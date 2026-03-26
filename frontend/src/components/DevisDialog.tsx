import { useState } from "react";
import { User, Building2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DevisType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [createdReference, setCreatedReference] = useState<string>("");

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    nombreVehicules: "1",
    nomEntreprise: "",
    siret: "",
    ville: "",
    dateDebut: "",
    heureDebut: "",
    dateFin: "",
    heureFin: "",
    typeVehicule: "",
    commentaire: "",
  });

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

    if (!form.typeVehicule)
      errs.typeVehicule = "Le type de véhicule est requis.";
    if (!form.nombreVehicules || parseInt(form.nombreVehicules) < 1)
      errs.nombreVehicules = "Minimum 1 véhicule.";

    if (type === "entreprise") {
      if (!form.nomEntreprise.trim())
        errs.nomEntreprise = "Le nom de l'entreprise est requis.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const createdQuote = await quotesService.create({
        requesterType: type === "entreprise" ? "ENTREPRISE" : "PARTICULIER",
        requesterName: form.nom,
        requesterEmail: form.email,
        requesterPhone: form.telephone,
        companyName: type === "entreprise" ? form.nomEntreprise : undefined,
        companySiret: type === "entreprise" ? form.siret : undefined,
        pickupCity: form.ville,
        requestedVehicleType: form.typeVehicule,
        requestedQuantity: Number(form.nombreVehicules),
        startAt: new Date(`${form.dateDebut}T${form.heureDebut}:00`).toISOString(),
        endAt: new Date(`${form.dateFin}T${form.heureFin}:00`).toISOString(),
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
      nombreVehicules: "1",
      nomEntreprise: "",
      siret: "",
      ville: "",
      dateDebut: "",
      heureDebut: "",
      dateFin: "",
      heureFin: "",
      typeVehicule: "",
      commentaire: "",
    });
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
                      <p className="text-xs text-destructive">
                        {errors.dateDebut}
                      </p>
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
                      <p className="text-xs text-destructive">
                        {errors.dateFin}
                      </p>
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
                        form.dateFin === today
                          ? getCurrentTimeString()
                          : undefined
                      }
                      onChange={(e) => set("heureFin", e.target.value)}
                      className={errors.heureFin ? "border-destructive" : ""}
                    />
                    {errors.heureFin && (
                      <p className="text-xs text-destructive">
                        {errors.heureFin}
                      </p>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Type de véhicule <span className="text-primary">*</span>
                    </label>
                    <select
                      value={form.typeVehicule}
                      onChange={(e) => set("typeVehicule", e.target.value)}
                      className={inputClass("typeVehicule")}
                    >
                      <option value="">Sélectionner</option>
                      {vehicleTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.typeVehicule && (
                      <p className="text-xs text-destructive">
                        {errors.typeVehicule}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Nombre de véhicules{" "}
                      <span className="text-primary">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.nombreVehicules}
                      onChange={(e) => set("nombreVehicules", e.target.value)}
                      className={
                        errors.nombreVehicules ? "border-destructive" : ""
                      }
                    />
                    {errors.nombreVehicules && (
                      <p className="text-xs text-destructive">
                        {errors.nombreVehicules}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations personnelles */}
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Envoi en cours..." : "Envoyer ma demande de devis"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
