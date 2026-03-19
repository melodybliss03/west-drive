import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Building2, Send } from "lucide-react";
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

type ClientType = "particulier" | "entreprise";

const villes = ["Puteaux", "La Défense", "Neuilly-sur-Seine", "Levallois-Perret", "Boulogne-Billancourt", "Courbevoie", "Nanterre", "Suresnes"];

interface ReservationDialogProps {
  children: React.ReactNode;
  vehiculeName?: string;
  vehiculeCategorie?: string;
  vehiculePrixJour?: number;
}

export default function ReservationDialog({ children, vehiculeName, vehiculeCategorie, vehiculePrixJour }: ReservationDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ClientType>("particulier");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nom: "", email: "", telephone: "",
    nomEntreprise: "", siret: "",
    ville: "", dateDebut: "", heureDebut: "", dateFin: "", heureFin: "",
  });

  const set = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nom.trim()) errs.nom = "Le nom complet est requis.";
    if (!form.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide.";
    if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    if (!form.ville) errs.ville = "La ville est requise.";
    if (!form.dateDebut) errs.dateDebut = "La date de prise est requise.";
    if (!form.heureDebut) errs.heureDebut = "L'heure de prise est requise.";
    if (!form.dateFin) errs.dateFin = "La date de retour est requise.";
    if (!form.heureFin) errs.heureFin = "L'heure de retour est requise.";
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut) errs.dateFin = "La date de retour doit être après la date de prise.";
    if (type === "entreprise") {
      if (!form.nomEntreprise.trim()) errs.nomEntreprise = "Le nom de l'entreprise est requis.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const dateDebut = new Date(form.dateDebut);
    const dateFin = new Date(form.dateFin);
    const nbJours = Math.max(1, Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)));
    const prixJour = vehiculePrixJour || 50;
    const total = nbJours * prixJour;
    const reservationId = `WD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      navigate("/checkout", {
        state: {
          vehiculeName: vehiculeName || "Véhicule",
          categorie: vehiculeCategorie || "COMPACTE",
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          prixJour,
          nbJours,
          total,
          reservationId,
          email: form.email,
          nom: form.nom,
        },
      });
    }, 500);
  };

  const reset = () => {
    setSuccess(false);
    setForm({ nom: "", email: "", telephone: "", nomEntreprise: "", siret: "", ville: "", dateDebut: "", heureDebut: "", dateFin: "", heureFin: "" });
    setErrors({});
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) { reset(); setType("particulier"); }
  };

  const inputClass = (key: string) =>
    `flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors[key] ? "border-destructive" : "border-input"}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="font-display text-2xl font-bold mb-2">Réservation envoyée !</DialogTitle>
            <p className="text-muted-foreground mb-6">Notre équipe vous confirmera sous 24h.</p>
            <Button onClick={reset}>Nouvelle réservation</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">
                Réserver{vehiculeName ? ` — ${vehiculeName}` : ""}
              </DialogTitle>
            </DialogHeader>

            {/* Toggle */}
            <div className="flex bg-secondary rounded-xl p-1 mb-4">
              <button type="button" onClick={() => setType("particulier")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === "particulier" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <User className="h-4 w-4" /> Particulier
              </button>
              <button type="button" onClick={() => setType("entreprise")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${type === "entreprise" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <Building2 className="h-4 w-4" /> Entreprise
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Location details */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Détails de la location</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date de prise <span className="text-primary">*</span></label>
                    <Input type="date" value={form.dateDebut} onChange={e => set("dateDebut", e.target.value)} className={errors.dateDebut ? "border-destructive" : ""} />
                    {errors.dateDebut && <p className="text-xs text-destructive">{errors.dateDebut}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Heure de prise <span className="text-primary">*</span></label>
                    <Input type="time" value={form.heureDebut} onChange={e => set("heureDebut", e.target.value)} className={errors.heureDebut ? "border-destructive" : ""} />
                    {errors.heureDebut && <p className="text-xs text-destructive">{errors.heureDebut}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date de retour <span className="text-primary">*</span></label>
                    <Input type="date" value={form.dateFin} onChange={e => set("dateFin", e.target.value)} className={errors.dateFin ? "border-destructive" : ""} />
                    {errors.dateFin && <p className="text-xs text-destructive">{errors.dateFin}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Heure de retour <span className="text-primary">*</span></label>
                    <Input type="time" value={form.heureFin} onChange={e => set("heureFin", e.target.value)} className={errors.heureFin ? "border-destructive" : ""} />
                    {errors.heureFin && <p className="text-xs text-destructive">{errors.heureFin}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Ville <span className="text-primary">*</span></label>
                  <select value={form.ville} onChange={e => set("ville", e.target.value)} className={inputClass("ville")}>
                    <option value="">Sélectionner une ville</option>
                    {villes.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {errors.ville && <p className="text-xs text-destructive">{errors.ville}</p>}
                </div>
              </div>

              {/* Personal info */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Vos informations</p>

                {type === "entreprise" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nom entreprise <span className="text-primary">*</span></label>
                      <Input value={form.nomEntreprise} onChange={e => set("nomEntreprise", e.target.value)} placeholder="Nom de l'entreprise" className={errors.nomEntreprise ? "border-destructive" : ""} />
                      {errors.nomEntreprise && <p className="text-xs text-destructive">{errors.nomEntreprise}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">SIRET <span className="text-primary">*</span></label>
                      <Input value={form.siret} onChange={e => set("siret", e.target.value)} placeholder="XXX XXX XXX XXXXX" className={errors.siret ? "border-destructive" : ""} />
                      {errors.siret && <p className="text-xs text-destructive">{errors.siret}</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium">Nom complet <span className="text-primary">*</span></label>
                  <Input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Prénom Nom" className={errors.nom ? "border-destructive" : ""} />
                  {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email <span className="text-primary">*</span></label>
                    <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="votre@email.com" className={errors.email ? "border-destructive" : ""} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Téléphone <span className="text-primary">*</span></label>
                    <Input type="tel" value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06 XX XX XX XX" className={errors.telephone ? "border-destructive" : ""} />
                    {errors.telephone && <p className="text-xs text-destructive">{errors.telephone}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Envoi en cours..." : "Confirmer ma réservation"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
