import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Devise = "FCFA" | "EUR";

const TAUX_CONVERSION = 655.957;
const FRAIS_CONVERSION = 0.0375;

// Pays utilisant le FCFA
const paysFCFA = [
  "Togo", "Bénin", "Côte d'Ivoire", "Sénégal", "Cameroun",
  "Gabon", "Mali", "Burkina Faso", "Niger", "Guinée", "Congo",
  "Tchad", "Centrafrique", "Guinée-Bissau", "Guinée équatoriale",
];

const tousLesPays = [
  "Togo", "Bénin", "Côte d'Ivoire", "Sénégal", "Cameroun",
  "Gabon", "Mali", "Burkina Faso", "Niger", "Guinée", "Congo",
  "Tchad", "Centrafrique", "Guinée-Bissau", "Guinée équatoriale",
  "France", "Belgique", "Suisse", "Canada", "Allemagne", "Espagne",
  "Italie", "Portugal", "Pays-Bas", "Luxembourg",
];

function getDeviseFromPays(pays: string): Devise {
  return paysFCFA.includes(pays) ? "FCFA" : "EUR";
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reservation = location.state as {
    vehiculeName: string;
    categorie: string;
    dateDebut: string;
    dateFin: string;
    prixJour: number;
    nbJours: number;
    total: number;
    reservationId: string;
    email: string;
    nom: string;
  } | null;

  const [codePromo, setCodePromo] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardForm, setCardForm] = useState({
    numero: "",
    expiration: "",
    cvc: "",
    pays: "Togo",
  });

  const [devise, setDevise] = useState<Devise>(() => getDeviseFromPays("Togo"));

  // Auto-switch devise when country changes
  useEffect(() => {
    setDevise(getDeviseFromPays(cardForm.pays));
  }, [cardForm.pays]);

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Aucune réservation en cours.</p>
          <Button onClick={() => navigate("/vehicules")}>Voir les véhicules</Button>
        </div>
      </div>
    );
  }

  const totalEUR = reservation.total;
  const prixJourEUR = reservation.prixJour;
  const totalFCFA = Math.round(totalEUR * TAUX_CONVERSION * (1 + FRAIS_CONVERSION));
  const prixJourFCFA = Math.round(prixJourEUR * TAUX_CONVERSION * (1 + FRAIS_CONVERSION));

  const montantAffiche = devise === "FCFA" ? totalFCFA.toLocaleString("fr-FR") + " FCFA" : totalEUR.toFixed(2) + " €";
  const prixJourAffiche = devise === "FCFA" ? prixJourFCFA.toLocaleString("fr-FR") + " FCFA" : prixJourEUR.toFixed(2) + " €";

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + " / " + v.slice(2);
    return v;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast({ title: "Paiement effectué !", description: "Votre réservation est confirmée." });
    }, 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Paiement confirmé !</h1>
          <p className="text-muted-foreground">
            Votre réservation <span className="font-semibold">{reservation.reservationId}</span> a été confirmée.
            Un email de confirmation a été envoyé à <span className="font-semibold">{reservation.email}</span>.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* LEFT — Order Summary */}
        <div className="bg-secondary/50 p-8 lg:p-12 flex flex-col">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>West Drive</span>
          </button>

          {/* Vehicle info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">{reservation.vehiculeName}</h2>
            <p className="text-sm text-muted-foreground">
              Catégorie : {reservation.categorie} · {prixJourAffiche}/jour · {reservation.nbJours} jour{reservation.nbJours > 1 ? "s" : ""}
            </p>
          </div>

          {/* Currency auto-info */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-medium border bg-primary text-primary-foreground border-primary`}>
                {devise === "FCFA"
                  ? totalFCFA.toLocaleString("fr-FR") + " FCFA"
                  : totalEUR.toFixed(2) + " €"}
              </span>
              <span className="text-xs text-muted-foreground">
                Devise basée sur : <span className="font-medium text-foreground">{cardForm.pays}</span>
              </span>
            </div>
            {devise === "FCFA" && (
              <p className="text-xs text-muted-foreground mt-2">
                1 EUR = {TAUX_CONVERSION.toFixed(4)} XOF{" "}
                <span className="text-primary/80">(frais de conversion de {(FRAIS_CONVERSION * 100).toFixed(2)} % inclus)</span>
              </p>
            )}
          </div>

          {/* Line items */}
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">
                  Location — {reservation.vehiculeName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Réf. {reservation.reservationId} — Du {new Date(reservation.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(reservation.dateFin).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prixJourAffiche} × {reservation.nbJours} jour{reservation.nbJours > 1 ? "s" : ""}
                </p>
              </div>
              <p className="font-medium text-foreground whitespace-nowrap">{montantAffiche}</p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="text-foreground">{montantAffiche}</span>
              </div>
            </div>

            {/* Promo code */}
            <div>
              {!showPromo ? (
                <button
                  onClick={() => setShowPromo(true)}
                  className="text-sm border border-border rounded-md px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                >
                  Ajouter un code promotionnel
                </button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={codePromo}
                    onChange={(e) => setCodePromo(e.target.value)}
                    placeholder="Code promo"
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowPromo(false)}>
                    Appliquer
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-foreground">Montant total dû</span>
                <span className="text-foreground">{montantAffiche}</span>
              </div>
            </div>

            {/* Client info summary */}
            <div className="border-t border-border pt-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</p>
              <p className="text-sm text-foreground">{reservation.nom}</p>
              <p className="text-sm text-muted-foreground">{reservation.email}</p>
            </div>
          </div>
        </div>

        {/* RIGHT — Payment Form */}
        <div className="p-8 lg:p-12 flex flex-col">
          {/* Link pay button */}
          <button className="w-full bg-[#00D66F] hover:bg-[#00C060] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mb-4">
            Payer avec <span className="font-bold tracking-tight">⚡ link</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground uppercase">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handlePay} className="space-y-5 flex-1">
            {/* Coordonnées (read-only, from reservation) */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Coordonnées</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
                  <Input
                    type="email"
                    value={reservation.email}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nom complet</label>
                  <Input
                    value={reservation.nom}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Moyen de paiement */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Moyen de paiement</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Card tab */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Carte</span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Informations de la carte</label>
                    <Input
                      value={cardForm.numero}
                      onChange={(e) => setCardForm({ ...cardForm, numero: formatCardNumber(e.target.value) })}
                      placeholder="1234 1234 1234 1234"
                      className="font-mono"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={cardForm.expiration}
                      onChange={(e) => setCardForm({ ...cardForm, expiration: formatExpiry(e.target.value) })}
                      placeholder="MM / AA"
                      className="font-mono"
                      maxLength={7}
                      required
                    />
                    <Input
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="CVC"
                      className="font-mono"
                      maxLength={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Pays ou région</label>
                    <select
                      value={cardForm.pays}
                      onChange={(e) => setCardForm({ ...cardForm, pays: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {tousLesPays.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Save info */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Enregistrer mes informations pour régler plus rapidement
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Payez en toute sécurité chez West Drive et partout où Link est accepté.
                </p>
              </div>
            </label>

            {/* Pay button */}
            <Button
              type="submit"
              className="w-full py-6 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Traitement...
                </span>
              ) : (
                `Payer ${montantAffiche}`
              )}
            </Button>

            {/* Footer */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
              <Lock className="h-3 w-3" />
              <span>Propulsé par <span className="font-semibold">stripe</span></span>
              <span className="mx-2">|</span>
              <a href="#" className="hover:underline">Conditions d'utilisation</a>
              <span className="mx-1">·</span>
              <a href="#" className="hover:underline">Confidentialité</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
