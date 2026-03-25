import { useState } from "react";
import { Car, Plus, Edit, Trash2, Search, Eye, Fuel, Users, Gauge, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { type Vehicule, type Categorie, type Transmission, type Energie } from "@/data/mock";
import { emptyVehicle } from "./data";
import { fleetService, vehiclesService } from "@/lib/api/services";
import { mapVehicleDtoToVehicule } from "@/lib/mappers";
import { ApiHttpError, PaginationMeta } from "@/lib/api/types";
import {
  Pagination as PaginationType,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Types étendus — plus de `any`
type VehiculeForm = Partial<Vehicule>;
type VehiculeView = Vehicule;

interface VehiculesTabProps {
  vehicles: Vehicule[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicule[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  meta: PaginationMeta | null;
  setMeta: React.Dispatch<React.SetStateAction<PaginationMeta | null>>;
  limit: number;
}

export default function VehiculesTab({ vehicles, setVehicles, page, setPage, meta, setMeta, limit }: VehiculesTabProps) {
  const { toast } = useToast();
  const [searchV, setSearchV] = useState("");
  const [editVehicle, setEditVehicle] = useState<VehiculeForm | null>(null);
  const [locationForm, setLocationForm] = useState({
    streetAddress: "",
    city: "",
  });
  const [isNew, setIsNew] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [viewVehicle, setViewVehicle] = useState<VehiculeView | null>(null);

  const filteredVehicles = vehicles.filter(v =>
    v.nom.toLowerCase().includes(searchV.toLowerCase()) ||
    v.marque.toLowerCase().includes(searchV.toLowerCase())
  );

  const openNew = () => {
    setEditVehicle({ ...emptyVehicle, id: `v-${Date.now()}` });
    setLocationForm({ streetAddress: "", city: ""});
    setImageFiles([]);
    setIsNew(true);
  };

  const openEdit = (v: Vehicule) => {
    setEditVehicle({ ...v });
    setLocationForm({ streetAddress: "Adresse non renseignée", city: v.villes[0] || ""});
    setImageFiles([]);
    setIsNew(false);
  };

  const toVehiclePayload = (vehicle: VehiculeForm) => ({
    name: vehicle.nom,
    brand: vehicle.marque,
    model: vehicle.modele,
    year: vehicle.annee,
    category: vehicle.categorie,
    transmission: vehicle.transmission,
    energy: vehicle.energie,
    isHybride: vehicle.isHybride || false,
    seats: vehicle.nbPlaces,
    includedKmPerDay: vehicle.kmInclus,
    mileage: vehicle.kilométrage || 0,
    pricePerDay: vehicle.prixJour,
    pricePerHour: vehicle.prixHeure || 0,
    additionalFeesLabels: vehicle.autreFraisLibelle || [],
    maintenanceRequired: vehicle.entretenueRequis,
    plateNumber: vehicle.plaqueImmatriculation,
    streetAddress: locationForm.streetAddress,
    city: locationForm.city,
    availableCities: vehicle.villes,
  });

  const reloadPage = async () => {
    const refreshed = await vehiclesService.list({ page, limit }, true);
    setVehicles(refreshed.items.map(mapVehicleDtoToVehicule));
    setMeta(refreshed.meta);
  };

  const saveVehicle = async () => {
    if (!editVehicle || isSaving) return;

    if (!locationForm.streetAddress.trim() || !locationForm.city.trim()) {
      toast({ title: "Adresse requise", description: "Veuillez renseigner l'adresse et la ville du véhicule.", variant: "destructive" });
      return;
    }

    if (!editVehicle.nom?.trim()) {
      toast({ title: "Nom requis", description: "Veuillez renseigner le nom du véhicule.", variant: "destructive" });
      return;
    }

    // Vérifier l'unicité du nom
    const namedAlready = vehicles.some(v => 
      v.nom.toLowerCase() === editVehicle.nom?.toLowerCase() && 
      v.id !== editVehicle.id
    );
    if (namedAlready) {
      toast({ title: "Nom déjà utilisé", description: "Un véhicule avec ce nom existe déjà.", variant: "destructive" });
      return;
    }

    const firstCity = locationForm.city.trim();
    const cities = (editVehicle.villes || []).filter(Boolean);
    const availableCities = cities.length > 0 ? cities : [firstCity];
    const vehicleWithCities: VehiculeForm = { ...editVehicle, villes: availableCities };

    try {
      setIsSaving(true);
      setSaveLabel(isNew ? "Création du véhicule..." : "Mise à jour du véhicule...");

      if (isNew) {
        const created = await vehiclesService.create(toVehiclePayload(vehicleWithCities));
        if (vehicleWithCities.disponible === false) {
          setSaveLabel("Mise à jour du statut...");
          await fleetService.updateVehicleStatus(created.id, "INDISPONIBLE");
        }
        if (imageFiles.length > 0) {
          setSaveLabel("Upload des images...");
          for (let index = 0; index < imageFiles.length; index += 1) {
            await vehiclesService.uploadImage(created.id, imageFiles[index], index);
          }
        }
        setSaveLabel("Actualisation de la liste...");
        await reloadPage();
      } else {
        const originalVehicle = vehicles.find((v) => v.id === String(editVehicle.id));
        const updated = await vehiclesService.update(String(editVehicle.id), toVehiclePayload(vehicleWithCities));
        if (originalVehicle && originalVehicle.disponible !== vehicleWithCities.disponible) {
          setSaveLabel("Mise à jour du statut...");
          await fleetService.updateVehicleStatus(updated.id, vehicleWithCities.disponible ? "DISPONIBLE" : "INDISPONIBLE");
        }
        if (imageFiles.length > 0) {
          setSaveLabel("Remplacement des images...");
          const vehicleDetail = await vehiclesService.detail(updated.id, true);
          const existingImages = vehicleDetail.images || [];
          for (const image of existingImages) {
            if (image.id) await vehiclesService.removeImage(updated.id, image.id);
          }
          for (let index = 0; index < imageFiles.length; index += 1) {
            await vehiclesService.uploadImage(updated.id, imageFiles[index], index);
          }
        }
        setSaveLabel("Actualisation de la liste...");
        await reloadPage();
      }

      setEditVehicle(null);
      setImageFiles([]);
      toast({ title: isNew ? "Véhicule ajouté" : "Véhicule mis à jour" });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de sauvegarder ce véhicule.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setSaveLabel("");
    }
  };

  const deleteVehicle = async (id: string) => {
    if (deletingVehicleId) return;
    try {
      setDeletingVehicleId(id);
      await vehiclesService.remove(id);
      await reloadPage();
      setDeleteConfirm(null);
      toast({ title: "Véhicule supprimé" });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : "Impossible de supprimer ce véhicule.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setDeletingVehicleId(null);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-display font-bold">Véhicules</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher…" value={searchV} onChange={e => setSearchV(e.target.value)} className="pl-9 w-56" />
            </div>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix/jour</TableHead>
                    <TableHead className="hidden md:table-cell">Km actuel</TableHead>
                    <TableHead className="hidden lg:table-cell">Statut</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        {vehicles.length === 0
                          ? "Aucun véhicule disponible pour le moment."
                          : "Aucun véhicule ne correspond à votre recherche."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map(v => {
                      const img = v.photos[0];
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {img ? (
                                <img src={img} alt={v.nom} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{v.nom}</p>
                                <p className="text-xs text-muted-foreground">{v.transmission} · {v.energie}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{v.categorie}</Badge></TableCell>
                          <TableCell className="font-semibold">{v.prixJour} €</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{v.kilométrage} km</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {v.disponible && v.actif ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Disponible</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Indisponible</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewVehicle(v)} disabled={isSaving || !!deletingVehicleId}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(v)} disabled={isSaving || !!deletingVehicleId}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(v.id)}
                                disabled={isSaving || !!deletingVehicleId}
                                className="text-destructive"
                              >
                                {deletingVehicleId === v.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {meta && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Page {meta.page} sur {Math.max(meta.totalPages, 1)} · {meta.totalItems} véhicules
            </p>
            <PaginationType>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (meta.hasPreviousPage) setPage((prev) => Math.max(prev - 1, 1)); }}
                    className={!meta.hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>{meta.page}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (meta.hasNextPage) setPage((prev) => prev + 1); }}
                    className={!meta.hasNextPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </PaginationType>
          </div>
        )}
      </motion.div>

      {/* Vehicle View Dialog */}
      <Dialog open={!!viewVehicle} onOpenChange={() => setViewVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du véhicule</DialogTitle>
          </DialogHeader>
          {viewVehicle && (() => {
            const img = viewVehicle.photos[0];
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
                  {img ? (
                    <img src={img} alt={viewVehicle.nom} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-display font-bold text-lg">{viewVehicle.nom}</p>
                    <p className="text-sm text-muted-foreground">{viewVehicle.marque} · {viewVehicle.annee}</p>
                    {viewVehicle.disponible && viewVehicle.actif ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 mt-1">Disponible</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 mt-1">Indisponible</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Caractéristiques</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm"><Car className="h-4 w-4 text-muted-foreground" /><span>{viewVehicle.categorie}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4 text-muted-foreground" /><span>{viewVehicle.transmission}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Fuel className="h-4 w-4 text-muted-foreground" /><span>{viewVehicle.energie}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{viewVehicle.nbPlaces} places</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tarification</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Prix/jour</p>
                      <p className="text-lg font-bold">{viewVehicle.prixJour} €</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Prix/heure</p>
                      <p className="text-lg font-bold">{viewVehicle.prixHeure} €</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Km inclus/jour</p>
                      <p className="text-lg font-bold">{viewVehicle.kmInclus}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-xs text-muted-foreground">Kilométrage actuel</p>
                      <p className="text-lg font-bold">{viewVehicle.kilométrage} km</p>
                    </div>
                  </div>
                  {viewVehicle.autreFraisLibelle && viewVehicle.autreFraisLibelle.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Frais additionnels</p>
                      {viewVehicle.autreFraisLibelle.map((frais, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{frais.label}</span>
                          <span className="font-semibold">{frais.amount} €</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {viewVehicle.entretenueRequis && (viewVehicle.entretenueRequis.kilométrage || viewVehicle.entretenueRequis.jours) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Entretien requis</p>
                    <div className="grid grid-cols-2 gap-3">
                      {viewVehicle.entretenueRequis.kilométrage && (
                        <div className="p-2 rounded-lg bg-muted/40 text-center text-xs">
                          <p className="text-muted-foreground">À {viewVehicle.entretenueRequis.kilométrage} km</p>
                        </div>
                      )}
                      {viewVehicle.entretenueRequis.jours && (
                        <div className="p-2 rounded-lg bg-muted/40 text-center text-xs">
                          <p className="text-muted-foreground">Tous les {viewVehicle.entretenueRequis.jours} jours</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewVehicle.isHybride && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-200 text-center">
                    <p className="text-sm font-medium text-amber-700">⚡ Véhicule hybride</p>
                  </div>
                )}

                {viewVehicle.villes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Villes disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {viewVehicle.villes.map(ville => (
                        <Badge key={ville} variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />{ville}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewVehicle.description && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{viewVehicle.description}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Vehicle Edit Dialog */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un véhicule" : "Modifier le véhicule"}</DialogTitle>
          </DialogHeader>
          {editVehicle && (
            <div className="grid gap-4 py-2">
              {isSaving && (
                <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  <Spinner />
                  <span>{saveLabel || "Traitement en cours..."}</span>
                </div>
              )}
              <div>
                <Label>Plaque d'immatriculation</Label>
                <Input 
                  value={editVehicle.plaqueImmatriculation || ""} 
                  onChange={e => setEditVehicle({ ...editVehicle, plaqueImmatriculation: e.target.value })}
                  placeholder="Ex: AB-123-CD"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marque *</Label>
                  <Input value={editVehicle.marque || ""} onChange={e => setEditVehicle({ ...editVehicle, marque: e.target.value })} />
                </div>
                <div>
                  <Label>Modèle *</Label>
                  <Input value={editVehicle.modele || ""} onChange={e => setEditVehicle({ ...editVehicle, modele: e.target.value, nom: `${editVehicle.marque} ${e.target.value}` })} />
                </div>
              </div>
              <div>
                <Label>Nom du véhicule (unique) *</Label>
                <Input 
                  value={editVehicle.nom || ""} 
                  onChange={e => setEditVehicle({ ...editVehicle, nom: e.target.value })}
                  placeholder="Ex: Peugeot 108 Blanc"
                />
                {vehicles.some(v => v.nom.toLowerCase() === editVehicle.nom?.toLowerCase() && v.id !== editVehicle.id) && (
                  <p className="text-xs text-destructive mt-1">⚠️ Ce nom est déjà utilisé par un autre véhicule</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Année</Label>
                  <Input type="number" value={editVehicle.annee || 2024} onChange={e => setEditVehicle({ ...editVehicle, annee: +e.target.value })} />
                </div>
                <div>
                  <Label>Places</Label>
                  <Input type="number" value={editVehicle.nbPlaces || 5} onChange={e => setEditVehicle({ ...editVehicle, nbPlaces: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prix/jour (€) *</Label>
                  <Input type="number" value={editVehicle.prixJour || 0} onChange={e => setEditVehicle({ ...editVehicle, prixJour: +e.target.value })} />
                </div>
                <div>
                  <Label>Prix/heure (€)</Label>
                  <Input type="number" step="0.01" value={editVehicle.prixHeure || 0} onChange={e => setEditVehicle({ ...editVehicle, prixHeure: +e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Le total du jour ne dépasse pas le prix/jour</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={editVehicle.categorie} onValueChange={v => setEditVehicle({ ...editVehicle, categorie: v as Categorie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["MICRO", "COMPACTE", "BERLINE", "SUV"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transmission</Label>
                  <Select value={editVehicle.transmission} onValueChange={v => setEditVehicle({ ...editVehicle, transmission: v as Transmission })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUELLE">Manuelle</SelectItem>
                      <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Énergie</Label>
                  <Select value={editVehicle.energie} onValueChange={v => setEditVehicle({ ...editVehicle, energie: v as Energie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ESSENCE", "DIESEL", "ELECTRIQUE"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editVehicle.isHybride || false} onCheckedChange={v => setEditVehicle({ ...editVehicle, isHybride: v })} />
                <Label>Hybride (2 énergies)</Label>
              </div>
              <div>
                <Label>Km inclus/jour</Label>
                <Input type="number" value={editVehicle.kmInclus || 200} onChange={e => setEditVehicle({ ...editVehicle, kmInclus: +e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Adresse *</Label>
                  <Input value={locationForm.streetAddress} onChange={(e) => setLocationForm((prev) => ({ ...prev, streetAddress: e.target.value }))} placeholder="12 Rue de Rivoli" />
                </div>
                <div>
                  <Label>Ville * (une seule ville par véhicule)</Label>
                  <Input
                    value={locationForm.city}
                    onChange={(e) => {
                      const city = e.target.value;
                      setLocationForm((prev) => ({ ...prev, city }));
                      setEditVehicle((prev) => (prev ? { ...prev, villes: city ? [city] : [] } : prev));
                    }}
                    placeholder="Paris"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Chaque véhicule ne peut être disponible que dans une seule ville</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kilométrage actuel (km)</Label>
                  <Input type="number" value={editVehicle.kilométrage || 0} onChange={e => setEditVehicle({ ...editVehicle, kilométrage: +e.target.value })} />
                </div>
                <div>
                  <Label>Prix/heure (€)</Label>
                  <Input type="number" step="0.01" value={editVehicle.prixHeure || 0} onChange={e => setEditVehicle({ ...editVehicle, prixHeure: +e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Entretien requis - Kilométrage (km)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 150000" 
                  value={editVehicle.entretenueRequis?.kilométrage || ""} 
                  onChange={e => setEditVehicle({ 
                    ...editVehicle, 
                    entretenueRequis: { ...editVehicle.entretenueRequis, kilométrage: e.target.value ? +e.target.value : undefined } 
                  })} 
                />
              </div>
              <div>
                <Label>Entretien requis - Jours</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 14" 
                  value={editVehicle.entretenueRequis?.jours || ""} 
                  onChange={e => setEditVehicle({ 
                    ...editVehicle, 
                    entretenueRequis: { ...editVehicle.entretenueRequis, jours: e.target.value ? +e.target.value : undefined } 
                  })} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Frais additionnels</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newFrais = [...(editVehicle.autreFraisLibelle || []), { label: "", amount: 0 }];
                      setEditVehicle({ ...editVehicle, autreFraisLibelle: newFrais });
                    }}
                  >
                    + Ajouter
                  </Button>
                </div>
                {editVehicle.autreFraisLibelle && editVehicle.autreFraisLibelle.length > 0 && (
                  <div className="space-y-2">
                    {editVehicle.autreFraisLibelle.map((frais, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <Input 
                          placeholder="Libellé" 
                          value={frais.label} 
                          onChange={e => {
                            const updated = [...editVehicle.autreFraisLibelle!];
                            updated[idx].label = e.target.value;
                            setEditVehicle({ ...editVehicle, autreFraisLibelle: updated });
                          }}
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Montant (€)" 
                          type="number"
                          step="0.01"
                          value={frais.amount} 
                          onChange={e => {
                            const updated = [...editVehicle.autreFraisLibelle!];
                            updated[idx].amount = +e.target.value;
                            setEditVehicle({ ...editVehicle, autreFraisLibelle: updated });
                          }}
                          className="w-24"
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const updated = editVehicle.autreFraisLibelle!.filter((_, i) => i !== idx);
                            setEditVehicle({ ...editVehicle, autreFraisLibelle: updated });
                          }}
                          className="text-destructive"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.disponible} onCheckedChange={v => setEditVehicle({ ...editVehicle, disponible: v })} />
                  <Label>Disponible</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Images (upload)</Label>
                <Input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
                {editVehicle.photos && editVehicle.photos.length > 0 && (
                  <p className="text-xs text-muted-foreground">Images existantes: {editVehicle.photos.length}</p>
                )}
                {imageFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">Nouvelles images à envoyer: {imageFiles.length}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)} disabled={isSaving}>Annuler</Button>
            <Button onClick={saveVehicle} disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2"><Spinner />{isNew ? "Création..." : "Mise à jour..."}</span>
              ) : (
                isNew ? "Créer" : "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={!!deletingVehicleId}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteVehicle(deleteConfirm)} disabled={!!deletingVehicleId}>
              {deletingVehicleId ? (
                <span className="flex items-center gap-2"><Spinner />Suppression...</span>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}