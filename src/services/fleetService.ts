import { Car } from '@/types';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let cars: Car[] = [
  { id: '1', registrationNumber: 'AB12 CDE', make: 'Toyota', model: 'Corolla', year: 2022, mileage: 15200, status: 'Available', motExpiry: '2026-08-15', insuranceExpiry: '2026-06-01' },
  { id: '2', registrationNumber: 'FG34 HIJ', make: 'BMW', model: '3 Series', year: 2023, mileage: 8400, status: 'Rented', motExpiry: '2026-11-20', insuranceExpiry: '2026-09-10' },
  { id: '3', registrationNumber: 'KL56 MNO', make: 'Ford', model: 'Focus', year: 2021, mileage: 32100, status: 'In Service', motExpiry: '2026-03-05', insuranceExpiry: '2026-04-18' },
  { id: '4', registrationNumber: 'PQ78 RST', make: 'Mercedes', model: 'A-Class', year: 2023, mileage: 5600, status: 'Available', motExpiry: '2027-01-12', insuranceExpiry: '2026-12-01' },
  { id: '5', registrationNumber: 'UV90 WXY', make: 'Volkswagen', model: 'Golf', year: 2020, mileage: 45300, status: 'Reserved', motExpiry: '2026-05-22', insuranceExpiry: '2026-07-14' },
  { id: '6', registrationNumber: 'ZA11 BCD', make: 'Audi', model: 'A3', year: 2022, mileage: 18700, status: 'Available', motExpiry: '2026-09-30', insuranceExpiry: '2026-10-15' },
  { id: '7', registrationNumber: 'EF22 GHI', make: 'Hyundai', model: 'i30', year: 2021, mileage: 28900, status: 'Rented', motExpiry: '2026-04-10', insuranceExpiry: '2026-05-20' },
  { id: '8', registrationNumber: 'JK33 LMN', make: 'Kia', model: 'Ceed', year: 2023, mileage: 3200, status: 'Available', motExpiry: '2027-02-28', insuranceExpiry: '2027-01-15' },
  { id: '9', registrationNumber: 'OP44 QRS', make: 'Nissan', model: 'Qashqai', year: 2022, mileage: 21400, status: 'Rented', motExpiry: '2026-07-18', insuranceExpiry: '2026-08-25' },
  { id: '10', registrationNumber: 'TU55 VWX', make: 'Vauxhall', model: 'Astra', year: 2020, mileage: 52600, status: 'In Service', motExpiry: '2026-03-01', insuranceExpiry: '2026-03-15' },
];

let nextId = 11;

export const fleetService = {
  getAll: async (): Promise<Car[]> => { await delay(); return [...cars]; },
  getById: async (id: string): Promise<Car | undefined> => { await delay(200); return cars.find(c => c.id === id); },
  create: async (car: Omit<Car, 'id'>): Promise<Car> => { await delay(); const newCar = { ...car, id: String(nextId++) }; cars.push(newCar); return newCar; },
  update: async (car: Car): Promise<Car> => { await delay(); cars = cars.map(c => c.id === car.id ? car : c); return car; },
  delete: async (id: string): Promise<void> => { await delay(200); cars = cars.filter(c => c.id !== id); },
};
