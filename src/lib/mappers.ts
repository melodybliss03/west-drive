import { Vehicule } from "@/data/mock";
import { Reservation } from "@/pages/admin/data";
import { ReservationDto, VehicleDto } from "@/lib/api/services";

function getCautionByCategory(category: string): number {
  const map: Record<string, number> = {
    MICRO: 200,
    COMPACTE: 300,
    BERLINE: 500,
    SUV: 400,
  };
  return map[category] ?? 300;
}

export function mapVehicleDtoToVehicule(dto: VehicleDto): Vehicule {
  const images = dto.images?.map((img) => img.url) ?? [];
  const availableFromStatus = dto.operationalStatus
    ? dto.operationalStatus === "DISPONIBLE"
    : undefined;

  return {
    id: dto.id,
    nom: dto.name,
    marque: dto.brand,
    modele: dto.model,
    annee: dto.year,
    categorie: dto.category,
    transmission: dto.transmission,
    energie: dto.energy,
    isHybride: dto.isHybride ?? false,
    nbPlaces: dto.seats,
    kmInclus: dto.includedKmPerDay,
    kilométrage: dto.mileage ?? 0,
    prixJour: dto.pricePerDay,
    prixHeure: dto.pricePerHour ?? 0,
    caution: dto.depositAmount ?? getCautionByCategory(dto.category),
    description: dto.description || "",
    photos: images,
    actif: dto.active ?? true,
    villes: dto.availableCities || (dto.city ? [dto.city] : []),
    disponible: dto.available ?? availableFromStatus ?? true,
    note: dto.rating ?? 4.5,
    nbAvis: dto.reviewsCount ?? 0,
    autreFraisLibelle: dto.additionalFeesLabels ?? [],
    entretenueRequis: {
      kilométrage: dto.maintenanceRequired?.mileage,
      jours: dto.maintenanceRequired?.days,
    },
  };
}

export function mapReservationDtoToAdminReservation(dto: ReservationDto): Reservation {
  return {
    id: dto.id,
    client: dto.requesterName,
    email: dto.requesterEmail,
    telephone: dto.requesterPhone,
    vehicule: dto.vehicleName || dto.requestedVehicleType,
    vehiculeId: dto.vehicleId || "",
    debut: dto.startAt,
    fin: dto.endAt,
    statut: mapReservationStatusToLegacy(dto.status),
    montant: dto.amountTtc,
    caution: dto.depositAmount,
    ville: dto.pickupCity,
  };
}

export function mapReservationStatusToLegacy(status: string): string {
  const map: Record<string, string> = {
    NOUVELLE_DEMANDE: "en attente",
    EN_ANALYSE: "en attente",
    PROPOSITION_ENVOYEE: "en attente",
    EN_ATTENTE_PAIEMENT: "en attente",
    CONFIRMEE: "confirmée",
    EN_COURS: "en cours",
    CLOTUREE: "terminée",
    ANNULEE: "annulée",
    REFUSEE: "annulée",
  };

  return map[status] || status.toLowerCase();
}