import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormField } from '@/components/FormField';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VehicleCouncil } from '@/types';
import { createVehicleCouncil, deleteVehicleCouncil, getVehicleCouncils, updateVehicleCouncil } from '@/services/fleetService';

export default function CouncilsPage() {
  const { toast } = useToast();
  const [councils, setCouncils] = useState<VehicleCouncil[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<VehicleCouncil | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleCouncil | null>(null);
  const [editName, setEditName] = useState('');

  const loadCouncils = async () => {
    setLoading(true);
    try {
      const response = await getVehicleCouncils();
      setCouncils(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load councils';
      toast({ title: 'Load failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouncils();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const councilName = name.trim();
    if (!councilName) {
      toast({ title: 'Council name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const created = await createVehicleCouncil({ council_name: councilName });
      setCouncils((current) => [created, ...current.filter((item) => item.name !== created.name)]);
      setName('');
      toast({ title: 'Council created' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create council';
      toast({ title: 'Create failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (council: VehicleCouncil) => {
    setDeleting(council);
    setDeleteOpen(true);
  };

  const askEdit = (council: VehicleCouncil) => {
    setEditing(council);
    setEditName(council.name);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editing) return;

    const nextName = editName.trim();
    if (!nextName) {
      toast({ title: 'Council name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateVehicleCouncil(editing.id, { council_name: nextName });
      setCouncils((current) => current.map((item) => (item.id === editing.id ? { ...item, name: updated.name } : item)));
      setEditOpen(false);
      toast({ title: 'Council updated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update council';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    const council = deleting;
    setCouncils((current) => current.filter((item) => item.id !== council.id));
    setDeleteOpen(false);

    try {
      await deleteVehicleCouncil(council.id);
      toast({ title: 'Council deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete council';
      setCouncils((current) => [council, ...current]);
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Councils" description="Manage available councils used by vehicles and booking filters." />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add Council</CardTitle>
          <CardDescription>Create a new council option for vehicles.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FormField
              label="Council Name"
              name="council_name"
              value={name}
              onChange={setName}
              placeholder="e.g. Birmingham City Council"
              required
              className="flex-1"
            />
            <Button type="submit" disabled={saving} className="sm:min-w-36">
              {saving ? 'Saving...' : 'Add Council'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Available Councils</CardTitle>
          <CardDescription>{loading ? 'Loading councils...' : `${councils.length} council(s)`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!loading && councils.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No councils found.</p>
          )}

          {councils.map((council) => (
            <div key={council.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <p className="text-sm font-medium">{council.name}</p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => askEdit(council)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => askDelete(council)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Council">
        <div className="space-y-4">
          <FormField
            label="Council Name"
            name="edit_council_name"
            value={editName}
            onChange={setEditName}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Council"
        description={`Delete ${deleting?.name || 'this council'}?`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  );
}
