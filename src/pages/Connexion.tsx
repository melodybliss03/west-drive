import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

export default function Connexion() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Connexion réussie", description: "Bienvenue sur votre espace." });
      setLoading(false);
      navigate("/espace");
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-center mb-2">Se connecter</h1>
          <p className="text-muted-foreground text-center mb-8">Accédez à votre espace WEST DRIVE.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" required placeholder="votre@email.com" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right">
                <a href="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</a>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="text-primary font-medium hover:underline">
                Créer un compte
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
