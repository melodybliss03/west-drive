export type CityCoordinate = {
  lat: number;
  lng: number;
};

const KNOWN_CITY_COORDINATES: Record<string, CityCoordinate> = {
  puteaux: { lat: 48.8847, lng: 2.2384 },
  "la defense": { lat: 48.8924, lng: 2.239 },
  nanterre: { lat: 48.8924, lng: 2.2069 },
  "rueil malmaison": { lat: 48.8769, lng: 2.1817 },
  "boulogne billancourt": { lat: 48.8354, lng: 2.2397 },
  suresnes: { lat: 48.8712, lng: 2.2286 },
  colombes: { lat: 48.9226, lng: 2.253 },
  "neuilly sur seine": { lat: 48.8846, lng: 2.2697 },
  "levallois perret": { lat: 48.8953, lng: 2.2879 },
  courbevoie: { lat: 48.8968, lng: 2.2567 },
  asnieres: { lat: 48.9109, lng: 2.2892 },
  clichy: { lat: 48.9045, lng: 2.3056 },
  "saint cloud": { lat: 48.8452, lng: 2.2194 },
  "issy les moulineaux": { lat: 48.8245, lng: 2.2746 },
  meudon: { lat: 48.8131, lng: 2.2381 },
  clamart: { lat: 48.8024, lng: 2.2663 },
  sevres: { lat: 48.8238, lng: 2.2115 },
  "paris 16": { lat: 48.8566, lng: 2.2758 },
  "paris 17": { lat: 48.8842, lng: 2.3131 },
};

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeCityName(city: string): string {
  return stripDiacritics(city)
    .toLowerCase()
    .replace(/\(.+?\)/g, "")
    .replace(/\barrondissement\b/g, "")
    .replace(/\barr\.?\b/g, "")
    .replace(/\beme\b/g, "")
    .replace(/\be\b/g, "")
    .replace(/[']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getKnownCityCoordinate(city: string): CityCoordinate | null {
  const normalized = normalizeCityName(city);

  if (KNOWN_CITY_COORDINATES[normalized]) {
    return KNOWN_CITY_COORDINATES[normalized];
  }

  if (normalized.startsWith("paris ")) {
    const arr = normalized.replace("paris ", "").trim();
    const arrKey = `paris ${arr}`;
    return KNOWN_CITY_COORDINATES[arrKey] || { lat: 48.8566, lng: 2.3522 };
  }

  return null;
}
