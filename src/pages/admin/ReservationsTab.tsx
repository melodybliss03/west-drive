import { useState } from "react";
import { Car, Eye, Search, Users, CheckCircle, XCircle, Mail, Phone, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Reservation } from "./data";
import { statColors, getVehicleImage } from "./data";
import { reservationsService } from "@/lib/api/services";
import { ApiHttpError } from "@/lib/api/types";

interface ReservationsTabProps {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
}

export default function ReservationsTab({ reservations, setReservations }: ReservationsTabProps) {
  const { toast } = useToast();
  const [searchR, setSearchR] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const filteredRes = reservations.filter(r => r.client.toLowerCase().includes(searchR.toLowerCase()) || r.vehicule.toLowerCase().includes(searchR.toLowerCase()));

  const updateReservationStatus = async (id: string, nextLegacyStatus: Reservation["statut"]) => {
    const toBackendStatus: Record<string, string> = {
      "en attente": "EN_ANALYSE",
      "confirmée": "CONFIRMEE",
      "en cours": "EN_COURS",
      "terminée": "CLOTUREE",
      "annulée": "ANNULEE",
    };

    try {
      await reservationsService.patchStatus(id, toBackendStatus[nextLegacyStatus] as any);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: nextLegacyStatus } : r));
      setSelectedReservation(prev => (prev && prev.id === id ? { ...prev, statut: nextLegacyStatus } : prev));
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de mettre à jour cette réservation.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-display font-bold">Réservations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={searchR} onChange={e => setSearchR(e.target.value)} className="pl-9 w-56" />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead className="hidden sm:table-cell">Début</TableHead>
                    <TableHead className="hidden sm:table-cell">Fin</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Caution</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRes.map(r => {
                    const img = getVehicleImage(r.vehicule, r.vehiculeId);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-medium">{r.client}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{r.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {img ? (
                              <img src={img} alt={r.vehicule} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Car className="h-3 w-3 text-muted-foreground" /></div>
                            )}
                            <span>{r.vehicule}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{r.debut}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{r.fin}</TableCell>
                        <TableCell className="font-semibold">{r.montant} €</TableCell>
                        <TableCell className="font-semibold">{r.caution} €</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statColors[r.statut] || ""}>{r.statut}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReservation(r)}><Eye className="h-4 w-4" /></Button>
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

      {/* Reservation Detail Modal */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la réservation {selectedReservation?.id}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (() => {
            const img = getVehicleImage(selectedReservation.vehicule, selectedReservation.vehiculeId);
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
                  {img ? (
                    <img src={img} alt={selectedReservation.vehicule} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"><Car className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <div>
                    <p className="font-display font-bold text-lg">{selectedReservation.vehicule}</p>
                    <Badge variant="outline" className={statColors[selectedReservation.statut] || ""}>{selectedReservation.statut}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.client}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.email}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.telephone}</span></div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedReservation.ville}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Période</p>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedReservation.debut} → {selectedReservation.fin}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Financier</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Montant</p>
                      <p className="text-lg font-bold">{selectedReservation.montant} €</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Caution</p>
                      <p className="text-lg font-bold">{selectedReservation.caution} €</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Gérer la réservation</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReservation.statut === "en attente" && (
                      <Button size="sm" className="gap-1" onClick={async () => {
                        await updateReservationStatus(selectedReservation.id, "confirmée");
                        toast({ title: "Réservation confirmée" });
                      }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Confirmer
                      </Button>
                    )}
                    {["confirmée", "en attente"].includes(selectedReservation.statut) && (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={async () => {
                        await updateReservationStatus(selectedReservation.id, "annulée");
                        toast({ title: "Réservation annulée" });
                      }}>
                        <XCircle className="h-3.5 w-3.5" /> Annuler
                      </Button>
                    )}
                    {selectedReservation.statut === "en cours" && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={async () => {
                        await updateReservationStatus(selectedReservation.id, "terminée");
                        toast({ title: "Réservation terminée" });
                      }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Terminer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
