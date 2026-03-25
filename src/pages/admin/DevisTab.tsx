import { useState } from "react";
import {
  Eye, Trash2, Search, Mail, Phone, MapPin, Calendar,
  Car, Building2, User, CheckCircle, XCircle, ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { MockDevis } from "./data";
import { devisStatColors } from "./data";

// ─── Types ────────────────────────────────────────────────────────────────────

// Détail d'un véhicule dans la proposition envoyée par l'admin
type PropositionVehicule = {
  typeVehicule: string;
  dateDebut: string;
  heureDebut: string;
  dateFin: string;
  heureFin: string;
  kmInclus: string;
  prixJour: string;
  autreFrais: string;
};

// Contrôle de la vue active dans la modal
type ActionType = "valider" | "refuser" | null;

const vehicleTypes = ["Micro", "Compacte", "Berline", "SUV"];

// Retourne un objet proposition vide
function emptyProposition(): PropositionVehicule {
  return {
    typeVehicule: "",
    dateDebut: "",
    heureDebut: "",
    dateFin: "",
    heureFin: "",
    kmInclus: "200",
    prixJour: "",
    autreFrais: "0",
  };
}

// ─────────────────────────────────────────────────────────────────────────────

interface DevisTabProps {
  devis: MockDevis[];
  setDevis: React.Dispatch<React.SetStateAction<MockDevis[]>>;
}

export default function DevisTab({ devis, setDevis }: DevisTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDevis, setSelectedDevis] = useState<MockDevis | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // null = vue détail, "valider" = formulaire proposition, "refuser" = formulaire refus
  const [action, setAction] = useState<ActionType>(null);

  // Un bloc par véhicule demandé
  const [propositions, setPropositions] = useState<PropositionVehicule[]>([]);

  // Commentaire de refus
  const [commentaireRefus, setCommentaireRefus] = useState("");
  const [refusError, setRefusError] = useState("");

  const filtered = devis.filter(d =>
    d.client.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  // Ouvre la modal et initialise les propositions selon le nombre de véhicules demandés
  const openDetail = (d: MockDevis) => {
    setSelectedDevis(d);
    setAction(null);
    setCommentaireRefus("");
    setRefusError("");
    setPropositions(Array.from({ length: d.nombreVehicules }, () => emptyProposition()));
  };

  const closeModal = () => {
    setSelectedDevis(null);
    setAction(null);
    setCommentaireRefus("");
    setRefusError("");
    setPropositions([]);
  };

  const handleDelete = (id: string) => {
    setDevis(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Devis supprimé" });
  };

  // Met à jour un champ d'une proposition spécifique
  const updateProposition = (index: number, key: keyof PropositionVehicule, value: string) => {
    setPropositions(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p));
  };

  // Validation et envoi de la proposition
  const handleValider = () => {
    const hasEmpty = propositions.some(p =>
      !p.typeVehicule || !p.dateDebut || !p.heureDebut || !p.dateFin || !p.heureFin || !p.prixJour
    );
    if (hasEmpty) {
      toast({ title: "Formulaire incomplet", description: "Remplissez tous les champs obligatoires pour chaque véhicule.", variant: "destructive" });
      return;
    }

    // Met le statut à "validé"
    setDevis(prev => prev.map(d =>
      d.id === selectedDevis?.id ? { ...d, statut: "validé" } : d
    ));

    toast({ title: "Proposition envoyée", description: `La proposition a été envoyée à ${selectedDevis?.email}.` });
    closeModal();
  };

  // Validation et envoi du refus
  const handleRefuser = () => {
    if (!commentaireRefus.trim()) {
      setRefusError("Un commentaire est requis pour justifier le refus.");
      return;
    }

    // Met le statut à "refusé" et sauvegarde le commentaire
    setDevis(prev => prev.map(d =>
      d.id === selectedDevis?.id ? { ...d, statut: "refusé", commentaireRefus } : d
    ));

    toast({ title: "Devis refusé", description: `${selectedDevis?.client} a été notifié par email.` });
    closeModal();
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
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        {devis.length === 0
                          ? "Aucune demande de devis pour le moment."
                          : "Aucune demande ne correspond à votre recherche."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(d => (
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
                            <Button variant="ghost" size="icon" onClick={() => openDetail(d)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(d.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Modal principale (détail / valider / refuser) ──────── */}
      <Dialog open={!!selectedDevis} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {/* Bouton retour quand on est dans un sous-formulaire */}
              {action && (
                <button onClick={() => setAction(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle>
                {action === "valider" && "Proposition de location"}
                {action === "refuser" && "Motif de refus"}
                {!action && `Détails du devis ${selectedDevis?.id}`}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* ── Vue détail ─────────────────────────────────────── */}
          {!action && selectedDevis && (
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

              {/* Affiche le motif de refus si présent */}
              {selectedDevis.statut === "refusé" && selectedDevis.commentaireRefus && (
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1">
                  <p className="text-xs font-medium text-destructive">Motif du refus</p>
                  <p className="text-sm text-muted-foreground">{selectedDevis.commentaireRefus}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">Créé le {selectedDevis.creeLe}</p>

              {/* Boutons d'action — uniquement si le devis est en attente */}
              {selectedDevis.statut === "en attente" && (
                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setAction("valider")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Valider
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => setAction("refuser")}
                  >
                    <XCircle className="h-4 w-4" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Vue proposition (valider) ──────────────────────── */}
          {action === "valider" && selectedDevis && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Remplissez les détails pour{" "}
                <span className="font-medium text-foreground">{selectedDevis.client}</span>.
                La proposition sera envoyée par email.
              </p>

              {/* Un bloc par véhicule demandé */}
              {propositions.map((p, index) => (
                <div key={index} className="space-y-3 p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold">
                    Véhicule {index + 1}
                    {selectedDevis.nombreVehicules > 1 ? ` / ${selectedDevis.nombreVehicules}` : ""}
                  </p>

                  {/* Type de véhicule */}
                  <div>
                    <Label className="text-xs">Type de véhicule *</Label>
                    <select
                      value={p.typeVehicule}
                      onChange={e => updateProposition(index, "typeVehicule", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    >
                      <option value="">Sélectionner</option>
                      {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Dates de prise */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Date de prise *</Label>
                      <Input type="date" value={p.dateDebut} onChange={e => updateProposition(index, "dateDebut", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Heure de prise *</Label>
                      <Input type="time" value={p.heureDebut} onChange={e => updateProposition(index, "heureDebut", e.target.value)} className="mt-1" />
                    </div>
                  </div>

                  {/* Dates de retour */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Date de retour *</Label>
                      <Input
                        type="date"
                        value={p.dateFin}
                        min={p.dateDebut || undefined} // retour ne peut pas être avant la prise
                        onChange={e => updateProposition(index, "dateFin", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Heure de retour *</Label>
                      <Input type="time" value={p.heureFin} onChange={e => updateProposition(index, "heureFin", e.target.value)} className="mt-1" />
                    </div>
                  </div>

                  {/* Tarification */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Km inclus/jour *</Label>
                      <Input type="number" value={p.kmInclus} onChange={e => updateProposition(index, "kmInclus", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Prix/jour (€) *</Label>
                      <Input type="number" value={p.prixJour} placeholder="0" onChange={e => updateProposition(index, "prixJour", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Autre frais (€)</Label>
                      <Input type="number" value={p.autreFrais} placeholder="0" onChange={e => updateProposition(index, "autreFrais", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}

              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)}>Annuler</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleValider}>
                  <CheckCircle className="h-4 w-4" />
                  Envoyer la proposition
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Vue refus ──────────────────────────────────────── */}
          {action === "refuser" && selectedDevis && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Expliquez à{" "}
                <span className="font-medium text-foreground">{selectedDevis.client}</span>{" "}
                pourquoi sa demande est refusée. Ce message lui sera envoyé par email.
              </p>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Motif du refus *</Label>
                <textarea
                  value={commentaireRefus}
                  onChange={e => { setCommentaireRefus(e.target.value); setRefusError(""); }}
                  placeholder="Ex : Les dates demandées ne sont pas disponibles pour cette catégorie de véhicule..."
                  rows={5}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none ${refusError ? "border-destructive" : "border-input"}`}
                />
                {refusError && <p className="text-xs text-destructive">{refusError}</p>}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)}>Annuler</Button>
                <Button variant="destructive" className="gap-2" onClick={handleRefuser}>
                  <XCircle className="h-4 w-4" />
                  Confirmer le refus
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirmation suppression ───────────────────────────── */}
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