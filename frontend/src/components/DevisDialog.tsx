import { useState, useEffect } from "react";
import { User, Building2, Send, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { quotesService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DevisType = "particulier" | "entreprise";

type VehicleSlot = {
  typeVehicule: string;
  dateDebut: string;
  heureDebut: string;
  dateFin: string;
  heureFin: string;
};

function emptySlot(): VehicleSlot {
  return { typeVehicule: "", dateDebut: "", heureDebut: "", dateFin: "", heureFin: "" };
}

const vehicleTypes = ["Micro", "Compacte", "Berline", "SUV"];
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

interface DevisDialogProps {
  children: React.ReactNode;
  defaultType?: DevisType;
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
  if (dateStr !== getTodayString()) return false; // autre jour → pas de contrainte horaire
  return timeStr < getCurrentTimeString();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DevisDialog({
  children,
  defaultType = "particulier",
}: DevisDialogProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const CLIENT_ROLE_NAMES_DEVIS = new Set(["client", "customer", "particulier"]);
  const isStaffOrAdmin =
    isAuthenticated &&
    user !== null &&
    (
      (user.role != null && user.role.trim() !== "" && !CLIENT_ROLE_NAMES_DEVIS.has(user.role.toLowerCase())) ||
      user.roles.some((r) => typeof r === "string" && r.trim() !== "" && !CLIENT_ROLE_NAMES_DEVIS.has(r.toLowerCase()))
    );
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DevisType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slotErrors, setSlotErrors] = useState<Record<string, string>[]>([{}]);
  const [success, setSuccess] = useState(false);
  const [createdReference, setCreatedReference] = useState<string>("");

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    nomEntreprise: "",
    siret: "",
    ville: "",
    commentaire: "",
  });

  const [vehicleSlots, setVehicleSlots] = useState<VehicleSlot[]>([emptySlot()]);

  const set = (key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const setSlot = (index: number, key: keyof VehicleSlot, val: string) => {
    setVehicleSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [key]: val } : s)));
    setSlotErrors((prev) => prev.map((e, i) => (i === index ? { ...e, [key]: "" } : e)));
  };

  const addSlot = () => {
    setVehicleSlots((prev) => [...prev, emptySlot()]);
    setSlotErrors((prev) => [...prev, {}]);
  };

  const removeSlot = (index: number) => {
    setVehicleSlots((prev) => prev.filter((_, i) => i !== index));
    setSlotErrors((prev) => prev.filter((_, i) => i !== index));
  };

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

  // ─── Validation avec contrôles de date/heure ────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};

    // Personal info is pre-filled from auth context for logged-in users;
    // skip validation since the fields are hidden for them.
    if (!isAuthenticated) {
      if (!form.nom.trim()) errs.nom = "Le nom complet est requis.";
      if (!form.email.trim()) errs.email = "L'email est requis.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Email invalide.";
      if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    }
    if (!form.ville) errs.ville = "La ville est requise.";

    if (type === "entreprise") {
      if (!form.nomEntreprise.trim())
        errs.nomEntreprise = "Le nom de l'entreprise est requis.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
    }

    // Per-vehicle slots validation
    const newSlotErrors: Record<string, string>[] = vehicleSlots.map((s) => {
      const se: Record<string, string> = {};
      if (!s.typeVehicule) se.typeVehicule = "Le type de véhicule est requis.";

      if (!s.dateDebut) {
        se.dateDebut = "La date de prise est requise.";
      } else if (isDateInPast(s.dateDebut)) {
        se.dateDebut = "La date de prise ne peut pas être dans le passé.";
      }

      if (!s.heureDebut) {
        se.heureDebut = "L'heure de prise est requise.";
      } else if (isTimeInPast(s.dateDebut, s.heureDebut)) {
        se.heureDebut = "L'heure de prise ne peut pas être dans le passé.";
      }

      if (!s.dateFin) {
        se.dateFin = "La date de retour est requise.";
      } else if (isDateInPast(s.dateFin)) {
        se.dateFin = "La date de retour ne peut pas être dans le passé.";
      } else if (s.dateDebut && s.dateFin < s.dateDebut) {
        se.dateFin = "La date de retour doit être après la date de prise.";
      }

      if (!s.heureFin) {
        se.heureFin = "L'heure de retour est requise.";
      } else if (isTimeInPast(s.dateFin, s.heureFin)) {
        se.heureFin = "L'heure de retour ne peut pas être dans le passé.";
      } else if (
        s.dateDebut === s.dateFin &&
        s.heureDebut &&
        s.heureFin &&
        s.heureFin <= s.heureDebut
      ) {
        se.heureFin = "L'heure de retour doit être après l'heure de prise.";
      }

      return se;
    });

    setErrors(errs);
    setSlotErrors(newSlotErrors);

    const slotHasErrors = newSlotErrors.some((se) => Object.keys(se).length > 0);
    return Object.keys(errs).length === 0 && !slotHasErrors;
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaffOrAdmin) {
      toast({
        title: "Accès refusé",
        description: "Les comptes administrateurs et personnel ne peuvent pas effectuer de demandes de devis.",
        variant: "destructive",
      });
      return;
    }
    if (!validate()) return;
    setLoading(true);

    try {
      const vehiclesDetail = vehicleSlots.map((s) => ({
        vehicleType: s.typeVehicule,
        startAt: new Date(`${s.dateDebut}T${s.heureDebut}:00`).toISOString(),
        endAt: new Date(`${s.dateFin}T${s.heureFin}:00`).toISOString(),
      }));

      const allStartAts = vehiclesDetail.map((v) => new Date(v.startAt).getTime());
      const allEndAts = vehiclesDetail.map((v) => new Date(v.endAt).getTime());
      const globalStartAt = new Date(Math.min(...allStartAts)).toISOString();
      const globalEndAt = new Date(Math.max(...allEndAts)).toISOString();

      const uniqueTypes = [...new Set(vehicleSlots.map((s) => s.typeVehicule))];
      const requestedVehicleType = uniqueTypes.length === 1 ? uniqueTypes[0] : "MULTIPLE";

      const createdQuote = await quotesService.create({
        requesterType: type === "entreprise" ? "ENTREPRISE" : "PARTICULIER",
        requesterName: form.nom,
        requesterEmail: form.email,
        requesterPhone: form.telephone,
        companyName: type === "entreprise" ? form.nomEntreprise : undefined,
        companySiret: type === "entreprise" ? form.siret : undefined,
        pickupCity: form.ville,
        requestedVehicleType,
        requestedQuantity: vehicleSlots.length,
        startAt: globalStartAt,
        endAt: globalEndAt,
        vehiclesDetail,
        comment: form.commentaire || undefined,
      });

      setLoading(false);
      setSuccess(true);
      setCreatedReference(createdQuote.publicReference);
      toast({
        title: "Demande envoyée !",
        description: `Reference: ${createdQuote.publicReference}`,
      });
    } catch (error) {
      setLoading(false);
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible d'envoyer votre demande de devis.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const reset = () => {
    setSuccess(false);
    setCreatedReference("");
    setForm({
      nom: "",
      email: "",
      telephone: "",
      nomEntreprise: "",
      siret: "",
      ville: "",
      commentaire: "",
    });
    setVehicleSlots([emptySlot()]);
    setSlotErrors([{}]);
    setErrors({});
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      reset();
      setType(defaultType);
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
        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="font-display text-2xl font-bold mb-2">
              Demande envoyée !
            </DialogTitle>
            <p className="text-muted-foreground mb-6">
              Votre demande a bien ete enregistree.
            </p>
            {createdReference && (
              <p className="text-sm font-medium mb-6">Reference devis: {createdReference}</p>
            )}
            <Button onClick={reset}>Nouvelle demande</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">
                Demander un devis
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
              {/* Per-vehicle slots */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Véhicule(s) souhaité(s)
                </p>

                {vehicleSlots.map((slot, index) => {
                  const se = slotErrors[index] ?? {};
                  return (
                    <div key={index} className="space-y-3 p-4 rounded-xl border border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Véhicule {index + 1}
                        </p>
                        {vehicleSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            aria-label="Supprimer ce véhicule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Type de véhicule */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium">
                          Type de véhicule <span className="text-primary">*</span>
                        </label>
                        <select
                          value={slot.typeVehicule}
                          onChange={(e) => setSlot(index, "typeVehicule", e.target.value)}
                          className={inputClass(se.typeVehicule ? "slot_typeVehicule_err" : "")}
                          style={se.typeVehicule ? { borderColor: "hsl(var(--destructive))" } : undefined}
                        >
                          <option value="">Sélectionner</option>
                          {vehicleTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        {se.typeVehicule && (
                          <p className="text-xs text-destructive">{se.typeVehicule}</p>
                        )}
                      </div>

                      {/* Dates de prise */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">
                            Date de prise <span className="text-primary">*</span>
                          </label>
                          <Input
                            type="date"
                            value={slot.dateDebut}
                            min={today}
                            onChange={(e) => setSlot(index, "dateDebut", e.target.value)}
                            className={se.dateDebut ? "border-destructive" : ""}
                          />
                          {se.dateDebut && (
                            <p className="text-xs text-destructive">{se.dateDebut}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">
                            Heure de prise <span className="text-primary">*</span>
                          </label>
                          <Input
                            type="time"
                            value={slot.heureDebut}
                            min={slot.dateDebut === today ? getCurrentTimeString() : undefined}
                            onChange={(e) => setSlot(index, "heureDebut", e.target.value)}
                            className={se.heureDebut ? "border-destructive" : ""}
                          />
                          {se.heureDebut && (
                            <p className="text-xs text-destructive">{se.heureDebut}</p>
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
                            value={slot.dateFin}
                            min={slot.dateDebut || today}
                            onChange={(e) => setSlot(index, "dateFin", e.target.value)}
                            className={se.dateFin ? "border-destructive" : ""}
                          />
                          {se.dateFin && (
                            <p className="text-xs text-destructive">{se.dateFin}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">
                            Heure de retour <span className="text-primary">*</span>
                          </label>
                          <Input
                            type="time"
                            value={slot.heureFin}
                            min={slot.dateFin === today ? getCurrentTimeString() : undefined}
                            onChange={(e) => setSlot(index, "heureFin", e.target.value)}
                            className={se.heureFin ? "border-destructive" : ""}
                          />
                          {se.heureFin && (
                            <p className="text-xs text-destructive">{se.heureFin}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add vehicle button */}
                <button
                  type="button"
                  onClick={addSlot}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un véhicule
                </button>
              </div>

              {/* Ville */}
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Ville de prise en charge <span className="text-primary">*</span>
                </label>
                <select
                  value={form.ville}
                  onChange={(e) => set("ville", e.target.value)}
                  className={inputClass("ville")}
                >
                  <option value="">Sélectionner une ville</option>
                  {villes.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {errors.ville && (
                  <p className="text-xs text-destructive">{errors.ville}</p>
                )}
              </div>

              {/* Informations personnelles */}
              {!isAuthenticated && (
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
                        className={
                          errors.nomEntreprise ? "border-destructive" : ""
                        }
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
                        <p className="text-xs text-destructive">
                          {errors.siret}
                        </p>
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
                      <p className="text-xs text-destructive">
                        {errors.telephone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Commentaire optionnel */}
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

              {isStaffOrAdmin && (
                <p className="text-sm text-destructive text-center">
                  Les comptes administrateurs et personnel ne peuvent pas effectuer de demandes de devis.
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? <><Spinner className="mr-2" />Envoi en cours...</> : "Envoyer ma demande de devis"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
