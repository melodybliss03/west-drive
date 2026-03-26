import { useState, useMemo, useEffect } from "react";
import {
  Car, Eye, Search, Users, CheckCircle, XCircle, Mail, Phone,
  MapPin, Clock, Plus, ChevronLeft, Play, Flag, Calendar, Filter, Pencil, Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Pagination as PaginationType,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import type { Reservation, Evenement } from "./data";
import { statColors } from "./data";
import { reservationsService } from "@/lib/api/services";
import { ApiHttpError, PaginationMeta, ReservationStatus } from "@/lib/api/types";
import { mapReservationStatusToLegacy } from "@/lib/mappers";

const SYSTEM_EVENT_TITLES: Record<string, string> = {
  reservation_created: "Reservation creee",
  reservation_updated: "Reservation mise a jour",
  reservation_status_changed: "Statut de reservation mis a jour",
  reservation_commercial_reviewed: "Dossier analyse par l'equipe commerciale",
  reservation_counter_offer_sent: "Proposition commerciale envoyee",
  reservation_payment_session_created: "Lien de paiement genere",
  reservation_payment_link_created: "Lien de paiement Link genere",
  reservation_payment_confirmed: "Paiement confirme",
  reservation_stripe_preauth_created: "Preautorisation Stripe creee",
  reservation_vehicle_handover: "Vehicule remis au client",
  reservation_closed: "Reservation cloturee",
  reservation_archived: "Reservation archivee",
};

function toFriendlyEventTitle(evt: any): string {
  if (evt?.payload?.title) return String(evt.payload.title);
  if (evt?.type && SYSTEM_EVENT_TITLES[evt.type]) return SYSTEM_EVENT_TITLES[evt.type];
  if (evt?.type) return String(evt.type).replace(/_/g, " ");
  return "Evenement";
}

// ─── Types locaux ─────────────────────────────────────────────────────────────

// Contrôle la vue active dans la modal
type ActionType =
  | "confirmer"   // admin accepte + envoie infos récupération
  | "annuler"     // admin annule + commentaire obligatoire si déjà confirmée
  | "refuser"     // admin refuse + commentaire
  | "demarrer"    // démarrage location : km + photos
  | "terminer"    // fin location : km + photos
  | "evenement"   // créer un événement custom
  | "modifier"    // modifier une reservation
  | "supprimer"   // supprimer une reservation
  | "timeline"    // voir tous les événements
  | null;

// ─────────────────────────────────────────────────────────────────────────────

interface ReservationsTabProps {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  meta: PaginationMeta | null;
}

export default function ReservationsTab({
  reservations,
  setReservations,
  page,
  setPage,
  meta,
}: ReservationsTabProps) {
  const { toast } = useToast();

  // ── États de la liste ──────────────────────────────────────────────────────
  const [searchR, setSearchR] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterVehicule, setFilterVehicule] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── États de la modal ──────────────────────────────────────────────────────
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [action, setAction] = useState<ActionType>(null);

  // Champs partagés entre plusieurs actions
  const [commentaire, setCommentaire] = useState("");
  const [commentaireError, setCommentaireError] = useState("");
  const [kmInput, setKmInput] = useState("");
  const [kmError, setKmError] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Champs pour un événement custom
  const [evtTitre, setEvtTitre] = useState("");
  const [evtDescription, setEvtDescription] = useState("");
  const [evtVisibleClient, setEvtVisibleClient] = useState(true);
  const [evtEnvoiEmail, setEvtEnvoiEmail] = useState(false);
  const [evtTitreError, setEvtTitreError] = useState("");

  // Champs pour modification reservation
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editPickupCity, setEditPickupCity] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [editStatus, setEditStatus] = useState<ReservationStatus | "">("");
  const [editStatusComment, setEditStatusComment] = useState("");
  const [editError, setEditError] = useState("");
  
  // Timeline loading state
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // ── Filtrage de la liste ───────────────────────────────────────────────────
  const filteredRes = useMemo(() => {
    return reservations.filter(r => {
      // Recherche texte (client ou véhicule)
      const matchSearch =
        r.client.toLowerCase().includes(searchR.toLowerCase()) ||
        r.vehicule.toLowerCase().includes(searchR.toLowerCase());

      // Filtre statut
      const matchStatut = filterStatut ? r.statut === filterStatut : true;

      // Filtre véhicule
      const matchVehicule = filterVehicule
        ? r.vehicule.toLowerCase().includes(filterVehicule.toLowerCase())
        : true;

      // Filtre date (compare avec debut)
      const matchDate = filterDate ? r.debut.startsWith(filterDate) : true;

      return matchSearch && matchStatut && matchVehicule && matchDate;
    });
  }, [reservations, searchR, filterStatut, filterVehicule, filterDate]);

  // ── Ouverture / fermeture modal ────────────────────────────────────────────
  const openDetail = (r: Reservation) => {
    setSelectedReservation(r);
    setAction(null);
    resetActionFields();
    setEditStartAt(r.debut ? new Date(r.debut).toISOString().slice(0, 16) : "");
    setEditEndAt(r.fin ? new Date(r.fin).toISOString().slice(0, 16) : "");
    setEditPickupCity(r.ville || "");
    setEditAmount(String(r.montant ?? ""));
    setEditDeposit(String(r.caution ?? ""));
    setEditStatus((r.backendStatus as ReservationStatus) || "");
  };

  const closeModal = () => {
    setSelectedReservation(null);
    setAction(null);
    resetActionFields();
  };

  const goBack = () => {
    setAction(null);
    resetActionFields();
    setTimelineEvents([]);
    setTimelineLoading(false);
  };

  const resetActionFields = () => {
    setCommentaire("");
    setCommentaireError("");
    setKmInput("");
    setKmError("");
    setPhotoFiles([]);
    setEvtTitre("");
    setEvtDescription("");
    setEvtVisibleClient(true);
    setEvtEnvoiEmail(false);
    setEvtTitreError("");
    setEditStatusComment("");
    setEditError("");
  };

  // Load timeline events when timeline view is opened
  useEffect(() => {
    if (action === "timeline" && selectedReservation) {
      const loadEvents = async () => {
        setTimelineLoading(true);
        try {
          const result = await reservationsService.findEvents(selectedReservation.id, { page: 1, limit: 100 });
          // Handle both paginated and direct array response
          const events = Array.isArray(result) ? result : result.items || [];
          setTimelineEvents(events);
        } catch (error) {
          const message = error instanceof ApiHttpError ? error.message : "Impossible de charger l'historique.";
          toast({ title: "Erreur", description: message, variant: "destructive" });
        } finally {
          setTimelineLoading(false);
        }
      };
      loadEvents();
    }
  }, [action, selectedReservation]);

  // ── Mise à jour du statut backend ──────────────────────────────────────────
  const updateStatus = async (id: string, nextStatus: Reservation["statut"]) => {
    const map: Record<string, string> = {
      "en attente":  "EN_ANALYSE",
      "confirmée":   "CONFIRMEE",
      "en cours":    "EN_COURS",
      "terminée":    "CLOTUREE",
      "annulée":     "ANNULEE",
      "refusée":     "REFUSEE",
    };
    try {
      await reservationsService.patchStatus(id, map[nextStatus] as never);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de mettre à jour.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
      throw error;
    }
  };

  // Ajoute un événement système ou custom à la réservation
  const addEvenement = (
    reservationId: string,
    evt: Omit<Evenement, "id" | "date">
  ) => {
    const nouvelEvt: Evenement = {
      ...evt,
      id: `evt-${Date.now()}`,
      date: new Date().toLocaleString("fr-FR"),
    };
    setReservations(prev =>
      prev.map(r =>
        r.id === reservationId
          ? { ...r, evenements: [...(r.evenements || []), nouvelEvt] }
          : r
      )
    );
    // Synchronise selectedReservation pour que la timeline se mette à jour
    setSelectedReservation(prev =>
      prev && prev.id === reservationId
        ? { ...prev, evenements: [...(prev.evenements || []), nouvelEvt] }
        : prev
    );
  };

  // ── Action : Confirmer ─────────────────────────────────────────────────────
  const handleConfirmer = async () => {
    if (!commentaire.trim()) {
      setCommentaireError("Les informations de récupération sont requises.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await updateStatus(selectedReservation.id, "confirmée");
      await reservationsService.createEvent(selectedReservation.id, {
        type: "reservation_comment_added",
        payload: {
          title: "Réservation confirmée",
          description: commentaire,
          visibleClient: true,
          sendEmail: true,
        },
      });
      setReservations(prev =>
        prev.map(r =>
          r.id === selectedReservation.id
            ? { ...r, statut: "confirmée", commentaireConfirmation: commentaire }
            : r
        )
      );
      toast({ title: "Réservation confirmée", description: "Le client a été notifié." });
      closeModal();
    } catch (_) { /* géré dans updateStatus */ }
  };

  // ── Action : Annuler ───────────────────────────────────────────────────────
  const handleAnnuler = async () => {
    // Commentaire obligatoire si la réservation était déjà confirmée
    const isConfirmee = selectedReservation?.statut === "confirmée";
    if (isConfirmee && !commentaire.trim()) {
      setCommentaireError("Un commentaire est requis pour annuler une réservation confirmée.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await updateStatus(selectedReservation.id, "annulée");
      await reservationsService.createEvent(selectedReservation.id, {
        type: "reservation_comment_added",
        payload: {
          title: "Réservation annulée",
          description: commentaire || "Annulation par l'administration.",
          visibleClient: true,
          sendEmail: true,
        },
      });
      setReservations(prev =>
        prev.map(r =>
          r.id === selectedReservation.id
            ? { ...r, statut: "annulée", commentaireAnnulation: commentaire }
            : r
        )
      );
      toast({ title: "Réservation annulée" });
      closeModal();
    } catch (_) { /* géré dans updateStatus */ }
  };

  // ── Action : Refuser ───────────────────────────────────────────────────────
  const handleRefuser = async () => {
    if (!commentaire.trim()) {
      setCommentaireError("Un motif de refus est requis.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await updateStatus(selectedReservation.id, "refusée");
      await reservationsService.createEvent(selectedReservation.id, {
        type: "reservation_comment_added",
        payload: {
          title: "Réservation refusée",
          description: commentaire,
          visibleClient: true,
          sendEmail: true,
        },
      });
      setReservations(prev =>
        prev.map(r =>
          r.id === selectedReservation.id
            ? { ...r, statut: "refusée", commentaireRefus: commentaire }
            : r
        )
      );
      toast({ title: "Réservation refusée", description: "Le client a été notifié." });
      closeModal();
    } catch (_) { /* géré dans updateStatus */ }
  };

  // ── Action : Démarrer location ─────────────────────────────────────────────
  const handleDemarrer = async () => {
    if (!kmInput.trim() || isNaN(Number(kmInput))) {
      setKmError("Le kilométrage de départ est requis.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await reservationsService.createEvent(selectedReservation.id, {
        type: "reservation_vehicle_handover",
        payload: {
          title: "Location démarrée",
          description: `Kilométrage de départ : ${kmInput} km${commentaire ? ` — ${commentaire}` : ""}`,
          visibleClient: true,
          sendEmail: true,
          kmStart: Number(kmInput),
        },
      });
      setReservations(prev =>
        prev.map(r =>
          r.id === selectedReservation.id
            ? { ...r, statut: "en cours", kmDebut: Number(kmInput) }
            : r
        )
      );
      toast({ title: "Location démarrée" });
      closeModal();
    } catch (_) { /* géré dans updateStatus */ }
  };

  // ── Action : Terminer location ─────────────────────────────────────────────
  const handleTerminer = async () => {
    if (!kmInput.trim() || isNaN(Number(kmInput))) {
      setKmError("Le kilométrage de retour est requis.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await reservationsService.createEvent(selectedReservation.id, {
        type: "reservation_closed",
        payload: {
          title: "Location terminée",
          description: `Kilométrage de retour : ${kmInput} km${commentaire ? ` — ${commentaire}` : ""}`,
          visibleClient: true,
          sendEmail: true,
          kmEnd: Number(kmInput),
        },
      });
      setReservations(prev =>
        prev.map(r =>
          r.id === selectedReservation.id
            ? { ...r, statut: "terminée", kmFin: Number(kmInput) }
            : r
        )
      );
      toast({ title: "Location terminée" });
      closeModal();
    } catch (_) { /* géré dans updateStatus */ }
  };

  // ── Action : Créer événement custom ───────────────────────────────────────
  const handleAjouterEvenement = async () => {
    if (!evtTitre.trim()) {
      setEvtTitreError("Le titre de l'événement est requis.");
      return;
    }
    if (!selectedReservation) return;
    try {
      await reservationsService.createEvent(selectedReservation.id, {
        type: "custom_event",
        payload: {
          title: evtTitre,
          description: evtDescription,
          visibleClient: evtVisibleClient,
          sendEmail: evtEnvoiEmail,
        },
      });
      toast({ title: "Événement ajouté", description: "L'événement a été enregistré." });
      // Reload events from backend
      const result = await reservationsService.findEvents(selectedReservation.id, { page: 1, limit: 100 });
      const events = Array.isArray(result) ? result : result.items || [];
      setTimelineEvents(events);
      goBack();
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible d'ajouter l'événement.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const handleModifierReservation = async () => {
    if (!selectedReservation) return;

    if (!editStartAt || !editEndAt || !editPickupCity.trim()) {
      setEditError("Dates et ville sont obligatoires.");
      return;
    }

    const amount = Number(editAmount);
    const deposit = Number(editDeposit);
    if (Number.isNaN(amount) || Number.isNaN(deposit) || amount < 0 || deposit < 0) {
      setEditError("Montant et caution doivent être des nombres positifs.");
      return;
    }

    try {
      // Patch the basic fields
      await reservationsService.patch(selectedReservation.id, {
        startAt: new Date(editStartAt).toISOString(),
        endAt: new Date(editEndAt).toISOString(),
        pickupCity: editPickupCity.trim(),
        amountTtc: amount,
        depositAmount: deposit,
      });

      // If status changed, also patch the status with optional comment for customer email.
      if (editStatus && editStatus !== (selectedReservation.backendStatus as ReservationStatus)) {
        await reservationsService.patchStatus(
          selectedReservation.id,
          editStatus,
          editStatusComment.trim() || undefined,
        );
      }

      setReservations((prev) =>
        prev.map((r) =>
          r.id === selectedReservation.id
            ? {
                ...r,
                debut: new Date(editStartAt).toISOString(),
                fin: new Date(editEndAt).toISOString(),
                ville: editPickupCity.trim(),
                montant: amount,
                caution: deposit,
                backendStatus: editStatus || r.backendStatus,
                statut: editStatus ? mapReservationStatusToLegacy(editStatus) : r.statut,
              }
            : r,
        ),
      );

      toast({ title: "Réservation modifiée", description: "Les informations ont été enregistrées." });
      closeModal();
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de modifier la réservation.";
      setEditError(message);
    }
  };

  const handleSupprimerReservation = async () => {
    if (!selectedReservation) return;
    try {
      await reservationsService.remove(selectedReservation.id);
      setReservations((prev) => prev.filter((r) => r.id !== selectedReservation.id));
      toast({ title: "Réservation supprimée" });
      closeModal();
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de supprimer la réservation.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  // ── Titre de la modal selon l'action active ────────────────────────────────
  const modalTitle = () => {
    if (action === "confirmer") return "Confirmer la réservation";
    if (action === "annuler")   return "Annuler la réservation";
    if (action === "refuser")   return "Refuser la réservation";
    if (action === "demarrer")  return "Démarrer la location";
    if (action === "terminer")  return "Terminer la location";
    if (action === "evenement") return "Ajouter un événement";
    if (action === "modifier") return "Modifier la réservation";
    if (action === "supprimer") return "Supprimer la réservation";
    if (action === "timeline")  return "Historique des événements";
    return `Reservation ${selectedReservation?.publicReference || selectedReservation?.id}`;
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-display font-bold">Réservations</h2>
          <div className="flex items-center gap-2">
            {/* Recherche texte */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Client ou véhicule…"
                value={searchR}
                onChange={e => setSearchR(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            {/* Toggle filtres avancés */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(v => !v)}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>

        {/* ── Filtres avancés ──────────────────────────────────── */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Filtre statut */}
                <div>
                  <Label className="text-xs mb-1 block">Statut</Label>
                  <select
                    value={filterStatut}
                    onChange={e => setFilterStatut(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Tous les statuts</option>
                    {["en attente", "confirmée", "en cours", "terminée", "annulée", "refusée"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Filtre véhicule */}
                <div>
                  <Label className="text-xs mb-1 block">Véhicule</Label>
                  <Input
                    placeholder="Nom du véhicule…"
                    value={filterVehicule}
                    onChange={e => setFilterVehicule(e.target.value)}
                  />
                </div>
                {/* Filtre date */}
                <div>
                  <Label className="text-xs mb-1 block">Date de début</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                </div>
              </div>
              {/* Reset filtres */}
              {(filterStatut || filterVehicule || filterDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => { setFilterStatut(""); setFilterVehicule(""); setFilterDate(""); }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Tableau ────────────────────────────────────────────── */}
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
                    <TableHead>Caution</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                        {reservations.length === 0
                          ? "Aucune réservation pour le moment."
                          : "Aucune réservation ne correspond à vos filtres."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRes.map(r => {
                      const img = r.vehicleImageUrl;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.id}</TableCell>
                          <TableCell className="font-medium">{r.client}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{r.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {img ? (
                                <img src={img} alt={r.vehicule} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                  <Car className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <span>{r.vehicule}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">
                            {r.debut}{r.heureDebut ? ` ${r.heureDebut}` : ""}
                          </TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">
                            {r.fin}{r.heureFin ? ` ${r.heureFin}` : ""}
                          </TableCell>
                          <TableCell className="font-semibold">{r.montant} €</TableCell>
                          <TableCell className="font-semibold">{r.caution} €</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statColors[r.statut] || ""}>{r.statut}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openDetail(r)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Modal principale ───────────────────────────────────── */}
      <Dialog open={!!selectedReservation} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {/* Bouton retour depuis un sous-formulaire */}
              {action && (
                <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle>{modalTitle()}</DialogTitle>
            </div>
          </DialogHeader>

          {/* ── Vue détail ──────────────────────────────────────── */}
          {!action && selectedReservation && (() => {
            const img = selectedReservation.vehicleImageUrl;
            return (
              <div className="space-y-5">
                {/* Véhicule + statut */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
                  {img ? (
                    <img src={img} alt={selectedReservation.vehicule} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-bold text-lg">{selectedReservation.vehicule}</p>
                    <Badge variant="outline" className={statColors[selectedReservation.statut] || ""}>
                      {selectedReservation.statut}
                    </Badge>
                  </div>
                </div>

                {/* Details vehicule importants */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Vehicule loue</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Type demande</p>
                      <p className="text-sm font-medium">{selectedReservation.requestedVehicleType || "-"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Immatriculation</p>
                      <p className="text-sm font-medium">{selectedReservation.vehicleDetails?.immatriculation || "-"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Modele</p>
                      <p className="text-sm font-medium">
                        {selectedReservation.vehicleDetails?.marque || ""} {selectedReservation.vehicleDetails?.modele || ""}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Categorie</p>
                      <p className="text-sm font-medium">{selectedReservation.vehicleDetails?.categorie || "-"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Transmission / Energie</p>
                      <p className="text-sm font-medium">
                        {(selectedReservation.vehicleDetails?.transmission || "-")} / {(selectedReservation.vehicleDetails?.energie || "-")}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground">Annee / Places</p>
                      <p className="text-sm font-medium">
                        {(selectedReservation.vehicleDetails?.annee || "-")} / {(selectedReservation.vehicleDetails?.places || "-")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.client}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.email}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.telephone}</span></div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.ville}</span></div>
                  </div>
                </div>

                {/* Période avec heures précises */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Période</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1">Début</p>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {selectedReservation.debut}
                      </div>
                      {selectedReservation.heureDebut && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedReservation.heureDebut}
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40">
                      <p className="text-xs text-muted-foreground mb-1">Fin</p>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {selectedReservation.fin}
                      </div>
                      {selectedReservation.heureFin && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedReservation.heureFin}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financier */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Financier</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Montant</p>
                      <p className="text-lg font-bold">{selectedReservation.montant} €</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Caution</p>
                      <p className="text-lg font-bold">{selectedReservation.caution} €</p>
                    </div>
                  </div>
                </div>

                {/* Kilométrages si renseignés */}
                {(selectedReservation.kmDebut !== undefined || selectedReservation.kmFin !== undefined) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Kilométrage</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReservation.kmDebut !== undefined && (
                        <div className="p-3 rounded-xl bg-muted/40 text-center">
                          <p className="text-xs text-muted-foreground">Départ</p>
                          <p className="text-lg font-bold">{selectedReservation.kmDebut} km</p>
                        </div>
                      )}
                      {selectedReservation.kmFin !== undefined && (
                        <div className="p-3 rounded-xl bg-muted/40 text-center">
                          <p className="text-xs text-muted-foreground">Retour</p>
                          <p className="text-lg font-bold">{selectedReservation.kmFin} km</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Commentaire de confirmation */}
                {selectedReservation.commentaireConfirmation && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-200 space-y-1">
                    <p className="text-xs font-medium text-emerald-700">Infos de récupération</p>
                    <p className="text-sm text-muted-foreground">{selectedReservation.commentaireConfirmation}</p>
                  </div>
                )}

                {/* Commentaire d'annulation */}
                {selectedReservation.commentaireAnnulation && (
                  <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
                    <p className="text-xs font-medium text-destructive">Motif d'annulation</p>
                    <p className="text-sm text-muted-foreground">{selectedReservation.commentaireAnnulation}</p>
                  </div>
                )}

                {/* Commentaire de refus */}
                {selectedReservation.commentaireRefus && (
                  <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
                    <p className="text-xs font-medium text-destructive">Motif de refus</p>
                    <p className="text-sm text-muted-foreground">{selectedReservation.commentaireRefus}</p>
                  </div>
                )}

                {/* Bouton timeline */}
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setAction("timeline")}>
                  <Clock className="h-4 w-4" />
                  Voir l'historique
                </Button>

                {/* ── Boutons d'action selon le statut ────────────── */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">Actions</p>
                  <div className="flex flex-wrap gap-2">

                    {/* Confirmer — si en attente */}
                    {selectedReservation.statut === "en attente" && (
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction("confirmer")}>
                        <CheckCircle className="h-3.5 w-3.5" /> Confirmer
                      </Button>
                    )}

                    {/* Refuser — si en attente */}
                    {selectedReservation.statut === "en attente" && (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => setAction("refuser")}>
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    )}

                    {/* Annuler — si en attente ou confirmée */}
                    {["en attente", "confirmée"].includes(selectedReservation.statut) && (
                      <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setAction("annuler")}>
                        <XCircle className="h-3.5 w-3.5" /> Annuler
                      </Button>
                    )}

                    {/* Démarrer — si confirmée */}
                    {selectedReservation.statut === "confirmée" && (
                      <Button size="sm" className="gap-1" onClick={() => setAction("demarrer")}>
                        <Play className="h-3.5 w-3.5" /> Démarrer la location
                      </Button>
                    )}

                    {/* Terminer — si en cours */}
                    {selectedReservation.statut === "en cours" && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setAction("terminer")}>
                        <Flag className="h-3.5 w-3.5" /> Terminer la location
                      </Button>
                    )}

                    {/* Ajouter un événement — toujours disponible */}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setAction("evenement")}>
                      <Plus className="h-3.5 w-3.5" /> Ajouter un événement
                    </Button>

                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setAction("modifier")}>
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </Button>

                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => setAction("supprimer")}>
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {action === "modifier" && selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Date début *</Label>
                  <Input type="datetime-local" value={editStartAt} onChange={(e) => { setEditStartAt(e.target.value); setEditError(""); }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Date fin *</Label>
                  <Input type="datetime-local" value={editEndAt} onChange={(e) => { setEditEndAt(e.target.value); setEditError(""); }} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Ville de retrait *</Label>
                <Input value={editPickupCity} onChange={(e) => { setEditPickupCity(e.target.value); setEditError(""); }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Montant TTC (€)</Label>
                  <Input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => { setEditAmount(e.target.value); setEditError(""); }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Caution (€)</Label>
                  <Input type="number" min="0" step="0.01" value={editDeposit} onChange={(e) => { setEditDeposit(e.target.value); setEditError(""); }} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Statut</Label>
                <select
                  value={editStatus}
                  onChange={(e) => { setEditStatus((e.target.value as ReservationStatus) || ""); setEditError(""); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Sélectionner un statut --</option>
                  <option value="NOUVELLE_DEMANDE">Nouvelle demande</option>
                  <option value="EN_ANALYSE">En analyse</option>
                  <option value="PROPOSITION_ENVOYEE">Proposition envoyée</option>
                  <option value="EN_ATTENTE_PAIEMENT">En attente paiement</option>
                  <option value="CONFIRMEE">Confirmée</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="CLOTUREE">Clôturée</option>
                  <option value="ANNULEE">Annulée</option>
                  <option value="REFUSEE">Refusée</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Commentaire client (optionnel)</Label>
                <textarea
                  value={editStatusComment}
                  onChange={(e) => { setEditStatusComment(e.target.value); setEditError(""); }}
                  rows={3}
                  placeholder="Message ajoute au mail de changement de statut..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {editError && <p className="text-xs text-destructive">{editError}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Annuler</Button>
                <Button className="gap-2" onClick={handleModifierReservation}>
                  <Pencil className="h-4 w-4" /> Enregistrer
                </Button>
              </DialogFooter>
            </div>
          )}

          {action === "supprimer" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette action est irreversible. La réservation <span className="font-medium text-foreground">{selectedReservation.id}</span> sera supprimée.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Annuler</Button>
                <Button variant="destructive" className="gap-2" onClick={handleSupprimerReservation}>
                  <Trash2 className="h-4 w-4" /> Supprimer définitivement
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Confirmer ──────────────────────────────────── */}
          {action === "confirmer" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Indiquez à <span className="font-medium text-foreground">{selectedReservation.client}</span> les
                informations de récupération du véhicule. Ce message lui sera envoyé par email.
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Informations de récupération *</Label>
                <textarea
                  value={commentaire}
                  onChange={e => { setCommentaire(e.target.value); setCommentaireError(""); }}
                  placeholder="Ex : Merci de vous présenter au 12 Rue de Rivoli, Puteaux à 09h00. Munissez-vous de votre permis et d'une pièce d'identité."
                  rows={5}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${commentaireError ? "border-destructive" : "border-input"}`}
                />
                {commentaireError && <p className="text-xs text-destructive">{commentaireError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Annuler</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleConfirmer}>
                  <CheckCircle className="h-4 w-4" /> Confirmer et envoyer
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Annuler ────────────────────────────────────── */}
          {action === "annuler" && selectedReservation && (
            <div className="space-y-4">
              {/* Avertissement pénalité si déjà confirmée */}
              {selectedReservation.statut === "confirmée" && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-300 text-sm text-yellow-800">
                  ⚠️ Cette réservation est déjà confirmée. L'annulation peut entraîner des pénalités pour le client.
                  Précisez les conditions dans votre commentaire.
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {selectedReservation.statut === "confirmée"
                  ? "Un commentaire expliquant les conditions d'annulation est obligatoire."
                  : "Ajoutez un commentaire optionnel pour informer le client."}
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Commentaire {selectedReservation.statut === "confirmée" ? "*" : "(optionnel)"}
                </Label>
                <textarea
                  value={commentaire}
                  onChange={e => { setCommentaire(e.target.value); setCommentaireError(""); }}
                  placeholder="Ex : Suite à un problème technique, nous devons annuler votre réservation. Aucune pénalité ne sera appliquée."
                  rows={4}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${commentaireError ? "border-destructive" : "border-input"}`}
                />
                {commentaireError && <p className="text-xs text-destructive">{commentaireError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Retour</Button>
                <Button variant="destructive" className="gap-2" onClick={handleAnnuler}>
                  <XCircle className="h-4 w-4" /> Confirmer l'annulation
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Refuser ────────────────────────────────────── */}
          {action === "refuser" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Expliquez à <span className="font-medium text-foreground">{selectedReservation.client}</span> pourquoi
                sa demande est refusée.
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Motif du refus *</Label>
                <textarea
                  value={commentaire}
                  onChange={e => { setCommentaire(e.target.value); setCommentaireError(""); }}
                  placeholder="Ex : Les dates demandées ne sont pas disponibles pour ce véhicule."
                  rows={4}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${commentaireError ? "border-destructive" : "border-input"}`}
                />
                {commentaireError && <p className="text-xs text-destructive">{commentaireError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Retour</Button>
                <Button variant="destructive" className="gap-2" onClick={handleRefuser}>
                  <XCircle className="h-4 w-4" /> Refuser la réservation
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Démarrer location ──────────────────────────── */}
          {action === "demarrer" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Renseignez le kilométrage de départ du véhicule. Ces données seront transmises à la gestion de flotte.
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Kilométrage de départ *</Label>
                <Input
                  type="number"
                  value={kmInput}
                  onChange={e => { setKmInput(e.target.value); setKmError(""); }}
                  placeholder="Ex : 24500"
                  className={kmError ? "border-destructive" : ""}
                />
                {kmError && <p className="text-xs text-destructive">{kmError}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Observations (optionnel)</Label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  placeholder="Ex : Véhicule remis avec plein d'essence, aucune rayure constatée."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Photos (optionnel)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setPhotoFiles(Array.from(e.target.files || []))}
                />
                {photoFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">{photoFiles.length} photo(s) sélectionnée(s)</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Retour</Button>
                <Button className="gap-2" onClick={handleDemarrer}>
                  <Play className="h-4 w-4" /> Démarrer la location
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Terminer location ──────────────────────────── */}
          {action === "terminer" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Renseignez le kilométrage de retour. L'écart avec le kilométrage de départ
                ({selectedReservation.kmDebut ?? "??"} km) mettra à jour la flotte automatiquement.
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Kilométrage de retour *</Label>
                <Input
                  type="number"
                  value={kmInput}
                  onChange={e => { setKmInput(e.target.value); setKmError(""); }}
                  placeholder="Ex : 25100"
                  className={kmError ? "border-destructive" : ""}
                />
                {kmError && <p className="text-xs text-destructive">{kmError}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Observations (optionnel)</Label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  placeholder="Ex : Véhicule rendu en bon état, caution restituée."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Photos (optionnel)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setPhotoFiles(Array.from(e.target.files || []))}
                />
                {photoFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">{photoFiles.length} photo(s) sélectionnée(s)</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Retour</Button>
                <Button variant="outline" className="gap-2" onClick={handleTerminer}>
                  <Flag className="h-4 w-4" /> Terminer la location
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Créer événement custom ─────────────────────── */}
          {action === "evenement" && selectedReservation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Créez un événement lié à cette réservation. Vous pouvez choisir de le rendre visible au client.
              </p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Titre *</Label>
                <Input
                  value={evtTitre}
                  onChange={e => { setEvtTitre(e.target.value); setEvtTitreError(""); }}
                  placeholder="Ex : Appel client, Incident signalé, Document reçu…"
                  className={evtTitreError ? "border-destructive" : ""}
                />
                {evtTitreError && <p className="text-xs text-destructive">{evtTitreError}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Description (optionnel)</Label>
                <textarea
                  value={evtDescription}
                  onChange={e => setEvtDescription(e.target.value)}
                  placeholder="Détails de l'événement…"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Visible par le client</p>
                  <p className="text-xs text-muted-foreground">Apparaîtra dans l'espace client</p>
                </div>
                <Switch checked={evtVisibleClient} onCheckedChange={setEvtVisibleClient} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Envoyer par email</p>
                  <p className="text-xs text-muted-foreground">Notifie le client par email</p>
                </div>
                <Switch checked={evtEnvoiEmail} onCheckedChange={setEvtEnvoiEmail} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={goBack}>Annuler</Button>
                <Button className="gap-2" onClick={handleAjouterEvenement}>
                  <Plus className="h-4 w-4" /> Ajouter l'événement
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue : Timeline des événements ───────────────────── */}
          {action === "timeline" && selectedReservation && (
            <div className="space-y-3">
              {timelineLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chargement de l'historique...</p>
              ) : timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun événement enregistré.</p>
              ) : (
                [...timelineEvents].reverse().map((evt: any) => (
                  <div key={evt.id} className="flex gap-3">
                    {/* Indicateur type */}
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${evt.type === "systeme" ? "bg-primary" : "bg-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{toFriendlyEventTitle(evt)}</p>
                        {evt.payload?.visibleClient && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">Client</Badge>
                        )}
                        {evt.payload?.sendEmail && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">Email</Badge>
                        )}
                      </div>
                      {evt.payload?.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{evt.payload.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(evt.occurredAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {meta && (
        <div className="space-y-2 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            Page {meta.page} sur {Math.max(meta.totalPages, 1)} · {meta.totalItems} réservations
          </p>
          <PaginationType>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasPreviousPage) setPage((prev) => Math.max(prev - 1, 1));
                  }}
                  className={!meta.hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>{meta.page}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasNextPage) setPage((prev) => prev + 1);
                  }}
                  className={!meta.hasNextPage ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </PaginationType>
        </div>
      )}
    </>
  );
}