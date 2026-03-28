import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { quotesService, reservationsService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

type PaymentFlow = "reservation" | "quote";

type ReservationState = {
  vehiculeName: string;
  categorie: string;
  dateDebut: string;
  dateFin: string;
  prixJour: number;
  nbJours: number;
  total: number;
  reservationId: string;
  reservationBackendId: string;
  email: string;
  nom: string;
  caution?: number;
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const reservation = location.state as ReservationState | null;

  const flow = (searchParams.get("flow") as PaymentFlow | null) ?? "reservation";
  const reservationIdFromQuery = searchParams.get("reservationId");
  const quoteIdFromQuery = searchParams.get("quoteId");
  const sessionId = searchParams.get("session_id");
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const paymentSuccess = searchParams.get("payment") === "success";

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    let ignore = false;

    const confirmStripePayment = async () => {
      setConfirming(true);
      try {
        if (flow === "quote" && quoteIdFromQuery) {
          await quotesService.confirmPayment(quoteIdFromQuery, sessionId);
          if (!ignore) {
            setSuccess(true);
            toast({ title: "Paiement confirmé", description: "Votre devis a bien été réglé." });
          }
          return;
        }

        const reservationId = reservation?.reservationBackendId ?? reservationIdFromQuery;
        if (!reservationId) {
          throw new Error("reservation_missing");
        }

        await reservationsService.confirmPayment(reservationId, sessionId);
        if (!ignore) {
          setSuccess(true);
          toast({ title: "Paiement confirmé", description: "Votre réservation est confirmée." });
        }
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof ApiHttpError
            ? error.message
            : "Impossible de confirmer le paiement automatiquement.";
        toast({ title: "Erreur", description: message, variant: "destructive" });
      } finally {
        if (!ignore) {
          setConfirming(false);
        }
      }
    };

    confirmStripePayment();

    return () => {
      ignore = true;
    };
  }, [flow, quoteIdFromQuery, reservation, reservationIdFromQuery, sessionId, toast]);

  useEffect(() => {
    if (sessionId || !paymentSuccess) return;

    setSuccess(true);
    toast({
      title: "Paiement termine",
      description:
        flow === "quote"
          ? "Votre paiement devis a ete recu. La conversion en reservation suivra cote admin."
          : "Votre paiement reservation a ete recu.",
    });
  }, [flow, paymentSuccess, sessionId, toast]);

  const effectiveReservationId = reservation?.reservationBackendId ?? reservationIdFromQuery;

  const canStartPayment = useMemo(() => {
    if (flow === "quote") {
      return !!quoteIdFromQuery;
    }

    return !!effectiveReservationId;
  }, [effectiveReservationId, flow, quoteIdFromQuery]);

  const handleStartPayment = async () => {

    if (!canStartPayment) {
      toast({
        title: "Paiement indisponible",
        description: "Aucun identifiant de réservation/devis n'a été trouvé.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (flow === "quote") {
        response = await quotesService.createPaymentLink(String(quoteIdFromQuery));
      } else {
        try {
          response = await reservationsService.createPaymentLink(String(effectiveReservationId));
        } catch (error) {
          const isLegacyPaymentStatusError =
            error instanceof ApiHttpError &&
            /EN_ATTENTE_PAIEMENT status/i.test(error.message);

          if (!isLegacyPaymentStatusError) {
            throw error;
          }

          await reservationsService.patchStatus(String(effectiveReservationId), "EN_ATTENTE_PAIEMENT");
          response = await reservationsService.createPaymentLink(String(effectiveReservationId));
        }
      }

      window.location.assign(response.paymentLinkUrl);
    } catch (error) {
      setLoading(false);
      const message =
        error instanceof ApiHttpError ? error.message : "Erreur de paiement. Veuillez réessayer.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  if (confirming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Confirmation du paiement...</h1>
          <p className="text-muted-foreground">Nous validons votre transaction Stripe en cours.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Paiement confirmé !</h1>
          <p className="text-muted-foreground">
            {flow === "quote"
              ? "Votre devis est maintenant payé."
              : `Votre réservation ${reservation?.reservationId ? `(${reservation.reservationId})` : ""} est confirmée.`}
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  if (!reservation && flow === "reservation" && !reservationIdFromQuery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Aucune réservation en cours.</p>
          <Button onClick={() => navigate("/vehicules")}>Voir les véhicules</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-xl w-full rounded-2xl border border-border bg-card p-6 space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {flow === "quote" ? "Paiement du devis" : "Paiement de la réservation"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paiement Stripe direct sans formulaire intermédiaire.
          </p>
        </div>

        {reservation && (
          <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
            <p className="font-medium text-foreground">{reservation.vehiculeName}</p>
            <p className="text-muted-foreground">
              Du {new Date(reservation.dateDebut).toLocaleDateString("fr-FR")} au {new Date(reservation.dateFin).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-muted-foreground">Réf: {reservation.reservationId}</p>
          </div>
        )}

        {paymentCancelled && (
          <p className="text-sm text-amber-700 bg-amber-100 rounded-md px-3 py-2">
            Paiement annulé. Vous pouvez relancer la transaction.
          </p>
        )}

        <Button onClick={() => void handleStartPayment()} disabled={loading || !canStartPayment} className="w-full gap-2">
          <ExternalLink className="h-4 w-4" />
          {loading ? "Redirection vers Stripe..." : "Payer maintenant"}
        </Button>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
