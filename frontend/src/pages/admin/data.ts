import { vehicules as mockVehicules, type Vehicule } from "@/data/mock";

// ── Types ──
export type TabKey = "kpi" | "vehicules" | "reservations" | "flotte" | "avis" | "blog" | "utilisateurs" | "profil" | "devis";

export interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions: string[];
  dateAttribution: string;
}

export type Evenement = {
  id: string;
  titre: string;
  description: string;
  date: string;
  visibleClient: boolean;
  envoiEmail: boolean;
  type: "systeme" | "custom";
};
export interface Reservation {
  id: string;
  publicReference?: string;
  backendStatus?: string;
  vehicleImageUrl?: string;
  client: string;
  email: string;
  telephone: string;
  vehicule: string;
  vehiculeId: string;
  requestedVehicleType?: string;
  vehicleDetails?: {
    marque?: string;
    modele?: string;
    annee?: number;
    categorie?: string;
    transmission?: string;
    energie?: string;
    places?: number;
    immatriculation?: string;
    ville?: string;
  };
  debut: string;
  fin: string;
  statut: string;
  montant: number;
  caution: number;
  ville: string;
   heureDebut?: string;
  heureFin?: string;
  commentaireConfirmation?: string; // infos récupération véhicule
  commentaireAnnulation?: string;
  commentaireRefus?: string;
  kmDebut?: number;
  kmFin?: number;
  photosDebut?: string[];
  photosFin?: string[];
  evenements?: Evenement[];
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
  telephone?: string;
  ville?: string;
  adresse?: string;
}

export interface FlotteItem {
  id: string;
  vehicule: string;
  plaque: string;
  km: number;
  dernierEntretien: string;
  prochainEntretien: string;
  etat: string;
  enPanne: boolean;
  detailPanne?: string;
  historiquePannes: {
    date: string;
    detail: string;
    kmAuMoment: number;
    repareLe?: string;
  }[];
}

export interface Notification {
  id: string;
  type: "reservation" | "devis" | "utilisateur" | "flotte" | "avis";
  titre: string;
  message: string;
  date: string;
  lu: boolean;
}

export interface DevisRow {
  id: string;
  publicReference?: string;
  backendStatus?: string;
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
  statut:
    | "en attente"
    | "en analyse"
    | "proposition envoyee"
    | "en negociation"
    | "en attente paiement"
    | "paye"
    | "converti"
    | "refuse"
    | "annule";
  creeLe: string;
  commentaireRefus?: string;
}

export type AvisSource = "Getaround" | "Turo" | "Google" | "Direct" | "Autre";

export interface AvisRow {
  id: string;
  auteur: string;
  titre: string;
  contenu: string;
  note: number;
  source: string; // texte libre — AvisSource pour les valeurs connues
  date: string;
  status: "PUBLISHED" | "DRAFT";
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

export const mockUsers: MockUser[] = [
  { id: "U001", nom: "Martin", prenom: "Sophie", email: "sophie@mail.com", type: "particulier", creeLe: "2025-01-15", reservations: 3, statut: "actif", role: "client", telephone: "06 12 34 56 78", ville: "Puteaux", adresse: "12 Rue de la Paix" },
  { id: "U002", nom: "Dubois", prenom: "Thomas", email: "thomas@mail.com", type: "particulier", creeLe: "2025-02-01", reservations: 1, statut: "actif", role: "client", telephone: "06 23 45 67 89", ville: "La Défense", adresse: "5 Avenue Charles de Gaulle" },
  { id: "U003", nom: "Laurent", prenom: "Marie", email: "marie@mail.com", type: "particulier", creeLe: "2024-12-10", reservations: 5, statut: "actif", role: "client", telephone: "06 34 56 78 90", ville: "Nanterre", adresse: "8 Boulevard des Nations" },
  { id: "U004", nom: "Entreprise ABC", prenom: "—", email: "contact@abc.com", type: "entreprise", creeLe: "2025-01-20", reservations: 8, statut: "actif", role: "client", telephone: "01 23 45 67 89", ville: "Rueil-Malmaison", adresse: "15 Rue du Commerce" },
  { id: "U005", nom: "Leroy", prenom: "Paul", email: "paul@mail.com", type: "particulier", creeLe: "2025-03-01", reservations: 0, statut: "suspendu", role: "client", telephone: "06 45 67 89 01", ville: "La Défense", adresse: "3 Place de la Défense" },
];

export const mockFlotte: FlotteItem[] = [
  { 
    id: "F001", 
    vehicule: "Peugeot 108", 
    plaque: "AB-001-CD", 
    km: 45000, 
    dernierEntretien: "2025-02-01", 
    prochainEntretien: "2025-05-01", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F002", 
    vehicule: "Fiat 500", 
    plaque: "EF-002-GH", 
    km: 25000, 
    dernierEntretien: "2025-01-15", 
    prochainEntretien: "2025-04-15", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F009", 
    vehicule: "Citroën C1", 
    plaque: "IJ-009-KL", 
    km: 52000, 
    dernierEntretien: "2024-12-15", 
    prochainEntretien: "2025-03-15", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F003", 
    vehicule: "Renault Clio V", 
    plaque: "MN-003-OP", 
    km: 38000, 
    dernierEntretien: "2025-01-20", 
    prochainEntretien: "2025-04-20", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F004", 
    vehicule: "Peugeot 308", 
    plaque: "QR-004-ST", 
    km: 15000, 
    dernierEntretien: "2025-02-10", 
    prochainEntretien: "2025-05-10", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F005", 
    vehicule: "BMW Série 3", 
    plaque: "UV-005-WX", 
    km: 22000, 
    dernierEntretien: "2025-01-20", 
    prochainEntretien: "2025-04-20", 
    etat: "entretien requis",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F006", 
    vehicule: "Mercedes Classe C", 
    plaque: "YZ-006-AA", 
    km: 35000, 
    dernierEntretien: "2024-12-20", 
    prochainEntretien: "2025-03-20", 
    etat: "en panne",
    enPanne: true,
    detailPanne: "Problème de transmission - hors service temporaire",
    historiquePannes: [
      {
        date: "2025-02-15",
        detail: "Problème de transmission - hors service temporaire",
        kmAuMoment: 35000,
        repareLe: undefined,
      }
    ],
  },
  { 
    id: "F010", 
    vehicule: "Volkswagen Golf 8", 
    plaque: "BB-010-CC", 
    km: 18000, 
    dernierEntretien: "2025-02-05", 
    prochainEntretien: "2025-05-05", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F011", 
    vehicule: "Audi A4", 
    plaque: "DD-011-EE", 
    km: 12000, 
    dernierEntretien: "2025-02-01", 
    prochainEntretien: "2025-05-01", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F012", 
    vehicule: "Renault Captur", 
    plaque: "FF-012-GG", 
    km: 28000, 
    dernierEntretien: "2025-01-25", 
    prochainEntretien: "2025-04-25", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F007", 
    vehicule: "Peugeot 3008", 
    plaque: "HH-007-II", 
    km: 19000, 
    dernierEntretien: "2025-02-03", 
    prochainEntretien: "2025-05-03", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
  { 
    id: "F008", 
    vehicule: "Audi Q5", 
    plaque: "JJ-008-KK", 
    km: 11000, 
    dernierEntretien: "2025-02-08", 
    prochainEntretien: "2025-05-08", 
    etat: "bon",
    enPanne: false,
    detailPanne: undefined,
    historiquePannes: [],
  },
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
  "refusée": "bg-destructive/10 text-destructive border-destructive/20",
};

export const devisStatColors: Record<string, string> = {
  "en attente": "bg-amber-500/10 text-amber-600 border-amber-200",
  "en analyse": "bg-blue-500/10 text-blue-600 border-blue-200",
  "proposition envoyee": "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  "en negociation": "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  "en attente paiement": "bg-orange-500/10 text-orange-600 border-orange-200",
  "paye": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "converti": "bg-teal-500/10 text-teal-600 border-teal-200",
  "refuse": "bg-destructive/10 text-destructive border-destructive/20",
  "annule": "bg-destructive/10 text-destructive border-destructive/20",
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
  {key: "avis", label: "Gestion des avis" },
  { key: "utilisateurs", label: "Gestion des utilisateurs" },
];

export const emptyVehicle: Partial<Vehicule> = {
  nom: "", marque: "", modele: "", annee: 2024, categorie: "COMPACTE",
  transmission: "MANUELLE", energie: "ESSENCE", isHybride: false, nbPlaces: 5, kmInclus: 200,
  kilométrage: 0, prixJour: 50, prixHeure: 12, description: "", actif: true, villes: [], disponible: true,
  note: 0, nbAvis: 0, photos: [], autreFraisLibelle: [], entretenueRequis: { kilométrage: 150000, jours: 14 },
  plaqueImmatriculation: generatePlate(),
};

function generatePlate(): string {
  const letters = Math.random().toString(36).substring(2, 4).toUpperCase();
  const numbers = Math.floor(Math.random() * 900) + 100;
  const letters2 = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${letters}-${numbers}-${letters2}`;
}