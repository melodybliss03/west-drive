import { Link } from "react-router-dom";
import { Fuel, Users, Gauge, Settings2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Vehicule } from "@/data/mock";
import { motion } from "framer-motion";
import ReservationDialog from "@/components/ReservationDialog";
import { Car } from "lucide-react";

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
  const imageSrc = vehicule.photos[0];

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${vehicule.marque} ${vehicule.modele}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Car className="h-10 w-10" />
          </div>
        )}
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
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-lg leading-tight">{vehicule.nom}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicule.categorie.charAt(0) + vehicule.categorie.slice(1).toLowerCase()} &middot; {vehicule.annee}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-display font-bold text-primary">{vehicule.prixJour}&euro;</span>
            <span className="text-sm text-muted-foreground"> /jour</span>
          </div>
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

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Link to={`/vehicules/${vehicule.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">Détail</Button>
          </Link>
          {vehicule.disponible ? (
            <ReservationDialog vehiculeId={vehicule.id} vehiculeName={vehicule.nom} vehiculeCategorie={vehicule.categorie} vehiculePrixJour={vehicule.prixJour}>
              <Button size="sm" className="flex-1">Réserver</Button>
            </ReservationDialog>
          ) : (
            <Button size="sm" disabled className="flex-1">
              Indisponible
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return cardContent;
}
