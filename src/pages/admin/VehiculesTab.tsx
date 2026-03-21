import { useState } from "react";
import { Car, Plus, Edit, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { vehicleImages } from "@/data/vehicleImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type Vehicule, type Categorie, type Transmission, type Energie } from "@/data/mock";
import { emptyVehicle } from "./data";

interface VehiculesTabProps {
  vehicles: Vehicule[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicule[]>>;
}

export default function VehiculesTab({ vehicles, setVehicles }: VehiculesTabProps) {
  const { toast } = useToast();
  const [searchV, setSearchV] = useState("");
  const [editVehicle, setEditVehicle] = useState<Partial<Vehicule> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredVehicles = vehicles.filter(v => v.nom.toLowerCase().includes(searchV.toLowerCase()) || v.marque.toLowerCase().includes(searchV.toLowerCase()));

  const openNew = () => { setEditVehicle({ ...emptyVehicle, id: `v-${Date.now()}` }); setIsNew(true); };
  const openEdit = (v: Vehicule) => { setEditVehicle({ ...v }); setIsNew(false); };
  const saveVehicle = () => {
    if (!editVehicle) return;
    if (isNew) setVehicles(prev => [...prev, editVehicle as Vehicule]);
    else setVehicles(prev => prev.map(v => v.id === editVehicle.id ? editVehicle as Vehicule : v));
    setEditVehicle(null);
    toast({ title: isNew ? "Véhicule ajouté" : "Véhicule mis à jour" });
  };
  const deleteVehicle = (id: string) => { setVehicles(prev => prev.filter(v => v.id !== id)); setDeleteConfirm(null); toast({ title: "Véhicule supprimé" }); };

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
                    <TableHead className="hidden md:table-cell">Villes</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map(v => {
                    const img = vehicleImages[v.id];
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {img ? (
                              <img src={img} alt={v.nom} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Car className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                            <div>
                              <p className="font-medium">{v.nom}</p>
                              <p className="text-xs text-muted-foreground">{v.transmission} · {v.energie}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{v.categorie}</Badge></TableCell>
                        <TableCell className="font-semibold">{v.prixJour} €</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate hidden md:table-cell">{v.villes.join(", ")}</TableCell>
                        <TableCell>
                          {v.disponible && v.actif ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Disponible</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Indisponible</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(v.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
      </motion.div>

      {/* Vehicle Edit Dialog */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un véhicule" : "Modifier le véhicule"}</DialogTitle>
          </DialogHeader>
          {editVehicle && (
            <div className="grid gap-4 py-2">
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
                  <Label>Autre frais (€)</Label>
                  <Input type="number" placeholder="Optionnel" value={(editVehicle as any).autreFrais || ""} onChange={e => setEditVehicle({ ...editVehicle, autreFrais: e.target.value ? +e.target.value : undefined } as any)} />
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
                      {["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Km inclus/jour</Label>
                <Input type="number" value={editVehicle.kmInclus || 200} onChange={e => setEditVehicle({ ...editVehicle, kmInclus: +e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editVehicle.description || ""} onChange={e => setEditVehicle({ ...editVehicle, description: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.disponible} onCheckedChange={v => setEditVehicle({ ...editVehicle, disponible: v })} />
                  <Label>Disponible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.actif} onCheckedChange={v => setEditVehicle({ ...editVehicle, actif: v })} />
                  <Label>Actif</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)}>Annuler</Button>
            <Button onClick={saveVehicle}>{isNew ? "Créer" : "Enregistrer"}</Button>
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
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteVehicle(deleteConfirm)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
