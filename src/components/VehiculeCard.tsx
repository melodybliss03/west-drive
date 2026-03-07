import { Link } from "react-router-dom";
import { Fuel, Users, Gauge, Settings2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Vehicule } from "@/data/mock";
import { vehicleImages } from "@/data/vehicleImages";
import { motion } from "framer-motion";

const energieLabels: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
};

const transmissionLabels: Record<string, string> = {
  MANUELLE: "Manuel",
  AUTOMATIQUE: "Auto",
};

export default function VehiculeCard({ vehicule, index = 0 }: { vehicule: Vehicule; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={vehicleImages[vehicule.id]}
          alt={`${vehicule.marque} ${vehicule.modele}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <Badge
          className={`absolute top-3 right-3 text-xs ${
            vehicule.disponible
              ? "bg-emerald-500/90 text-background hover:bg-emerald-500"
              : "bg-muted-foreground/80 text-background hover:bg-muted-foreground"
          }`}
        >
          {vehicule.disponible ? "Disponible" : "Indisponible"}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-lg leading-tight">{vehicule.nom}</h3>
          <p className="text-sm text-muted-foreground">
            {vehicule.categorie.charAt(0) + vehicule.categorie.slice(1).toLowerCase()} &middot; {vehicule.annee}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="font-medium text-foreground">{vehicule.note}</span>
          <span>({vehicule.nbAvis} avis)</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            <span>{transmissionLabels[vehicule.transmission]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5" />
            <span>{energieLabels[vehicule.energie]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{vehicule.nbPlaces} places</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            <span>{vehicule.kmInclus} km/j</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-border">
          <div>
            <span className="text-2xl font-display font-bold text-primary">{vehicule.prixJour}&euro;</span>
            <span className="text-sm text-muted-foreground"> /jour</span>
          </div>
          <Link to={`/vehicules/${vehicule.id}`}>
            <Button size="sm" disabled={!vehicule.disponible}>
              Réserver
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
