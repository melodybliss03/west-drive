import { useMemo } from "react";
import { Car, MapPin } from "lucide-react";
import { divIcon } from "leaflet"; // ← divIcon au lieu de Icon
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import { motion } from "framer-motion";
import type { Vehicule } from "@/data/mock";
import { useVehicleCityMarkers } from "@/hooks/useVehicleCityMarkers";

type VehicleCoverageMapProps = {
  vehicles: Vehicule[];
};

export default function VehicleCoverageMap({ vehicles }: VehicleCoverageMapProps) {
  const { markers, isLoading } = useVehicleCityMarkers(vehicles);

  const validMarkers = useMemo(
    () => markers.filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng)),
    [markers],
  );

  // ── Icône SVG avec la couleur primaire ─────────────────────────────────────
  // On lit la couleur primaire depuis les variables CSS au moment du rendu
  const primaryColor = useMemo(() => {
    if (typeof window === "undefined") return "#000";
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim()
      // Les variables Tailwind sont au format "H S% L%" (HSL sans hsl())
      // On les enveloppe pour obtenir une couleur CSS valide
      || "221 83% 53%"; // fallback si la variable n'est pas lisible
  }, []);

  const locationIcon = useMemo(
    () =>
      divIcon({
        // SVG en forme de pin, rempli avec la couleur primaire
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40" fill="none">
            <path
              d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0Z"
              fill="hsl(${primaryColor})"
            />
            <circle cx="14" cy="14" r="6" fill="white" />
          </svg>
        `,
        className: "",            // ← supprime le fond blanc par défaut de Leaflet
        iconSize: [28, 40],
        iconAnchor: [14, 40],     // pointe du pin
        popupAnchor: [0, -42],
        tooltipAnchor: [16, -28],
      }),
    [primaryColor],
  );

  const center = useMemo<[number, number]>(() => {
    if (validMarkers.length === 0) return [48.8847, 2.2384];
    const { latSum, lngSum } = validMarkers.reduce(
      (acc, m) => ({ latSum: acc.latSum + m.lat, lngSum: acc.lngSum + m.lng }),
      { latSum: 0, lngSum: 0 },
    );
    return [latSum / validMarkers.length, lngSum / validMarkers.length];
  }, [validMarkers]);

  return (
    <div className="relative z-30 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-lg mb-10">
      <div className="h-[550px] w-full bg-muted/30">
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validMarkers.map((marker) => (
            <Marker
              key={marker.city}
              position={[marker.lat, marker.lng]}
              icon={locationIcon}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs font-semibold">
                  {marker.city} — {marker.vehiclesCount} véhicule{marker.vehiclesCount > 1 ? "s" : ""}
                </div>
              </Tooltip>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{marker.city}</p>
                  <p className="text-sm text-muted-foreground">
                    {marker.vehiclesCount} véhicule{marker.vehiclesCount > 1 ? "s" : ""} disponible{marker.vehiclesCount > 1 ? "s" : ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Label haut */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-background/90 to-transparent p-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          OpenStreetMap — positions basées sur les villes de la flotte
        </div>
      </div>

      {/* Label bas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="absolute bottom-4 left-4 z-[500] rounded-xl border border-border bg-card/95 px-3 py-2 shadow"
      >
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Car className="h-3.5 w-3.5 text-primary" />
          {isLoading
            ? "Géolocalisation des villes en cours..."
            : `${validMarkers.length} ville${validMarkers.length > 1 ? "s" : ""} géolocalisée${validMarkers.length > 1 ? "s" : ""}`}
        </p>
      </motion.div>
    </div>
  );
}