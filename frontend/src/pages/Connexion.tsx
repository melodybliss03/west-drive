import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { ApiHttpError } from "@/lib/api/types";
import { isBackofficeUser } from "@/lib/auth/roles";

export default function Connexion() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide.";
    if (!password.trim()) errs.password = "Le mot de passe est requis.";
    else if (password.length < 6) errs.password = "Minimum 6 caractères.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const authenticatedUser = await loginWithCredentials(email, password);
      const targetRoute = isBackofficeUser(authenticatedUser) ? "/boss" : "/espace";
      const welcomeMessage = targetRoute === "/boss"
        ? "Bienvenue dans l'espace administration."
        : "Bienvenue sur votre espace.";

      toast({ title: "Connexion réussie", description: welcomeMessage });
      navigate(targetRoute, { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : "Impossible de se connecter pour le moment.";
      toast({
        title: "Échec de connexion",
        description: message,
        variant: "destructive",
      });
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
          <h1 className="font-display text-3xl font-bold text-center mb-2">Se connecter</h1>
          <p className="text-muted-foreground text-center mb-8">Accédez à votre espace WEST DRIVE.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email <span className="text-primary">*</span></label>
              <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe <span className="text-primary">*</span></label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                  className={errors.password ? "border-destructive" : ""}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              <div className="text-right">
                <Link to="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Spinner className="mr-2" />Connexion...</> : "Se connecter"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="text-primary font-medium hover:underline">Créer un compte</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
