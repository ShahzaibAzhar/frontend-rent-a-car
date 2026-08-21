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
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_ORDER, Booking, BookingDocument } from '@/types';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, FileClock, RefreshCw, Upload } from 'lucide-react';
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

function renderDocumentGroup(title: string, documents: BookingDocument[]) {
  if (documents.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <span className="truncate pr-2">{doc.name}</span>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
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
    booking.vehiclePickupPictures.length > 0 ||
    booking.vehicleDropoffPictures.length > 0
  ));

  const hasCustomerDocuments = Boolean(booking && booking.customerInsuranceDocuments.length > 0);
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

  const handleGenerateAgreement = async () => {
    if (!booking) return;
    await runAction('Agreement generated', async () => {
      await dispatch(generateBookingAgreement(booking.id)).unwrap();
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
                    accept="image/*,.pdf"
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
                    accept="image/*,.pdf"
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
                {renderDocumentGroup('Booking Agreement', booking.bookingAgreement)}
                {renderDocumentGroup('Customer Signature', booking.customerSignature)}
                {renderDocumentGroup('Customer Insurance Documents', booking.customerInsuranceDocuments)}
                {renderDocumentGroup('Vehicle Pickup Pictures', booking.vehiclePickupPictures)}
                {renderDocumentGroup('Vehicle Dropoff Pictures', booking.vehicleDropoffPictures)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
