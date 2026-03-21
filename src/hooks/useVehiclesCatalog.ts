import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vehicule, Ville } from "@/data/mock";
import { vehiclesService } from "@/lib/api/services";
import { mapVehicleDtoToVehicule } from "@/lib/mappers";
import { ApiHttpError } from "@/lib/api/types";

function buildCities(vehicles: Vehicule[]): Ville[] {
  const uniqueCities = new Set<string>();

  vehicles.forEach((vehicle) => {
    vehicle.villes.forEach((city) => uniqueCities.add(city));
  });

  return Array.from(uniqueCities).map((city, index) => ({
    id: `api-city-${index + 1}`,
    nom: city,
    lat: 0,
    lng: 0,
  }));
}

export function useVehiclesCatalog() {
  return useVehiclesCatalogPage(1, 100);
}

export function useVehiclesCatalogPage(page: number, limit: number) {
  const query = useQuery({
    queryKey: ["vehicles-catalog", page, limit],
    queryFn: async () => {
      const collection = await vehiclesService.list({ page, limit });

      return {
        items: collection.items.map(mapVehicleDtoToVehicule),
        meta: collection.meta,
      };
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiHttpError && error.code === 401) {
        return false;
      }

      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });

  const cities = useMemo(() => buildCities(query.data?.items || []), [query.data?.items]);

  return {
    vehicles: query.data?.items || [],
    meta: query.data?.meta,
    cities,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
