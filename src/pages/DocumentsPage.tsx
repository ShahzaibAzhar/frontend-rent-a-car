import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDocuments, selectAllDocuments, selectDocumentsLoading, createDocument, deleteDocument } from '@/features/documents/documentsSlice';
import { fetchCars, selectAllCars } from '@/features/fleet/fleetSlice';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { CarDocument, DocumentType } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const typeOpts = [
  { label: 'Insurance', value: 'Insurance' }, { label: 'MOT', value: 'MOT' },
  { label: 'V5', value: 'V5' }, { label: 'Service Record', value: 'Service Record' },
];

const emptyDoc = { carId: '', type: 'Insurance' as DocumentType, fileName: '', uploadDate: new Date().toISOString().split('T')[0], expiryDate: null as string | null };

export default function DocumentsPage() {
  const dispatch = useAppDispatch();
  const docs = useAppSelector(selectAllDocuments);
  const loading = useAppSelector(selectDocumentsLoading);
  const cars = useAppSelector(selectAllCars);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<CarDocument | null>(null);
  const [form, setForm] = useState(emptyDoc);

  useEffect(() => { dispatch(fetchDocuments()); dispatch(fetchCars()); }, [dispatch]);

  const handleSave = async () => {
    await dispatch(createDocument(form as Omit<CarDocument, 'id'>));
    toast({ title: 'Document uploaded' });
    setModalOpen(false);
    setForm(emptyDoc);
  };

  const handleDelete = async () => {
    if (deleting) { await dispatch(deleteDocument(deleting.id)); toast({ title: 'Document deleted', variant: 'destructive' }); }
    setDeleteOpen(false);
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val || null }));
  const carOptions = cars.map(c => ({ label: `${c.registrationNumber} — ${c.make} ${c.model}`, value: c.id }));

  const getExpiryBadge = (date: string | null) => {
    if (!date) return <span className="text-xs text-muted-foreground">N/A</span>;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <StatusBadge status="Expired" variant={{ Expired: 'bg-red-100 text-red-700' }} />;
    if (diffDays <= 30) return <StatusBadge status={`${diffDays}d left`} variant={{ [`${diffDays}d left`]: 'bg-amber-100 text-amber-700' }} />;
    return <span className="text-sm">{date}</span>;
  };

  const columns: Column<CarDocument>[] = [
    { key: 'carId', header: 'Vehicle', render: d => { const c = cars.find(x => x.id === d.carId); return c ? c.registrationNumber : d.carId; } },
    { key: 'type', header: 'Type', render: d => <StatusBadge status={d.type} /> },
    { key: 'fileName', header: 'File Name' },
    { key: 'uploadDate', header: 'Uploaded', sortable: true },
    { key: 'expiryDate', header: 'Expiry', render: d => getExpiryBadge(d.expiryDate) },
    { key: 'actions', header: '', render: d => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); setDeleting(d); setDeleteOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Vehicle documents and certificates" actionLabel="Upload Document" actionIcon={Plus} onAction={() => { setForm(emptyDoc); setModalOpen(true); }} />
      <DataTable columns={columns} data={docs} loading={loading} searchKeys={['fileName']} searchPlaceholder="Search documents..." filterKey="type" filterOptions={typeOpts} />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Upload Document">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vehicle" name="car" value={form.carId} onChange={set('carId')} type="select" options={carOptions} required />
          <FormField label="Document Type" name="type" value={form.type} onChange={set('type')} type="select" options={typeOpts} required />
          <FormField label="File Name" name="file" value={form.fileName} onChange={set('fileName')} placeholder="document.pdf" required />
          <FormField label="Expiry Date" name="expiry" value={form.expiryDate || ''} onChange={set('expiryDate')} type="date" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Upload</Button>
        </div>
      </Modal>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Document" description={`Delete ${deleting?.fileName}?`} onConfirm={handleDelete} confirmLabel="Delete" />
    </div>
  );
}
