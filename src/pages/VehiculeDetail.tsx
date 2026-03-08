import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Fuel, Users, Gauge, Settings2, Star, Shield, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehiculeCard from "@/components/VehiculeCard";
import { getVehiculeById, vehicules } from "@/data/mock";
import { vehicleImages } from "@/data/vehicleImages";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

const energieLabels: Record<string, string> = {
  ESSENCE: "Essence", DIESEL: "Diesel", HYBRIDE: "Hybride", ELECTRIQUE: "Électrique",
};

export default function VehiculeDetail() {
  const { id } = useParams();
  const vehicule = getVehiculeById(id || "");

  if (!vehicule) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Véhicule introuvable</h1>
          <Link to="/vehicules"><Button variant="outline">Retour au catalogue</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const similaires = vehicules.filter((v) => v.categorie === vehicule.categorie && v.id !== vehicule.id && v.actif).slice(0, 3);

  const inclus = ["Assurance tous risques", `${vehicule.kmInclus} km/jour inclus`, "Assistance 24h/24", "Entretien et nettoyage"];

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/vehicules" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Retour au catalogue
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image */}
            <div className="rounded-xl overflow-hidden bg-muted aspect-[4/3]">
              <img
                src={vehicleImages[vehicule.id]}
                alt={`${vehicule.marque} ${vehicule.modele}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <Badge className={vehicule.disponible ? "bg-emerald-500/90 hover:bg-emerald-500" : ""}>
                  {vehicule.disponible ? "Disponible" : "Indisponible"}
                </Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">{vehicule.nom}</h1>
                <p className="text-muted-foreground mt-1">
                  {vehicule.marque} {vehicule.modele} &middot; {vehicule.annee} &middot;{" "}
                  {vehicule.categorie.charAt(0) + vehicule.categorie.slice(1).toLowerCase()}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{vehicule.note}</span>
                <span className="text-muted-foreground text-sm">({vehicule.nbAvis} avis)</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">{vehicule.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span>{vehicule.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Fuel className="h-4 w-4 text-primary" />
                  <span>{energieLabels[vehicule.energie]}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{vehicule.nbPlaces} places</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span>{vehicule.kmInclus} km/jour</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Disponible à : {vehicule.villes.join(", ")}
              </div>

              <div className="bg-secondary rounded-xl p-5">
                <h3 className="font-display font-semibold mb-3">Inclus dans la location</h3>
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
                  <p className="text-sm text-muted-foreground">À partir de</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-primary">{vehicule.prixJour}&euro;</span>
                    <span className="text-muted-foreground">/jour</span>
                  </div>
                </div>
                <Link to={`/reservation?vehicule=${vehicule.id}`}>
                  <Button size="lg" disabled={!vehicule.disponible}>
                    Réserver ce véhicule
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Similaires */}
          {similaires.length > 0 && (
            <div className="mt-20">
              <h2 className="font-display text-2xl font-bold mb-6">Véhicules similaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similaires.map((v, i) => (
                  <VehiculeCard key={v.id} vehicule={v} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
