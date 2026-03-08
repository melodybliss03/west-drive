export type Categorie = "MICRO" | "COMPACTE" | "BERLINE" | "SUV";
export type Transmission = "MANUELLE" | "AUTOMATIQUE";
export type Energie = "ESSENCE" | "DIESEL" | "HYBRIDE" | "ELECTRIQUE";

export interface Vehicule {
  id: string;
  nom: string;
  marque: string;
  modele: string;
  annee: number;
  categorie: Categorie;
  transmission: Transmission;
  energie: Energie;
  nbPlaces: number;
  kmInclus: number;
  prixJour: number;
  description: string;
  photos: string[];
  actif: boolean;
  villes: string[];
  disponible: boolean;
  note: number;
  nbAvis: number;
}

export interface Ville {
  id: string;
  nom: string;
  lat: number;
  lng: number;
}

export const villes: Ville[] = [
  { id: "v1", nom: "Puteaux", lat: 48.8847, lng: 2.2384 },
  { id: "v2", nom: "La Défense", lat: 48.8924, lng: 2.239 },
  { id: "v3", nom: "Nanterre", lat: 48.8924, lng: 2.2069 },
  { id: "v4", nom: "Rueil-Malmaison", lat: 48.8769, lng: 2.1817 },
  { id: "v5", nom: "Bougival", lat: 48.865, lng: 2.1333 },
  { id: "v6", nom: "Boulogne-Billancourt", lat: 48.8354, lng: 2.2397 },
  { id: "v7", nom: "La Celle-Saint-Cloud", lat: 48.8456, lng: 2.1375 },
  { id: "v8", nom: "Suresnes", lat: 48.8712, lng: 2.2286 },
];

export const vehicules: Vehicule[] = [
  {
    id: "1",
    nom: "Peugeot 108",
    marque: "Peugeot",
    modele: "108",
    annee: 2021,
    categorie: "MICRO",
    transmission: "MANUELLE",
    energie: "ESSENCE",
    nbPlaces: 4,
    kmInclus: 150,
    prixJour: 35,
    description: "Citadine agile et économique, parfaite pour circuler en ville. Idéale pour les déplacements quotidiens en Île-de-France avec une consommation maîtrisée.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "La Défense", "Rueil-Malmaison"],
    disponible: true,
    note: 4.5,
    nbAvis: 23,
  },
  {
    id: "2",
    nom: "Fiat 500",
    marque: "Fiat",
    modele: "500",
    annee: 2022,
    categorie: "MICRO",
    transmission: "AUTOMATIQUE",
    energie: "HYBRIDE",
    nbPlaces: 4,
    kmInclus: 150,
    prixJour: 40,
    description: "La mythique Fiat 500 en version hybride. Style iconique et conduite facile pour vos trajets urbains.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Nanterre", "Bougival"],
    disponible: true,
    note: 4.7,
    nbAvis: 18,
  },
  {
    id: "9",
    nom: "Citroën C1",
    marque: "Citroën",
    modele: "C1",
    annee: 2021,
    categorie: "MICRO",
    transmission: "MANUELLE",
    energie: "ESSENCE",
    nbPlaces: 4,
    kmInclus: 150,
    prixJour: 32,
    description: "Citadine compacte et maniable, la C1 est idéale pour se faufiler en ville avec une consommation très réduite.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Suresnes", "Boulogne-Billancourt"],
    disponible: true,
    note: 4.3,
    nbAvis: 14,
  },
  {
    id: "3",
    nom: "Renault Clio V",
    marque: "Renault",
    modele: "Clio V",
    annee: 2022,
    categorie: "COMPACTE",
    transmission: "AUTOMATIQUE",
    energie: "HYBRIDE",
    nbPlaces: 5,
    kmInclus: 200,
    prixJour: 55,
    description: "Polyvalente et moderne, la Clio V hybride offre le meilleur compromis entre confort et économie pour vos trajets quotidiens.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Nanterre", "Bougival"],
    disponible: true,
    note: 4.6,
    nbAvis: 31,
  },
  {
    id: "4",
    nom: "Peugeot 308",
    marque: "Peugeot",
    modele: "308",
    annee: 2023,
    categorie: "COMPACTE",
    transmission: "AUTOMATIQUE",
    energie: "DIESEL",
    nbPlaces: 5,
    kmInclus: 250,
    prixJour: 60,
    description: "Design primé et technologie de pointe. La 308 offre un habitacle premium et une conduite dynamique.",
    photos: [],
    actif: true,
    villes: ["La Défense", "Rueil-Malmaison", "Suresnes"],
    disponible: true,
    note: 4.4,
    nbAvis: 15,
  },
  {
    id: "5",
    nom: "BMW Série 3",
    marque: "BMW",
    modele: "320d",
    annee: 2023,
    categorie: "BERLINE",
    transmission: "AUTOMATIQUE",
    energie: "DIESEL",
    nbPlaces: 5,
    kmInclus: 300,
    prixJour: 95,
    description: "L'excellence allemande. Confort, puissance et technologie pour vos déplacements professionnels ou personnels.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "La Défense", "Boulogne-Billancourt"],
    disponible: true,
    note: 4.8,
    nbAvis: 27,
  },
  {
    id: "6",
    nom: "Mercedes Classe C",
    marque: "Mercedes",
    modele: "C200",
    annee: 2022,
    categorie: "BERLINE",
    transmission: "AUTOMATIQUE",
    energie: "ESSENCE",
    nbPlaces: 5,
    kmInclus: 300,
    prixJour: 105,
    description: "Élégance et raffinement. La Classe C incarne le luxe accessible avec un intérieur soigné et une conduite souple.",
    photos: [],
    actif: true,
    villes: ["La Défense", "Rueil-Malmaison", "La Celle-Saint-Cloud"],
    disponible: false,
    note: 4.9,
    nbAvis: 12,
  },
  {
    id: "10",
    nom: "Volkswagen Golf 8",
    marque: "Volkswagen",
    modele: "Golf 8",
    annee: 2023,
    categorie: "COMPACTE",
    transmission: "MANUELLE",
    energie: "ESSENCE",
    nbPlaces: 5,
    kmInclus: 200,
    prixJour: 58,
    description: "Référence du segment compact, la Golf 8 allie polyvalence, confort et technologies modernes pour tous vos trajets.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Boulogne-Billancourt", "Suresnes"],
    disponible: true,
    note: 4.5,
    nbAvis: 22,
  },
  {
    id: "11",
    nom: "Audi A4",
    marque: "Audi",
    modele: "A4",
    annee: 2023,
    categorie: "BERLINE",
    transmission: "AUTOMATIQUE",
    energie: "HYBRIDE",
    nbPlaces: 5,
    kmInclus: 300,
    prixJour: 110,
    description: "Berline premium au design épuré. L'Audi A4 offre un confort de conduite exceptionnel et des finitions haut de gamme.",
    photos: [],
    actif: true,
    villes: ["La Défense", "Nanterre", "Rueil-Malmaison"],
    disponible: true,
    note: 4.7,
    nbAvis: 16,
  },
  {
    id: "12",
    nom: "Renault Captur",
    marque: "Renault",
    modele: "Captur",
    annee: 2023,
    categorie: "SUV",
    transmission: "AUTOMATIQUE",
    energie: "ESSENCE",
    nbPlaces: 5,
    kmInclus: 200,
    prixJour: 70,
    description: "SUV urbain compact et stylé. Le Captur offre modularité et confort pour vos escapades en ville comme à la campagne.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Bougival", "La Celle-Saint-Cloud"],
    disponible: true,
    note: 4.4,
    nbAvis: 25,
  },
  {
    id: "7",
    nom: "Peugeot 3008",
    marque: "Peugeot",
    modele: "3008",
    annee: 2023,
    categorie: "SUV",
    transmission: "AUTOMATIQUE",
    energie: "HYBRIDE",
    nbPlaces: 5,
    kmInclus: 250,
    prixJour: 85,
    description: "SUV familial au design félin. Spacieux, technologique et hybride pour des trajets confortables en toutes circonstances.",
    photos: [],
    actif: true,
    villes: ["Puteaux", "Nanterre", "Suresnes"],
    disponible: true,
    note: 4.6,
    nbAvis: 34,
  },
  {
    id: "8",
    nom: "Audi Q5",
    marque: "Audi",
    modele: "Q5",
    annee: 2023,
    categorie: "SUV",
    transmission: "AUTOMATIQUE",
    energie: "DIESEL",
    nbPlaces: 5,
    kmInclus: 300,
    prixJour: 120,
    description: "Le SUV premium par excellence. Finitions haut de gamme, quattro intégral et technologies embarquées de dernière génération.",
    photos: [],
    actif: true,
    villes: ["La Défense", "Boulogne-Billancourt", "Rueil-Malmaison"],
    disponible: true,
    note: 4.8,
    nbAvis: 19,
  },
];

export const temoignages = [
  {
    id: "t1",
    nom: "Sophie Martin",
    note: 5,
    commentaire: "Service impeccable ! Véhicule propre, livré à l'heure. Je recommande WEST DRIVE sans hésitation pour la location en région parisienne.",
    vehicule: "Renault Clio V",
    date: "2024-02-15",
  },
  {
    id: "t2",
    nom: "Thomas Dubois",
    note: 5,
    commentaire: "Rapport qualité-prix imbattable. La BMW était en parfait état. Processus de réservation simple et rapide.",
    vehicule: "BMW Série 3",
    date: "2024-01-28",
  },
  {
    id: "t3",
    nom: "Marie Laurent",
    note: 4,
    commentaire: "Très satisfaite de mon expérience. L'équipe est réactive et les véhicules sont bien entretenus. Je reviendrai !",
    vehicule: "Peugeot 3008",
    date: "2024-03-02",
  },
];

export const faqData = [
  {
    categorie: "Réservation",
    questions: [
      { q: "Comment réserver un véhicule ?", a: "Utilisez notre formulaire de recherche en page d'accueil, sélectionnez vos dates et votre ville, puis suivez le tunnel de réservation en 5 étapes." },
      { q: "Puis-je réserver sans créer de compte ?", a: "Oui, nous proposons une réservation en mode invité. Vous recevrez votre confirmation par email." },
      { q: "Puis-je modifier ma réservation ?", a: "Oui, contactez-nous au moins 24h avant la prise en charge pour toute modification." },
    ],
  },
  {
    categorie: "Paiement",
    questions: [
      { q: "Quels moyens de paiement acceptez-vous ?", a: "Carte bancaire (Visa, Mastercard) et paiement à la prise en charge." },
      { q: "Y a-t-il une caution ?", a: "Oui, une caution est retenue sur votre carte bancaire au moment de la prise en charge et restituée au retour du véhicule." },
    ],
  },
  {
    categorie: "Documents",
    questions: [
      { q: "Quels documents dois-je fournir ?", a: "Permis de conduire valide (2 ans minimum), pièce d'identité et justificatif de domicile." },
      { q: "Quelle est la durée minimum de permis requise ?", a: "Le conducteur doit être titulaire du permis B depuis au moins 2 ans." },
    ],
  },
  {
    categorie: "Livraison",
    questions: [
      { q: "Livrez-vous le véhicule ?", a: "Oui, nous proposons un service de livraison dans un rayon de 20 km autour de Puteaux." },
      { q: "La livraison est-elle payante ?", a: "La livraison est offerte dans les villes de notre zone de couverture. Au-delà, un supplément s'applique." },
    ],
  },
];

export function getVehiculesByCategorie(categorie: Categorie): Vehicule[] {
  return vehicules.filter((v) => v.categorie === categorie && v.actif);
}

export function getVehiculeById(id: string): Vehicule | undefined {
  return vehicules.find((v) => v.id === id);
}

export function searchVehicules(filters: {
  ville?: string;
  categorie?: Categorie;
  transmission?: Transmission;
  energie?: Energie;
  prixMin?: number;
  prixMax?: number;
  nbPlaces?: number;
}): Vehicule[] {
  return vehicules.filter((v) => {
    if (!v.actif) return false;
    if (filters.ville && !v.villes.includes(filters.ville)) return false;
    if (filters.categorie && v.categorie !== filters.categorie) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.energie && v.energie !== filters.energie) return false;
    if (filters.prixMin && v.prixJour < filters.prixMin) return false;
    if (filters.prixMax && v.prixJour > filters.prixMax) return false;
    if (filters.nbPlaces && v.nbPlaces < filters.nbPlaces) return false;
    return true;
  });
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
