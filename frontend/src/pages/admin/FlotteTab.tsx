import { useEffect, useMemo, useState } from "react";
import { Car, CheckCircle, AlertTriangle, XCircle, Wrench, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FlotteItem, mockFlotte, etatColors, getVehicleImage } from "./data";
import { fleetService } from "@/lib/api/services";

export default function FlotteTab() {
  const [fleetItems, setFleetItems] = useState<FlotteItem[]>(mockFlotte);
  const [overview, setOverview] = useState({
    bonEtat: mockFlotte.filter(f => f.etat === "bon").length,
    entretienRequis: mockFlotte.filter(f => f.etat === "entretien requis").length,
    enPanne: mockFlotte.filter(f => f.etat === "en panne").length,
  });

  // Dialog states
  const [breakdownDialog, setBreakdownDialog] = useState(false);
  const [mileageDialog, setMileageDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<FlotteItem | null>(null);
  const [breakdownDetail, setBreakdownDetail] = useState("");
  const [newMileage, setNewMileage] = useState("");

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
          enPanne: item.enPanne ?? false,
          detailPanne: item.detailPanne,
          historiquePannes: item.historiquePannes ?? [],
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

  const handleDeclareBreakdown = (vehicle: FlotteItem) => {
    setSelectedVehicle(vehicle);
    setBreakdownDetail("");
    setBreakdownDialog(true);
  };

  const handleUpdateMileage = (vehicle: FlotteItem) => {
    setSelectedVehicle(vehicle);
    setNewMileage(vehicle.km.toString());
    setMileageDialog(true);
  };

  const saveBreakdown = () => {
    if (!selectedVehicle || !breakdownDetail.trim()) {
      alert("Veuillez ajouter un détail de panne");
      return;
    }

    const updated = fleetItems.map(item => {
      if (item.id === selectedVehicle.id) {
        return {
          ...item,
          enPanne: true,
          etat: "en panne",
          detailPanne: breakdownDetail,
          historiquePannes: [
            ...item.historiquePannes,
            {
              date: new Date().toLocaleDateString("fr-FR"),
              detail: breakdownDetail,
              kmAuMoment: item.km,
              repareLe: undefined,
            },
          ],
        };
      }
      return item;
    });

    setFleetItems(updated);
    setOverview(prev => ({
      ...prev,
      bonEtat: prev.bonEtat - 1,
      enPanne: prev.enPanne + 1,
    }));
    setBreakdownDialog(false);
  };

  const saveMileage = () => {
    if (!selectedVehicle || !newMileage.trim()) {
      alert("Veuillez entrer le kilométrage");
      return;
    }

    const mileageValue = parseInt(newMileage, 10);
    if (isNaN(mileageValue)) {
      alert("Kilométrage invalide");
      return;
    }

    const updated = fleetItems.map(item => {
      if (item.id === selectedVehicle.id) {
        return {
          ...item,
          km: mileageValue,
        };
      }
      return item;
    });

    setFleetItems(updated);
    setMileageDialog(false);
  };

  const resolveBreakdown = (vehicle: FlotteItem) => {
    const updated = fleetItems.map(item => {
      if (item.id === vehicle.id) {
        const updatedHistorique = item.historiquePannes.map((panne, idx) => {
          if (idx === item.historiquePannes.length - 1) {
            return {
              ...panne,
              repareLe: new Date().toLocaleDateString("fr-FR"),
            };
          }
          return panne;
        });
        return {
          ...item,
          enPanne: false,
          etat: "bon",
          detailPanne: undefined,
          historiquePannes: updatedHistorique,
        };
      }
      return item;
    });

    setFleetItems(updated);
    setOverview(prev => ({
      ...prev,
      bonEtat: prev.bonEtat + 1,
      enPanne: prev.enPanne - 1,
    }));
  };

  // Calculate maintenance alerts
  const checkMaintenanceAlert = (vehicle: FlotteItem) => {
    // This would check against vehicle maintenance requirements from VehiculesTab
    // For now, returning simple logic
    return vehicle.etat === "entretien requis";
  };

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
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fleetItems.map(f => {
                  const img = getVehicleImage(f.vehicule);
                  const hasMaintenanceAlert = checkMaintenanceAlert(f);
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={etatColors[f.etat] || ""}>{f.etat}</Badge>
                          {hasMaintenanceAlert && <AlertCircle className="h-4 w-4 text-amber-500" />}
                          {f.enPanne && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateMileage(f)}
                            title="Mettre à jour le kilométrage"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                          {!f.enPanne ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeclareBreakdown(f)}
                              className="text-destructive "
                              title="Déclarer une panne"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveBreakdown(f)}
                              className="text-emerald-500 hover:text-emerald-600"
                              title="Marquer comme réparé"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Declaration Dialog */}
      <Dialog open={breakdownDialog} onOpenChange={setBreakdownDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclarer une panne</DialogTitle>
            <DialogDescription>
              Véhicule: {selectedVehicle?.vehicule} ({selectedVehicle?.plaque})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="breakdown-detail">Détail de la panne</Label>
              <Textarea
                id="breakdown-detail"
                placeholder="Décrivez les problèmes..."
                value={breakdownDetail}
                onChange={e => setBreakdownDetail(e.target.value)}
                className="min-h-24"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Le véhicule sera automatiquement marqué comme indisponible lors de la sauvegarde.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBreakdownDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveBreakdown} className="bg-destructive hover:bg-destructive/90">
              Déclarer la panne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mileage Update Dialog */}
      <Dialog open={mileageDialog} onOpenChange={setMileageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le kilométrage</DialogTitle>
            <DialogDescription>
              Véhicule: {selectedVehicle?.vehicule} ({selectedVehicle?.plaque})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mileage-input">Kilométrage actuel</Label>
              <Input
                id="mileage-input"
                type="number"
                placeholder="Entrez le kilométrage"
                value={newMileage}
                onChange={e => setNewMileage(e.target.value)}
              />
            </div>
            {selectedVehicle && selectedVehicle.km > 0 && (
              <p className="text-xs text-muted-foreground">
                Kilométrage précédent: {selectedVehicle.km.toLocaleString()} km
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMileageDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveMileage}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
