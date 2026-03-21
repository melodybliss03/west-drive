import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

type AccountType = "particulier" | "entreprise";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
};

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  required = true,
  type,
  placeholder,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label} {required && <span className="text-primary">*</span>}</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-destructive" : ""}
        type={type}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function Inscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [type, setType] = useState<AccountType>("particulier");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", telephone: "", password: "",
    raison: "", siret: "",
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
    if (!form.password.trim()) errs.password = "Le mot de passe est requis.";
    else if (form.password.length < 8) errs.password = "Minimum 8 caractères.";
    if (type === "entreprise") {
      if (!form.raison.trim()) errs.raison = "La raison sociale est requise.";
      if (!form.siret.trim()) errs.siret = "Le SIRET est requis.";
      else if (form.siret.replace(/\s/g, "").length !== 14) errs.siret = "Le SIRET doit contenir 14 chiffres.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await authService.register({
        accountType: type === "entreprise" ? "ENTREPRISE" : "PARTICULIER",
        email: form.email,
        password: form.password,
        firstName: form.prenom,
        lastName: form.nom,
        phone: form.telephone,
        companyName: type === "entreprise" ? form.raison : undefined,
        siret: type === "entreprise" ? form.siret.replace(/\s/g, "") : undefined,
        contactName: type === "entreprise" ? `${form.prenom} ${form.nom}` : undefined,
        contactEmail: type === "entreprise" ? form.email : undefined,
        contactPhone: type === "entreprise" ? form.telephone : undefined,
      });

      toast({ title: "Code OTP envoyé", description: "Vérifiez votre email pour finaliser l'inscription." });
      navigate(`/inscription/confirmation?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : "Inscription impossible pour le moment.";
      toast({ title: "Erreur d'inscription", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-center mb-2">Créer un compte</h1>
          <p className="text-muted-foreground text-center mb-8">Rejoignez WEST DRIVE et réservez en quelques clics.</p>

          <div className="flex bg-secondary rounded-xl p-1 mb-8">
            <button type="button" onClick={() => setType("particulier")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "particulier" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <User className="h-4 w-4" /> Particulier
            </button>
            <button type="button" onClick={() => setType("entreprise")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "entreprise" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <Building2 className="h-4 w-4" /> Entreprise
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {type === "entreprise" && (
              <>
                <FormField id="raison" label="Raison sociale" value={form.raison} onChange={(value) => set("raison", value)} error={errors.raison} placeholder="Nom de l'entreprise" />
                <FormField id="siret" label="SIRET" value={form.siret} onChange={(value) => set("siret", value)} error={errors.siret} placeholder="XXX XXX XXX XXXXX" />
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField id="prenom" label="Prénom" value={form.prenom} onChange={(value) => set("prenom", value)} error={errors.prenom} placeholder="Prénom" />
              <FormField id="nom" label="Nom" value={form.nom} onChange={(value) => set("nom", value)} error={errors.nom} placeholder="Nom" />
            </div>

            <FormField id="email" label="Email" value={form.email} onChange={(value) => set("email", value)} error={errors.email} type="email" placeholder="votre@email.com" />
            <FormField id="telephone" label="Téléphone" value={form.telephone} onChange={(value) => set("telephone", value)} error={errors.telephone} type="tel" placeholder="06 XX XX XX XX" />

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe <span className="text-primary">*</span></label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 caractères"
                  value={form.password} onChange={e => set("password", e.target.value)}
                  className={errors.password ? "border-destructive" : ""} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link to="/connexion" className="text-primary font-medium hover:underline">Se connecter</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
