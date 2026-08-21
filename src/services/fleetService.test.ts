import { describe, expect, it } from 'vitest';
import { mapVehicleToCar } from '@/services/fleetService';
import { VehicleListItem } from '@/types';

function baseVehicle(overrides: Partial<VehicleListItem> = {}): VehicleListItem {
  return {
    id: 1,
    registration_number: 'AB12CDE',
    model: 'Toyota Corolla',
    mileage: '12000',
    vehicle_type: 'sedan',
    ...overrides,
  };
}

describe('mapVehicleToCar council mapping', () => {
  it('maps council when API returns council as plain string', () => {
    const car = mapVehicleToCar(baseVehicle({ council: 'Manchester City Council' }));
    expect(car.council).toBe('Manchester City Council');
  });

  it('maps council when API returns council object', () => {
    const car = mapVehicleToCar(baseVehicle({ council: { id: 2, council_name: 'Birmingham Council' } }));
    expect(car.council).toBe('Birmingham Council');
  });

  it('maps council using council_name fallback', () => {
    const car = mapVehicleToCar(baseVehicle({ council: undefined, council_name: 'Leeds Council' }));
    expect(car.council).toBe('Leeds Council');
  });
});
