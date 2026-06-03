import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  approveBookingDocuments,
  deleteBooking,
  fetchBookings,
  generateBookingAgreement,
  refreshBookingById,
  selectAllBookings,
  selectBookingsLoading,
  signBookingAgreement,
  uploadCustomerDocuments,
} from '@/features/bookings/bookingSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_ORDER, Booking, BookingDocument } from '@/types';
import { CheckCircle2, Circle, ExternalLink, FileClock, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusOpts = BOOKING_STATUS_ORDER.map((status) => ({
  label: BOOKING_STATUS_LABELS[status],
  value: status,
}));

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

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const bookings = useAppSelector(selectAllBookings);
  const loading = useAppSelector(selectBookingsLoading);
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customerDocumentFiles, setCustomerDocumentFiles] = useState<File[]>([]);
  const [agreementSignature, setAgreementSignature] = useState<File | null>(null);

  useEffect(() => { dispatch(fetchBookings()); }, [dispatch]);

  useEffect(() => {
    if (!selectedBookingId && bookings.length > 0) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

  useEffect(() => {
    if (!selectedBookingId) return;
    dispatch(refreshBookingById(selectedBookingId));
  }, [dispatch, selectedBookingId]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );

  const hasDocuments = Boolean(selectedBooking && (
    selectedBooking.bookingAgreement.length > 0 ||
    selectedBooking.customerSignature.length > 0 ||
    selectedBooking.customerInsuranceDocuments.length > 0 ||
    selectedBooking.vehiclePickupPictures.length > 0 ||
    selectedBooking.vehicleDropoffPictures.length > 0
  ));

  const hasCustomerDocuments = Boolean(selectedBooking && selectedBooking.customerInsuranceDocuments.length > 0);
  const customerDocumentsApproved = normalizeStatusValue(selectedBooking?.customerDocumentStatus) === 'approved'
    || selectedBooking?.status === 'documents approved';
  const agreementGenerated = Boolean(selectedBooking && selectedBooking.bookingAgreement.length > 0);
  const agreementSigned = normalizeStatusValue(selectedBooking?.agreementSigningStatus) === 'signed'
    || Boolean(selectedBooking?.agreementSignedAt)
    || selectedBooking?.status === 'pending handover'
    || selectedBooking?.status === 'waiting customer confirmation'
    || selectedBooking?.status === 'done';

  const timelineStatuses = useMemo(() => {
    if (!selectedBooking) return [];
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
  }, [selectedBooking]);

  const openCreate = () => navigate('/bookings/new');
  const openDelete = (b: Booking) => { setEditing(b); setDeleteOpen(true); };

  const handleDelete = async () => {
    if (editing) { await dispatch(deleteBooking(editing.id)); toast({ title: 'Booking deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

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
    if (!selectedBooking || customerDocumentFiles.length === 0) {
      toast({ title: 'Select at least one document', variant: 'destructive' });
      return;
    }

    await runAction('Customer documents uploaded', async () => {
      await dispatch(uploadCustomerDocuments({ bookingId: selectedBooking.id, files: customerDocumentFiles })).unwrap();
      setCustomerDocumentFiles([]);
    });
  };

  const handleApproveDocuments = async () => {
    if (!selectedBooking) return;
    await runAction('Documents approved', async () => {
      await dispatch(approveBookingDocuments(selectedBooking.id)).unwrap();
    });
  };

  const handleGenerateAgreement = async () => {
    if (!selectedBooking) return;
    await runAction('Agreement generated', async () => {
      await dispatch(generateBookingAgreement(selectedBooking.id)).unwrap();
    });
  };

  const handleSignAgreement = async () => {
    if (!selectedBooking || !agreementSignature) {
      toast({ title: 'Upload a signature file', variant: 'destructive' });
      return;
    }

    await runAction('Agreement signed', async () => {
      await dispatch(signBookingAgreement({ bookingId: selectedBooking.id, signature: agreementSignature })).unwrap();
      setAgreementSignature(null);
    });
  };

  const handleRefreshBooking = async () => {
    if (!selectedBooking) return;
    await runAction('Booking refreshed', async () => {
      await dispatch(refreshBookingById(selectedBooking.id)).unwrap();
    });
  };

  const columns: Column<Booking>[] = [
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'customerPhone', header: 'Phone' },
    { key: 'startDate', header: 'Start', sortable: true },
    { key: 'endDate', header: 'End', sortable: true },
    { key: 'assignedCarId', header: 'Car ID' },
    { key: 'totalPrice', header: 'Price', sortable: true, render: b => `£${b.totalPrice}` },
    { key: 'status', header: 'Status', render: b => <StatusBadge status={b.status} /> },
    { key: 'actions', header: '', render: b => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); openDelete(b); }}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage customer bookings" actionLabel="New Booking" actionIcon={Plus} onAction={openCreate} />
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        searchKeys={['customerName', 'customerPhone']}
        searchPlaceholder="Search customers..."
        filterKey="status"
        filterOptions={statusOpts}
        onRowClick={(booking) => setSelectedBookingId(booking.id)}
      />

      {selectedBooking && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Booking #{selectedBooking.id}</CardTitle>
              <CardDescription>
                {selectedBooking.customerName} • Car #{selectedBooking.assignedCarId}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedBooking.status} />
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
                <p className="text-sm font-medium">{selectedBooking.pickupDateTime || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dropoff</p>
                <p className="text-sm font-medium">{selectedBooking.dropoffDateTime || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking Type</p>
                <p className="text-sm font-medium">{selectedBooking.bookingType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="text-sm font-medium">{selectedBooking.insuranceIncluded ? 'With insurance' : 'Without insurance'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Status Timeline</h3>
              <div className="space-y-2">
                {timelineStatuses.map((status, index) => {
                  const currentIndex = timelineStatuses.indexOf(selectedBooking.status as (typeof timelineStatuses)[number]);
                  const isCurrent = status === selectedBooking.status;
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
                  {renderDocumentGroup('Booking Agreement', selectedBooking.bookingAgreement)}
                  {renderDocumentGroup('Customer Signature', selectedBooking.customerSignature)}
                  {renderDocumentGroup('Customer Insurance Documents', selectedBooking.customerInsuranceDocuments)}
                  {renderDocumentGroup('Vehicle Pickup Pictures', selectedBooking.vehiclePickupPictures)}
                  {renderDocumentGroup('Vehicle Dropoff Pictures', selectedBooking.vehicleDropoffPictures)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Booking" description={`Delete booking for ${editing?.customerName}?`} onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
