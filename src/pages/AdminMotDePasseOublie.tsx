import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "otp" | "password";

export default function AdminMotDePasseOublie() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Code envoyé", description: `Un code OTP a été envoyé à ${email}.` });
      setStep("otp");
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!otp.trim()) errs.otp = "Le code OTP est requis.";
    else if (otp.replace(/\s/g, "").length !== 6) errs.otp = "Le code doit contenir 6 chiffres.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Code vérifié", description: "Vous pouvez maintenant créer un nouveau mot de passe." });
      setStep("password");
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password.trim()) errs.password = "Le mot de passe est requis.";
    else if (password.length < 12) errs.password = "Minimum 12 caractères.";
    if (!confirmPassword.trim()) errs.confirmPassword = "La confirmation est requise.";
    else if (password !== confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter." });
      navigate("/boss");
    }, 1200);
  };

  const formatOtp = (value: string) => value.replace(/\D/g, "").slice(0, 6);

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
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["email", "otp", "password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  (["email", "otp", "password"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
                }`}>{i + 1}</div>
                {i < 2 && <div className={`w-6 h-0.5 ${["email", "otp", "password"].indexOf(step) > i ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold">Mot de passe oublié</h2>
                <p className="text-muted-foreground text-xs mt-1">Entrez votre email pour recevoir un code.</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email <span className="text-primary">*</span></label>
                  <Input type="email" placeholder="admin@westdrive.fr" value={email} onChange={e => { setEmail(e.target.value); setErrors({}); }} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Envoi..." : "Continuer"}
                </Button>
                <button type="button" onClick={() => navigate("/boss")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
                  <ArrowLeft className="h-4 w-4" /> Retour
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold">Vérification</h2>
                <p className="text-muted-foreground text-xs mt-1">Code envoyé à <span className="font-medium text-foreground">{email}</span></p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Code OTP <span className="text-primary">*</span></label>
                  <Input type="text" inputMode="numeric" placeholder="000000" value={otp} onChange={e => { setOtp(formatOtp(e.target.value)); setErrors({}); }} className={`text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? "border-destructive" : ""}`} maxLength={6} />
                  {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Vérification..." : "Continuer"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Pas reçu ? <button type="button" onClick={() => toast({ title: "Code renvoyé", description: `Nouveau code envoyé à ${email}.` })} className="text-primary font-medium hover:underline">Renvoyer</button>
                </p>
                <button type="button" onClick={() => setStep("email")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
                  <ArrowLeft className="h-4 w-4" /> Changer d'email
                </button>
              </form>
            </>
          )}

          {step === "password" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold">Nouveau mot de passe</h2>
                <p className="text-muted-foreground text-xs mt-1">Choisissez un mot de passe sécurisé.</p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nouveau mot de passe <span className="text-primary">*</span></label>
                  <Input type="password" placeholder="Min. 12 caractères" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }} className={errors.password ? "border-destructive" : ""} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirmer <span className="text-primary">*</span></label>
                  <Input type="password" placeholder="Confirmez le mot de passe" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }} className={errors.confirmPassword ? "border-destructive" : ""} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </form>
            </>
          )}

          <div className="text-center mt-4">
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Retour au site</button>
          </div>
        </div>
      </div>
    </div>
  );
}
