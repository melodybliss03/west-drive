import { useEffect, useMemo, useState } from "react";
import { Car, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FlotteItem, mockFlotte, etatColors, getVehicleImage } from "./data";
import { fleetService } from "@/lib/api/services";

export default function FlotteTab() {
  const [fleetItems, setFleetItems] = useState<FlotteItem[]>(mockFlotte);
  const [overview, setOverview] = useState({
    bonEtat: mockFlotte.filter(f => f.etat === "bon").length,
    entretienRequis: mockFlotte.filter(f => f.etat === "entretien requis").length,
    enPanne: mockFlotte.filter(f => f.etat === "en panne").length,
  });

  useEffect(() => {
    const loadFleet = async () => {
      try {
        const [overviewDto, fleetVehicles] = await Promise.all([fleetService.overview(), fleetService.vehicles()]);

        setOverview({
          bonEtat: overviewDto.bonEtat,
          entretienRequis: overviewDto.entretienRequis,
          enPanne: overviewDto.enPanne,
        });

        const mapped = fleetVehicles.map((item, idx) => ({
          id: String(item.id || `F${idx + 1}`),
          vehicule: String(item.vehicleName || item.name || "Véhicule"),
          plaque: String(item.plate || "-"),
          km: Number(item.mileage || 0),
          dernierEntretien: String(item.lastMaintenanceAt || "-"),
          prochainEntretien: String(item.nextMaintenanceAt || "-"),
          etat: String(item.state || "bon").toLowerCase(),
        }));

        if (mapped.length > 0) {
          setFleetItems(mapped);
        }
      } catch {
        // Fallback mock
      }
    };

    loadFleet();
  }, []);

  const stats = useMemo(
    () => [
      { label: "En bon état", count: overview.bonEtat, icon: CheckCircle, color: "text-emerald-500" },
      { label: "Entretien requis", count: overview.entretienRequis, icon: AlertTriangle, color: "text-amber-500" },
      { label: "En panne", count: overview.enPanne, icon: XCircle, color: "text-destructive" },
    ],
    [overview]
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Gestion de flotte</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Plaque</TableHead>
                  <TableHead className="hidden sm:table-cell">Kilométrage</TableHead>
                  <TableHead className="hidden md:table-cell">Dernier entretien</TableHead>
                  <TableHead className="hidden md:table-cell">Prochain entretien</TableHead>
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fleetItems.map(f => {
                  const img = getVehicleImage(f.vehicule);
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {img ? (
                            <img src={img} alt={f.vehicule} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Car className="h-3 w-3 text-muted-foreground" /></div>
                          )}
                          <span className="font-medium">{f.vehicule}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{f.plaque}</TableCell>
                      <TableCell className="hidden sm:table-cell">{f.km.toLocaleString()} km</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{f.dernierEntretien}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{f.prochainEntretien}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={etatColors[f.etat] || ""}>{f.etat}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
