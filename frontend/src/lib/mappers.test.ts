import { describe, expect, it } from "vitest";
import { mapVehicleDtoToVehicule } from "@/lib/mappers";
import type { VehicleDto } from "@/lib/api/services";

describe("mapVehicleDtoToVehicule", () => {
  it("uses isActive when active is undefined", () => {
    const dto: VehicleDto = {
      id: "veh-1",
      name: "Peugeot 3008",
      brand: "Peugeot",
      model: "3008",
      year: 2024,
      category: "SUV",
      transmission: "AUTOMATIQUE",
      energy: "ESSENCE",
      isHybride: false,
      seats: 5,
      includedKmPerDay: 150,
      mileage: 42000,
      pricePerDay: 95,
      pricePerHour: 15,
      availableCities: ["Paris"],
      isActive: false,
      operationalStatus: "INDISPONIBLE",
    };

    const mapped = mapVehicleDtoToVehicule(dto);

    expect(mapped.actif).toBe(false);
    expect(mapped.disponible).toBe(false);
    expect(mapped.kilométrage).toBe(42000);
  });

  it("keeps active when explicitly provided", () => {
    const dto: VehicleDto = {
      id: "veh-2",
      name: "Renault Clio",
      brand: "Renault",
      model: "Clio",
      year: 2023,
      category: "COMPACTE",
      transmission: "MANUELLE",
      energy: "ESSENCE",
      isHybride: false,
      seats: 5,
      includedKmPerDay: 120,
      mileage: 1234,
      pricePerDay: 55,
      pricePerHour: 9,
      availableCities: ["Lyon"],
      active: true,
      isActive: false,
      operationalStatus: "DISPONIBLE",
    };

    const mapped = mapVehicleDtoToVehicule(dto);

    expect(mapped.actif).toBe(true);
    expect(mapped.disponible).toBe(true);
  });
});
