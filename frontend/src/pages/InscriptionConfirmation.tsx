import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { authService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

export default function InscriptionConfirmation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeAuthWithTokens } = useAuth();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const email = params.get("email") || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanedOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (!email) {
      setError("Email manquant. Veuillez recommencer l'inscription.");
      return;
    }

    if (cleanedOtp.length !== 6) {
      setError("Le code OTP doit contenir 6 chiffres.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const tokens = await authService.confirmRegister(email, cleanedOtp);
      await completeAuthWithTokens(tokens);
      toast({
        title: "Email confirmé",
        description: "Votre compte est activé.",
      });
      navigate("/espace");
    } catch (err) {
      const message = err instanceof ApiHttpError ? err.message : "Validation OTP impossible pour le moment.";
      setError(message);
      toast({ title: "Erreur", description: message, variant: "destructive" });
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
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Confirmer votre email</h1>
            <p className="text-muted-foreground text-sm">
              Saisissez le code OTP envoyé à <span className="font-medium text-foreground">{email || "votre adresse email"}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="otp" className="text-sm font-medium">Code OTP <span className="text-primary">*</span></label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                className={`text-center tracking-[0.3em] ${error ? "border-destructive" : ""}`}
                maxLength={6}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Validation..." : "Valider mon inscription"}
            </Button>

            <div className="text-center space-y-2">
              <Link to="/inscription" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Revenir à l'inscription
              </Link>
              <p className="text-xs text-muted-foreground">Pas de code ? Vérifiez vos spams ou recommencez l'inscription.</p>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
