import { vehicleImages } from "@/data/vehicleImages";
import { vehicules as mockVehicules, type Vehicule } from "@/data/mock";

// ── Types ──
export type TabKey = "kpi" | "vehicules" | "reservations" | "flotte" | "utilisateurs" | "profil" | "devis";

export interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions: string[];
  dateAttribution: string;
}

export interface Reservation {
  id: string;
  client: string;
  email: string;
  telephone: string;
  vehicule: string;
  vehiculeId: string;
  debut: string;
  fin: string;
  statut: string;
  montant: number;
  caution: number;
  ville: string;
}

export interface MockUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  type: string;
  creeLe: string;
  reservations: number;
  statut: string;
  role: string;
}

export interface FlotteItem {
  id: string;
  vehicule: string;
  plaque: string;
  km: number;
  dernierEntretien: string;
  prochainEntretien: string;
  etat: string;
}

export interface Notification {
  id: string;
  type: "reservation" | "devis" | "utilisateur" | "flotte";
  titre: string;
  message: string;
  date: string;
  lu: boolean;
}

export interface MockDevis {
  id: string;
  client: string;
  email: string;
  telephone: string;
  type: "particulier" | "entreprise";
  nomEntreprise?: string;
  siret?: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  typeVehicule: string;
  nombreVehicules: number;
  statut: "en attente" | "traité" | "refusé";
  creeLe: string;
}

// ── Mock data ──
export const mockReservations: Reservation[] = [
  { id: "R001", client: "Sophie Martin", email: "sophie@mail.com", telephone: "06 12 34 56 78", vehicule: "Peugeot 108", vehiculeId: "1", debut: "2025-03-10", fin: "2025-03-15", statut: "confirmée", montant: 175, caution: 500, ville: "Puteaux" },
  { id: "R002", client: "Thomas Dubois", email: "thomas@mail.com", telephone: "06 23 45 67 89", vehicule: "BMW Série 3", vehiculeId: "5", debut: "2025-03-12", fin: "2025-03-14", statut: "en cours", montant: 190, caution: 1500, ville: "La Défense" },
  { id: "R003", client: "Marie Laurent", email: "marie@mail.com", telephone: "06 34 56 78 90", vehicule: "Renault Clio V", vehiculeId: "3", debut: "2025-03-08", fin: "2025-03-10", statut: "terminée", montant: 110, caution: 600, ville: "Nanterre" },
  { id: "R004", client: "Entreprise ABC", email: "contact@abc.com", telephone: "01 23 45 67 89", vehicule: "Audi Q5", vehiculeId: "8", debut: "2025-03-20", fin: "2025-03-25", statut: "en attente", montant: 600, caution: 2000, ville: "Rueil-Malmaison" },
  { id: "R005", client: "Paul Leroy", email: "paul@mail.com", telephone: "06 45 67 89 01", vehicule: "Mercedes Classe C", vehiculeId: "6", debut: "2025-03-05", fin: "2025-03-07", statut: "annulée", montant: 210, caution: 1500, ville: "La Défense" },
  { id: "R006", client: "Claire Morel", email: "claire@mail.com", telephone: "06 56 78 90 12", vehicule: "Peugeot 3008", vehiculeId: "7", debut: "2025-03-15", fin: "2025-03-18", statut: "confirmée", montant: 285, caution: 1000, ville: "Puteaux" },
  { id: "R007", client: "Lucas Bernard", email: "lucas@mail.com", telephone: "06 67 89 01 23", vehicule: "Fiat 500", vehiculeId: "2", debut: "2025-03-11", fin: "2025-03-13", statut: "en cours", montant: 90, caution: 400, ville: "Bougival" },
  { id: "R008", client: "Emma Petit", email: "emma@mail.com", telephone: "06 78 90 12 34", vehicule: "Peugeot 308", vehiculeId: "4", debut: "2025-03-14", fin: "2025-03-16", statut: "confirmée", montant: 130, caution: 700, ville: "Suresnes" },
  { id: "R009", client: "Hugo Roux", email: "hugo@mail.com", telephone: "06 89 01 23 45", vehicule: "Renault Clio V", vehiculeId: "3", debut: "2025-03-09", fin: "2025-03-11", statut: "terminée", montant: 110, caution: 600, ville: "Nanterre" },
];

export const vehicleNameToId: Record<string, string> = {
  "Peugeot 108": "1", "Fiat 500": "2", "Renault Clio V": "3", "Peugeot 308": "4",
  "BMW Série 3": "5", "Mercedes Classe C": "6", "Peugeot 3008": "7", "Audi Q5": "8",
  "Citroën C1": "9", "Volkswagen Golf 8": "10", "Audi A4": "11", "Renault Captur": "12",
};

export const getVehicleImage = (name: string, id?: string): string | undefined => {
  if (id && vehicleImages[id]) return vehicleImages[id];
  const mappedId = vehicleNameToId[name];
  return mappedId ? vehicleImages[mappedId] : undefined;
};

export const mockUsers: MockUser[] = [
  { id: "U001", nom: "Martin", prenom: "Sophie", email: "sophie@mail.com", type: "particulier", creeLe: "2025-01-15", reservations: 3, statut: "actif", role: "client" },
  { id: "U002", nom: "Dubois", prenom: "Thomas", email: "thomas@mail.com", type: "particulier", creeLe: "2025-02-01", reservations: 1, statut: "actif", role: "client" },
  { id: "U003", nom: "Laurent", prenom: "Marie", email: "marie@mail.com", type: "particulier", creeLe: "2024-12-10", reservations: 5, statut: "actif", role: "client" },
  { id: "U004", nom: "Entreprise ABC", prenom: "—", email: "contact@abc.com", type: "entreprise", creeLe: "2025-01-20", reservations: 8, statut: "actif", role: "client" },
  { id: "U005", nom: "Leroy", prenom: "Paul", email: "paul@mail.com", type: "particulier", creeLe: "2025-03-01", reservations: 0, statut: "suspendu", role: "client" },
];

export const mockFlotte: FlotteItem[] = [
  { id: "F001", vehicule: "Peugeot 108", plaque: "AB-123-CD", km: 24500, dernierEntretien: "2025-02-01", prochainEntretien: "2025-05-01", etat: "bon" },
  { id: "F002", vehicule: "Fiat 500", plaque: "EF-456-GH", km: 18200, dernierEntretien: "2025-01-15", prochainEntretien: "2025-04-15", etat: "bon" },
  { id: "F003", vehicule: "BMW Série 3", plaque: "IJ-789-KL", km: 45000, dernierEntretien: "2025-01-20", prochainEntretien: "2025-04-20", etat: "entretien requis" },
  { id: "F004", vehicule: "Audi Q5", plaque: "MN-012-OP", km: 32000, dernierEntretien: "2025-02-10", prochainEntretien: "2025-05-10", etat: "bon" },
  { id: "F005", vehicule: "Mercedes Classe C", plaque: "QR-345-ST", km: 52000, dernierEntretien: "2024-12-20", prochainEntretien: "2025-03-20", etat: "en panne" },
];

export const initialTeamMembers: TeamMember[] = [
  { id: "T001", nom: "Durand", prenom: "Alice", email: "alice@westdrive.fr", role: "gestionnaire", permissions: ["vehicules", "reservations", "flotte"], dateAttribution: "2025-01-10" },
  { id: "T002", nom: "Moreau", prenom: "Julien", email: "julien@westdrive.fr", role: "support", permissions: ["reservations", "utilisateurs"], dateAttribution: "2025-02-15" },
  { id: "T003", nom: "Garcia", prenom: "Léa", email: "lea@westdrive.fr", role: "comptable", permissions: ["reservations", "kpi"], dateAttribution: "2025-03-01" },
];

export { mockVehicules };

// ── Style maps ──
export const statColors: Record<string, string> = {
  "confirmée": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "en cours": "bg-blue-500/10 text-blue-600 border-blue-200",
  "terminée": "bg-muted text-muted-foreground border-border",
  "en attente": "bg-amber-500/10 text-amber-600 border-amber-200",
  "annulée": "bg-destructive/10 text-destructive border-destructive/20",
};

export const devisStatColors: Record<string, string> = {
  "en attente": "bg-amber-500/10 text-amber-600 border-amber-200",
  "traité": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "refusé": "bg-destructive/10 text-destructive border-destructive/20",
};

export const etatColors: Record<string, string> = {
  "bon": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "entretien requis": "bg-amber-500/10 text-amber-600 border-amber-200",
  "en panne": "bg-destructive/10 text-destructive border-destructive/20",
};

export const roleColors: Record<string, string> = {
  "admin": "bg-primary/10 text-primary border-primary/20",
  "gestionnaire": "bg-blue-500/10 text-blue-600 border-blue-200",
  "support": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "comptable": "bg-amber-500/10 text-amber-600 border-amber-200",
  "client": "bg-muted text-muted-foreground border-border",
};

export const allPermissions = [
  { key: "kpi", label: "Tableau de bord / KPI" },
  { key: "vehicules", label: "Gestion des véhicules" },
  { key: "reservations", label: "Gestion des réservations" },
  { key: "flotte", label: "Gestion de la flotte" },
  { key: "utilisateurs", label: "Gestion des utilisateurs" },
];

export const emptyVehicle: Partial<Vehicule> = {
  nom: "", marque: "", modele: "", annee: 2024, categorie: "COMPACTE",
  transmission: "MANUELLE", energie: "ESSENCE", nbPlaces: 5, kmInclus: 200,
  prixJour: 50, description: "", actif: true, villes: [], disponible: true,
  note: 0, nbAvis: 0, photos: [],
};
