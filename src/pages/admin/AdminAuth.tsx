import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye as EyeIcon, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AdminAuth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ nomComplet: "", email: "", password: "" });
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = (score: number) => {
    if (score <= 1) return { text: "Très faible", color: "bg-destructive" };
    if (score === 2) return { text: "Faible", color: "bg-amber-500" };
    if (score === 3) return { text: "Moyen", color: "bg-amber-400" };
    if (score === 4) return { text: "Fort", color: "bg-emerald-400" };
    return { text: "Très fort", color: "bg-emerald-500" };
  };

  const validateAuth = () => {
    const errs: Record<string, string> = {};
    if (authMode === "register" && !authForm.nomComplet.trim()) errs.nomComplet = "Le nom complet est requis.";
    if (!authForm.email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) errs.email = "Email invalide.";
    if (!authForm.password.trim()) errs.password = "Le mot de passe est requis.";
    else if (authMode === "register") {
      if (authForm.password.length < 12) errs.password = "Minimum 12 caractères.";
      else if (!/[A-Z]/.test(authForm.password)) errs.password = "Au moins une majuscule requise.";
      else if (!/[a-z]/.test(authForm.password)) errs.password = "Au moins une minuscule requise.";
      else if (!/[0-9]/.test(authForm.password)) errs.password = "Au moins un chiffre requis.";
      else if (!/[^A-Za-z0-9]/.test(authForm.password)) errs.password = "Au moins un caractère spécial requis (!@#$%...).";
    } else if (authForm.password.length < 6) errs.password = "Minimum 6 caractères.";
    setAuthErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAuth()) return;
    setAuthLoading(true);
    setTimeout(() => {
      const parts = authForm.nomComplet.trim().split(" ");
      const prenom = parts[0] || "Admin";
      const nom = parts.slice(1).join(" ") || "WEST DRIVE";
      login({ nom, prenom, email: authForm.email });
      toast({ title: authMode === "register" ? "Compte admin créé !" : "Connexion réussie", description: "Bienvenue dans l'espace administration." });
      setAuthLoading(false);
    }, 1000);
  };

  const strength = passwordStrength(authForm.password);
  const sLabel = strengthLabel(strength);

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
            {authMode === "login" ? "Se connecter" : "Créer un compte admin"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {authMode === "login" ? "Accédez au tableau de bord." : "Mot de passe ultra-sécurisé requis."}
          </p>
          <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
            {authMode === "register" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nom complet <span className="text-primary">*</span></label>
                <Input placeholder="Jean Dupont" value={authForm.nomComplet} onChange={e => { setAuthForm(p => ({ ...p, nomComplet: e.target.value })); setAuthErrors(p => ({ ...p, nomComplet: "" })); }} className={authErrors.nomComplet ? "border-destructive" : ""} />
                {authErrors.nomComplet && <p className="text-xs text-destructive">{authErrors.nomComplet}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email <span className="text-primary">*</span></label>
              <Input type="email" placeholder="admin@westdrive.fr" value={authForm.email} onChange={e => { setAuthForm(p => ({ ...p, email: e.target.value })); setAuthErrors(p => ({ ...p, email: "" })); }} className={authErrors.email ? "border-destructive" : ""} />
              {authErrors.email && <p className="text-xs text-destructive">{authErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mot de passe <span className="text-primary">*</span></label>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} placeholder={authMode === "register" ? "Min. 12 car., majuscule, chiffre, spécial" : "Votre mot de passe"} value={authForm.password} onChange={e => { setAuthForm(p => ({ ...p, password: e.target.value })); setAuthErrors(p => ({ ...p, password: "" })); }} className={authErrors.password ? "border-destructive" : ""} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {authErrors.password && <p className="text-xs text-destructive">{authErrors.password}</p>}
              {authMode === "register" && authForm.password.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? sLabel.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Force : <span className="font-medium">{sLabel.text}</span></p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li className={authForm.password.length >= 12 ? "text-emerald-600" : ""}>Min. 12 caractères</li>
                    <li className={/[A-Z]/.test(authForm.password) ? "text-emerald-600" : ""}>Une majuscule</li>
                    <li className={/[a-z]/.test(authForm.password) ? "text-emerald-600" : ""}>Une minuscule</li>
                    <li className={/[0-9]/.test(authForm.password) ? "text-emerald-600" : ""}>Un chiffre</li>
                    <li className={/[^A-Za-z0-9]/.test(authForm.password) ? "text-emerald-600" : ""}>Un caractère spécial</li>
                  </ul>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
              {authLoading ? "Chargement..." : authMode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
          </form>
          {authMode === "login" && (
            <div className="text-center mt-3">
              <button onClick={() => navigate("/boss/mot-de-passe-oublie")} className="text-xs text-primary hover:underline">Mot de passe oublié ?</button>
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            {authMode === "login" ? (
              <>Pas encore de compte admin ? <button onClick={() => setAuthMode("register")} className="text-primary font-medium hover:underline">Créer un compte</button></>
            ) : (
              <>Déjà un compte ? <button onClick={() => setAuthMode("login")} className="text-primary font-medium hover:underline">Se connecter</button></>
            )}
          </p>
          <div className="text-center mt-4">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Retour au site</button>
          </div>
        </div>
      </div>
    </div>
  );
}
