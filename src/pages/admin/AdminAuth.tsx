import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye as EyeIcon, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiHttpError } from "@/lib/api/types";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) return error.message;
  if (error instanceof Error) return error.message;
  return "Authentification impossible pour le moment.";
}

export default function AdminAuth() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const { toast } = useToast();
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validateAuth = () => {
    const errs: Record<string, string> = {};
    if (!authForm.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) errs.email = "Email invalide.";
    if (!authForm.password.trim()) errs.password = "Le mot de passe est requis.";
    else if (authForm.password.length < 6) errs.password = "Minimum 6 caractères.";
    setAuthErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuth()) return;
    setAuthLoading(true);

    try {
      await loginWithCredentials(authForm.email, authForm.password);
      toast({ title: "Connexion réussie", description: "Bienvenue dans l'espace administration." });

      // Admin registration disabled by product decision.
      // If future requirements change, previous branch can be restored from git history.
      // const parts = authForm.nomComplet.trim().split(" ");
      // const prenom = parts[0] || "Admin";
      // const nom = parts.slice(1).join(" ") || "WEST DRIVE";
      // await authService.register({
      //   accountType: "PARTICULIER",
      //   email: authForm.email,
      //   password: authForm.password,
      //   firstName: prenom,
      //   lastName: nom,
      //   phone: "+33000000000",
      // });
    } catch (error) {
      const message = getErrorMessage(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-primary-foreground">
            WEST <span className="text-primary">DRIVE</span>
          </h1>
          <p className="text-primary-foreground/50 text-sm mt-1">Administration</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <h2 className="font-display text-xl font-bold text-center mb-1">
            Se connecter
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Accédez au tableau de bord.
          </p>
          <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email <span className="text-primary">*</span></label>
              <Input type="email" placeholder="admin@westdrive.fr" value={authForm.email} onChange={e => { setAuthForm(p => ({ ...p, email: e.target.value })); setAuthErrors(p => ({ ...p, email: "" })); }} className={authErrors.email ? "border-destructive" : ""} />
              {authErrors.email && <p className="text-xs text-destructive">{authErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mot de passe <span className="text-primary">*</span></label>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} placeholder="Votre mot de passe" value={authForm.password} onChange={e => { setAuthForm(p => ({ ...p, password: e.target.value })); setAuthErrors(p => ({ ...p, password: "" })); }} className={authErrors.password ? "border-destructive" : ""} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {authErrors.password && <p className="text-xs text-destructive">{authErrors.password}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
              {authLoading ? "Chargement..." : "Se connecter"}
            </Button>
          </form>
          <div className="text-center mt-3">
            <button onClick={() => navigate("/boss/mot-de-passe-oublie")} className="text-xs text-primary hover:underline">Mot de passe oublié ?</button>
          </div>
          <div className="text-center mt-4">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Retour au site</button>
          </div>
        </div>
      </div>
    </div>
  );
}
