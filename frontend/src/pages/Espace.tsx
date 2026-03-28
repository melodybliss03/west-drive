import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  LogOut,
  MapPin,
  MessageSquare,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import {
  CustomerQuoteResponseAction,
  NotificationDto,
  PendingReviewReservationDto,
  QuoteDto,
  QuoteEventDto,
  ReservationDto,
  ReservationEventDto,
  notificationsService,
  quotesService,
  reservationsService,
  reviewsService,
  usersService,
} from "@/lib/api/services";
import { ApiHttpError, PaginatedCollection } from "@/lib/api/types";

type StatutReservation = "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "ANNULEE" | "REFUSEE" | "CLOTUREE";

type UiReservation = {
  id: string;
  publicReference: string;
  vehicule: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  statut: StatutReservation;
  montant: number;
  caution: number;
  ville: string;
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
  publicReference: string;
  type: "particulier" | "entreprise";
  nomEntreprise?: string;
  dateEmission: string;
  statut: "en_attente" | "accepte" | "refuse" | "contre_proposition";
  vehicules: DevisVehicule[];
  commentaireAdmin?: string;
  commentaireClient?: string;
  source: QuoteDto;
};

type UiFacture = {
  id: string;
  reservationId: string;
  date: string;
  montant: number;
  vehicule: string;
  ville: string;
};

type TabPagination = {
  page: number;
  totalPages: number;
};

const MOCK_FACTURES: UiFacture[] = [
  { id: "F-2025-001", reservationId: "RES-2025-001", date: "2025-06-13", montant: 165, vehicule: "Renault Clio V", ville: "Puteaux" },
  { id: "F-2025-002", reservationId: "RES-2025-003", date: "2025-04-08", montant: 255, vehicule: "Peugeot 3008", ville: "Nanterre" },
];

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-amber-500/10 text-amber-600 border-amber-200",
  CONFIRMEE: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  EN_COURS: "bg-blue-500/10 text-blue-600 border-blue-200",
  CLOTUREE: "bg-muted text-muted-foreground border-border",
  ANNULEE: "bg-destructive/10 text-destructive border-destructive/20",
  REFUSEE: "bg-destructive/10 text-destructive border-destructive/20",
};

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmee",
  EN_COURS: "En cours",
  CLOTUREE: "Cloturee",
  ANNULEE: "Annulee",
  REFUSEE: "Refusee",
};

const devisStatutColors: Record<string, string> = {
  en_attente: "bg-amber-500/10 text-amber-600 border-amber-200",
  accepte: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  refuse: "bg-destructive/10 text-destructive border-destructive/20",
  contre_proposition: "bg-blue-500/10 text-blue-600 border-blue-200",
};

const devisStatutLabels: Record<string, string> = {
  en_attente: "En attente",
  accepte: "Accepte",
  refuse: "Refuse",
  contre_proposition: "Contre-proposition",
};

const quoteEventLabels: Record<string, string> = {
  quote_created: "Demande creee",
  quote_ack_email_sent: "Accuse de reception envoye",
  quote_admin_notified: "Equipe admin notifiee",
  quote_status_changed: "Statut mis a jour",
  quote_in_analysis: "Devis en analyse",
  quote_negotiation_updated: "Negociation mise a jour",
  quote_proposal_sent: "Proposition envoyee",
  quote_payment_link_created: "Lien de paiement genere",
  quote_payment_confirmed: "Paiement confirme",
  quote_accepted: "Proposition acceptee",
  quote_refused: "Devis refuse",
  quote_customer_accepted: "Vous avez accepte la proposition",
  quote_customer_rejected: "Vous avez refuse la proposition",
  quote_customer_counter_proposal: "Vous avez envoye une contre-proposition",
};

const reservationEventLabels: Record<string, string> = {
  reservation_created: "Reservation creee",
  reservation_ack_email_sent: "Accuse de reception envoye",
  reservation_admin_notified: "Equipe admin notifiee",
  reservation_status_changed: "Statut mis a jour",
  reservation_payment_session_created: "Session paiement creee",
  reservation_payment_link_created: "Lien de paiement genere",
  reservation_payment_confirmed: "Paiement confirme",
  reservation_archived: "Reservation archivee",
};

function toItems<T>(value: PaginatedCollection<T> | T[]): T[] {
  return Array.isArray(value) ? value : value.items ?? [];
}

function toPagination(value: PaginatedCollection<unknown> | unknown[]): TabPagination {
  if (Array.isArray(value)) {
    return { page: 1, totalPages: 1 };
  }

  return {
    page: value.meta?.page ?? 1,
    totalPages: value.meta?.totalPages ?? 1,
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtHour(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function totalDevis(vehicules: DevisVehicule[]) {
  return vehicules.reduce((acc, v) => acc + v.nbJours * v.prixJour + v.autreFrais, 0);
}

function mapReservationStatus(status: ReservationDto["status"]): StatutReservation {
  if (status === "EN_ATTENTE_PAIEMENT" || status === "NOUVELLE_DEMANDE" || status === "EN_ANALYSE" || status === "PROPOSITION_ENVOYEE") {
    return "EN_ATTENTE";
  }
  if (status === "CONFIRMEE") return "CONFIRMEE";
  if (status === "EN_COURS") return "EN_COURS";
  if (status === "CLOTUREE") return "CLOTUREE";
  if (status === "REFUSEE") return "REFUSEE";
  return "ANNULEE";
}

function mapQuoteStatus(status: QuoteDto["status"]): UiDevis["statut"] {
  if (status === "REFUSEE" || status === "ANNULEE") return "refuse";
  if (status === "EN_NEGOCIATION") return "contre_proposition";
  if (status === "PAYEE" || status === "CONVERTI_RESERVATION" || status === "EN_ATTENTE_PAIEMENT") return "accepte";
  return "en_attente";
}

function daysBetween(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

function eventComment(payload?: Record<string, unknown>): string | null {
  if (!payload) return null;
  const candidates = [payload.comment, payload.message, payload.description, payload.title]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return candidates[0] ?? null;
}

export default function Espace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("reservations");

  const [reservations, setReservations] = useState<UiReservation[]>([]);
  const [reservationsPagination, setReservationsPagination] = useState<TabPagination>({ page: 1, totalPages: 1 });
  const [quotes, setQuotes] = useState<UiDevis[]>([]);
  const [quotesPagination, setQuotesPagination] = useState<TabPagination>({ page: 1, totalPages: 1 });
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [factures] = useState<UiFacture[]>(MOCK_FACTURES);

  const [selectedReservation, setSelectedReservation] = useState<UiReservation | null>(null);
  const [selectedDevis, setSelectedDevis] = useState<UiDevis | null>(null);

  const [reservationEvents, setReservationEvents] = useState<ReservationEventDto[]>([]);
  const [quoteEvents, setQuoteEvents] = useState<QuoteEventDto[]>([]);
  const [reservationEventsLoading, setReservationEventsLoading] = useState(false);
  const [quoteEventsLoading, setQuoteEventsLoading] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [reservationStatusFilter, setReservationStatusFilter] = useState("ALL");
  const [reservationSearch, setReservationSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("ALL");
  const [quoteSearch, setQuoteSearch] = useState("");

  const [commentaireClient, setCommentaireClient] = useState("");
  const [commentaireError, setCommentaireError] = useState("");
  const [quoteResponseLoading, setQuoteResponseLoading] = useState(false);

  const [pendingReviews, setPendingReviews] = useState<PendingReviewReservationDto[]>([]);
  const [selectedPendingReview, setSelectedPendingReview] = useState<PendingReviewReservationDto | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
      return;
    }

    setProfileForm({
      firstName: user.prenom ?? "",
      lastName: user.nom ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
  }, [user, navigate]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const loadReservations = async (page = 1) => {
    try {
      const response = await reservationsService.listMine({ page, limit: 8 });
      const mapped = toItems(response).map((r) => ({
        id: r.id,
        publicReference: r.publicReference ?? r.id,
        vehicule: r.vehicle?.name || r.requestedVehicleType,
        dateDebut: r.startAt,
        dateFin: r.endAt,
        heureDebut: fmtHour(r.startAt),
        heureFin: fmtHour(r.endAt),
        statut: mapReservationStatus(r.status),
        montant: Number(r.amountTtc || 0),
        caution: Number(r.depositAmount || 0),
        ville: r.pickupCity,
      }));
      setReservations(mapped);
      setReservationsPagination(toPagination(response));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de charger vos reservations.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const loadQuotes = async (page = 1) => {
    try {
      const response = await quotesService.listMine({ page, limit: 8 });
      const mapped = toItems(response).map((q) => {
        const nbJours = daysBetween(q.startAt, q.endAt);
        const perDay = Math.max(0, Number(q.amountTtc || 0) / nbJours);
        return {
          id: q.id,
          publicReference: q.publicReference,
          type: q.requesterType === "ENTREPRISE" ? "entreprise" : "particulier",
          nomEntreprise: q.companyName ?? undefined,
          dateEmission: q.createdAt,
          statut: mapQuoteStatus(q.status),
          commentaireAdmin: q.proposalMessage ?? undefined,
          vehicules: [
            {
              type: q.requestedVehicleType,
              dateDebut: q.startAt,
              dateFin: q.endAt,
              heureDebut: fmtHour(q.startAt),
              heureFin: fmtHour(q.endAt),
              nbJours,
              prixJour: perDay,
              kmInclus: 0,
              autreFrais: 0,
              ville: q.pickupCity,
            },
          ],
          source: q,
        } as UiDevis;
      });
      setQuotes(mapped);
      setQuotesPagination(toPagination(response));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de charger vos devis.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsService.list({ page: 1, limit: 50 });
      setNotifications(toItems(response));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de charger vos notifications.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const loadPendingReviews = async () => {
    try {
      const pending = await reviewsService.listPendingMine();
      setPendingReviews(pending);
      if (pending.length > 0 && !selectedPendingReview) {
        setSelectedPendingReview(pending[0]);
      }
    } catch {
      // Optional UX flow; ignore if API is temporarily unavailable.
    }
  };

  useEffect(() => {
    if (!user) return;
    loadReservations(reservationsPagination.page);
    loadQuotes(quotesPagination.page);
    loadNotifications();
    loadPendingReviews();
  }, [user, reservationsPagination.page, quotesPagination.page]);

  const filteredReservations = useMemo(() => {
    const search = reservationSearch.trim().toLowerCase();
    return reservations.filter((r) => {
      const statusOk = reservationStatusFilter === "ALL" || r.statut === reservationStatusFilter;
      const searchOk = !search || `${r.publicReference} ${r.vehicule} ${r.ville}`.toLowerCase().includes(search);
      return statusOk && searchOk;
    });
  }, [reservationSearch, reservationStatusFilter, reservations]);

  const filteredQuotes = useMemo(() => {
    const search = quoteSearch.trim().toLowerCase();
    return quotes.filter((q) => {
      const statusOk = quoteStatusFilter === "ALL" || q.statut === quoteStatusFilter;
      const searchOk = !search || `${q.publicReference} ${q.nomEntreprise || ""} ${q.vehicules[0]?.type || ""} ${q.vehicules[0]?.ville || ""}`.toLowerCase().includes(search);
      return statusOk && searchOk;
    });
  }, [quoteSearch, quoteStatusFilter, quotes]);

  const markRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de marquer cette notification.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de marquer les notifications.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const openReservationDetails = async (reservation: UiReservation) => {
    setSelectedReservation(reservation);
    setReservationEventsLoading(true);
    try {
      const result = await reservationsService.findMineEvents(reservation.id, { page: 1, limit: 100 });
      setReservationEvents(toItems(result));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de charger la timeline reservation.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
      setReservationEvents([]);
    } finally {
      setReservationEventsLoading(false);
    }
  };

  const openQuoteDetails = async (devis: UiDevis) => {
    setSelectedDevis(devis);
    setCommentaireClient(devis.commentaireClient || "");
    setCommentaireError("");
    setQuoteEventsLoading(true);
    try {
      const result = await quotesService.findMineEvents(devis.id, { page: 1, limit: 100 });
      setQuoteEvents(toItems(result));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de charger la timeline devis.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
      setQuoteEvents([]);
    } finally {
      setQuoteEventsLoading(false);
    }
  };

  const respondQuote = async (action: CustomerQuoteResponseAction) => {
    if (!selectedDevis) return;

    if (action !== "ACCEPTER" && !commentaireClient.trim()) {
      setCommentaireError("Veuillez indiquer votre commentaire.");
      return;
    }

    setQuoteResponseLoading(true);
    try {
      const response = await quotesService.respondToProposal(selectedDevis.id, {
        action,
        comment: commentaireClient.trim() || undefined,
      });

      const updated = response.quote;
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === selectedDevis.id
            ? {
                ...q,
                statut: mapQuoteStatus(updated.status),
                commentaireClient: commentaireClient.trim() || q.commentaireClient,
                source: updated,
              }
            : q,
        ),
      );

      if (response.paymentLinkUrl) {
        window.location.href = response.paymentLinkUrl;
        return;
      }

      toast({ title: "Reponse envoyee", description: "Votre reponse a ete transmise a West Drive." });
      setSelectedDevis(null);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible d'envoyer votre reponse.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setQuoteResponseLoading(false);
    }
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await usersService.updateMe({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      toast({ title: "Profil mis a jour", description: "Vos informations ont ete enregistrees." });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de mettre a jour votre profil.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  };

  const downloadFacture = (facture: UiFacture) => {
    const content = [
      "WEST DRIVE - FACTURE",
      "====================",
      `N Facture   : ${facture.id}`,
      `Reservation : ${facture.reservationId}`,
      `Vehicule    : ${facture.vehicule}`,
      `Ville       : ${facture.ville}`,
      `Date        : ${fmtDate(facture.date)}`,
      `Montant TTC : ${facture.montant} EUR`,
      "====================",
      "Merci de votre confiance.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${facture.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Facture telechargee", description: `${facture.id} telechargee avec succes.` });
  };

  const submitReview = async () => {
    if (!selectedPendingReview) return;

    if (!reviewContent.trim()) {
      toast({ title: "Avis incomplet", description: "Merci d'ecrire votre avis.", variant: "destructive" });
      return;
    }

    setReviewSubmitting(true);
    try {
      await reviewsService.createMine({
        reservationId: selectedPendingReview.reservationId,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        content: reviewContent.trim(),
      });

      toast({ title: "Merci pour votre avis", description: "Votre retour est publie." });
      const remaining = pendingReviews.filter((p) => p.reservationId !== selectedPendingReview.reservationId);
      setPendingReviews(remaining);
      setSelectedPendingReview(remaining[0] ?? null);
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible d'envoyer votre avis.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
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
                  <Car className="h-4 w-4" /> Nouvelle reservation
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => { logout(); navigate("/"); }}>
                <LogOut className="h-4 w-4" /> Deconnexion
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Car, label: "Reservations", value: reservations.length },
              { icon: Clock, label: "En cours", value: reservations.filter((r) => ["CONFIRMEE", "EN_COURS"].includes(r.statut)).length },
              { icon: FileText, label: "Factures", value: factures.length },
              { icon: Bell, label: "Non lues", value: unreadCount, suffix: " notif." },
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none p-0 h-auto mb-6 overflow-x-auto">
              {[
                { value: "reservations", icon: CalendarDays, label: "Reservations" },
                { value: "devis", icon: FileText, label: "Devis", badge: quotes.filter((d) => d.statut === "en_attente").length },
                { value: "factures", icon: Download, label: "Factures" },
                { value: "notifications", icon: Bell, label: "Notifications", badge: unreadCount },
                { value: "profil", icon: User, label: "Profil" },
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

            <TabsContent value="reservations">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="CONFIRMEE">Confirmee</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="CLOTUREE">Cloturee</option>
                  <option value="ANNULEE">Annulee</option>
                  <option value="REFUSEE">Refusee</option>
                </select>
                <input
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  placeholder="Rechercher reference, vehicule, ville..."
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                />
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Vehicule</TableHead>
                      <TableHead className="hidden sm:table-cell">Periode</TableHead>
                      <TableHead className="hidden md:table-cell">Ville</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.publicReference}</TableCell>
                        <TableCell className="font-medium">{r.vehicule}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{fmtDate(r.dateDebut)} - {fmtDate(r.dateFin)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{r.ville}</TableCell>
                        <TableCell className="font-semibold text-primary">{r.montant.toLocaleString("fr-FR")} EUR</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statutColors[r.statut] || ""}>
                            {statutLabels[r.statut] || r.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openReservationDetails(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredReservations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune reservation trouvee.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reservationsPagination.page <= 1}
                      onClick={() =>
                        setReservationsPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                    >
                      Precedent
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {reservationsPagination.page} / {Math.max(1, reservationsPagination.totalPages)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reservationsPagination.page >= reservationsPagination.totalPages}
                      onClick={() =>
                        setReservationsPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                    >
                      Suivant
                    </Button>
                  </div>
            </TabsContent>

            <TabsContent value="devis">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  value={quoteStatusFilter}
                  onChange={(e) => setQuoteStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="accepte">Accepte</option>
                  <option value="refuse">Refuse</option>
                  <option value="contre_proposition">Contre-proposition</option>
                </select>
                <input
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  placeholder="Rechercher reference, entreprise, type..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredQuotes.map((d) => (
                  <div key={d.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">{d.publicReference}</span>
                        <Badge variant="outline" className={d.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                          {d.type === "entreprise" ? <><Building2 className="h-3 w-3 mr-1" />Entreprise</> : <><User className="h-3 w-3 mr-1" />Particulier</>}
                        </Badge>
                        <Badge variant="outline" className={devisStatutColors[d.statut] || ""}>
                          {devisStatutLabels[d.statut]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {d.vehicules.length} vehicule{d.vehicules.length > 1 ? "s" : ""} propose{d.vehicules.length > 1 ? "s" : ""}
                        {" - "}Emis le {fmtDate(d.dateEmission)}
                      </p>
                      <p className="text-sm font-semibold text-primary">Total estime : {totalDevis(d.vehicules).toLocaleString("fr-FR")} EUR</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openQuoteDetails(d)}>
                      Consulter <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {filteredQuotes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Aucun devis pour le moment.</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quotesPagination.page <= 1}
                  onClick={() =>
                    setQuotesPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Precedent
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {quotesPagination.page} / {Math.max(1, quotesPagination.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quotesPagination.page >= quotesPagination.totalPages}
                  onClick={() =>
                    setQuotesPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                >
                  Suivant
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="factures">
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N Facture</TableHead>
                      <TableHead>Vehicule</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="hidden md:table-cell">Ville</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead className="text-right">Telecharger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.id}</TableCell>
                        <TableCell className="font-medium">{f.vehicule}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{fmtDate(f.date)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{f.ville}</TableCell>
                        <TableCell className="font-semibold text-primary">{f.montant} EUR</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => downloadFacture(f)}>
                            <Download className="h-4 w-4" /> TXT
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={markAllRead}>Tout marquer comme lu</Button>
              </div>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`bg-card border rounded-xl p-5 cursor-pointer transition-colors ${!n.isRead ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <h3 className="font-semibold text-sm">{n.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profil">
              <div className="max-w-lg space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prenom</label>
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom</label>
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telephone</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <Button onClick={saveProfile} disabled={profileSaving}>Enregistrer les modifications</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservation {selectedReservation?.publicReference}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-5">
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

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Periode</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-1">Depart</p>
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

              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedReservation.ville}</div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Financier</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Montant TTC</p>
                    <p className="text-lg font-bold text-primary">{selectedReservation.montant} EUR</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Caution</p>
                    <p className="text-lg font-bold">{selectedReservation.caution} EUR</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Chronologie</p>
                {reservationEventsLoading && <p className="text-xs text-muted-foreground">Chargement de la timeline...</p>}
                {!reservationEventsLoading && reservationEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun evenement pour cette reservation.</p>
                )}
                {!reservationEventsLoading && reservationEvents.length > 0 && (
                  <div className="space-y-2 max-h-52 overflow-y-auto border border-border rounded-xl p-3 bg-muted/20">
                    {reservationEvents.map((event) => (
                      <div key={event.id} className="text-sm">
                        <p className="font-medium">{reservationEventLabels[event.type] || event.type}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(event.occurredAt)}</p>
                        {eventComment(event.payload) && <p className="text-xs mt-1">{eventComment(event.payload)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDevis} onOpenChange={() => { setSelectedDevis(null); setCommentaireClient(""); setCommentaireError(""); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devis {selectedDevis?.publicReference}</DialogTitle>
          </DialogHeader>
          {selectedDevis && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDevis.type === "entreprise"
                      ? <><Building2 className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">{selectedDevis.nomEntreprise}</span></>
                      : <><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Particulier</span></>
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Emis le {fmtDate(selectedDevis.dateEmission)}</p>
                </div>
                <Badge variant="outline" className={devisStatutColors[selectedDevis.statut] || ""}>
                  {devisStatutLabels[selectedDevis.statut]}
                </Badge>
              </div>

              {selectedDevis.commentaireAdmin && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <p className="text-xs font-medium text-primary">Message de West Drive</p>
                  <p className="text-sm text-muted-foreground">{selectedDevis.commentaireAdmin}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Vehicule(s) propose(s)</p>
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
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Prise a {v.heureDebut}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Retour a {v.heureFin}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.ville}</div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{v.nbJours} jour(s) x {v.prixJour.toFixed(2)} EUR/jour</span>
                          <span>{(v.nbJours * v.prixJour).toFixed(2)} EUR</span>
                        </div>
                        {v.autreFrais > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Autres frais</span>
                            <span>{v.autreFrais.toFixed(2)} EUR</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                          <span>Sous-total</span>
                          <span className="text-primary">{total.toFixed(2)} EUR</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Chronologie</p>
                {quoteEventsLoading && <p className="text-xs text-muted-foreground">Chargement de la timeline...</p>}
                {!quoteEventsLoading && quoteEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun evenement pour ce devis.</p>
                )}
                {!quoteEventsLoading && quoteEvents.length > 0 && (
                  <div className="space-y-2 max-h-52 overflow-y-auto border border-border rounded-xl p-3 bg-muted/20">
                    {quoteEvents.map((event) => (
                      <div key={event.id} className="text-sm">
                        <p className="font-medium">{quoteEventLabels[event.type] || event.type}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(event.occurredAt)}</p>
                        {eventComment(event.payload) && <p className="text-xs mt-1">{eventComment(event.payload)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Total estime</span>
                </div>
                <span className="text-2xl font-display font-bold text-primary">{totalDevis(selectedDevis.vehicules).toLocaleString("fr-FR")} EUR</span>
              </div>

              {selectedDevis.statut === "en_attente" || selectedDevis.statut === "contre_proposition" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      Votre commentaire
                    </label>
                    <textarea
                      value={commentaireClient}
                      onChange={(e) => { setCommentaireClient(e.target.value); setCommentaireError(""); }}
                      placeholder="Ex: je prefere un SUV a la place de la berline"
                      rows={4}
                      className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${commentaireError ? "border-destructive" : "border-input"}`}
                    />
                    {commentaireError && <p className="text-xs text-destructive">{commentaireError}</p>}
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="destructive"
                      className="gap-2 flex-1"
                      onClick={() => respondQuote("REFUSER")}
                      disabled={quoteResponseLoading}
                    >
                      <XCircle className="h-4 w-4" /> Refuser
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => respondQuote("CONTRE_PROPOSITION")}
                      disabled={quoteResponseLoading}
                    >
                      <MessageSquare className="h-4 w-4" /> Contre-proposition
                    </Button>
                    <Button
                      className="gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => respondQuote("ACCEPTER")}
                      disabled={quoteResponseLoading}
                    >
                      <CheckCircle className="h-4 w-4" /> Accepter
                    </Button>
                  </DialogFooter>
                </>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedPendingReview}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPendingReview(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Votre location est terminee, donnez votre avis
            </DialogTitle>
          </DialogHeader>
          {selectedPendingReview && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reservation {selectedPendingReview.publicReference} - {selectedPendingReview.vehicleName}
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Note</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Tres bien</option>
                  <option value={3}>3 - Bien</option>
                  <option value={2}>2 - Moyen</option>
                  <option value={1}>1 - Insuffisant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Titre (optionnel)</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Ex: Experience tres fluide"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Votre avis</label>
                <textarea
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card resize-none"
                  rows={5}
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Partagez votre experience de location..."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPendingReview(null)} disabled={reviewSubmitting}>
                  Plus tard
                </Button>
                <Button onClick={submitReview} disabled={reviewSubmitting}>
                  Publier mon avis
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
