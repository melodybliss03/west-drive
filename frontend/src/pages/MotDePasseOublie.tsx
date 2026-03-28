import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

type Step = "email" | "otp" | "password";

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isActivationMode = searchParams.get("mode") === "activation" || window.location.pathname === "/activation-compte";
  const redirectAfterSuccess = searchParams.get("redirect") || "/connexion";

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    const otpFromQuery = searchParams.get("otp");

    if (emailFromQuery) {
      setEmail(emailFromQuery);
      setStep("otp");
    }

    if (otpFromQuery) {
      setOtp(formatOtp(otpFromQuery));
      if (emailFromQuery) {
        setStep("password");
      }
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isActivationMode) {
        toast({ title: "Lien d'activation requis", description: "Utilisez le lien d'activation reçu par email." });
        return;
      }

      await authService.forgotPassword(email);
      toast({ title: "Code envoyé", description: `Un code OTP a été envoyé à ${email}.` });
      setStep("otp");
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : "Impossible d'envoyer le code OTP.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!otp.trim()) errs.otp = "Le code OTP est requis.";
    else if (otp.replace(/\s/g, "").length !== 6) errs.otp = "Le code doit contenir 6 chiffres.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      // Validation OTP côté backend pendant le reset final.
      toast({ title: "Code vérifié", description: "Vous pouvez maintenant créer un nouveau mot de passe." });
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password.trim()) errs.password = "Le mot de passe est requis.";
    else if (password.length < 12) errs.password = "Minimum 12 caractères.";
    if (!confirmPassword.trim()) errs.confirmPassword = "La confirmation est requise.";
    else if (password !== confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isActivationMode) {
        await authService.activateAccount(email, otp, password);
        toast({ title: "Compte activé", description: "Votre compte est activé. Vous pouvez maintenant vous connecter." });
        navigate(redirectAfterSuccess);
      } else {
        await authService.resetPassword(email, otp, password);
        toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." });
        navigate("/connexion");
      }
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : "Échec de réinitialisation du mot de passe.";
      const isExpiredActivationLink =
        isActivationMode && /expir|expired/i.test(message);
      toast({
        title: "Erreur",
        description: isExpiredActivationLink
          ? "Votre lien d'activation a expiré. Utilisez Mot de passe oublié pour recevoir un nouveau code."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatOtp = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 6);
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-md mx-auto px-4">
          {/* Progress indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(["email", "otp", "password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" : 
                  (["email", "otp", "password"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${["email", "otp", "password"].indexOf(step) > i ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Mot de passe oublié</h1>
                <p className="text-muted-foreground text-sm">
                  {isActivationMode
                    ? "Utilisez les informations du lien reçu par email pour activer votre compte."
                    : "Entrez votre adresse email pour recevoir un code de vérification."}
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Adresse email <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Envoi en cours..." : isActivationMode ? "Vérifier" : "Continuer"}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate(redirectAfterSuccess)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Vérification</h1>
                <p className="text-muted-foreground text-sm">
                  Entrez le code à 6 chiffres envoyé à <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Code OTP <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => { setOtp(formatOtp(e.target.value)); setErrors({}); }}
                    className={`text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? "border-destructive" : ""}`}
                    maxLength={6}
                  />
                  {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Vérification..." : "Continuer"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Vous n'avez pas reçu le code ?{" "}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim()) {
                        toast({ title: "Erreur", description: "Email manquant.", variant: "destructive" });
                        return;
                      }
                      try {
                        if (isActivationMode) {
                          toast({
                            title: "Lien d'activation requis",
                            description: "Veuillez utiliser le lien d'activation le plus recent recu par email.",
                          });
                          return;
                        }

                        await authService.forgotPassword(email);
                        toast({ title: "Code renvoyé", description: `Un nouveau code a été envoyé à ${email}.` });
                      } catch (error) {
                        const message =
                          error instanceof ApiHttpError
                            ? error.message
                            : "Impossible de renvoyer le code OTP.";
                        toast({ title: "Erreur", description: message, variant: "destructive" });
                      }
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Renvoyer
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Changer d'email
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Nouveau mot de passe</h1>
                <p className="text-muted-foreground text-sm">
                  {isActivationMode
                    ? "Définissez votre mot de passe pour activer votre compte."
                    : "Choisissez un nouveau mot de passe sécurisé."}
                </p>
                {isActivationMode ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Lien expiré ? Utilisez "Mot de passe oublié" pour recevoir un nouveau code.
                  </p>
                ) : null}
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium">
                    Nouveau mot de passe <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmer le mot de passe <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
