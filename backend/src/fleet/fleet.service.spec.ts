import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { FleetIncident } from './entities/fleet-incident.entity';
import { VehicleScheduleSlot } from './entities/vehicle-schedule-slot.entity';
import { FleetService } from './fleet.service';

describe('FleetService', () => {
  let service: FleetService;

  const vehicleRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };

  const incidentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const slotRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepository },
        { provide: getRepositoryToken(FleetIncident), useValue: incidentRepository },
        {
          provide: getRepositoryToken(VehicleScheduleSlot),
          useValue: slotRepository,
        },
      ],
    }).compile();

    service = module.get<FleetService>(FleetService);
  });

  it('updates mileage when vehicle exists', async () => {
    const vehicle = {
      id: 'veh-1',
      mileage: 12000,
    } as Vehicle;

    vehicleRepository.findOne.mockResolvedValue(vehicle);
    vehicleRepository.save.mockImplementation(async (payload) => payload);

    const result = await service.updateVehicleMileage('veh-1', { mileage: 12550 });

    expect(vehicleRepository.findOne).toHaveBeenCalledWith({ where: { id: 'veh-1' } });
    expect(vehicleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'veh-1',
        mileage: 12550,
      }),
    );
    expect(result).toEqual(expect.objectContaining({ mileage: 12550 }));
  });

  it('throws NotFoundException when mileage update target vehicle does not exist', async () => {
    vehicleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateVehicleMileage('missing-veh', { mileage: 7000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
