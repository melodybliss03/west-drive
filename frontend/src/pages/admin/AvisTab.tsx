import { useState, useRef, Dispatch, SetStateAction } from "react";
import { Plus, Edit, Trash2, Search, Eye, Star, Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PaginationMeta } from "@/lib/api/types";
import { AvisRow, AvisSource } from "./data";

// ─── Données fictives ─────────────────────────────────────────────────────────

const MOCK_AVIS: AvisRow[] = [
  { id: "AV-001", auteur: "Naomie G.",    titre: "Ghislain est une personne agréable", contenu: "Ghislain est une personne agréable, sympathique et arrangeant. Son véhicule Citroën C3 est récent, une bonne prise en mains.", note: 5, source: "Getaround", date: "2020-12-23" },
  { id: "AV-002", auteur: "Omar R.",       titre: "Très bon contact",                  contenu: "It went very well, the car is in good conditions and the owner is welcoming.", note: 5, source: "Getaround", date: "2020-12-13" },
  { id: "AV-003", auteur: "Francisco",     titre: "Flexible and friendly",             contenu: "Thanks to Ghislain for being so flexible and friendly.", note: 5, source: "Turo",      date: "2025-10-08" },
  { id: "AV-004", auteur: "Michel-Ange",   titre: "Hôte à l'écoute",                  contenu: "La voiture est pratique avec un grand coffre, la prise en charge parfaite avec un hôte à l'écoute. Je le recommande.", note: 5, source: "Turo",      date: "2025-10-23" },
  { id: "AV-005", auteur: "Lynda",         titre: "Très satisfaite",                  contenu: "Je suis très satisfaite de ma location ! Tout s'est déroulé parfaitement, du processus de réservation à la remise du véhicule.", note: 5, source: "Google",    date: "2025-06-02" },
];

const SOURCES: AvisSource[] = ["Getaround", "Turo", "Google", "Direct", "Autre"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sourceColors: Record<AvisSource, string> = {
  Getaround: "bg-violet-500/10 text-violet-600 border-violet-200",
  Turo:      "bg-gray-500/10 text-gray-700 border-gray-300",
  Google:    "bg-blue-500/10 text-blue-600 border-blue-200",
  Direct:    "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Autre:     "bg-muted text-muted-foreground border-border",
};

function StarDisplay({ note, size = "sm" }: { note: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < note ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function emptyAvis(): Omit<AvisRow, "id" | "date"> {
  return { auteur: "", titre: "", contenu: "", note: 5, source: "Direct" };
}

// ─── Props Interface ──────────────────────────────────────────────────────────

interface AvisTabProps {
  avis: AvisRow[];
  setAvis: Dispatch<SetStateAction<AvisRow[]>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  meta: PaginationMeta | null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AvisTab({ avis, setAvis, page, setPage, meta }: AvisTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterNote, setFilterNote] = useState<string>("");

  // Modal détail
  const [viewAvis, setViewAvis] = useState<Avis | null>(null);

  // Modal ajout / édition
  const [editAvis, setEditAvis] = useState<Partial<Avis> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal suppression
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const filtered = avis.filter(a => {
    const matchSearch =
      a.auteur.toLowerCase().includes(search.toLowerCase()) ||
      a.contenu.toLowerCase().includes(search.toLowerCase()) ||
      a.titre.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource ? a.source === filterSource : true;
    const matchNote = filterNote ? a.note === Number(filterNote) : true;
    return matchSearch && matchSource && matchNote;
  });

  // ── Ouvrir formulaire ajout ────────────────────────────────────────────────
  const openNew = () => {
    setEditAvis(emptyAvis());
    setIsNew(true);
    setErrors({});
  };

  // ── Ouvrir formulaire édition ──────────────────────────────────────────────
  const openEdit = (a: Avis) => {
    setEditAvis({ ...a });
    setIsNew(false);
    setErrors({});
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editAvis?.auteur?.trim()) errs.auteur = "Le nom de l'auteur est requis.";
    if (!editAvis?.contenu?.trim()) errs.contenu = "Le contenu est requis.";
    if (!editAvis?.note || editAvis.note < 1 || editAvis.note > 5) errs.note = "La note doit être entre 1 et 5.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Sauvegarder ────────────────────────────────────────────────────────────
  const saveAvis = () => {
    if (!validate() || !editAvis) return;

    if (isNew) {
      const nouvel: Avis = {
        id: `AV-${String(avis.length + 1).padStart(3, "0")}`,
        auteur: editAvis.auteur!,
        titre: editAvis.titre || "",
        contenu: editAvis.contenu!,
        note: editAvis.note!,
        source: (editAvis.source as AvisSource) || "Direct",
        date: new Date().toISOString().split("T")[0],
      };
      setAvis(prev => [nouvel, ...prev]);
      toast({ title: "Avis ajouté" });
    } else {
      setAvis(prev => prev.map(a => a.id === editAvis.id ? { ...a, ...editAvis } as Avis : a));
      toast({ title: "Avis mis à jour" });
    }

    setEditAvis(null);
  };

  // ── Supprimer ──────────────────────────────────────────────────────────────
  const deleteAvis = (id: string) => {
    setAvis(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Avis supprimé" });
  };

  // ── Import fichier (CSV / Excel / PDF) ────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const supported = ["csv", "xlsx", "xls", "pdf"];

    if (!ext || !supported.includes(ext)) {
      toast({ title: "Format non supporté", description: "Formats acceptés : CSV, Excel (.xlsx/.xls), PDF.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    // Simulation d'import — à brancher sur un parser réel (PapaParse, SheetJS…)
    toast({
      title: "Import reçu",
      description: `Le fichier "${file.name}" a bien été reçu. L'import sera traité prochainement.`,
    });

    e.target.value = "";
  };

  // ── Statistiques rapides ───────────────────────────────────────────────────
  const avgNote = avis.length
    ? (avis.reduce((acc, a) => acc + a.note, 0) / avis.length).toFixed(1)
    : "—";

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* ── En-tête ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Avis clients</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {avis.length} avis · Note moyenne : {avgNote}/5
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Importer
            </Button>

            {/* Ajouter */}
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter un avis
            </Button>
          </div>
        </div>

        {/* ── Formats acceptés ───────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Import accepté : <span className="font-medium">CSV, Excel (.xlsx/.xls), PDF</span>
        </div>

        {/* ── Filtres ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par auteur, titre ou contenu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-40"
          >
            <option value="">Toutes sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterNote}
            onChange={e => setFilterNote(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-36"
          >
            <option value="">Toutes notes</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>

        {/* ── Tableau ────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead className="hidden sm:table-cell">Titre</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        {avis.length === 0
                          ? "Aucun avis pour le moment."
                          : "Aucun avis ne correspond à votre recherche."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.id}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{a.auteur}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm max-w-[140px] truncate">{a.titre}</TableCell>
                        {/* Contenu tronqué */}
                        <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2">{a.contenu}</span>
                        </TableCell>
                        <TableCell>
                          <StarDisplay note={a.note} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={sourceColors[a.source]}>
                            {a.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell text-muted-foreground">
                          {new Date(a.date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewAvis(a)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(a.id)}
                            >
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

      {/* ── Modal Détail ─────────────────────────────────────────── */}
      <Dialog open={!!viewAvis} onOpenChange={() => setViewAvis(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'avis {viewAvis?.id}</DialogTitle>
          </DialogHeader>
          {viewAvis && (
            <div className="space-y-5">
              {/* En-tête */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <p className="font-display font-bold text-lg">{viewAvis.auteur}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(viewAvis.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <Badge variant="outline" className={sourceColors[viewAvis.source]}>
                  {viewAvis.source}
                </Badge>
              </div>

              {/* Note */}
              <div className="flex items-center gap-3">
                <StarDisplay note={viewAvis.note} size="md" />
                <span className="text-sm font-semibold">{viewAvis.note} / 5</span>
              </div>

              {/* Titre */}
              {viewAvis.titre && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Titre</p>
                  <p className="font-semibold">{viewAvis.titre}</p>
                </div>
              )}

              {/* Contenu complet */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Contenu</p>
                <p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-4">{viewAvis.contenu}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Ajout / Édition ─────────────────────────────────── */}
      <Dialog open={!!editAvis} onOpenChange={() => setEditAvis(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un avis" : "Modifier l'avis"}</DialogTitle>
          </DialogHeader>
          {editAvis && (
            <div className="grid gap-4 py-2">

              {/* Auteur */}
              <div className="space-y-1.5">
                <Label>Nom de l'auteur *</Label>
                <Input
                  value={editAvis.auteur || ""}
                  onChange={e => setEditAvis({ ...editAvis, auteur: e.target.value })}
                  placeholder="Ex : Sophie M."
                  className={errors.auteur ? "border-destructive" : ""}
                />
                {errors.auteur && <p className="text-xs text-destructive">{errors.auteur}</p>}
              </div>

              {/* Titre */}
              <div className="space-y-1.5">
                <Label>Titre <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input
                  value={editAvis.titre || ""}
                  onChange={e => setEditAvis({ ...editAvis, titre: e.target.value })}
                  placeholder="Ex : Très bonne expérience"
                />
              </div>

              {/* Contenu */}
              <div className="space-y-1.5">
                <Label>Contenu *</Label>
                <textarea
                  value={editAvis.contenu || ""}
                  onChange={e => setEditAvis({ ...editAvis, contenu: e.target.value })}
                  placeholder="Contenu de l'avis…"
                  rows={5}
                  className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.contenu ? "border-destructive" : "border-input"}`}
                />
                {errors.contenu && <p className="text-xs text-destructive">{errors.contenu}</p>}
              </div>

              {/* Note + Source */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Note *</Label>
                  <Select
                    value={String(editAvis.note || 5)}
                    onValueChange={v => setEditAvis({ ...editAvis, note: Number(v) })}
                  >
                    <SelectTrigger className={errors.note ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          <span className="flex items-center gap-2">
                            {n} {"★".repeat(n)}{"☆".repeat(5 - n)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.note && <p className="text-xs text-destructive">{errors.note}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select
                    value={editAvis.source || "Direct"}
                    onValueChange={v => setEditAvis({ ...editAvis, source: v as AvisSource })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAvis(null)}>Annuler</Button>
            <Button onClick={saveAvis}>
              {isNew ? "Ajouter" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Suppression ────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Voulez-vous vraiment supprimer cet avis ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteAvis(deleteConfirm)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}