import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { FlotteItem, etatColors } from "./data";
import { FleetIncidentDto, fleetService, VehicleDto } from "@/lib/api/services";
import { useToast } from "@/hooks/use-toast";
import { ApiHttpError, PaginationMeta } from "@/lib/api/types";
import {
  Pagination as PaginationType,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type FleetRow = FlotteItem & {
  operationalStatus?: VehicleDto["operationalStatus"];
  activeIncidentId?: string;
  imageUrl?: string;
};

function toArray<T>(payload: T[] | { items: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.items;
}

function mapOperationalStatusToEtat(
  status: VehicleDto["operationalStatus"] | undefined,
  hasActiveBreakdown: boolean,
): string {
  if (hasActiveBreakdown) return "en panne";
  if (status === "MAINTENANCE") return "entretien requis";
  if (status === "INDISPONIBLE") return "en panne";
  return "bon";
}

function mapVehicleToFleetRow(
  vehicle: VehicleDto,
  incidents: FleetIncidentDto[],
): FleetRow {
  const activeIncident = incidents.find(
    (incident) =>
      incident.status !== "RESOLU" && incident.incidentType === "PANNE",
  );

  const history = incidents.map((incident) => ({
    date: new Date(incident.openedAt).toLocaleDateString("fr-FR"),
    detail: incident.description,
    kmAuMoment: vehicle.mileage ?? 0,
    repareLe: incident.resolvedAt
      ? new Date(incident.resolvedAt).toLocaleDateString("fr-FR")
      : undefined,
  }));

  const enPanne = Boolean(activeIncident);

  return {
    id: vehicle.id,
    vehicule: vehicle.name,
    plaque: vehicle.plateNumber || "-",
    km: Number(vehicle.mileage || 0),
    dernierEntretien: "-",
    prochainEntretien: "-",
    etat: mapOperationalStatusToEtat(vehicle.operationalStatus, enPanne),
    enPanne,
    detailPanne: activeIncident?.description,
    historiquePannes: history,
    operationalStatus: vehicle.operationalStatus,
    activeIncidentId: activeIncident?.id,
    imageUrl: vehicle.images?.[0]?.url,
  };
}

export default function FlotteTab() {
  const { toast } = useToast();
  const [fleetItems, setFleetItems] = useState<FleetRow[]>([]);
  const [overview, setOverview] = useState({
    bonEtat: 0,
    entretienRequis: 0,
    enPanne: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Dialog states
  const [breakdownDialog, setBreakdownDialog] = useState(false);
  const [mileageDialog, setMileageDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetRow | null>(null);
  const [breakdownDetail, setBreakdownDetail] = useState("");
  const [newMileage, setNewMileage] = useState("");
  const [isSavingBreakdown, setIsSavingBreakdown] = useState(false);
  const [isSavingMileage, setIsSavingMileage] = useState(false);
  const [resolvingVehicleId, setResolvingVehicleId] = useState<string | null>(
    null,
  );

  const loadFleet = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [overviewDto, fleetVehicles, incidents] = await Promise.all([
        fleetService.overview(),
        fleetService.vehicles({ page, limit }),
        fleetService.listIncidents({ page: 1, limit: 200 }),
      ]);

      const vehicles = toArray(fleetVehicles);
      const incidentsList = toArray(incidents);

      if (Array.isArray(fleetVehicles)) {
        setMeta({
          page,
          limit,
          totalItems: vehicles.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: page > 1,
        });
      } else {
        setMeta(fleetVehicles.meta);
      }

      const incidentsByVehicle = new Map<string, FleetIncidentDto[]>();
      for (const incident of incidentsList) {
        const current = incidentsByVehicle.get(incident.vehicleId) ?? [];
        current.push(incident);
        incidentsByVehicle.set(incident.vehicleId, current);
      }

      setOverview({
        bonEtat: overviewDto.bonEtat,
        entretienRequis: overviewDto.entretienRequis,
        enPanne: overviewDto.enPanne,
      });

      setFleetItems(
        vehicles.map((vehicle) =>
          mapVehicleToFleetRow(
            vehicle,
            incidentsByVehicle.get(vehicle.id) ?? [],
          ),
        ),
      );
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible de charger les données flotte.";
      setLoadError(message);
      setFleetItems([]);
      setOverview({ bonEtat: 0, entretienRequis: 0, enPanne: 0 });
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    void loadFleet();
  }, [loadFleet]);

  const stats = useMemo(
    () => [
      {
        label: "En bon état",
        count: overview.bonEtat,
        icon: CheckCircle,
        color: "text-emerald-500",
      },
      {
        label: "Entretien requis",
        count: overview.entretienRequis,
        icon: AlertTriangle,
        color: "text-amber-500",
      },
      {
        label: "En panne",
        count: overview.enPanne,
        icon: XCircle,
        color: "text-destructive",
      },
    ],
    [overview],
  );

  const handleDeclareBreakdown = (vehicle: FleetRow) => {
    setSelectedVehicle(vehicle);
    setBreakdownDetail("");
    setBreakdownDialog(true);
  };

  const handleUpdateMileage = (vehicle: FleetRow) => {
    setSelectedVehicle(vehicle);
    setNewMileage(vehicle.km.toString());
    setMileageDialog(true);
  };

  const saveBreakdown = async () => {
    if (!selectedVehicle || !breakdownDetail.trim()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez ajouter un détail de panne.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBreakdown(true);
    try {
      await fleetService.createIncident({
        vehicleId: selectedVehicle.id,
        incidentType: "PANNE",
        severity: "CRITIQUE",
        description: breakdownDetail.trim(),
        status: "OUVERT",
      });

      toast({
        title: "Panne déclarée",
        description:
          "L'incident a été enregistré et le véhicule est indisponible.",
      });
      setBreakdownDialog(false);
      setSelectedVehicle(null);
      setBreakdownDetail("");
      await loadFleet();
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible de déclarer la panne.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSavingBreakdown(false);
    }
  };

  const saveMileage = async () => {
    if (!selectedVehicle || !newMileage.trim()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez entrer le kilométrage.",
        variant: "destructive",
      });
      return;
    }

    const mileageValue = parseInt(newMileage, 10);
    if (isNaN(mileageValue) || mileageValue < 0) {
      toast({
        title: "Saisie invalide",
        description: "Le kilométrage doit être un entier positif.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMileage(true);
    try {
      await fleetService.updateVehicleMileage(selectedVehicle.id, mileageValue);
      toast({ title: "Kilométrage mis à jour" });
      setMileageDialog(false);
      setSelectedVehicle(null);
      setNewMileage("");
      await loadFleet();
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible de mettre à jour le kilométrage.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSavingMileage(false);
    }
  };

  const resolveBreakdown = async (vehicle: FleetRow) => {
    if (!vehicle.activeIncidentId) {
      toast({
        title: "Action impossible",
        description: "Aucune panne active n'a été trouvée pour ce véhicule.",
        variant: "destructive",
      });
      return;
    }

    setResolvingVehicleId(vehicle.id);
    try {
      await fleetService.updateIncident(vehicle.activeIncidentId, {
        status: "RESOLU",
        resolvedAt: new Date().toISOString(),
      });
      await fleetService.updateVehicleStatus(vehicle.id, "DISPONIBLE");

      toast({
        title: "Panne résolue",
        description: "Le véhicule a été remis en état disponible.",
      });
      await loadFleet();
    } catch (error) {
      const message =
        error instanceof ApiHttpError
          ? error.message
          : "Impossible de clôturer la panne.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setResolvingVehicleId(null);
    }
  };

  // Calculate maintenance alerts
  const checkMaintenanceAlert = (vehicle: FlotteItem) => {
    // This would check against vehicle maintenance requirements from VehiculesTab
    // For now, returning simple logic
    return vehicle.etat === "entretien requis";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
      {loadError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button
              variant="outline"
              onClick={() => void loadFleet()}
              disabled={isLoading}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Plaque</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Kilométrage
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Dernier entretien
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Prochain entretien
                  </TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Chargement des données flotte...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !loadError && fleetItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun véhicule de flotte à afficher.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  !loadError &&
                  fleetItems.map((f) => {
                    const img = f.imageUrl;
                    const hasMaintenanceAlert = checkMaintenanceAlert(f);
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {img ? (
                              <img
                                src={img}
                                alt={f.vehicule}
                                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Car className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{f.vehicule}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {f.plaque}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {f.km.toLocaleString()} km
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {f.dernierEntretien}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {f.prochainEntretien}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={etatColors[f.etat] || ""}
                            >
                              {f.etat}
                            </Badge>
                            {hasMaintenanceAlert && (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            {f.enPanne && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateMileage(f)}
                              disabled={
                                isSavingMileage ||
                                isSavingBreakdown ||
                                resolvingVehicleId === f.id
                              }
                              title="Mettre à jour le kilométrage"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                            {!f.enPanne ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeclareBreakdown(f)}
                                disabled={
                                  isSavingMileage ||
                                  isSavingBreakdown ||
                                  resolvingVehicleId === f.id
                                }
                                className="text-destructive "
                                title="Déclarer une panne"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void resolveBreakdown(f)}
                                disabled={
                                  resolvingVehicleId === f.id ||
                                  isSavingBreakdown ||
                                  isSavingMileage
                                }
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

      {meta && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Page {meta.page} sur {Math.max(meta.totalPages, 1)} ·{" "}
            {meta.totalItems} véhicules flotte
          </p>
          <PaginationType>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasPreviousPage)
                      setPage((prev) => Math.max(prev - 1, 1));
                  }}
                  className={
                    !meta.hasPreviousPage
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {meta.page}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasNextPage) setPage((prev) => prev + 1);
                  }}
                  className={
                    !meta.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </PaginationType>
        </div>
      )}

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
                onChange={(e) => setBreakdownDetail(e.target.value)}
                className="min-h-24"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Le véhicule sera automatiquement marqué comme indisponible lors de
              la sauvegarde.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBreakdownDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void saveBreakdown()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSavingBreakdown}
            >
              {isSavingBreakdown ? "Enregistrement..." : "Déclarer la panne"}
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
                onChange={(e) => setNewMileage(e.target.value)}
              />
            </div>
            {selectedVehicle && selectedVehicle.km > 0 && (
              <p className="text-xs text-muted-foreground">
                Kilométrage précédent: {selectedVehicle.km.toLocaleString()} km
              </p>
            )}
          </div>
          {/* New add */}

          <div>
            <Label>Entretien requis - Kilométrage (km)</Label>
            <Input
              type="number"
              placeholder="Ex: 150000"
            />
          </div>
          <div>
            <Label>Entretien requis - Jours</Label>
            <Input
              type="number"
              placeholder="Ex: 14"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMileageDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void saveMileage()}
              disabled={isSavingMileage}
            >
              {isSavingMileage ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
