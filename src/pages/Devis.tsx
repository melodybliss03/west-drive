import { useState } from "react";
import { User, Building2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

type DevisType = "particulier" | "entreprise";

const vehicleTypes = ["Micro", "Compacte", "Berline", "SUV"];

export default function Devis() {
  const { toast } = useToast();
  const [type, setType] = useState<DevisType>("particulier");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", telephone: "",
    raison: "", siret: "",
    villeDepart: "", dateDebut: "", dateFin: "",
    typeVehicule: "", message: "",
  });

  const set = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.prenom.trim()) errs.prenom = "Le prénom est requis.";
    if (!form.nom.trim()) errs.nom = "Le nom est requis.";
    if (!form.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide.";
    if (!form.telephone.trim()) errs.telephone = "Le téléphone est requis.";
    if (!form.villeDepart.trim()) errs.villeDepart = "La ville est requise.";
    if (!form.dateDebut) errs.dateDebut = "La date de début est requise.";
    if (!form.dateFin) errs.dateFin = "La date de fin est requise.";
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut) errs.dateFin = "La date de fin doit être après la date de début.";
    if (!form.typeVehicule) errs.typeVehicule = "Le type de véhicule est requis.";
    if (type === "entreprise") {
      if (!form.raison.trim()) errs.raison = "La raison sociale est requise.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast({ title: "Demande envoyée !", description: "Nous reviendrons vers vous sous 24h." });
    }, 1500);
  };

  const Field = ({ id, label, required = true, children, ...props }: any) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label} {required && <span className="text-primary">*</span>}</label>
      {children || (
        <Input id={id} value={form[id as keyof typeof form]} onChange={(e: any) => set(id, e.target.value)}
          className={errors[id] ? "border-destructive" : ""} {...props} />
      )}
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <Header />
        <main className="pt-40 pb-16">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-3">Demande envoyée !</h1>
            <p className="text-muted-foreground mb-6">Notre équipe vous contactera sous 24h avec un devis personnalisé.</p>
            <Button onClick={() => { setSuccess(false); setForm({ prenom: "", nom: "", email: "", telephone: "", raison: "", siret: "", villeDepart: "", dateDebut: "", dateFin: "", typeVehicule: "", message: "" }); }}>
              Nouvelle demande
            </Button>
          </div>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-center mb-2">Demander un devis</h1>
          <p className="text-muted-foreground text-center mb-8">Recevez une offre personnalisée sous 24h.</p>

          <div className="flex bg-secondary rounded-xl p-1 mb-8 max-w-sm mx-auto">
            <button type="button" onClick={() => setType("particulier")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "particulier" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <User className="h-4 w-4" /> Particulier
            </button>
            <button type="button" onClick={() => setType("entreprise")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "entreprise" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <Building2 className="h-4 w-4" /> Entreprise
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Infos personnelles */}
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Vos informations</h2>
              <div className="space-y-4">
                {type === "entreprise" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="raison" label="Raison sociale" placeholder="Nom de l'entreprise" />
                    <Field id="siret" label="SIRET" placeholder="XXX XXX XXX XXXXX" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field id="prenom" label="Prénom" placeholder="Prénom" />
                  <Field id="nom" label="Nom" placeholder="Nom" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="email" label="Email" type="email" placeholder="votre@email.com" />
                  <Field id="telephone" label="Téléphone" type="tel" placeholder="06 XX XX XX XX" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Détails de la location</h2>
              <div className="space-y-4">
                <Field id="villeDepart" label="Ville de prise en charge" placeholder="Ex: Puteaux, La Défense..." />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="dateDebut" label="Date de début" type="date" />
                  <Field id="dateFin" label="Date de fin" type="date" />
                </div>
                <Field id="typeVehicule" label="Type de véhicule">
                  <select id="typeVehicule" value={form.typeVehicule} onChange={e => set("typeVehicule", e.target.value)}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.typeVehicule ? "border-destructive" : "border-input"}`}>
                    <option value="">Sélectionner un type</option>
                    {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium">Message complémentaire</label>
              <Textarea id="message" rows={4} placeholder="Précisez vos besoins (nombre de véhicules, options, etc.)"
                value={form.message} onChange={e => set("message", e.target.value)} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer ma demande de devis"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
