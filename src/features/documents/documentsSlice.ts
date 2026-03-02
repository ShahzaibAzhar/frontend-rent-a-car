import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CarDocument, SliceState } from '@/types';
import { documentsService } from '@/services/documentsService';
import { RootState } from '@/app/store';

const initialState: SliceState<CarDocument> = { items: [], selectedItem: null, loading: false, error: null };

export const fetchDocuments = createAsyncThunk('documents/fetchAll', () => documentsService.getAll());
export const createDocument = createAsyncThunk('documents/create', (d: Omit<CarDocument, 'id'>) => documentsService.create(d));
export const updateDocument = createAsyncThunk('documents/update', (d: CarDocument) => documentsService.update(d));
export const deleteDocument = createAsyncThunk('documents/delete', (id: string) => documentsService.delete(id).then(() => id));

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDocuments.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchDocuments.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed'; })
      .addCase(createDocument.fulfilled, (s, a) => { s.items.push(a.payload); })
      .addCase(updateDocument.fulfilled, (s, a) => { s.items = s.items.map(d => d.id === a.payload.id ? a.payload : d); })
      .addCase(deleteDocument.fulfilled, (s, a) => { s.items = s.items.filter(d => d.id !== a.payload); });
  },
});

export const selectAllDocuments = (state: RootState) => state.documents.items;
export const selectDocumentsLoading = (state: RootState) => state.documents.loading;
export default documentsSlice.reducer;
