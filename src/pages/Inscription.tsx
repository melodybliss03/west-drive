import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

type AccountType = "particulier" | "entreprise";

export default function Inscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      login({ nom: form.nom, prenom: form.prenom, email: form.email });
      toast({ title: "Compte créé avec succès !", description: "Bienvenue chez WEST DRIVE." });
      setLoading(false);
      navigate("/espace");
    }, 1200);
  };

  const Field = ({ id, label, required = true, ...props }: any) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label} {required && <span className="text-primary">*</span>}</label>
      <Input id={id} value={form[id as keyof typeof form]} onChange={(e: any) => set(id, e.target.value)} className={errors[id] ? "border-destructive" : ""} {...props} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

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
                <Field id="raison" label="Raison sociale" placeholder="Nom de l'entreprise" />
                <Field id="siret" label="SIRET" placeholder="XXX XXX XXX XXXXX" />
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field id="prenom" label="Prénom" placeholder="Prénom" />
              <Field id="nom" label="Nom" placeholder="Nom" />
            </div>

            <Field id="email" label="Email" type="email" placeholder="votre@email.com" />
            <Field id="telephone" label="Téléphone" type="tel" placeholder="06 XX XX XX XX" />

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
