import type { CarResource } from '../models/types';

export const carResource: CarResource = {
  id: 'resource-car-tesla',
  type: 'car',
  name: 'Tesla',
  status: 'available',
  metadata: {
    chargeLevel: 80,
    needsChargeBefore: [3, 4], // Wednesday and Thursday (office days)
    isAvailable: true,
  },
};
