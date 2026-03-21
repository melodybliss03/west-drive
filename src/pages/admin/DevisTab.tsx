import { useState } from "react";
import { Eye, Trash2, Search, Mail, Phone, MapPin, Calendar, Car, Building2, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { MockDevis } from "./data";
import { devisStatColors } from "./data";

interface DevisTabProps {
  devis: MockDevis[];
  setDevis: React.Dispatch<React.SetStateAction<MockDevis[]>>;
}

export default function DevisTab({ devis, setDevis }: DevisTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDevis, setSelectedDevis] = useState<MockDevis | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = devis.filter(d =>
    d.client.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setDevis(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Devis supprimé" });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-display font-bold">Demandes de devis</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
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
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead className="hidden sm:table-cell">Période</TableHead>
                    <TableHead className="hidden md:table-cell">Créé le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.client}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={d.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                          {d.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{d.nombreVehicules}x {d.typeVehicule}</span>
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{d.dateDebut} → {d.dateFin}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{d.creeLe}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={devisStatColors[d.statut] || ""}>{d.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedDevis(d)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(d.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!selectedDevis} onOpenChange={() => setSelectedDevis(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du devis {selectedDevis?.id}</DialogTitle>
          </DialogHeader>
          {selectedDevis && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <p className="font-display font-bold text-lg">{selectedDevis.client}</p>
                  <Badge variant="outline" className={devisStatColors[selectedDevis.statut] || ""}>{selectedDevis.statut}</Badge>
                </div>
                <Badge variant="outline" className={selectedDevis.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                  {selectedDevis.type === "entreprise" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                  {selectedDevis.type}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.email}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.telephone}</span></div>
                  <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.ville}</span></div>
                  {selectedDevis.nomEntreprise && (
                    <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.nomEntreprise}</span></div>
                  )}
                </div>
                {selectedDevis.siret && (
                  <p className="text-xs text-muted-foreground">SIRET : {selectedDevis.siret}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Véhicule demandé</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm"><Car className="h-4 w-4 text-muted-foreground" /><span>{selectedDevis.typeVehicule}</span></div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Qté :</span><span className="font-semibold">{selectedDevis.nombreVehicules}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Période</p>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedDevis.dateDebut} → {selectedDevis.dateFin}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Créé le {selectedDevis.creeLe}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Voulez-vous vraiment supprimer ce devis ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
