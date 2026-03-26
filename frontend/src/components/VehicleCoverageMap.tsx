import { useMemo } from "react";
import { Car, MapPin } from "lucide-react";
import { Icon } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
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

  const locationIcon = useMemo(
    () =>
      new Icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIcon2x,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
        className: "westdrive-location-marker",
      }),
    [],
  );

  const center = useMemo<[number, number]>(() => {
    if (validMarkers.length === 0) {
      return [48.8847, 2.2384];
    }

    const { latSum, lngSum } = validMarkers.reduce(
      (acc, marker) => ({
        latSum: acc.latSum + marker.lat,
        lngSum: acc.lngSum + marker.lng,
      }),
      { latSum: 0, lngSum: 0 },
    );

    return [latSum / validMarkers.length, lngSum / validMarkers.length];
  }, [validMarkers]);

  const cardColor = "hsl(var(--card))";
  const borderColor = "hsl(var(--border))";

  return (
    <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-lg mb-10">
      <div className="h-[550px] w-full bg-muted/30">
        <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="h-full w-full" attributionControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validMarkers.map((marker) => {
            return (
              <Marker
                key={marker.city}
                position={[marker.lat, marker.lng]}
                icon={locationIcon}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1} className="westdrive-map-tooltip">
                  <div className="text-xs font-semibold">
                    {marker.city} - {marker.vehiclesCount} vehicule{marker.vehiclesCount > 1 ? "s" : ""}
                  </div>
                </Tooltip>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{marker.city}</p>
                  <p className="text-sm text-muted-foreground">
                    {marker.vehiclesCount} vehicule{marker.vehiclesCount > 1 ? "s" : ""} disponible{marker.vehiclesCount > 1 ? "s" : ""}
                  </p>
                </div>
              </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-background/90 to-transparent p-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          OpenStreetMap - positions basees sur les villes de la flotte
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="absolute bottom-4 left-4 z-[500] rounded-xl border border-border bg-card/95 px-3 py-2 shadow"
        style={{ backgroundColor: cardColor, borderColor }}
      >
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Car className="h-3.5 w-3.5 text-primary" />
          {isLoading ? "Geolocalisation des villes en cours..." : `${validMarkers.length} villes geolocalisees`}
        </p>
      </motion.div>
    </div>
  );
}
