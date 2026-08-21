import { Car, VehicleCouncil } from '@/types';

export interface VehicleFilterCriteria {
  council: string;
  seat: string;
  type: string;
}

export function buildCouncilOptions(councils: VehicleCouncil[], cars: Car[]) {
  const values = Array.from(new Set([
    ...councils.map((council) => council.name.trim()).filter(Boolean),
    ...cars.map((car) => (car.council || '').trim()).filter(Boolean),
  ]));

  return [
    { label: 'All councils', value: 'all' },
    ...values.sort((a, b) => a.localeCompare(b)).map((value) => ({ label: value, value })),
  ];
}

export function filterVehiclesByCriteria(cars: Car[], criteria: VehicleFilterCriteria): Car[] {
  return cars.filter((car) => {
    const matchesCouncil = criteria.council === 'all' || (car.council || '').trim() === criteria.council;
    const matchesSeats = criteria.seat === 'all' || String(car.seats ?? '') === criteria.seat;
    const matchesType = criteria.type === 'all' || (car.type || '').trim() === criteria.type;
    return matchesCouncil && matchesSeats && matchesType;
  });
}
