import { describe, expect, it } from 'vitest';
import { buildCouncilOptions, filterVehiclesByCriteria } from '@/features/bookings/vehicleFilterUtils';
import { Car, VehicleCouncil } from '@/types';

const cars: Car[] = [
  {
    id: '1',
    registrationNumber: 'AAA111',
    make: 'Toyota',
    model: 'Corolla',
    council: 'Leeds Council',
    type: 'sedan',
    seats: 5,
    year: 2024,
    mileage: 1000,
    status: 'Available',
    motExpiry: '',
    insuranceExpiry: '',
  },
  {
    id: '2',
    registrationNumber: 'BBB222',
    make: 'Ford',
    model: 'Transit',
    council: 'Manchester Council',
    type: 'van',
    seats: 3,
    year: 2023,
    mileage: 2000,
    status: 'Available',
    motExpiry: '',
    insuranceExpiry: '',
  },
];

const councils: VehicleCouncil[] = [
  { id: '10', name: 'Leeds Council' },
  { id: '11', name: 'Bristol Council' },
];

describe('vehicleFilterUtils', () => {
  it('buildCouncilOptions merges and deduplicates council values', () => {
    const options = buildCouncilOptions(councils, cars);

    expect(options[0]).toEqual({ label: 'All councils', value: 'all' });
    expect(options.some((item) => item.value === 'Leeds Council')).toBe(true);
    expect(options.some((item) => item.value === 'Manchester Council')).toBe(true);
    expect(options.some((item) => item.value === 'Bristol Council')).toBe(true);
  });

  it('filters vehicles by council, type and seats', () => {
    const result = filterVehiclesByCriteria(cars, {
      council: 'Leeds Council',
      type: 'sedan',
      seat: '5',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns all vehicles when all filters are selected', () => {
    const result = filterVehiclesByCriteria(cars, {
      council: 'all',
      type: 'all',
      seat: 'all',
    });

    expect(result).toHaveLength(2);
  });
});
