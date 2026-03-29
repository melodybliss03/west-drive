import { useState, useEffect } from "react";
import { User, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reservationsService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

type ClientType = "particulier" | "entreprise";

const villes = [
  "Puteaux",
  "La Défense",
  "Neuilly-sur-Seine",
  "Levallois-Perret",
  "Boulogne-Billancourt",
  "Courbevoie",
  "Nanterre",
  "Suresnes",
];

interface ReservationDialogProps {
  children: React.ReactNode;
  vehiculeId?: string;
  vehiculeName?: string;
  vehiculeCategorie?: string;
  vehiculePrixJour?: number;
  vehiculeCaution?: number;
  vehiculeAdditionalFees?: Array<{ label: string; amount: number }>;
}

// ─── Helpers date/heure ───────────────────────────────────────────────────────

// Retourne la date du jour au format YYYY-MM-DD (valeur min pour les inputs date)
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Retourne l'heure actuelle au format HH:MM (valeur min pour les inputs time si date = aujourd'hui)
function getCurrentTimeString(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Vérifie qu'une date saisie manuellement n'est pas antérieure à aujourd'hui
function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr < getTodayString();
}

// Vérifie qu'une heure saisie manuellement n'est pas dans le passé
// (uniquement pertinent si la date choisie est aujourd'hui)
function isTimeInPast(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  if (dateStr !== getTodayString()) return false;
  return timeStr < getCurrentTimeString();
}

function parseDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function computeReservationPricing(
  startAt: Date,
  endAt: Date,
  pricePerDay: number,
  vehicleDepositAmount: number | undefined,
  additionalFees: Array<{ label: string; amount: number }>,
  selectedAdditionalFeeLabels: string[],
): { rentalAmount: number; depositAmount: number; totalAmount: number } {
  const days = Math.max(
    1,
    Math.ceil((endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const safePricePerDay =
    typeof pricePerDay === "number" && Number.isFinite(pricePerDay) && pricePerDay > 0
      ? pricePerDay
      : 50;

  const baseRentalAmount = days * safePricePerDay;
  const selectedAdditionalFeesAmount = additionalFees
    .filter((fee) => selectedAdditionalFeeLabels.includes(fee.label))
    .reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);

  const rentalAmount = baseRentalAmount + selectedAdditionalFeesAmount;
  const depositAmount =
    typeof vehicleDepositAmount === "number" && Number.isFinite(vehicleDepositAmount)
      ? Math.max(vehicleDepositAmount, 0)
      : Math.max(rentalAmount * 2, 500);

  return {
    rentalAmount,
    depositAmount,
    totalAmount: rentalAmount + depositAmount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ReservationDialog({
  children,
  vehiculeId,
  vehiculeName,
  vehiculeCategorie,
  vehiculePrixJour,
  vehiculeCaution,
  vehiculeAdditionalFees = [],
}: ReservationDialogProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ClientType>("particulier");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAdditionalFeeLabels, setSelectedAdditionalFeeLabels] = useState<string[]>([]);

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    nomEntreprise: "",
    siret: "",
    ville: "",
    dateDebut: "",
    heureDebut: "",
    dateFin: "",
    heureFin: "",
    commentaire: "",
  });

  const startAt = parseDateTime(form.dateDebut, form.heureDebut);
  const endAt = parseDateTime(form.dateFin, form.heureFin);
  const hasValidDateRange = !!startAt && !!endAt && endAt.getTime() > startAt.getTime();
  const pricing =
    hasValidDateRange && startAt && endAt
      ? computeReservationPricing(
          startAt,
          endAt,
          vehiculePrixJour ?? 50,
          vehiculeCaution,
          vehiculeAdditionalFees,
          selectedAdditionalFeeLabels,
        )
      : null;

  useEffect(() => {
    if (open && isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        nom: [user.prenom, user.nom].filter(Boolean).join(' ').trim() || prev.nom,
        email: user.email || prev.email,
        telephone: user.phone || prev.telephone,
      }));
    }
  }, [open, isAuthenticated, user]);

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ─── Validation avec contrôles de date/heure ────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.nom.trim()) errs.nom = "Le nom complet est requis.";
    if (!form.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email invalide.";
    if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    if (!form.ville) errs.ville = "La ville est requise.";

    // Date de prise
    if (!form.dateDebut) {
      errs.dateDebut = "La date de prise est requise.";
    } else if (isDateInPast(form.dateDebut)) {
      // Détection de saisie manuelle d'une date passée
      errs.dateDebut = "La date de prise ne peut pas être dans le passé.";
    } else if (!parseDateTime(form.dateDebut, form.heureDebut || "00:00")) {
      errs.dateDebut = "La date de prise est invalide.";
    }

    // Heure de prise
    if (!form.heureDebut) {
      errs.heureDebut = "L'heure de prise est requise.";
    } else if (isTimeInPast(form.dateDebut, form.heureDebut)) {
      // Détection de saisie manuelle d'une heure passée (si date = aujourd'hui)
      errs.heureDebut = "L'heure de prise ne peut pas être dans le passé.";
    }

    // Date de retour
    if (!form.dateFin) {
      errs.dateFin = "La date de retour est requise.";
    } else if (isDateInPast(form.dateFin)) {
      errs.dateFin = "La date de retour ne peut pas être dans le passé.";
    } else if (form.dateDebut && form.dateFin < form.dateDebut) {
      errs.dateFin = "La date de retour doit être après la date de prise.";
    } else if (!parseDateTime(form.dateFin, form.heureFin || "00:00")) {
      errs.dateFin = "La date de retour est invalide.";
    }

    // Heure de retour
    if (!form.heureFin) {
      errs.heureFin = "L'heure de retour est requise.";
    } else if (isTimeInPast(form.dateFin, form.heureFin)) {
      errs.heureFin = "L'heure de retour ne peut pas être dans le passé.";
    } else if (
      form.dateDebut === form.dateFin &&
      form.heureDebut &&
      form.heureFin &&
      form.heureFin <= form.heureDebut
    ) {
      // Si même jour → l'heure de retour doit être après l'heure de prise
      errs.heureFin = "L'heure de retour doit être après l'heure de prise.";
    }

    if (type === "entreprise") {
      if (!form.nomEntreprise.trim())
        errs.nomEntreprise = "Le nom de l'entreprise est requis.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
    }

    const previewStartAt = parseDateTime(form.dateDebut, form.heureDebut);
    const previewEndAt = parseDateTime(form.dateFin, form.heureFin);
    if (previewStartAt && previewEndAt && previewEndAt.getTime() <= previewStartAt.getTime()) {
      errs.heureFin = "La période de réservation est invalide.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    if (!startAt || !endAt || endAt.getTime() <= startAt.getTime() || !pricing) {
      toast({
        title: "Erreur",
        description: "La période de réservation est invalide.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const created = await reservationsService.create({
        vehicleId: vehiculeId,
        requesterType: type === "entreprise" ? "ENTREPRISE" : "PARTICULIER",
        requesterName: form.nom,
        requesterEmail: form.email,
        requesterPhone: form.telephone,
        companyName: type === "entreprise" ? form.nomEntreprise : null,
        companySiret: type === "entreprise" ? form.siret : null,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        pickupCity: form.ville,
        requestedVehicleType: vehiculeCategorie || "COMPACTE",
        amountTtc: pricing.rentalAmount,
        depositAmount: pricing.depositAmount,
      });

      let payment;
      try {
        payment = await reservationsService.createPaymentLink(created.id);
      } catch (error) {
        const isLegacyPaymentStatusError =
          error instanceof ApiHttpError &&
          /EN_ATTENTE_PAIEMENT status/i.test(error.message);

        if (!isLegacyPaymentStatusError) {
          throw error;
        }

        await reservationsService.patchStatus(created.id, "EN_ATTENTE_PAIEMENT");
        payment = await reservationsService.createPaymentLink(created.id);
      }

      toast({
        title: "Réservation créée",
        description: "Redirection vers le paiement sécurisé Stripe.",
      });
      window.location.assign(payment.paymentLinkUrl);
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible de créer la réservation ou de générer le lien de paiement.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      nom: "",
      email: "",
      telephone: "",
      nomEntreprise: "",
      siret: "",
      ville: "",
      dateDebut: "",
      heureDebut: "",
      dateFin: "",
      heureFin: "",
      commentaire: "",
    });
    setErrors({});
    setSelectedAdditionalFeeLabels([]);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      reset();
      setType("particulier");
    }
  };

  const inputClass = (key: string) =>
    `flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors[key] ? "border-destructive" : "border-input"}`;

  // Date du jour — utilisée comme attribut `min` sur les inputs date
  // pour bloquer la sélection via le date picker natif
  const today = getTodayString();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Réserver{vehiculeName ? ` — ${vehiculeName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Toggle particulier / entreprise */}
        <div className="flex bg-secondary rounded-xl p-1 mb-4">
          <button
            type="button"
            onClick={() => setType("particulier")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === "particulier" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <User className="h-4 w-4" /> Particulier
          </button>
          <button
            type="button"
            onClick={() => setType("entreprise")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === "entreprise" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            <Building2 className="h-4 w-4" /> Entreprise
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Détails de la location
            </p>

            {/* Dates de prise */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Date de prise <span className="text-primary">*</span>
                </label>
                <Input
                  type="date"
                  value={form.dateDebut}
                  min={today} // ← bloque le date picker avant aujourd'hui
                  onChange={(e) => set("dateDebut", e.target.value)}
                  className={errors.dateDebut ? "border-destructive" : ""}
                />
                {/* Message affiché si saisie manuelle d'une date passée */}
                {errors.dateDebut && (
                  <p className="text-xs text-destructive">{errors.dateDebut}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Heure de prise <span className="text-primary">*</span>
                </label>
                <Input
                  type="time"
                  value={form.heureDebut}
                  // Si la date choisie est aujourd'hui, on bloque les heures passées dans le picker
                  min={
                    form.dateDebut === today
                      ? getCurrentTimeString()
                      : undefined
                  }
                  onChange={(e) => set("heureDebut", e.target.value)}
                  className={errors.heureDebut ? "border-destructive" : ""}
                />
                {/* Message affiché si saisie manuelle d'une heure passée */}
                {errors.heureDebut && (
                  <p className="text-xs text-destructive">
                    {errors.heureDebut}
                  </p>
                )}
              </div>
            </div>

            {/* Dates de retour */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Date de retour <span className="text-primary">*</span>
                </label>
                <Input
                  type="date"
                  value={form.dateFin}
                  // La date de retour ne peut pas être avant la date de prise (ni avant aujourd'hui)
                  min={form.dateDebut || today}
                  onChange={(e) => set("dateFin", e.target.value)}
                  className={errors.dateFin ? "border-destructive" : ""}
                />
                {errors.dateFin && (
                  <p className="text-xs text-destructive">{errors.dateFin}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Heure de retour <span className="text-primary">*</span>
                </label>
                <Input
                  type="time"
                  value={form.heureFin}
                  // Si retour = aujourd'hui, on bloque les heures passées
                  min={
                    form.dateFin === today ? getCurrentTimeString() : undefined
                  }
                  onChange={(e) => set("heureFin", e.target.value)}
                  className={errors.heureFin ? "border-destructive" : ""}
                />
                {errors.heureFin && (
                  <p className="text-xs text-destructive">{errors.heureFin}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">
                Ville <span className="text-primary">*</span>
              </label>
              <select
                value={form.ville}
                onChange={(e) => set("ville", e.target.value)}
                className={inputClass("ville")}
              >
                <option value="">Sélectionner une ville</option>
                {villes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.ville && (
                <p className="text-xs text-destructive">{errors.ville}</p>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          {isAuthenticated ? (
            <div className="p-3 rounded-xl bg-muted/40 text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4 flex-shrink-0" />
              Connecté en tant que {user?.prenom} {user?.nom} ({user?.email})
            </div>
          ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Vos informations
            </p>

            {type === "entreprise" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Nom entreprise <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={form.nomEntreprise}
                    onChange={(e) => set("nomEntreprise", e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className={errors.nomEntreprise ? "border-destructive" : ""}
                  />
                  {errors.nomEntreprise && (
                    <p className="text-xs text-destructive">
                      {errors.nomEntreprise}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    SIRET <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={form.siret}
                    onChange={(e) => set("siret", e.target.value)}
                    placeholder="XXX XXX XXX XXXXX"
                    className={errors.siret ? "border-destructive" : ""}
                  />
                  {errors.siret && (
                    <p className="text-xs text-destructive">{errors.siret}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium">
                Nom complet <span className="text-primary">*</span>
              </label>
              <Input
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                placeholder="Prénom Nom"
                className={errors.nom ? "border-destructive" : ""}
              />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Email <span className="text-primary">*</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="votre@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Téléphone <span className="text-primary">*</span>
                </label>
                <Input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  placeholder="06 XX XX XX XX"
                  className={errors.telephone ? "border-destructive" : ""}
                />
                {errors.telephone && (
                  <p className="text-xs text-destructive">{errors.telephone}</p>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Commentaire optionnel */}
          {vehiculeAdditionalFees.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Frais additionnels</p>
              {vehiculeAdditionalFees.map((fee) => {
                const feeAmount = Number(fee.amount) || 0;
                const checked = selectedAdditionalFeeLabels.includes(fee.label);

                return (
                  <label
                    key={fee.label}
                    className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <span>{fee.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground">+{feeAmount.toFixed(2)} EUR</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedAdditionalFeeLabels((prev) =>
                            event.target.checked
                              ? [...prev, fee.label]
                              : prev.filter((value) => value !== fee.label),
                          );
                        }}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium">
              Commentaire{" "}
              <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              value={form.commentaire}
              onChange={(e) => set("commentaire", e.target.value)}
              placeholder="Informations complémentaires, besoins spécifiques..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Envoi en cours..." : "Confirmer ma réservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
