export interface AdminUser {
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