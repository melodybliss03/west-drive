import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Car, FileText, Bell, CalendarDays, Clock, Download,
  ChevronRight, User, LogOut, Eye, CheckCircle, XCircle,
  Building2, MessageSquare, Euro, MapPin, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutReservation = "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "ANNULEE" | "REFUSEE" | "CLOTUREE";

type UiReservation = {
  id: string;
  vehicule: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  statut: StatutReservation;
  montant: number;
  caution: number;
  ville: string;
  commentaireAdmin?: string;
};

type UiNotification = {
  id: string;
  title: string;
  desc: string;
  date: string;
  read: boolean;
};

type DevisVehicule = {
  type: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  nbJours: number;
  prixJour: number;
  kmInclus: number;
  autreFrais: number;
  ville: string;
};

type UiDevis = {
  id: string;
  type: "particulier" | "entreprise";
  nomEntreprise?: string;
  dateEmission: string;
  statut: "en_attente" | "accepte" | "refuse" | "contre_proposition";
  vehicules: DevisVehicule[];
  commentaireAdmin?: string;
  commentaireClient?: string;
};

type UiFacture = {
  id: string;
  reservationId: string;
  date: string;
  montant: number;
  vehicule: string;
  ville: string;
};

// ─── Données fictives ─────────────────────────────────────────────────────────

const MOCK_RESERVATIONS: UiReservation[] = [
  {
    id: "RES-2025-001",
    vehicule: "Renault Clio V",
    dateDebut: "2025-06-10",
    dateFin: "2025-06-13",
    heureDebut: "09:00",
    heureFin: "18:00",
    statut: "CONFIRMEE",
    montant: 165,
    caution: 300,
    ville: "Puteaux",
    commentaireAdmin: "Merci de vous présenter au 12 Rue de la Paix, Puteaux à 09h00. Munissez-vous de votre permis et d'une pièce d'identité.",
  },
  {
    id: "RES-2025-002",
    vehicule: "BMW Série 3",
    dateDebut: "2025-07-01",
    dateFin: "2025-07-03",
    heureDebut: "08:00",
    heureFin: "19:00",
    statut: "EN_ATTENTE",
    montant: 190,
    caution: 500,
    ville: "La Défense",
  },
  {
    id: "RES-2025-003",
    vehicule: "Peugeot 3008",
    dateDebut: "2025-04-05",
    dateFin: "2025-04-08",
    heureDebut: "10:00",
    heureFin: "17:00",
    statut: "CLOTUREE",
    montant: 255,
    caution: 400,
    ville: "Nanterre",
  },
  {
    id: "RES-2025-004",
    vehicule: "Fiat 500",
    dateDebut: "2025-05-20",
    dateFin: "2025-05-21",
    heureDebut: "08:30",
    heureFin: "20:00",
    statut: "ANNULEE",
    montant: 40,
    caution: 250,
    ville: "Puteaux",
    commentaireAdmin: "Véhicule immobilisé pour maintenance imprévue. Aucune pénalité ne sera appliquée. Nous nous excusons pour la gêne occasionnée.",
  },
  {
    id: "RES-2025-005",
    vehicule: "Audi Q5",
    dateDebut: "2025-08-15",
    dateFin: "2025-08-18",
    heureDebut: "09:00",
    heureFin: "18:00",
    statut: "REFUSEE",
    montant: 360,
    caution: 700,
    ville: "Boulogne-Billancourt",
    commentaireAdmin: "Les dates demandées ne sont pas disponibles pour ce véhicule. Nous vous invitons à soumettre une nouvelle demande.",
  },
];

const MOCK_NOTIFICATIONS: UiNotification[] = [
  { id: "n1", title: "Réservation confirmée", desc: "Votre réservation RES-2025-001 pour la Renault Clio V a été confirmée.", date: "10 juin 2025 à 09:15", read: false },
  { id: "n2", title: "Nouveau devis reçu", desc: "West Drive vous a envoyé un devis pour votre demande de location longue durée.", date: "5 juin 2025 à 14:30", read: false },
  { id: "n3", title: "Facture disponible", desc: "La facture F-2025-003 est disponible en téléchargement.", date: "9 avril 2025 à 11:00", read: true },
  { id: "n4", title: "Rappel de réservation", desc: "Votre location démarre dans 48h. Pensez à préparer vos documents.", date: "8 juin 2025 à 08:00", read: true },
];

const MOCK_DEVIS: UiDevis[] = [
  // Devis entreprise
  {
    id: "DEV-2025-001",
    type: "entreprise",
    nomEntreprise: "Acme Solutions SAS",
    dateEmission: "2025-06-05",
    statut: "en_attente",
    commentaireAdmin: "Bonjour, suite à votre demande, veuillez trouver ci-dessous notre proposition de location longue durée pour vos besoins professionnels.",
    vehicules: [
      {
        type: "Berline — BMW Série 3",
        dateDebut: "2025-07-01",
        dateFin: "2025-07-31",
        heureDebut: "08:00",
        heureFin: "18:00",
        nbJours: 30,
        prixJour: 95,
        kmInclus: 300,
        autreFrais: 0,
        ville: "La Défense",
      },
      {
        type: "SUV — Peugeot 3008",
        dateDebut: "2025-07-01",
        dateFin: "2025-07-31",
        heureDebut: "08:00",
        heureFin: "18:00",
        nbJours: 30,
        prixJour: 85,
        kmInclus: 250,
        autreFrais: 50,
        ville: "Puteaux",
      },
    ],
  },
  // Devis particulier
  {
    id: "DEV-2025-002",
    type: "particulier",
    dateEmission: "2025-05-28",
    statut: "accepte",
    commentaireAdmin: "Voici notre proposition pour votre week-end prolongé. Le véhicule sera livré à votre adresse.",
    vehicules: [
      {
        type: "Compacte — Renault Clio V",
        dateDebut: "2025-06-20",
        dateFin: "2025-06-23",
        heureDebut: "09:00",
        heureFin: "19:00",
        nbJours: 3,
        prixJour: 55,
        kmInclus: 200,
        autreFrais: 20,
        ville: "Puteaux",
      },
    ],
  },
];

const MOCK_FACTURES: UiFacture[] = [
  { id: "F-2025-001", reservationId: "RES-2025-001", date: "2025-06-13", montant: 165, vehicule: "Renault Clio V", ville: "Puteaux" },
  { id: "F-2025-002", reservationId: "RES-2025-003", date: "2025-04-08", montant: 255, vehicule: "Peugeot 3008", ville: "Nanterre" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statutColors: Record<string, string> = {
  EN_ATTENTE:  "bg-amber-500/10 text-amber-600 border-amber-200",
  CONFIRMEE:   "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  EN_COURS:    "bg-blue-500/10 text-blue-600 border-blue-200",
  CLOTUREE:    "bg-muted text-muted-foreground border-border",
  TERMINEE:    "bg-muted text-muted-foreground border-border",
  ANNULEE:     "bg-destructive/10 text-destructive border-destructive/20",
  REFUSEE:     "bg-destructive/10 text-destructive border-destructive/20",
};

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE:  "Confirmée",
  EN_COURS:   "En cours",
  CLOTUREE:   "Clôturée",
  TERMINEE:   "Terminée",
  ANNULEE:    "Annulée",
  REFUSEE:    "Refusée",
};

const devisStatutColors: Record<string, string> = {
  en_attente:          "bg-amber-500/10 text-amber-600 border-amber-200",
  accepte:             "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  refuse:              "bg-destructive/10 text-destructive border-destructive/20",
  contre_proposition:  "bg-blue-500/10 text-blue-600 border-blue-200",
};

const devisStatutLabels: Record<string, string> = {
  en_attente:         "En attente",
  accepte:            "Accepté",
  refuse:             "Refusé",
  contre_proposition: "Contre-proposition",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function totalDevis(vehicules: DevisVehicule[]) {
  return vehicules.reduce((acc, v) => acc + v.nbJours * v.prixJour + v.autreFrais, 0);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Espace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("reservations");

  // Reservations
  const [reservations] = useState<UiReservation[]>(MOCK_RESERVATIONS);
  const [selectedReservation, setSelectedReservation] = useState<UiReservation | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<UiNotification[]>(MOCK_NOTIFICATIONS);

  // Devis
  const [devis, setDevis] = useState<UiDevis[]>(MOCK_DEVIS);
  const [selectedDevis, setSelectedDevis] = useState<UiDevis | null>(null);
  const [commentaireClient, setCommentaireClient] = useState("");
  const [commentaireError, setCommentaireError] = useState("");

  // Factures
  const [factures] = useState<UiFacture[]>(MOCK_FACTURES);

  useEffect(() => {
    if (!user) navigate("/connexion");
  }, [user, navigate]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // Accepter un devis
  const handleAccepterDevis = (devisId: string) => {
    setDevis(prev => prev.map(d => d.id === devisId ? { ...d, statut: "accepte" } : d));
    toast({ title: "Devis accepté", description: "Votre acceptation a été transmise à West Drive." });
    setSelectedDevis(null);
  };

  // Refuser un devis avec commentaire
  const handleRefuserDevis = (devisId: string) => {
    if (!commentaireClient.trim()) {
      setCommentaireError("Veuillez indiquer la raison de votre refus ou vos préférences.");
      return;
    }
    setDevis(prev => prev.map(d =>
      d.id === devisId
        ? { ...d, statut: "refuse", commentaireClient: commentaireClient }
        : d
    ));
    toast({ title: "Refus envoyé", description: "Votre commentaire a été transmis à l'équipe West Drive." });
    setSelectedDevis(null);
    setCommentaireClient("");
    setCommentaireError("");
  };

  // Télécharger une facture fictive (génère un blob texte)
  const downloadFacture = (facture: UiFacture) => {
    const content = `
WEST DRIVE — FACTURE
====================
N° Facture   : ${facture.id}
Réservation  : ${facture.reservationId}
Véhicule     : ${facture.vehicule}
Ville        : ${facture.ville}
Date         : ${fmtDate(facture.date)}
Montant TTC  : ${facture.montant} €
====================
Merci de votre confiance.
West Drive — Puteaux, Île-de-France
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${facture.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Facture téléchargée", description: `${facture.id} téléchargée avec succès.` });
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">

          {/* ── En-tête ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Mon espace</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Bienvenue, {user?.prenom || "Client"} {user?.nom || ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/vehicules">
                <Button size="sm" className="gap-2">
                  <Car className="h-4 w-4" /> Nouvelle réservation
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => { logout(); navigate("/"); }}>
                <LogOut className="h-4 w-4" /> Déconnexion
              </Button>
            </div>
          </div>

          {/* ── Stats rapides ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Car,      label: "Réservations", value: reservations.length },
              { icon: Clock,    label: "En cours",      value: reservations.filter(r => ["CONFIRMEE", "EN_COURS"].includes(r.statut)).length },
              { icon: FileText, label: "Factures",      value: factures.length },
              { icon: Bell,     label: "Non lues",      value: unreadCount, suffix: " notif." },
            ].map(({ icon: Icon, label, value, suffix }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </div>
                <p className="font-display text-2xl font-bold">
                  {value}
                  {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tabs ─────────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none p-0 h-auto mb-6 overflow-x-auto">
              {[
                { value: "reservations", icon: CalendarDays, label: "Réservations" },
                { value: "devis",        icon: FileText,     label: "Devis", badge: devis.filter(d => d.statut === "en_attente").length },
                { value: "factures",     icon: Download,     label: "Factures" },
                { value: "notifications",icon: Bell,         label: "Notifications", badge: unreadCount },
                { value: "profil",       icon: User,         label: "Profil" },
              ].map(({ value, icon: Icon, label, badge }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {badge ? (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {badge}
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Réservations ─────────────────────────────────────── */}
            <TabsContent value="reservations">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="hidden sm:table-cell">Période</TableHead>
                      <TableHead className="hidden md:table-cell">Ville</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-medium">{r.vehicule}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">
                          {fmtDate(r.dateDebut)} → {fmtDate(r.dateFin)}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{r.ville}</TableCell>
                        <TableCell className="font-semibold text-primary">{r.montant} €</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statutColors[r.statut] || ""}>
                            {statutLabels[r.statut] || r.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReservation(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── Devis ────────────────────────────────────────────── */}
            <TabsContent value="devis">
              <div className="space-y-4">
                {devis.map(d => (
                  <div key={d.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">{d.id}</span>
                        <Badge variant="outline" className={d.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                          {d.type === "entreprise" ? <><Building2 className="h-3 w-3 mr-1" />Entreprise</> : <><User className="h-3 w-3 mr-1" />Particulier</>}
                        </Badge>
                        <Badge variant="outline" className={devisStatutColors[d.statut] || ""}>
                          {devisStatutLabels[d.statut]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {d.vehicules.length} véhicule{d.vehicules.length > 1 ? "s" : ""} proposé{d.vehicules.length > 1 ? "s" : ""}
                        {" · "}Émis le {fmtDate(d.dateEmission)}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        Total estimé : {totalDevis(d.vehicules).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedDevis(d); setCommentaireClient(d.commentaireClient || ""); setCommentaireError(""); }}>
                      Consulter <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {devis.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Aucun devis pour le moment.</p>
                )}
              </div>
            </TabsContent>

            {/* ── Factures ─────────────────────────────────────────── */}
            <TabsContent value="factures">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="hidden md:table-cell">Ville</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead className="text-right">Télécharger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.id}</TableCell>
                        <TableCell className="font-medium">{f.vehicule}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{fmtDate(f.date)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{f.ville}</TableCell>
                        <TableCell className="font-semibold text-primary">{f.montant} €</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => downloadFacture(f)}>
                            <Download className="h-4 w-4" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── Notifications ─────────────────────────────────────── */}
            <TabsContent value="notifications">
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={markAllRead}>
                  Tout marquer comme lu
                </Button>
              </div>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`bg-card border rounded-xl p-5 cursor-pointer transition-colors ${!n.read ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <h3 className="font-semibold text-sm">{n.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{n.desc}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Profil ───────────────────────────────────────────── */}
            <TabsContent value="profil">
              <div className="max-w-lg space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prénom</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue={user?.prenom || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue={user?.nom || ""} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue={user?.email || ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue={user?.phone || ""} />
                </div>
                <Button onClick={() => toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." })}>
                  Enregistrer les modifications
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ── Modal Détail Réservation ──────────────────────────────── */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Réservation {selectedReservation?.id}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-5">
              {/* Véhicule + statut */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold">{selectedReservation.vehicule}</p>
                  <Badge variant="outline" className={statutColors[selectedReservation.statut] || ""}>
                    {statutLabels[selectedReservation.statut] || selectedReservation.statut}
                  </Badge>
                </div>
              </div>

              {/* Période */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Période</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-1">Départ</p>
                    <div className="flex items-center gap-1 text-sm font-medium"><Calendar className="h-3.5 w-3.5 text-primary" />{fmtDate(selectedReservation.dateDebut)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><Clock className="h-3 w-3" />{selectedReservation.heureDebut}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-1">Retour</p>
                    <div className="flex items-center gap-1 text-sm font-medium"><Calendar className="h-3.5 w-3.5 text-primary" />{fmtDate(selectedReservation.dateFin)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><Clock className="h-3 w-3" />{selectedReservation.heureFin}</div>
                  </div>
                </div>
              </div>

              {/* Lieu */}
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedReservation.ville}</div>

              {/* Financier */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Financier</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Montant TTC</p>
                    <p className="text-lg font-bold text-primary">{selectedReservation.montant} €</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Caution</p>
                    <p className="text-lg font-bold">{selectedReservation.caution} €</p>
                  </div>
                </div>
              </div>

              {/* Message de l'admin */}
              {selectedReservation.commentaireAdmin && (
                <div className={`p-3 rounded-xl border space-y-1 ${
                  selectedReservation.statut === "ANNULEE" || selectedReservation.statut === "REFUSEE"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-emerald-500/5 border-emerald-200"
                }`}>
                  <p className="text-xs font-medium text-muted-foreground">Message de West Drive</p>
                  <p className="text-sm">{selectedReservation.commentaireAdmin}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Détail Devis ───────────────────────────────────── */}
      <Dialog open={!!selectedDevis} onOpenChange={() => { setSelectedDevis(null); setCommentaireClient(""); setCommentaireError(""); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis {selectedDevis?.id}</DialogTitle>
          </DialogHeader>
          {selectedDevis && (
            <div className="space-y-5">
              {/* En-tête devis */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDevis.type === "entreprise"
                      ? <><Building2 className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">{selectedDevis.nomEntreprise}</span></>
                      : <><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Particulier</span></>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Émis le {fmtDate(selectedDevis.dateEmission)}</p>
                </div>
                <Badge variant="outline" className={devisStatutColors[selectedDevis.statut] || ""}>
                  {devisStatutLabels[selectedDevis.statut]}
                </Badge>
              </div>

              {/* Message admin */}
              {selectedDevis.commentaireAdmin && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <p className="text-xs font-medium text-primary">Message de West Drive</p>
                  <p className="text-sm text-muted-foreground">{selectedDevis.commentaireAdmin}</p>
                </div>
              )}

              {/* Véhicules proposés */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Véhicule{selectedDevis.vehicules.length > 1 ? "s" : ""} proposé{selectedDevis.vehicules.length > 1 ? "s" : ""}
                </p>
                {selectedDevis.vehicules.map((v, i) => {
                  const total = v.nbJours * v.prixJour + v.autreFrais;
                  return (
                    <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-sm">{v.type}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Du {fmtDate(v.dateDebut)}</div>
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />Au {fmtDate(v.dateFin)}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Prise à {v.heureDebut}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Retour à {v.heureFin}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.ville}</div>
                        <div className="flex items-center gap-1"><Car className="h-3 w-3" />{v.kmInclus} km/jour inclus</div>
                      </div>
                      {/* Calcul automatique */}
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{v.nbJours} jour{v.nbJours > 1 ? "s" : ""} × {v.prixJour} €/jour</span>
                          <span>{v.nbJours * v.prixJour} €</span>
                        </div>
                        {v.autreFrais > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Autres frais</span>
                            <span>{v.autreFrais} €</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                          <span>Sous-total</span>
                          <span className="text-primary">{total} €</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total global */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Total estimé</span>
                </div>
                <span className="text-2xl font-display font-bold text-primary">
                  {totalDevis(selectedDevis.vehicules).toLocaleString("fr-FR")} €
                </span>
              </div>

              {/* Commentaire client précédent */}
              {selectedDevis.commentaireClient && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Votre commentaire envoyé</p>
                  <p className="text-sm">{selectedDevis.commentaireClient}</p>
                </div>
              )}

              {/* Zone de commentaire + actions (uniquement si en attente) */}
              {selectedDevis.statut === "en_attente" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      Votre commentaire (refus ou demande de modification)
                    </label>
                    <textarea
                      value={commentaireClient}
                      onChange={e => { setCommentaireClient(e.target.value); setCommentaireError(""); }}
                      placeholder="Ex : Je préfèrerais un SUV plutôt qu'une berline, et si possible sur Nanterre..."
                      rows={4}
                      className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${commentaireError ? "border-destructive" : "border-input"}`}
                    />
                    {commentaireError && <p className="text-xs text-destructive">{commentaireError}</p>}
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="destructive"
                      className="gap-2 flex-1"
                      onClick={() => handleRefuserDevis(selectedDevis.id)}
                    >
                      <XCircle className="h-4 w-4" /> Refuser et commenter
                    </Button>
                    <Button
                      className="gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleAccepterDevis(selectedDevis.id)}
                    >
                      <CheckCircle className="h-4 w-4" /> Accepter le devis
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <ScrollToTop />
    </div>
  );
}