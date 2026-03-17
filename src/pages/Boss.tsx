import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Users, CalendarCheck, BarChart3, Plus, Edit, Trash2, Eye,
  Search, TrendingUp, TrendingDown, Bell,
  DollarSign, CheckCircle, XCircle, AlertTriangle, Truck, LogOut, Shield,
  Eye as EyeIcon, EyeOff, UserCog, Save, Mail, Phone, ArrowRight, UserPlus,
  MapPin, Clock, CreditCard
} from "lucide-react";
import { vehicleImages } from "@/data/vehicleImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { vehicules as mockVehicules, type Vehicule, type Categorie, type Transmission, type Energie } from "@/data/mock";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// ── Mock data ──
const mockReservations = [
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

// Vehicle name to ID mapping for images
const vehicleNameToId: Record<string, string> = {
  "Peugeot 108": "1", "Fiat 500": "2", "Renault Clio V": "3", "Peugeot 308": "4",
  "BMW Série 3": "5", "Mercedes Classe C": "6", "Peugeot 3008": "7", "Audi Q5": "8",
  "Citroën C1": "9", "Volkswagen Golf 8": "10", "Audi A4": "11", "Renault Captur": "12",
};

const getVehicleImage = (name: string, id?: string): string | undefined => {
  if (id && vehicleImages[id]) return vehicleImages[id];
  const mappedId = vehicleNameToId[name];
  return mappedId ? vehicleImages[mappedId] : undefined;
};

const mockUsers = [
  { id: "U001", nom: "Martin", prenom: "Sophie", email: "sophie@mail.com", type: "particulier", creeLe: "2025-01-15", reservations: 3, statut: "actif", role: "client" as string },
  { id: "U002", nom: "Dubois", prenom: "Thomas", email: "thomas@mail.com", type: "particulier", creeLe: "2025-02-01", reservations: 1, statut: "actif", role: "client" as string },
  { id: "U003", nom: "Laurent", prenom: "Marie", email: "marie@mail.com", type: "particulier", creeLe: "2024-12-10", reservations: 5, statut: "actif", role: "client" as string },
  { id: "U004", nom: "Entreprise ABC", prenom: "—", email: "contact@abc.com", type: "entreprise", creeLe: "2025-01-20", reservations: 8, statut: "actif", role: "client" as string },
  { id: "U005", nom: "Leroy", prenom: "Paul", email: "paul@mail.com", type: "particulier", creeLe: "2025-03-01", reservations: 0, statut: "suspendu", role: "client" as string },
];

const mockFlotte = [
  { id: "F001", vehicule: "Peugeot 108", plaque: "AB-123-CD", km: 24500, dernierEntretien: "2025-02-01", prochainEntretien: "2025-05-01", etat: "bon" },
  { id: "F002", vehicule: "Fiat 500", plaque: "EF-456-GH", km: 18200, dernierEntretien: "2025-01-15", prochainEntretien: "2025-04-15", etat: "bon" },
  { id: "F003", vehicule: "BMW Série 3", plaque: "IJ-789-KL", km: 45000, dernierEntretien: "2025-01-20", prochainEntretien: "2025-04-20", etat: "entretien requis" },
  { id: "F004", vehicule: "Audi Q5", plaque: "MN-012-OP", km: 32000, dernierEntretien: "2025-02-10", prochainEntretien: "2025-05-10", etat: "bon" },
  { id: "F005", vehicule: "Mercedes Classe C", plaque: "QR-345-ST", km: 52000, dernierEntretien: "2024-12-20", prochainEntretien: "2025-03-20", etat: "en panne" },
];

// ── Team members (mock) ──
interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions: string[];
  dateAttribution: string;
}

const initialTeamMembers: TeamMember[] = [
  { id: "T001", nom: "Durand", prenom: "Alice", email: "alice@westdrive.fr", role: "gestionnaire", permissions: ["vehicules", "reservations", "flotte"], dateAttribution: "2025-01-10" },
  { id: "T002", nom: "Moreau", prenom: "Julien", email: "julien@westdrive.fr", role: "support", permissions: ["reservations", "utilisateurs"], dateAttribution: "2025-02-15" },
  { id: "T003", nom: "Garcia", prenom: "Léa", email: "lea@westdrive.fr", role: "comptable", permissions: ["reservations", "kpi"], dateAttribution: "2025-03-01" },
];

type TabKey = "kpi" | "vehicules" | "reservations" | "flotte" | "utilisateurs" | "profil";

const statColors: Record<string, string> = {
  "confirmée": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "en cours": "bg-blue-500/10 text-blue-600 border-blue-200",
  "terminée": "bg-muted text-muted-foreground border-border",
  "en attente": "bg-amber-500/10 text-amber-600 border-amber-200",
  "annulée": "bg-destructive/10 text-destructive border-destructive/20",
};

const etatColors: Record<string, string> = {
  "bon": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "entretien requis": "bg-amber-500/10 text-amber-600 border-amber-200",
  "en panne": "bg-destructive/10 text-destructive border-destructive/20",
};

const roleColors: Record<string, string> = {
  "admin": "bg-primary/10 text-primary border-primary/20",
  "gestionnaire": "bg-blue-500/10 text-blue-600 border-blue-200",
  "support": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "comptable": "bg-amber-500/10 text-amber-600 border-amber-200",
  "client": "bg-muted text-muted-foreground border-border",
};

const allPermissions = [
  { key: "kpi", label: "Tableau de bord / KPI" },
  { key: "vehicules", label: "Gestion des véhicules" },
  { key: "reservations", label: "Gestion des réservations" },
  { key: "flotte", label: "Gestion de la flotte" },
  { key: "utilisateurs", label: "Gestion des utilisateurs" },
];

const emptyVehicle: Partial<Vehicule> = {
  nom: "", marque: "", modele: "", annee: 2024, categorie: "COMPACTE",
  transmission: "MANUELLE", energie: "ESSENCE", nbPlaces: 5, kmInclus: 200,
  prixJour: 50, description: "", actif: true, villes: [], disponible: true,
  note: 0, nbAvis: 0, photos: [],
};

const sidebarItems: { key: TabKey; icon: typeof BarChart3; label: string }[] = [
  { key: "kpi", icon: BarChart3, label: "Tableau de bord" },
  { key: "vehicules", icon: Car, label: "Véhicules" },
  { key: "reservations", icon: CalendarCheck, label: "Réservations" },
  { key: "flotte", icon: Truck, label: "Gestion flotte" },
  { key: "utilisateurs", icon: Users, label: "Utilisateurs" },
  { key: "profil", icon: UserCog, label: "Mon profil" },
];

// ═══════════════════════════════════════════════════════════
// Admin Sidebar Component
// ═══════════════════════════════════════════════════════════
function AdminSidebar({ tab, setTab, user, onLogout }: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  user: { nom: string; prenom: string; email: string };
  onLogout: () => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-foreground">
      <SidebarContent className="bg-foreground">
        <div className={`p-4 border-b border-border/20 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <span className="font-display text-lg font-bold text-primary">W</span>
          ) : (
            <div>
              <h1 className="font-display text-lg font-bold text-primary-foreground">
                WEST <span className="text-primary">DRIVE</span>
              </h1>
              <p className="text-xs text-primary-foreground/50 mt-0.5">Administration</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/40 text-[10px] uppercase tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => setTab(item.key)}
                    isActive={tab === item.key}
                    tooltip={item.label}
                    className={`transition-colors ${
                      tab === item.key
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border/20">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-primary-foreground/50 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors ${collapsed ? "justify-center w-full" : "px-1"}`}
            title="Retour au site"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Retour au site</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Boss Page
// ═══════════════════════════════════════════════════════════
export default function Boss() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("kpi");
  const [vehicles, setVehicles] = useState<Vehicule[]>(mockVehicules);
  const [users, setUsers] = useState(mockUsers);
  const [editVehicle, setEditVehicle] = useState<Partial<Vehicule> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchV, setSearchV] = useState("");
  const [searchR, setSearchR] = useState("");
  const [searchU, setSearchU] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<typeof mockReservations[0] | null>(null);
  const [reservations, setReservations] = useState(mockReservations);

  // ── Team members state ──
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberPermissions, setNewMemberPermissions] = useState<string[]>([]);

  // ── Profile edit state ──
  const [profileForm, setProfileForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    email: user?.email || "",
    telephone: "06 12 34 56 78",
  });
  const [profileEditing, setProfileEditing] = useState(false);

  // ── Admin login/register state ──
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ nomComplet: "", email: "", password: "" });
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = (score: number) => {
    if (score <= 1) return { text: "Très faible", color: "bg-destructive" };
    if (score === 2) return { text: "Faible", color: "bg-amber-500" };
    if (score === 3) return { text: "Moyen", color: "bg-amber-400" };
    if (score === 4) return { text: "Fort", color: "bg-emerald-400" };
    return { text: "Très fort", color: "bg-emerald-500" };
  };

  const validateAuth = () => {
    const errs: Record<string, string> = {};
    if (authMode === "register" && !authForm.nomComplet.trim()) errs.nomComplet = "Le nom complet est requis.";
    if (!authForm.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) errs.email = "Email invalide.";
    if (!authForm.password.trim()) errs.password = "Le mot de passe est requis.";
    else if (authMode === "register") {
      if (authForm.password.length < 12) errs.password = "Minimum 12 caractères.";
      else if (!/[A-Z]/.test(authForm.password)) errs.password = "Au moins une majuscule requise.";
      else if (!/[a-z]/.test(authForm.password)) errs.password = "Au moins une minuscule requise.";
      else if (!/[0-9]/.test(authForm.password)) errs.password = "Au moins un chiffre requis.";
      else if (!/[^A-Za-z0-9]/.test(authForm.password)) errs.password = "Au moins un caractère spécial requis (!@#$%...).";
    } else if (authForm.password.length < 6) errs.password = "Minimum 6 caractères.";
    setAuthErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuth()) return;
    setAuthLoading(true);
    setTimeout(() => {
      const parts = authForm.nomComplet.trim().split(" ");
      const prenom = parts[0] || "Admin";
      const nom = parts.slice(1).join(" ") || "WEST DRIVE";
      login({ nom, prenom, email: authForm.email });
      toast({ title: authMode === "register" ? "Compte admin créé !" : "Connexion réussie", description: "Bienvenue dans l'espace administration." });
      setAuthLoading(false);
      setProfileForm({ prenom, nom, email: authForm.email, telephone: "06 12 34 56 78" });
    }, 1000);
  };

  // ── Auth guard ──
  if (!user) {
    const strength = passwordStrength(authForm.password);
    const sLabel = strengthLabel(strength);
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-primary-foreground">
              WEST <span className="text-primary">DRIVE</span>
            </h1>
            <p className="text-primary-foreground/50 text-sm mt-1">Administration</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
            <h2 className="font-display text-xl font-bold text-center mb-1">
              {authMode === "login" ? "Se connecter" : "Créer un compte admin"}
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              {authMode === "login" ? "Accédez au tableau de bord." : "Mot de passe ultra-sécurisé requis."}
            </p>
            <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
              {authMode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nom complet <span className="text-primary">*</span></label>
                  <Input placeholder="Jean Dupont" value={authForm.nomComplet} onChange={e => { setAuthForm(p => ({ ...p, nomComplet: e.target.value })); setAuthErrors(p => ({ ...p, nomComplet: "" })); }} className={authErrors.nomComplet ? "border-destructive" : ""} />
                  {authErrors.nomComplet && <p className="text-xs text-destructive">{authErrors.nomComplet}</p>}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email <span className="text-primary">*</span></label>
                <Input type="email" placeholder="admin@westdrive.fr" value={authForm.email} onChange={e => { setAuthForm(p => ({ ...p, email: e.target.value })); setAuthErrors(p => ({ ...p, email: "" })); }} className={authErrors.email ? "border-destructive" : ""} />
                {authErrors.email && <p className="text-xs text-destructive">{authErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mot de passe <span className="text-primary">*</span></label>
                <div className="relative">
                  <Input type={showPwd ? "text" : "password"} placeholder={authMode === "register" ? "Min. 12 car., majuscule, chiffre, spécial" : "Votre mot de passe"} value={authForm.password} onChange={e => { setAuthForm(p => ({ ...p, password: e.target.value })); setAuthErrors(p => ({ ...p, password: "" })); }} className={authErrors.password ? "border-destructive" : ""} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {authErrors.password && <p className="text-xs text-destructive">{authErrors.password}</p>}
                {authMode === "register" && authForm.password.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? sLabel.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Force : <span className="font-medium">{sLabel.text}</span></p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li className={authForm.password.length >= 12 ? "text-emerald-600" : ""}>Min. 12 caractères</li>
                      <li className={/[A-Z]/.test(authForm.password) ? "text-emerald-600" : ""}>Une majuscule</li>
                      <li className={/[a-z]/.test(authForm.password) ? "text-emerald-600" : ""}>Une minuscule</li>
                      <li className={/[0-9]/.test(authForm.password) ? "text-emerald-600" : ""}>Un chiffre</li>
                      <li className={/[^A-Za-z0-9]/.test(authForm.password) ? "text-emerald-600" : ""}>Un caractère spécial</li>
                    </ul>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
                {authLoading ? "Chargement..." : authMode === "login" ? "Se connecter" : "Créer le compte"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {authMode === "login" ? (
                <>Pas encore de compte admin ? <button onClick={() => setAuthMode("register")} className="text-primary font-medium hover:underline">Créer un compte</button></>
              ) : (
                <>Déjà un compte ? <button onClick={() => setAuthMode("login")} className="text-primary font-medium hover:underline">Se connecter</button></>
              )}
            </p>
            <div className="text-center mt-4">
              <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Retour au site</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── KPI data ──
  const totalCA = mockReservations.filter(r => r.statut !== "annulée").reduce((s, r) => s + r.montant, 0);
  const activeRes = mockReservations.filter(r => ["confirmée", "en cours"].includes(r.statut)).length;
  const totalUsers = users.length;
  const availableVehicles = vehicles.filter(v => v.disponible && v.actif).length;

  // ── Vehicle CRUD ──
  const openNew = () => { setEditVehicle({ ...emptyVehicle, id: `v-${Date.now()}` }); setIsNew(true); };
  const openEdit = (v: Vehicule) => { setEditVehicle({ ...v }); setIsNew(false); };
  const saveVehicle = () => {
    if (!editVehicle) return;
    if (isNew) setVehicles(prev => [...prev, editVehicle as Vehicule]);
    else setVehicles(prev => prev.map(v => v.id === editVehicle.id ? editVehicle as Vehicule : v));
    setEditVehicle(null);
    toast({ title: isNew ? "Véhicule ajouté" : "Véhicule mis à jour" });
  };
  const deleteVehicle = (id: string) => { setVehicles(prev => prev.filter(v => v.id !== id)); setDeleteConfirm(null); toast({ title: "Véhicule supprimé" }); };

  // ── Add team member ──
  const addTeamMember = () => {
    if (!newMemberEmail.trim() || !newMemberRole) {
      toast({ title: "Erreur", description: "Veuillez remplir l'email et le rôle.", variant: "destructive" });
      return;
    }
    const newMember: TeamMember = {
      id: `T-${Date.now()}`,
      nom: newMemberEmail.split("@")[0],
      prenom: "",
      email: newMemberEmail,
      role: newMemberRole,
      permissions: newMemberPermissions,
      dateAttribution: new Date().toISOString().split("T")[0],
    };
    setTeamMembers(prev => [...prev, newMember]);
    setNewMemberEmail("");
    setNewMemberRole("");
    setNewMemberPermissions([]);
    toast({ title: "Membre ajouté", description: `${newMemberEmail} a été ajouté avec le rôle "${newMemberRole}".` });
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Membre retiré" });
  };

  // ── Profile save ──
  const saveProfile = () => {
    login({ nom: profileForm.nom, prenom: profileForm.prenom, email: profileForm.email });
    setProfileEditing(false);
    toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
  };

  const filteredVehicles = vehicles.filter(v => v.nom.toLowerCase().includes(searchV.toLowerCase()) || v.marque.toLowerCase().includes(searchV.toLowerCase()));
  const filteredRes = mockReservations.filter(r => r.client.toLowerCase().includes(searchR.toLowerCase()) || r.vehicule.toLowerCase().includes(searchR.toLowerCase()));
  const filteredUsers = users.filter(u => u.nom.toLowerCase().includes(searchU.toLowerCase()) || u.email.toLowerCase().includes(searchU.toLowerCase()));

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const togglePermission = (key: string) => {
    setNewMemberPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="h-14 flex items-center gap-4 border-b border-border bg-card px-4 flex-shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
              <button
                onClick={() => setTab("profil")}
                className="flex items-center gap-2 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user.prenom[0]}{user.nom[0]}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.prenom} {user.nom}</span>
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ═══ KPI / DASHBOARD ═══ */}
              {tab === "kpi" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-display font-bold">Dashboard</h2>
                      <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activité</p>
                    </div>
                  </div>

                  {/* Stat cards row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Chiffre d'affaires", value: `${totalCA.toLocaleString()} €`, icon: DollarSign, trend: "+12%", up: true },
                      { label: "Réservations actives", value: activeRes, icon: CalendarCheck, trend: "+3", up: true },
                      { label: "Véhicules dispo.", value: `${availableVehicles}/${vehicles.length}`, icon: Car, trend: "", up: true },
                      { label: "Utilisateurs", value: totalUsers, icon: Users, trend: "+2", up: true },
                    ].map((kpi, i) => (
                      <Card key={i} className="border border-border">
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-muted">
                              <kpi.icon className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                              <p className="text-xl font-bold">{kpi.value}</p>
                            </div>
                          </div>
                          {kpi.trend && (
                            <div className="flex items-center gap-1 mt-3 text-xs">
                              {kpi.up ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                              <span className={kpi.up ? "text-emerald-600" : "text-destructive"}>{kpi.trend}</span>
                              <span className="text-muted-foreground">ce mois</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Two-column layout: Reservations + Team */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Reservations - left 2 cols */}
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            Réservations récentes
                            <span className="text-sm font-normal text-muted-foreground">({String(mockReservations.length).padStart(2, "0")})</span>
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary gap-1 text-xs"
                            onClick={() => setTab("reservations")}
                          >
                            Voir tout <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockReservations.slice(0, 5).map(r => (
                            <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                                <Car className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{r.client}</p>
                                <p className="text-xs text-muted-foreground">{r.vehicule} · {r.debut}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold">{r.montant} €</p>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statColors[r.statut] || ""}`}>{r.statut}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team members with roles - right col */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Équipe & Rôles</CardTitle>
                        <p className="text-xs text-muted-foreground">Membres avec un rôle attribué</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {teamMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                              <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
                                {member.prenom ? member.prenom[0] : member.nom[0]}{member.nom[member.nom.length > 1 ? 1 : 0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {member.prenom ? `${member.prenom} ${member.nom}` : member.email}
                                </p>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 ${roleColors[member.role] || "bg-muted text-muted-foreground border-border"}`}>
                                  {member.role}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {teamMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucun membre assigné</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 gap-1 text-xs"
                          onClick={() => setTab("profil")}
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Gérer les rôles
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* ═══ VÉHICULES ═══ */}
              {tab === "vehicules" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-display font-bold">Véhicules</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher…" value={searchV} onChange={e => setSearchV(e.target.value)} className="pl-9 w-56" />
                      </div>
                      <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Véhicule</TableHead>
                              <TableHead>Catégorie</TableHead>
                              <TableHead>Prix/jour</TableHead>
                              <TableHead className="hidden md:table-cell">Villes</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVehicles.map(v => (
                              <TableRow key={v.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{v.nom}</p>
                                    <p className="text-xs text-muted-foreground">{v.transmission} · {v.energie}</p>
                                  </div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{v.categorie}</Badge></TableCell>
                                <TableCell className="font-semibold">{v.prixJour} €</TableCell>
                                <TableCell className="text-xs max-w-[150px] truncate hidden md:table-cell">{v.villes.join(", ")}</TableCell>
                                <TableCell>
                                  {v.disponible && v.actif ? (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Disponible</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Indisponible</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(v.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ═══ RÉSERVATIONS ═══ */}
              {tab === "reservations" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-display font-bold">Réservations</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher…" value={searchR} onChange={e => setSearchR(e.target.value)} className="pl-9 w-56" />
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead className="hidden md:table-cell">Email</TableHead>
                              <TableHead>Véhicule</TableHead>
                              <TableHead className="hidden sm:table-cell">Début</TableHead>
                              <TableHead className="hidden sm:table-cell">Fin</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRes.map(r => (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                                <TableCell className="font-medium">{r.client}</TableCell>
                                <TableCell className="text-xs hidden md:table-cell">{r.email}</TableCell>
                                <TableCell>{r.vehicule}</TableCell>
                                <TableCell className="text-xs hidden sm:table-cell">{r.debut}</TableCell>
                                <TableCell className="text-xs hidden sm:table-cell">{r.fin}</TableCell>
                                <TableCell className="font-semibold">{r.montant} €</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={statColors[r.statut] || ""}>{r.statut}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ═══ FLOTTE ═══ */}
              {tab === "flotte" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-display font-bold">Gestion de flotte</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "En bon état", count: mockFlotte.filter(f => f.etat === "bon").length, icon: CheckCircle, color: "text-emerald-500" },
                      { label: "Entretien requis", count: mockFlotte.filter(f => f.etat === "entretien requis").length, icon: AlertTriangle, color: "text-amber-500" },
                      { label: "En panne", count: mockFlotte.filter(f => f.etat === "en panne").length, icon: XCircle, color: "text-destructive" },
                    ].map((s, i) => (
                      <Card key={i}>
                        <CardContent className="p-5 flex items-center gap-4">
                          <s.icon className={`h-8 w-8 ${s.color}`} />
                          <div>
                            <p className="text-2xl font-bold">{s.count}</p>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Véhicule</TableHead>
                              <TableHead>Plaque</TableHead>
                              <TableHead className="hidden sm:table-cell">Kilométrage</TableHead>
                              <TableHead className="hidden md:table-cell">Dernier entretien</TableHead>
                              <TableHead className="hidden md:table-cell">Prochain entretien</TableHead>
                              <TableHead>État</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockFlotte.map(f => (
                              <TableRow key={f.id}>
                                <TableCell className="font-medium">{f.vehicule}</TableCell>
                                <TableCell className="font-mono text-xs">{f.plaque}</TableCell>
                                <TableCell className="hidden sm:table-cell">{f.km.toLocaleString()} km</TableCell>
                                <TableCell className="text-xs hidden md:table-cell">{f.dernierEntretien}</TableCell>
                                <TableCell className="text-xs hidden md:table-cell">{f.prochainEntretien}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={etatColors[f.etat] || ""}>{f.etat}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ═══ UTILISATEURS ═══ */}
              {tab === "utilisateurs" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-display font-bold">Utilisateurs</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher…" value={searchU} onChange={e => setSearchU(e.target.value)} className="pl-9 w-56" />
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="hidden sm:table-cell">Type</TableHead>
                              <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                              <TableHead>Réservations</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map(u => (
                              <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                                <TableCell className="text-xs">{u.email}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <Badge variant="outline" className={u.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                                    {u.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs hidden md:table-cell">{u.creeLe}</TableCell>
                                <TableCell>{u.reservations}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={u.statut === "actif" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                                    {u.statut}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ═══ PROFIL ═══ */}
              {tab === "profil" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-display font-bold">Mon profil</h2>
                    {!profileEditing ? (
                      <Button variant="outline" className="gap-2" onClick={() => setProfileEditing(true)}>
                        <Edit className="h-4 w-4" /> Modifier
                      </Button>
                    ) : (
                      <Button className="gap-2" onClick={saveProfile}>
                        <Save className="h-4 w-4" /> Enregistrer
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Avatar & summary */}
                    <Card className="lg:col-span-1">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <h3 className="font-display font-bold text-lg">{user.prenom} {user.nom}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge className="mt-3 bg-primary/10 text-primary border-primary/20" variant="outline">Administrateur</Badge>
                        <div className="w-full mt-6 pt-4 border-t border-border space-y-3 text-left">
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{profileForm.telephone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Rôle : Administrateur</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Edit form */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Informations personnelles</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Prénom</Label>
                            <Input
                              value={profileForm.prenom}
                              onChange={e => setProfileForm(p => ({ ...p, prenom: e.target.value }))}
                              disabled={!profileEditing}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Nom</Label>
                            <Input
                              value={profileForm.nom}
                              onChange={e => setProfileForm(p => ({ ...p, nom: e.target.value }))}
                              disabled={!profileEditing}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                            disabled={!profileEditing}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Téléphone</Label>
                          <Input
                            type="tel"
                            value={profileForm.telephone}
                            onChange={e => setProfileForm(p => ({ ...p, telephone: e.target.value }))}
                            disabled={!profileEditing}
                          />
                        </div>
                        {profileEditing && (
                          <div className="flex gap-3 pt-2">
                            <Button onClick={saveProfile} className="gap-2">
                              <Save className="h-4 w-4" /> Enregistrer
                            </Button>
                            <Button variant="outline" onClick={() => {
                              setProfileEditing(false);
                              setProfileForm({ prenom: user.prenom, nom: user.nom, email: user.email, telephone: profileForm.telephone });
                            }}>
                              Annuler
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* ═══ ATTRIBUTION DES RÔLES (dans le profil admin) ═══ */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Attribution des rôles — Équipe West Drive
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Attribuez un rôle et des permissions aux membres de votre équipe.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Add new member form */}
                      <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/30">
                        <p className="text-sm font-medium">Ajouter un membre</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Email du membre</Label>
                            <Input
                              type="email"
                              placeholder="nom@westdrive.fr"
                              value={newMemberEmail}
                              onChange={e => setNewMemberEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Rôle</Label>
                            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                              <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                                <SelectItem value="support">Support client</SelectItem>
                                <SelectItem value="comptable">Comptable</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button onClick={addTeamMember} className="w-full gap-2">
                              <UserPlus className="h-4 w-4" /> Attribuer
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {allPermissions.map(perm => (
                              <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors">
                                <Checkbox
                                  checked={newMemberPermissions.includes(perm.key)}
                                  onCheckedChange={() => togglePermission(perm.key)}
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Existing team members */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Membres actuels ({teamMembers.length})</p>
                        {teamMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                            <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-bold flex-shrink-0">
                              {member.prenom ? member.prenom[0] : member.nom[0]}{member.nom[member.nom.length > 1 ? 1 : 0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {member.prenom ? `${member.prenom} ${member.nom}` : member.email}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <Badge variant="outline" className={`${roleColors[member.role] || ""} flex-shrink-0`}>
                              {member.role}
                            </Badge>
                            <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                              {member.permissions.map(p => (
                                <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                  {allPermissions.find(ap => ap.key === p)?.label || p}
                                </span>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive flex-shrink-0"
                              onClick={() => removeTeamMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ═══ Vehicle Edit Dialog ═══ */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un véhicule" : "Modifier le véhicule"}</DialogTitle>
          </DialogHeader>
          {editVehicle && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marque *</Label>
                  <Input value={editVehicle.marque || ""} onChange={e => setEditVehicle({ ...editVehicle, marque: e.target.value })} />
                </div>
                <div>
                  <Label>Modèle *</Label>
                  <Input value={editVehicle.modele || ""} onChange={e => setEditVehicle({ ...editVehicle, modele: e.target.value, nom: `${editVehicle.marque} ${e.target.value}` })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Année</Label>
                  <Input type="number" value={editVehicle.annee || 2024} onChange={e => setEditVehicle({ ...editVehicle, annee: +e.target.value })} />
                </div>
                <div>
                  <Label>Prix/jour (€) *</Label>
                  <Input type="number" value={editVehicle.prixJour || 0} onChange={e => setEditVehicle({ ...editVehicle, prixJour: +e.target.value })} />
                </div>
                <div>
                  <Label>Places</Label>
                  <Input type="number" value={editVehicle.nbPlaces || 5} onChange={e => setEditVehicle({ ...editVehicle, nbPlaces: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={editVehicle.categorie} onValueChange={v => setEditVehicle({ ...editVehicle, categorie: v as Categorie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["MICRO", "COMPACTE", "BERLINE", "SUV"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transmission</Label>
                  <Select value={editVehicle.transmission} onValueChange={v => setEditVehicle({ ...editVehicle, transmission: v as Transmission })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUELLE">Manuelle</SelectItem>
                      <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Énergie</Label>
                  <Select value={editVehicle.energie} onValueChange={v => setEditVehicle({ ...editVehicle, energie: v as Energie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Km inclus/jour</Label>
                <Input type="number" value={editVehicle.kmInclus || 200} onChange={e => setEditVehicle({ ...editVehicle, kmInclus: +e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editVehicle.description || ""} onChange={e => setEditVehicle({ ...editVehicle, description: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.disponible} onCheckedChange={v => setEditVehicle({ ...editVehicle, disponible: v })} />
                  <Label>Disponible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.actif} onCheckedChange={v => setEditVehicle({ ...editVehicle, actif: v })} />
                  <Label>Actif</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)}>Annuler</Button>
            <Button onClick={saveVehicle}>{isNew ? "Créer" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteVehicle(deleteConfirm)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
