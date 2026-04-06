import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Fuel,
  Users,
  Gauge,
  Settings2,
  Star,
  Shield,
  MapPin,
  CheckCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehiculeCard from "@/components/VehiculeCard";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { useVehiclesCatalog } from "@/hooks/useVehiclesCatalog";
import ReservationDialog from "@/components/ReservationDialog";
import ImageCarousel from "@/components/ImageCarousel";
import { reviewsService } from "@/lib/api/services";
import { useAuth } from "@/contexts/AuthContext";

export default function VehiculeDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { vehicles, isLoading } = useVehiclesCatalog();
  const { user, isAuthenticated } = useAuth();
  const CLIENT_ROLE_NAMES_DETAIL = new Set(["client", "customer", "particulier"]);
  const isStaffOrAdmin =
    isAuthenticated &&
    user !== null &&
    (
      (user.role != null && user.role.trim() !== "" && !CLIENT_ROLE_NAMES_DETAIL.has(user.role.toLowerCase())) ||
      user.roles.some((r) => typeof r === "string" && r.trim() !== "" && !CLIENT_ROLE_NAMES_DETAIL.has(r.toLowerCase()))
    );
  const vehicule = vehicles.find((item) => item.id === (id || ""));

  const { data: vehicleReviews } = useQuery({
    queryKey: ["vehicle-reviews", id],
    queryFn: () => reviewsService.list({ page: 1, limit: 6, vehicleId: String(id || "") }),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <Header />
        <div className="pt-40 pb-16 max-w-5xl mx-auto px-4 text-center text-muted-foreground">
          {t('vehiculeDetail.loading')}
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicule) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">
            {t('vehiculeDetail.notFound')}
          </h1>
          <Link to="/vehicules">
            <Button variant="outline">{t('vehiculeDetail.backToCatalog')}</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const similaires = vehicles
    .filter(
      (v) =>
        v.categorie === vehicule.categorie && v.id !== vehicule.id && v.actif,
    )
    .slice(0, 3);

  const inclus = [
    t('vehiculeDetail.allRiskInsurance'),
    t('vehiculeDetail.kmIncluded', { km: vehicule.kmInclus }),
    t('vehiculeDetail.support24h'),
    t('vehiculeDetail.maintenanceAndCleaning'),
  ];

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            to="/vehicules"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> {t('vehiculeDetail.backToCatalog')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image Carousel */}
            <div className="rounded-xl overflow-hidden bg-muted aspect-[4/3]">
              <ImageCarousel
                images={vehicule.photos}
                alt={`${vehicule.marque} ${vehicule.modele}`}
                className="aspect-[4/3]"
                showDots={vehicule.photos.length > 1}
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <Badge
                  className={
                    vehicule.disponible
                      ? "bg-emerald-500/90 hover:bg-emerald-500"
                      : ""
                  }
                >
                  {vehicule.disponible ? t('vehiculeDetail.available') : t('vehiculeDetail.unavailable')}
                </Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">
                  {vehicule.nom}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {vehicule.marque} {vehicule.modele} &middot; {vehicule.annee}{" "}
                  &middot;{" "}
                  {vehicule.categorie.charAt(0) +
                    vehicule.categorie.slice(1).toLowerCase()}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{vehicule.note}</span>
                <span className="text-muted-foreground text-sm">
                  ({vehicule.nbAvis} avis)
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {vehicule.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span>
                    {vehicule.transmission === "AUTOMATIQUE"
                      ? t('vehiculeDetail.automatic')
                      : t('vehiculeDetail.manual')}
                  </span>

                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Fuel className="h-4 w-4 text-primary" />
                  <span>
                    {vehicule.energie === "ESSENCE" ? t('vehicules.petrol') :
                     vehicule.energie === "DIESEL" ? t('vehicules.diesel') :
                     vehicule.energie === "ELECTRIQUE" ? t('vehicules.electric') :
                     vehicule.energie}
                  </span>
                  {vehicule.isHybride && (
                    <Badge variant="outline" className="text-[12px] px-2 py-1 bg-green-500/30 text-green-700 border-green-200">{t('vehiculeDetail.hybrid')}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{vehicule.nbPlaces} {t('vehiculeDetail.places')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span>{vehicule.kmInclus} {t('vehiculeDetail.kmPerDay')}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {t('vehiculeDetail.availableAt')} {vehicule.villes.join(", ")}
              </div>

              <div className="bg-secondary rounded-xl p-5">
                <h3 className="font-display font-semibold mb-3">
                  {t('vehiculeDetail.includedInRental')}
                </h3>
                <ul className="space-y-2">
                  {inclus.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-end justify-between p-5 bg-card border border-border rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">{t('vehiculeDetail.startingFrom')}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-primary">
                      {vehicule.prixJour}&euro;
                    </span>
                    <span className="text-muted-foreground">{t('vehiculeDetail.perDay')}</span>
                  </div>
                </div>
                <ReservationDialog
                  vehiculeId={vehicule.id}
                  vehiculeName={vehicule.nom}
                  vehiculeCategorie={vehicule.categorie}
                  vehiculePrixJour={vehicule.prixJour}
                  vehiculePrixHeure={vehicule.prixHeure}
                  vehiculeCaution={vehicule.caution}
                  vehiculeAdditionalFees={vehicule.autreFraisLibelle}
                >
                  <Button size="lg" disabled={!vehicule.disponible}>
                    {t('vehiculeDetail.bookVehicle')}
                  </Button>
                </ReservationDialog>
              </div>

              {/* Caution section */}
              <div className="flex items-end justify-between p-5 bg-green-50 border border-border rounded-xl">
                <div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">{t('vehiculeDetail.caution')}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-primary">
                      {vehicule.caution}&euro;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {similaires.length > 0 && (
            <div className="mt-20">
              <h2 className="font-display text-2xl font-bold mb-6">
                {t('vehiculeDetail.similarVehicles')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similaires.map((v, i) => (
                  <VehiculeCard key={v.id} vehicule={v} index={i} />
                ))}
              </div>
            </div>
          )}

          {vehicleReviews?.items?.length ? (
            <div className="mt-20">
              <h2 className="font-display text-2xl font-bold mb-6">{t('vehiculeDetail.reviewsTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicleReviews.items.map((review) => (
                  <article key={review.id} className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{review.authorName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <p className="text-sm font-medium mb-1">{review.title || t('vehiculeDetail.clientReview')}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={`${review.id}-${idx}`}
                          className={`h-4 w-4 ${idx < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
