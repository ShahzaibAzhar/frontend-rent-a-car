import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  approveBookingDocuments,
  fetchBookings,
  generateBookingAgreement,
  refreshBookingById,
  selectAllBookings,
  selectBookingsLoading,
  signBookingAgreement,
  uploadCustomerDocuments,
} from '@/features/bookings/bookingSlice';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/Modal';
import apiClient from '@/services/apiClient';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_ORDER, Booking, BookingDocument } from '@/types';
import { ArrowLeft, CheckCircle2, Circle, FileClock, RefreshCw, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: unknown; error?: unknown };
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
    if (typeof maybeError.error === 'string' && maybeError.error.trim()) return maybeError.error;
  }

  if (typeof error === 'string' && error.trim()) return error;
  return 'Unexpected error';
}

function normalizeStatusValue(value?: string | null): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function renderDocumentGroup(
  title: string,
  documents: BookingDocument[],
  onPreview: (document: BookingDocument) => void,
) {
  if (documents.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onPreview(doc)}
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="truncate pr-2">{doc.name}</span>
            <span className="shrink-0 text-xs font-medium text-primary">Preview</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bookings = useAppSelector(selectAllBookings);
  const loading = useAppSelector(selectBookingsLoading);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [customerDocumentFiles, setCustomerDocumentFiles] = useState<File[]>([]);
  const [agreementSignature, setAgreementSignature] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<BookingDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (bookings.length === 0) {
      dispatch(fetchBookings());
    }
  }, [dispatch, bookings.length]);

  useEffect(() => {
    if (id) {
      dispatch(refreshBookingById(id));
    }
  }, [dispatch, id]);

  const booking = useMemo(
    () => bookings.find((item) => item.id === id) || null,
    [bookings, id],
  );

  const hasDocuments = Boolean(booking && (
    booking.bookingAgreement.length > 0 ||
    booking.customerSignature.length > 0 ||
    booking.customerInsuranceDocuments.length > 0 ||
    booking.customerLicenseFrontDocuments.length > 0 ||
    booking.customerLicenseBackDocuments.length > 0 ||
    booking.customerPassportDocuments.length > 0 ||
    booking.customerProofOfAddressDocuments.length > 0 ||
    booking.customerTaxiBadgeDocuments.length > 0 ||
    booking.vehiclePickupPictures.length > 0 ||
    booking.vehicleDropoffPictures.length > 0
  ));

  const hasCustomerDocuments = Boolean(booking && (
    booking.customerInsuranceDocuments.length > 0 ||
    booking.customerLicenseFrontDocuments.length > 0 ||
    booking.customerLicenseBackDocuments.length > 0 ||
    booking.customerPassportDocuments.length > 0 ||
    booking.customerProofOfAddressDocuments.length > 0 ||
    booking.customerTaxiBadgeDocuments.length > 0
  ));
  const customerDocumentsApproved = normalizeStatusValue(booking?.customerDocumentStatus) === 'approved'
    || booking?.status === 'documents approved';
  const agreementGenerated = Boolean(booking && booking.bookingAgreement.length > 0);
  const agreementSigned = normalizeStatusValue(booking?.agreementSigningStatus) === 'signed'
    || Boolean(booking?.agreementSignedAt)
    || booking?.status === 'pending handover'
    || booking?.status === 'waiting customer confirmation'
    || booking?.status === 'done';

  const timelineStatuses = useMemo(() => {
    if (!booking) return [];
    return [
      'pending',
      'pending documents with insurance',
      'pending documents without insurance',
      'pending document review',
      'documents approved',
      'pending agreement signing',
      'pending handover',
      'waiting customer confirmation',
      'done',
    ] as const;
  }, [booking]);

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setSubmitting(true);
    try {
      await fn();
      toast({ title: label });
    } catch (error) {
      toast({
        title: `${label} failed`,
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadCustomerDocuments = async () => {
    if (!booking || customerDocumentFiles.length === 0) {
      toast({ title: 'Select at least one document', variant: 'destructive' });
      return;
    }

    await runAction('Customer documents uploaded', async () => {
      await dispatch(uploadCustomerDocuments({ bookingId: booking.id, files: customerDocumentFiles })).unwrap();
      setCustomerDocumentFiles([]);
    });
  };

  const handleApproveDocuments = async () => {
    if (!booking) return;
    await runAction('Documents approved', async () => {
      await dispatch(approveBookingDocuments(booking.id)).unwrap();
    });
  };

  const handleSignAgreement = async () => {
    if (!booking || !agreementSignature) {
      toast({ title: 'Upload a signature file', variant: 'destructive' });
      return;
    }

    await runAction('Agreement signed', async () => {
      await dispatch(signBookingAgreement({ bookingId: booking.id, signature: agreementSignature })).unwrap();
      setAgreementSignature(null);
    });
  };

  const handleRefreshBooking = async () => {
    if (!booking) return;
    await runAction('Booking refreshed', async () => {
      await dispatch(refreshBookingById(booking.id)).unwrap();
    });
  };

  const closePreview = () => {
    setPreviewDocument(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const openPreview = async (document: BookingDocument) => {
    setPreviewDocument(document);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    try {
      const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
      const response = await apiClient.get(
        `${baseUrl}/api/file/preview?path=${encodeURIComponent(document.url)}`,
        { responseType: 'blob' },
      );
      const contentType = String(response.headers['content-type'] || document.mimeType || 'application/octet-stream');
      setPreviewUrl(URL.createObjectURL(new Blob([response.data], { type: contentType })));
    } catch {
      if (/^https:\/\//i.test(document.url)) {
        setPreviewUrl(document.url);
      } else {
        setPreviewError('The document preview could not be loaded.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateAgreement = async () => {
    if (!booking) return;

    await runAction('Agreement generated', async () => {
      const updatedBooking = await dispatch(generateBookingAgreement(booking.id)).unwrap();
      const agreement = updatedBooking.bookingAgreement[0];

      if (agreement) {
        await openPreview(agreement);
      }
    });
  };

  if (!id) {
    return <div className="text-sm text-muted-foreground">Booking not found.</div>;
  }

  if (!booking && loading) {
    return <div className="text-sm text-muted-foreground">Loading booking details...</div>;
  }

  if (!booking) {
    return <div className="text-sm text-muted-foreground">Booking not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Booking #${booking.id}`} description={`${booking.customerName} - Car #${booking.assignedCarId}`}>
        <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Booking Summary</CardTitle>
            <CardDescription>
              {booking.customerName} - {booking.customerPhone}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            <Button variant="outline" size="sm" onClick={handleRefreshBooking} disabled={submitting}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{formatDisplayDate(booking.pickupDateTime, '-')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="text-sm font-medium">{formatDisplayDate(booking.dropoffDateTime, '-')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Booking Type</p>
              <p className="text-sm font-medium">{booking.bookingType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insurance</p>
              <p className="text-sm font-medium">{booking.insuranceIncluded ? 'With insurance' : 'Without insurance'}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Weekly Rent Price</p>
              <p className="text-sm font-medium">£{booking.weeklyRentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billable Weeks</p>
              <p className="text-sm font-medium">{booking.billingWeeks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rent Total</p>
              <p className="text-sm font-medium">£{booking.totalPrice.toFixed(2)}</p>
            </div>
            {booking.insuranceIncluded && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Weekly Insurance Price</p>
                  <p className="text-sm font-medium">£{(booking.weeklyInsurancePrice ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Insurance Total</p>
                  <p className="text-sm font-medium">£{booking.insurancePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Including Insurance</p>
                  <p className="text-sm font-medium">£{(booking.totalPrice + booking.insurancePrice).toFixed(2)}</p>
                </div>
              </>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Status Timeline</h3>
            <div className="space-y-2">
              {timelineStatuses.map((status, index) => {
                const currentIndex = timelineStatuses.indexOf(booking.status as (typeof timelineStatuses)[number]);
                const isCurrent = status === booking.status;
                const isCompleted = currentIndex > -1 && index < currentIndex;

                return (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : isCurrent ? <FileClock className="h-4 w-4 text-blue-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className={isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                      {BOOKING_STATUS_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border p-4">
            <h3 className="mb-3 text-sm font-semibold">Document Workflow</h3>

            <div className="space-y-4">
              {!hasCustomerDocuments && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Upload customer documents to attach them to this booking.</p>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.csv,.rtf,.doc,.docx,.xls,.xlsx,.odt,.ods,image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/pdf,text/plain,text/csv,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet"
                    onChange={(event) => setCustomerDocumentFiles(Array.from(event.target.files || []))}
                    className="block w-full text-sm"
                  />
                  <Button onClick={handleUploadCustomerDocuments} disabled={submitting}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Customer Documents
                  </Button>
                </div>
              )}

              {hasCustomerDocuments && !customerDocumentsApproved && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Customer documents are attached. Review them, then approve to continue.</p>
                  <Button onClick={handleApproveDocuments} disabled={submitting}>Approve Documents</Button>
                </div>
              )}

              {customerDocumentsApproved && !agreementGenerated && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Documents are approved. Generate the agreement next.</p>
                  <Button onClick={handleGenerateAgreement} disabled={submitting}>Generate Agreement</Button>
                </div>
              )}

              {agreementGenerated && !agreementSigned && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Upload the customer signature to sign the agreement.</p>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.csv,.rtf,.doc,.docx,.xls,.xlsx,.odt,.ods,image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/pdf,text/plain,text/csv,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet"
                    onChange={(event) => setAgreementSignature(event.target.files?.[0] || null)}
                    className="block w-full text-sm"
                  />
                  <Button onClick={handleSignAgreement} disabled={submitting}>Sign Agreement</Button>
                </div>
              )}

              {agreementSigned && (
                <p className="text-sm text-emerald-700">Agreement signed. Booking is now pending handover.</p>
              )}

              {!hasCustomerDocuments && (
                <p className="text-xs text-muted-foreground">Once documents are uploaded, they will appear below and the approval step will unlock.</p>
              )}
            </div>
          </div>

          {hasDocuments && (
            <div className="rounded-md border p-4">
              <h3 className="mb-3 text-sm font-semibold">Documents</h3>
              <div className="space-y-4">
                {renderDocumentGroup('Booking Agreement', booking.bookingAgreement, openPreview)}
                {renderDocumentGroup('Customer Signature', booking.customerSignature, openPreview)}
                {renderDocumentGroup('Customer Insurance Documents', booking.customerInsuranceDocuments, openPreview)}
                {renderDocumentGroup('Driving Licence — Front', booking.customerLicenseFrontDocuments, openPreview)}
                {renderDocumentGroup('Driving Licence — Back', booking.customerLicenseBackDocuments, openPreview)}
                {renderDocumentGroup('Passport', booking.customerPassportDocuments, openPreview)}
                {renderDocumentGroup('Proof of Address', booking.customerProofOfAddressDocuments, openPreview)}
                {renderDocumentGroup('Taxi Badge', booking.customerTaxiBadgeDocuments, openPreview)}
                {renderDocumentGroup('Vehicle Pickup Pictures', booking.vehiclePickupPictures, openPreview)}
                {renderDocumentGroup('Vehicle Dropoff Pictures', booking.vehicleDropoffPictures, openPreview)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(previewDocument)}
        onOpenChange={(open) => !open && closePreview()}
        title={previewDocument?.name || 'Document preview'}
        className="max-w-5xl"
      >
        <div className="min-h-72 bg-muted p-3">
          {previewLoading ? (
            <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">Loading document preview...</p>
          ) : previewError ? (
            <p className="flex h-72 items-center justify-center text-sm text-destructive">{previewError}</p>
          ) : previewUrl && previewDocument?.mimeType.startsWith('image/') ? (
            <img src={previewUrl} alt={previewDocument.name} className="max-h-[75vh] w-full rounded-md object-contain" />
          ) : previewUrl ? (
            <iframe title={previewDocument?.name || 'Document preview'} src={previewUrl} className="h-[75vh] w-full rounded-md border-0 bg-white" />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
