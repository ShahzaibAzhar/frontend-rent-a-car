import { CarDocument } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let docs: CarDocument[] = [
  { id: '1', carId: '1', type: 'Insurance', fileName: 'toyota_corolla_insurance.pdf', uploadDate: '2026-01-10', expiryDate: '2026-06-01' },
  { id: '2', carId: '1', type: 'MOT', fileName: 'toyota_corolla_mot.pdf', uploadDate: '2025-08-15', expiryDate: '2026-08-15' },
  { id: '3', carId: '2', type: 'Insurance', fileName: 'bmw_3series_insurance.pdf', uploadDate: '2026-01-05', expiryDate: '2026-09-10' },
  { id: '4', carId: '3', type: 'V5', fileName: 'ford_focus_v5.pdf', uploadDate: '2021-06-01', expiryDate: null },
  { id: '5', carId: '5', type: 'MOT', fileName: 'vw_golf_mot.pdf', uploadDate: '2025-05-22', expiryDate: '2026-05-22' },
  { id: '6', carId: '10', type: 'Insurance', fileName: 'vauxhall_astra_insurance.pdf', uploadDate: '2026-01-15', expiryDate: '2026-03-15' },
  { id: '7', carId: '4', type: 'Service Record', fileName: 'mercedes_a_service.pdf', uploadDate: '2026-02-01', expiryDate: null },
  { id: '8', carId: '7', type: 'MOT', fileName: 'hyundai_i30_mot.pdf', uploadDate: '2025-04-10', expiryDate: '2026-04-10' },
];

let nextId = 9;

export const documentsService = {
  getAll: async (): Promise<CarDocument[]> => { await delay(); return [...docs]; },
  getById: async (id: string): Promise<CarDocument | undefined> => { await delay(200); return docs.find(d => d.id === id); },
  create: async (doc: Omit<CarDocument, 'id'>): Promise<CarDocument> => { await delay(); const n = { ...doc, id: String(nextId++) }; docs.push(n); return n; },
  update: async (doc: CarDocument): Promise<CarDocument> => { await delay(); docs = docs.map(d => d.id === doc.id ? doc : d); return doc; },
  delete: async (id: string): Promise<void> => { await delay(200); docs = docs.filter(d => d.id !== id); },
};
