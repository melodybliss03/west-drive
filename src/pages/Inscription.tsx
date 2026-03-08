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

type AccountType = "particulier" | "entreprise";

export default function Inscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [type, setType] = useState<AccountType>("particulier");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Compte créé avec succès !", description: "Bienvenue chez WEST DRIVE." });
      setLoading(false);
      navigate("/espace");
    }, 1200);
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-center mb-2">Créer un compte</h1>
          <p className="text-muted-foreground text-center mb-8">Rejoignez WEST DRIVE et réservez en quelques clics.</p>

          {/* Toggle */}
          <div className="flex bg-secondary rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setType("particulier")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "particulier" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <User className="h-4 w-4" />
              Particulier
            </button>
            <button
              type="button"
              onClick={() => setType("entreprise")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${type === "entreprise" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Building2 className="h-4 w-4" />
              Entreprise
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "entreprise" && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="raison" className="text-sm font-medium">Raison sociale</label>
                  <Input id="raison" required placeholder="Nom de l'entreprise" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="siret" className="text-sm font-medium">SIRET</label>
                  <Input id="siret" required placeholder="XXX XXX XXX XXXXX" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="prenom" className="text-sm font-medium">Prénom</label>
                <Input id="prenom" required placeholder="Prénom" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="nom" className="text-sm font-medium">Nom</label>
                <Input id="nom" required placeholder="Nom" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" required placeholder="votre@email.com" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="telephone" className="text-sm font-medium">Téléphone</label>
              <Input id="telephone" type="tel" required placeholder="06 XX XX XX XX" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link to="/connexion" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
