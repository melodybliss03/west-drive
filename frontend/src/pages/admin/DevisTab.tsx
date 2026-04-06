import { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Car,
  Building2,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { mapQuoteDtoToDevisRow } from "@/lib/mappers";
import { ApiHttpError, PaginatedCollection, PaginationMeta } from "@/lib/api/types";
import { QuoteDto, QuoteEventDto, VehicleDto, quotesService, vehiclesService } from "@/lib/api/services";
import type { DevisRow } from "./data";
import { devisStatColors } from "./data";
import { vehicules } from "@/data/mock";
import type { Categorie, Vehicule } from "@/data/mock";

type PropositionVehicule = {
  vehicleId?: string;
  typeVehicule: string;
  vehiculesSelectionnes: string[];
  dateDebut: string;
  heureDebut: string;
  dateFin: string;
  heureFin: string;
  kmInclus: string;
  prixJour: string;
  prixHeure: string;
  autreFraisLibelle: { label: string; amount: string }[];
};

type ActionType = "analyse" | "valider" | "negocier" | "refuser" | null;

const vehicleTypes = ["Micro", "Compacte", "Berline", "SUV"];

function emptyProposition(): PropositionVehicule {
  return {
    vehicleId: undefined,
    typeVehicule: "",
    vehiculesSelectionnes: [],
    dateDebut: "",
    heureDebut: "",
    dateFin: "",
    heureFin: "",
    kmInclus: "200",
    prixJour: "",
    prixHeure: "",
    autreFraisLibelle: [],
  };
}

function toItems<T>(collection: PaginatedCollection<T> | T[]): T[] {
  return Array.isArray(collection) ? collection : collection.items;
}

function formatEventLabel(type: string): string {
  const map: Record<string, string> = {
    quote_created: "Demande créée",
    quote_ack_email_sent: "Accusé de réception envoyé",
    quote_admin_notified: "Admin notifié",
    quote_in_analysis: "Devis en analyse",
    quote_negotiation_updated: "Négociation mise à jour",
    quote_proposal_sent: "Proposition envoyée",
    quote_payment_link_created: "Lien de paiement généré",
    quote_payment_confirmed: "Paiement confirmé",
    quote_accepted: "Devis accepté",
    quote_refused: "Devis refusé",
    quote_status_changed: "Statut modifié",
    quote_converted_to_reservation: "Converti en réservation",
    quote_customer_accepted: "Client a accepté la proposition",
    quote_customer_rejected: "Client a refusé la proposition",
    quote_customer_counter_proposal: "Client a envoyé une contre-proposition",
  };

  return map[type] ?? type;
}

function formatEventDetails(event: QuoteEventDto): string | null {
  const payload = event.payload ?? {};

  if (event.type === "quote_status_changed" && typeof payload.status === "string") {
    return `Nouveau statut: ${payload.status}`;
  }

  if (event.type === "quote_refused" && typeof payload.reason === "string" && payload.reason.trim()) {
    return payload.reason;
  }

  if (event.type === "quote_negotiation_updated" && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (event.type === "quote_converted_to_reservation" && typeof payload.reservationPublicReference === "string") {
    return `Réservation créée : ${payload.reservationPublicReference}`;
  }

  if ((event.type === "quote_customer_accepted" || event.type === "quote_customer_rejected" || event.type === "quote_customer_counter_proposal") && typeof payload.comment === "string" && payload.comment.trim()) {
    return payload.comment;
  }

  return null;
}

interface DevisTabProps {
  devis: DevisRow[];
  setDevis: React.Dispatch<React.SetStateAction<DevisRow[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  meta: PaginationMeta | null;
  hasPermission: (perm: string) => boolean;
}

export default function DevisTab({ devis, setDevis, page, setPage, meta, hasPermission }: DevisTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDevis, setSelectedDevis] = useState<DevisRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType>(null);

  const [propositions, setPropositions] = useState<PropositionVehicule[]>([]);
  const [commentaireAnalyse, setCommentaireAnalyse] = useState("");
  const [messageNegociation, setMessageNegociation] = useState("");
  const [commentaireRefus, setCommentaireRefus] = useState("");
  const [refusError, setRefusError] = useState("");

  const [availableVehicles, setAvailableVehicles] = useState<VehicleDto[]>([]);

  const [timeline, setTimeline] = useState<QuoteEventDto[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all active vehicles once on mount for the proposal vehicle dropdown
  useEffect(() => {
    vehiclesService.list({ page: 1, limit: 100 }, false).then((res) => {
      const items = Array.isArray(res) ? res : res.items;
      setAvailableVehicles(items.filter((v) => v.isActive && v.operationalStatus === "DISPONIBLE"));
    }).catch(() => { /* silent — dropdown just stays empty */ });
  }, []);

  const filtered = devis.filter((d) =>
    d.client.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    (d.publicReference ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const canStartAnalysis = selectedDevis?.backendStatus === "NOUVELLE_DEMANDE";
  const canSendProposal = ["EN_ANALYSE", "EN_NEGOCIATION", "PROPOSITION_ENVOYEE"].includes(selectedDevis?.backendStatus ?? "");
  const canNegotiate = ["EN_ANALYSE", "PROPOSITION_ENVOYEE", "EN_ATTENTE_PAIEMENT"].includes(selectedDevis?.backendStatus ?? "");
  const canRefuse = ["REFUSEE", "ANNULEE", "CONVERTI_RESERVATION"].every((status) => status !== selectedDevis?.backendStatus);

  const applyQuoteUpdate = (quote: QuoteDto) => {
    const mapped = mapQuoteDtoToDevisRow(quote);
    setDevis((prev) => prev.map((d) => (d.id === mapped.id ? { ...d, ...mapped } : d)));
    setSelectedDevis((prev) => (prev && prev.id === mapped.id ? { ...prev, ...mapped } : prev));
  };

  const loadEvents = async (quoteId: string) => {
    setTimelineLoading(true);
    try {
      const response = await quotesService.findEvents(quoteId, { page: 1, limit: 50 });
      setTimeline(toItems(response));
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const openDetail = (d: DevisRow) => {
    setSelectedDevis(d);
    setAction(null);
    setCommentaireAnalyse("");
    setMessageNegociation("");
    setCommentaireRefus("");
    setRefusError("");

    // Pre-fill propositions: per-vehicle slots when available, else fallback to quote-level dates
    if (d.requestedVehiclesDetail && d.requestedVehiclesDetail.length > 0) {
      setPropositions(
        d.requestedVehiclesDetail.map((v) => ({
          ...emptyProposition(),
          typeVehicule: v.vehicleType,
          dateDebut: v.startAt.split("T")[0] ?? "",
          heureDebut: v.startAt.split("T")[1]?.substring(0, 5) ?? "",
          dateFin: v.endAt.split("T")[0] ?? "",
          heureFin: v.endAt.split("T")[1]?.substring(0, 5) ?? "",
        })),
      );
    } else {
      const dateDebut = d.dateDebut ? d.dateDebut.split("T")[0] ?? "" : "";
      const heureDebut = d.dateDebut ? (d.dateDebut.split("T")[1]?.substring(0, 5) ?? "") : "";
      const dateFin = d.dateFin ? d.dateFin.split("T")[0] ?? "" : "";
      const heureFin = d.dateFin ? (d.dateFin.split("T")[1]?.substring(0, 5) ?? "") : "";
      setPropositions(
        Array.from({ length: d.nombreVehicules }, () => ({
          ...emptyProposition(),
          typeVehicule: d.typeVehicule,
          dateDebut,
          heureDebut,
          dateFin,
          heureFin,
        })),
      );
    }

    void loadEvents(d.id);
  };

  const closeModal = () => {
    setSelectedDevis(null);
    setAction(null);
    setTimeline([]);
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await quotesService.remove(id);
      setDevis((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
      toast({ title: "Devis supprime" });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Suppression du devis impossible.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProposition = (index: number, key: keyof PropositionVehicule, value: string | undefined) => {
    setPropositions((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const handleStartAnalysis = async () => {
    if (!selectedDevis) return;
    setIsSubmitting(true);
    try {
      const updated = await quotesService.startAnalysis(selectedDevis.id, commentaireAnalyse || undefined);
      applyQuoteUpdate(updated);
      await loadEvents(selectedDevis.id);
      setAction(null);
      toast({ title: "Devis passe en analyse" });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Mise en analyse impossible.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValider = async () => {
    if (!selectedDevis) return;

    const hasEmpty = propositions.some(
      (p) => !p.typeVehicule || !p.dateDebut || !p.heureDebut || !p.dateFin || !p.heureFin || !p.prixJour,
    );
    if (hasEmpty) {
      toast({
        title: "Formulaire incomplet",
        description: "Remplissez les champs obligatoires pour chaque vehicule.",
        variant: "destructive",
      });
      return;
    }

    const amountTtc = propositions.reduce((total, p) => {
      const start = new Date(`${p.dateDebut}T${p.heureDebut}:00`);
      const end = new Date(`${p.dateFin}T${p.heureFin}:00`);
      const diffMs = Math.max(end.getTime() - start.getTime(), 0);
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const prixJour = Number(p.prixJour || 0);
      const prixHeure = Number(p.prixHeure || 0);

      // Use hourly pricing only when cheaper AND duration < 1 day
      if (prixHeure > 0 && diffHours < 24) {
        const totalHourly = prixHeure * Math.max(1, Math.ceil(diffHours));
        const totalDaily = prixJour * 1;
        return total + (totalHourly < totalDaily ? totalHourly : totalDaily);
      }
      const days = Math.max(1, Math.ceil(diffDays));
      return total + prixJour * days;
    }, 0);

    setIsSubmitting(true);
    try {
      const response = await quotesService.sendProposal(selectedDevis.id, {
        amountTtc,
        currency: "EUR",
        proposalDetails: { propositions },
      });

      applyQuoteUpdate(response.quote);
      await loadEvents(selectedDevis.id);
      setAction(null);
      toast({ title: "Proposition envoyee", description: `${selectedDevis.client} sera notifie par email.` });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Envoi de la proposition impossible.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!selectedDevis) return;
    setIsSubmitting(true);
    try {
      const updated = await quotesService.startNegotiation(selectedDevis.id, messageNegociation || undefined);
      applyQuoteUpdate(updated);
      await loadEvents(selectedDevis.id);
      setAction(null);
      toast({ title: "Devis passe en negociation" });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Passage en negociation impossible.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefuser = async () => {
    if (!selectedDevis) return;
    if (!commentaireRefus.trim()) {
      setRefusError("Un commentaire est requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await quotesService.updateStatus(selectedDevis.id, "REFUSEE", commentaireRefus);
      applyQuoteUpdate(updated);
      setSelectedDevis((prev) => (prev ? { ...prev, commentaireRefus } : prev));
      await loadEvents(selectedDevis.id);
      setAction(null);
      toast({ title: "Devis refuse", description: `${selectedDevis.client} a ete notifie par email.` });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Refus du devis impossible.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedDevis) return;
    const refreshed = devis.find((d) => d.id === selectedDevis.id);
    if (refreshed) {
      setSelectedDevis(refreshed);
    }
  }, [devis, selectedDevis]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-display font-bold">Demandes de devis</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Vehicule</TableHead>
                    <TableHead className="hidden sm:table-cell">Periode</TableHead>
                    <TableHead className="hidden md:table-cell">Cree le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        {devis.length === 0
                          ? "Aucune demande de devis pour le moment."
                          : "Aucune demande ne correspond a votre recherche."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">{d.publicReference ?? d.id}</TableCell>
                        <TableCell className="font-medium">{d.client}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={d.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                            {d.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{d.nombreVehicules}x {d.typeVehicule}</span>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{formatDate(d.dateDebut)} {"-> "} {formatDate(d.dateFin)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{new Date(d.creeLe).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={devisStatColors[d.statut] || ""}>{d.statut}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openDetail(d)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {hasPermission('quotes.manage') && (
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteConfirm(d.id)} disabled={isSubmitting}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!selectedDevis} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {action && (
                <button onClick={() => setAction(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle>
                {action === "analyse" && "Passer en analyse"}
                {action === "valider" && "Envoyer une proposition"}
                {action === "negocier" && "Demarrer une negociation"}
                {action === "refuser" && "Motif de refus"}
                {!action && `Dossier ${selectedDevis?.publicReference ?? selectedDevis?.id}`}
              </DialogTitle>
            </div>
          </DialogHeader>

          {!action && selectedDevis && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <p className="font-display font-bold text-lg">{selectedDevis.client}</p>
                  <p className="text-xs text-muted-foreground">{selectedDevis.publicReference ?? selectedDevis.id}</p>
                </div>
                <Badge variant="outline" className={devisStatColors[selectedDevis.statut] || ""}>{selectedDevis.statut}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.telephone}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.ville}</span></div>
                  {selectedDevis.nomEntreprise && (
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.nomEntreprise}</span></div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Demande</p>
                  {selectedDevis.requestedVehiclesDetail && selectedDevis.requestedVehiclesDetail.length > 0 ? (
                    selectedDevis.requestedVehiclesDetail.map((v, i) => (
                      <div key={i} className="border-l-2 border-primary/40 pl-2 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{v.vehicleType}</span>
                          {selectedDevis.requestedVehiclesDetail!.length > 1 && (
                            <span className="text-xs text-muted-foreground">#{i + 1}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(v.startAt)} → {formatDate(v.endAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.nombreVehicules}x {selectedDevis.typeVehicule}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{formatDate(selectedDevis.dateDebut)} {"-> "} {formatDate(selectedDevis.dateFin)}</span></div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedDevis.type === "entreprise" ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    <span>{selectedDevis.type}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const propositions = (selectedDevis.proposalDetails as { propositions?: PropositionVehicule[] } | null | undefined)?.propositions;
                if (!propositions || propositions.length === 0) return null;
                return (
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                    <p className="text-sm font-medium text-muted-foreground">Proposition envoyee</p>
                    {propositions.map((p, i) => {
                      const assignedVehicle = p.vehicleId ? availableVehicles.find((v) => v.id === p.vehicleId) : undefined;
                      return (
                        <div key={i} className="text-sm space-y-1 border-l-2 border-emerald-500 pl-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{p.typeVehicule || "Type non defini"}</p>
                            {assignedVehicle && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">
                                {assignedVehicle.name}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground">{p.dateDebut} {p.heureDebut} &rarr; {p.dateFin} {p.heureFin}</p>
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{p.prixJour} €/jour</span>
                            {p.prixHeure && Number(p.prixHeure) > 0 && <span>{p.prixHeure} €/h</span>}
                            <span>{p.kmInclus} km/j inclus</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {selectedDevis.commentaireRefus && (                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
                  <p className="text-xs font-medium text-destructive">Motif du refus</p>
                  <p className="text-sm text-muted-foreground">{selectedDevis.commentaireRefus}</p>
                </div>
              )}

              <div className="space-y-2 border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Timeline</p>
                  <Button variant="ghost" size="sm" onClick={() => selectedDevis && void loadEvents(selectedDevis.id)} disabled={timelineLoading}>
                    <RefreshCw className={`h-4 w-4 ${timelineLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {timelineLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement des evenements...</p>
                ) : timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun evenement pour ce devis.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {timeline.map((event) => (
                      <div key={event.id} className="border-l-2 border-border pl-3">
                        <p className="text-sm font-medium">{formatEventLabel(event.type)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {new Date(event.occurredAt).toLocaleString("fr-FR")}
                        </p>
                        {formatEventDetails(event) && (
                          <p className="text-xs text-muted-foreground mt-1">{formatEventDetails(event)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
                {hasPermission('quotes.manage') && canStartAnalysis && (
                  <Button className="gap-2" onClick={() => setAction("analyse")} disabled={isSubmitting}>
                    <CheckCircle className="h-4 w-4" />
                    Passer en analyse
                  </Button>
                )}
                {hasPermission('quotes.manage') && canSendProposal && (
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction("valider")} disabled={isSubmitting}>
                    <CheckCircle className="h-4 w-4" />
                    Envoyer proposition
                  </Button>
                )}
                {hasPermission('quotes.manage') && canNegotiate && (
                  <Button variant="outline" className="gap-2" onClick={() => setAction("negocier")} disabled={isSubmitting}>
                    Negocier
                  </Button>
                )}
                {hasPermission('quotes.manage') && canRefuse && (
                  <Button variant="destructive" className="gap-2" onClick={() => setAction("refuser")} disabled={isSubmitting}>
                    <XCircle className="h-4 w-4" />
                    Refuser
                  </Button>
                )}
              </div>
            </div>
          )}

          {action === "analyse" && selectedDevis && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Ajoutez un commentaire optionnel pour informer le client.</p>
              <textarea
                value={commentaireAnalyse}
                onChange={(e) => setCommentaireAnalyse(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>Annuler</Button>
                <Button onClick={handleStartAnalysis} disabled={isSubmitting}>{isSubmitting ? <><Spinner className="mr-2" />Traitement...</> : "Confirmer"}</Button>
              </DialogFooter>
            </div>
          )}

          {action === "valider" && selectedDevis && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Remplissez les details pour {selectedDevis.client}.</p>

              {propositions.map((p, index) => {
                const totalSlots = propositions.length;
                // Filter available vehicles by category matching the selected typeVehicule
                const filteredVehicles = p.typeVehicule
                  ? availableVehicles.filter((v) => v.category.toUpperCase() === p.typeVehicule.toUpperCase())
                  : availableVehicles;

                return (
                  <div key={index} className="space-y-3 p-4 rounded-xl border border-border">
                    <p className="text-sm font-semibold">Vehicule {index + 1}{totalSlots > 1 ? ` / ${totalSlots}` : ""}</p>

                    <div>
                      <Label className="text-xs">Type de vehicule *</Label>
                      <select
                        value={p.typeVehicule}
                        onChange={(e) => {
                          updateProposition(index, "typeVehicule", e.target.value);
                          updateProposition(index, "vehicleId", undefined);
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      >
                        <option value="">Selectionner</option>
                        {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Vehicle assignment dropdown */}
                    <div>
                      <Label className="text-xs">Vehicule assigne (optionnel)</Label>
                      <select
                        value={p.vehicleId ?? ""}
                        onChange={(e) => {
                          const vid = e.target.value || undefined;
                          updateProposition(index, "vehicleId", vid);
                          if (vid) {
                            const v = availableVehicles.find((av) => av.id === vid);
                            if (v) {
                              updateProposition(index, "prixJour", String(v.pricePerDay ?? ""));
                              updateProposition(index, "prixHeure", String(v.pricePerHour ?? ""));
                              updateProposition(index, "kmInclus", String(v.includedKmPerDay ?? "200"));
                            }
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      >
                        <option value="">— Aucun vehicule specifique —</option>
                        {filteredVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.city || v.availableCities?.[0] || "—"}) · {v.pricePerDay} €/j
                          </option>
                        ))}
                        {filteredVehicles.length === 0 && p.typeVehicule && (
                          <option disabled value="">Aucun vehicule disponible pour ce type</option>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Date de prise *</Label>
                        <Input type="date" value={p.dateDebut} onChange={(e) => updateProposition(index, "dateDebut", e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Heure de prise *</Label>
                        <Input type="time" value={p.heureDebut} onChange={(e) => updateProposition(index, "heureDebut", e.target.value)} className="mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Date de retour *</Label>
                        <Input type="date" value={p.dateFin} min={p.dateDebut || undefined} onChange={(e) => updateProposition(index, "dateFin", e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Heure de retour *</Label>
                        <Input type="time" value={p.heureFin} onChange={(e) => updateProposition(index, "heureFin", e.target.value)} className="mt-1" />
                      </div>
                    </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Km inclus/jour *</Label>
                      <Input type="number" value={p.kmInclus} onChange={(e) => updateProposition(index, "kmInclus", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Prix/jour (EUR) *</Label>
                      <Input type="number" value={p.prixJour} placeholder="0" onChange={(e) => updateProposition(index, "prixJour", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Prix/heure (EUR)</Label>
                      <Input type="number" step="0.01" value={p.prixHeure} placeholder="0" onChange={(e) => updateProposition(index, "prixHeure", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              );
              })}

              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>Annuler</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleValider} disabled={isSubmitting}>
                  {isSubmitting ? <><Spinner className="mr-2" />Traitement...</> : "Envoyer la proposition"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {action === "negocier" && selectedDevis && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Precisez les points de negociation qui seront envoyes au client.</p>
              <textarea
                value={messageNegociation}
                onChange={(e) => setMessageNegociation(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>Annuler</Button>
                <Button onClick={handleStartNegotiation} disabled={isSubmitting}>{isSubmitting ? <><Spinner className="mr-2" />Traitement...</> : "Envoyer"}</Button>
              </DialogFooter>
            </div>
          )}

          {action === "refuser" && selectedDevis && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Expliquez a {selectedDevis.client} pourquoi sa demande est refusee.</p>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Motif du refus *</Label>
                <textarea
                  value={commentaireRefus}
                  onChange={(e) => {
                    setCommentaireRefus(e.target.value);
                    setRefusError("");
                  }}
                  rows={5}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none ${refusError ? "border-destructive" : "border-input"}`}
                />
                {refusError && <p className="text-xs text-destructive">{refusError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>Annuler</Button>
                <Button variant="destructive" onClick={handleRefuser} disabled={isSubmitting}>{isSubmitting ? <><Spinner className="mr-2" />Traitement...</> : "Confirmer le refus"}</Button>
              </DialogFooter>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {meta && (
        <div className="space-y-2 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            Page {meta.page} sur {Math.max(meta.totalPages, 1)} · {meta.totalItems} devis
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
                <PaginationLink href="#" isActive>{page}</PaginationLink>
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

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irreversible. Supprimer ce devis ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isSubmitting}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && void handleDelete(deleteConfirm)} disabled={isSubmitting}>
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
