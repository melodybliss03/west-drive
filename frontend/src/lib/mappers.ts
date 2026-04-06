import { Vehicule } from "@/data/mock";
import { Reservation } from "@/pages/admin/data";
import { DevisRow } from "@/pages/admin/data";
import { QuoteDto, ReservationDto, VehicleDto } from "@/lib/api/services";

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
    actif: dto.active ?? dto.isActive ?? true,
    villes: dto.availableCities || (dto.city ? [dto.city] : []),
    disponible: dto.available ?? availableFromStatus ?? true,
    note: Number(dto.rating ?? 4.5),
    nbAvis: dto.reviewCount ?? dto.reviewsCount ?? 0,
    plaqueImmatriculation: dto.plateNumber,
    autreFraisLibelle: dto.additionalFeesLabels ?? [],
    entretenueRequis: {
      kilométrage: dto.maintenanceRequired?.mileage,
    },
  };
}

export function mapReservationDtoToAdminReservation(dto: ReservationDto): Reservation {
  return {
    id: dto.id,
    publicReference: dto.publicReference,
    backendStatus: dto.status,
    vehicleImageUrl: dto.vehicle?.images?.[0]?.url,
    client: dto.requesterName,
    email: dto.requesterEmail,
    telephone: dto.requesterPhone,
    vehicule: dto.vehicleName || dto.requestedVehicleType,
    vehiculeId: dto.vehicleId || "",
    requestedVehicleType: dto.requestedVehicleType,
    vehicleDetails: dto.vehicle
      ? {
          marque: dto.vehicle.brand,
          modele: dto.vehicle.model,
          annee: dto.vehicle.year,
          categorie: dto.vehicle.category,
          transmission: dto.vehicle.transmission,
          energie: dto.vehicle.energy,
          places: dto.vehicle.seats,
          immatriculation: dto.vehicle.plateNumber,
          ville: dto.vehicle.city,
        }
      : undefined,
    debut: dto.startAt,
    fin: dto.endAt,
    statut: mapReservationStatusToLegacy(dto.status),
    montant: Number(dto.amountTtc ?? 0),
    caution: Number(dto.depositAmount ?? 0),
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

export function mapQuoteDtoToDevisRow(dto: QuoteDto): DevisRow {
  return {
    id: dto.id,
    publicReference: dto.publicReference,
    backendStatus: dto.status,
    client: dto.requesterName,
    email: dto.requesterEmail,
    telephone: dto.requesterPhone,
    type: dto.requesterType === "ENTREPRISE" ? "entreprise" : "particulier",
    nomEntreprise: dto.companyName ?? undefined,
    siret: dto.companySiret ?? undefined,
    ville: dto.pickupCity,
    dateDebut: dto.startAt,
    dateFin: dto.endAt,
    typeVehicule: dto.requestedVehicleType,
    nombreVehicules: dto.requestedQuantity,
    requestedVehiclesDetail: dto.requestedVehiclesDetail ?? null,
    proposalDetails: dto.proposalDetails ?? null,
    statut: mapQuoteStatusToLegacy(dto.status),
    creeLe: dto.createdAt,
  };
}

function mapQuoteStatusToLegacy(status: string): DevisRow["statut"] {
  const map: Record<string, DevisRow["statut"]> = {
    NOUVELLE_DEMANDE: "en attente",
    EN_ANALYSE: "en analyse",
    PROPOSITION_ENVOYEE: "proposition envoyee",
    EN_NEGOCIATION: "en negociation",
    EN_ATTENTE_PAIEMENT: "en attente paiement",
    PAYEE: "paye",
    CONVERTI_RESERVATION: "converti",
    REFUSEE: "refuse",
    ANNULEE: "annule",
  };

  return map[status] ?? "en attente";
}