import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Vehicule } from "@/data/mock";
import { getKnownCityCoordinate } from "@/lib/geo/cityCoordinates";

export type VehicleCityMarker = {
  city: string;
  lat: number;
  lng: number;
  vehiclesCount: number;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
};

function isValidCoordinate(value: { lat: number; lng: number } | null): value is { lat: number; lng: number } {
  if (!value) {
    return false;
  }

  return (
    Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && value.lat >= -90
    && value.lat <= 90
    && value.lng >= -180
    && value.lng <= 180
  );
}

async function geocodeCityWithOsm(city: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${city}, Ile-de-France, France`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${query}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "fr",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NominatimSearchResult[];
  const first = data[0];

  if (!first) {
    return null;
  }

  const lat = Number(first.lat);
  const lng = Number(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function useVehicleCityMarkers(vehicles: Vehicule[]) {
  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      vehicle.villes.forEach((city) => {
        if (typeof city !== "string") {
          return;
        }

        const trimmedCity = city.trim();
        if (!trimmedCity) {
          return;
        }

        const current = counts.get(trimmedCity) || 0;
        counts.set(trimmedCity, current + 1);
      });
    });

    return counts;
  }, [vehicles]);

  const orderedCities = useMemo(
    () => Array.from(cityCounts.keys()).sort((a, b) => a.localeCompare(b, "fr")),
    [cityCounts],
  );

  const query = useQuery({
    queryKey: ["vehicle-city-markers", orderedCities.join("|")],
    queryFn: async () => {
      const markers: VehicleCityMarker[] = [];

      for (const city of orderedCities) {
        const knownCoordinate = getKnownCityCoordinate(city);
        const coordinate = knownCoordinate || (await geocodeCityWithOsm(city));

        if (!isValidCoordinate(coordinate)) {
          continue;
        }

        markers.push({
          city,
          lat: coordinate.lat,
          lng: coordinate.lng,
          vehiclesCount: cityCounts.get(city) || 0,
        });
      }

      return markers;
    },
    enabled: orderedCities.length > 0,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  return {
    markers: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
