import { useState, useRef, Dispatch, SetStateAction } from "react";
import * as XLSX from "xlsx";
import { Plus, Edit, Trash2, Search, Eye, Star, Upload, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PaginationMeta } from "@/lib/api/types";
import { AvisRow } from "./data";
import { reviewsService } from "@/lib/api/services";

// === Helpers ===

const KNOWN_SOURCE_COLORS: Record<string, string> = {
  getaround: "bg-violet-500/10 text-violet-600 border-violet-200",
  turo: "bg-gray-500/10 text-gray-700 border-gray-300",
  google: "bg-blue-500/10 text-blue-600 border-blue-200",
  direct: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};
function sourceColor(source: string): string {
  return KNOWN_SOURCE_COLORS[source.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

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

function emptyForm(): Omit<AvisRow, "id" | "date"> {
  return { auteur: "", titre: "", contenu: "", note: 5, source: "Direct", status: "PUBLISHED" };
}

// === Props ===

interface AvisTabProps {
  avis: AvisRow[];
  setAvis: Dispatch<SetStateAction<AvisRow[]>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  meta: PaginationMeta | null;
  onRefresh: () => void;
  hasPermission: (perm: string) => boolean;
}

// === Component ===

export default function AvisTab({ avis, page, setPage, meta, onRefresh, hasPermission }: AvisTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterNote, setFilterNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [viewAvis, setViewAvis] = useState<AvisRow | null>(null);
  const [editAvis, setEditAvis] = useState<Partial<AvisRow> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const filtered = avis.filter(a => {
    const q = search.toLowerCase();
    return (
      (!q || a.auteur.toLowerCase().includes(q) || a.contenu.toLowerCase().includes(q) || a.titre.toLowerCase().includes(q)) &&
      (!filterSource || a.source.toLowerCase() === filterSource.toLowerCase()) &&
      (!filterNote || a.note === Number(filterNote)) &&
      (!filterStatus || a.status === filterStatus)
    );
  });

  const avgNote = avis.length ? (avis.reduce((acc, a) => acc + a.note, 0) / avis.length).toFixed(1) : "—";

  const openNew = () => { setEditAvis(emptyForm()); setIsNew(true); setErrors({}); };
  const openEdit = (a: AvisRow) => { setEditAvis({ ...a }); setIsNew(false); setErrors({}); };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editAvis?.auteur?.trim()) errs.auteur = "Le nom de l'auteur est requis.";
    if (!editAvis?.contenu?.trim()) errs.contenu = "Le contenu est requis.";
    if (!editAvis?.note || editAvis.note < 1 || editAvis.note > 5) errs.note = "La note doit etre entre 1 et 5.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveAvis = async () => {
    if (!validate() || !editAvis) return;
    setIsSaving(true);
    try {
      if (isNew) {
        await reviewsService.adminCreate({
          authorName: editAvis.auteur!,
          title: editAvis.titre || undefined,
          rating: editAvis.note!,
          content: editAvis.contenu!,
          source: editAvis.source || undefined,
          status: editAvis.status as "PUBLISHED" | "DRAFT",
        });
        toast({ title: "Avis ajouté" });
      } else {
        await reviewsService.adminUpdate(editAvis.id!, {
          authorName: editAvis.auteur!,
          title: editAvis.titre || null,
          rating: editAvis.note!,
          content: editAvis.contenu!,
          source: editAvis.source || null,
          status: editAvis.status as "PUBLISHED" | "DRAFT",
        });
        toast({ title: "Avis mis à jour" });
      }
      setEditAvis(null);
      onRefresh();
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAvis = async (id: string) => {
    setIsDeleting(true);
    try {
      await reviewsService.adminDelete(id);
      setDeleteConfirm(null);
      toast({ title: "Avis supprimé" });
      onRefresh();
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFFAuteur;Titre;Contenu;Note;Source\nJean D.;Super vehicule;Tres satisfait.;5;Getaround\n"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-import-avis.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      toast({ title: "Format non supporté", description: "CSV ou Excel uniquement.", variant: "destructive" });
      e.target.value = ""; return;
    }
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const payload = rows.map(row => {
        const auteur = String(row["Auteur"] ?? row["auteur"] ?? "").trim();
        const contenu = String(row["Contenu"] ?? row["contenu"] ?? "").trim();
        const note = Number(row["Note"] ?? row["note"] ?? 5);
        if (!auteur || !contenu || isNaN(note) || note < 1 || note > 5) return null;
        return { authorName: auteur, title: String(row["Titre"] ?? row["titre"] ?? "").trim() || undefined, content: contenu, rating: note, source: String(row["Source"] ?? row["source"] ?? "Direct").trim() || "Direct" };
      }).filter((r): r is NonNullable<typeof r> => r !== null);
      if (!payload.length) { toast({ title: "Aucune ligne valide.", variant: "destructive" }); return; }
      const result = await reviewsService.adminBulkCreate(payload);
      toast({ title: "Import terminé", description: `${result.created} créés, ${result.skipped} ignorés.` });
      onRefresh();
    } catch {
      toast({ title: "Erreur import", variant: "destructive" });
    } finally {
      setIsImporting(false); e.target.value = "";
    }
  };

  const totalPages = meta?.totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = meta?.hasNextPage ?? false;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Avis clients</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{meta?.totalItems ?? avis.length} avis · Note moyenne : {avgNote}/5</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Modèle CSV
            </Button>
            {hasPermission('avis.write') && (
              <>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                  <Upload className="h-4 w-4" />{isImporting ? "Import..." : "Importer CSV/Excel"}
                </Button>
                <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
              </>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Toutes sources</option>
            {["Getaround", "Turo", "Google", "Direct", "Autre"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterNote} onChange={e => setFilterNote(e.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Toutes notes</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} etoile{n > 1 ? "s" : ""}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            <option value="PUBLISHED">Publié</option>
            <option value="DRAFT">Brouillon</option>
          </select>
        </div>

        {/* Tableau */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auteur</TableHead>
                    <TableHead className="hidden sm:table-cell">Titre</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden md:table-cell">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        {avis.length === 0 ? "Aucun avis pour le moment." : "Aucun resultat."}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium whitespace-nowrap">{a.auteur}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm max-w-[140px] truncate">{a.titre}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]"><span className="line-clamp-2">{a.contenu}</span></TableCell>
                      <TableCell><StarDisplay note={a.note} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        {a.source ? <Badge variant="outline" className={sourceColor(a.source)}>{a.source}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                          {a.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs hidden lg:table-cell text-muted-foreground">{new Date(a.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewAvis(a)}><Eye className="h-4 w-4" /></Button>
                          {hasPermission('avis.write') && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                          )}
                          {hasPermission('avis.write') && (
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(a.id)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Page {page} / {totalPages} · {meta?.totalItems ?? "-"} avis</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-1">{page}</span>
              <Button size="sm" variant="outline" disabled={!canNext} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

      </motion.div>

      {/* Modal Détail */}
      <Dialog open={!!viewAvis} onOpenChange={() => setViewAvis(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Détail de l'avis</DialogTitle></DialogHeader>
          {viewAvis && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
                <div>
                  <p className="font-display font-bold text-lg">{viewAvis.auteur}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(viewAvis.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {viewAvis.source && <Badge variant="outline" className={sourceColor(viewAvis.source)}>{viewAvis.source}</Badge>}
                  <Badge variant={viewAvis.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">{viewAvis.status === "PUBLISHED" ? "Publié" : "Brouillon"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3"><StarDisplay note={viewAvis.note} size="md" /><span className="text-sm font-semibold">{viewAvis.note} / 5</span></div>
              {viewAvis.titre && <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Titre</p><p className="font-semibold">{viewAvis.titre}</p></div>}
              <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Contenu</p><p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-4">{viewAvis.contenu}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ajout/Édition */}
      <Dialog open={!!editAvis} onOpenChange={() => setEditAvis(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isNew ? "Ajouter un avis" : "Modifier l'avis"}</DialogTitle></DialogHeader>
          {editAvis && (
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Nom de l'auteur *</Label>
                <Input value={editAvis.auteur || ""} onChange={e => setEditAvis({ ...editAvis, auteur: e.target.value })} placeholder="Ex : Sophie M." className={errors.auteur ? "border-destructive" : ""} />
                {errors.auteur && <p className="text-xs text-destructive">{errors.auteur}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Titre <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input value={editAvis.titre || ""} onChange={e => setEditAvis({ ...editAvis, titre: e.target.value })} placeholder="Ex : Tres bonne experience" />
              </div>
              <div className="space-y-1.5">
                <Label>Contenu *</Label>
                <textarea rows={4} value={editAvis.contenu || ""} onChange={e => setEditAvis({ ...editAvis, contenu: e.target.value })} placeholder="Decrivez l'experience..." className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none ${errors.contenu ? "border-destructive" : ""}`} />
                {errors.contenu && <p className="text-xs text-destructive">{errors.contenu}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Note *</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setEditAvis({ ...editAvis, note: n })} className="focus:outline-none">
                      <Star className={`h-6 w-6 transition-colors ${n <= (editAvis.note ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"}`} />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">{editAvis.note}/5</span>
                </div>
                {errors.note && <p className="text-xs text-destructive">{errors.note}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input value={editAvis.source || ""} onChange={e => setEditAvis({ ...editAvis, source: e.target.value })} placeholder="Ex : Getaround, Turo, Google..." />
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <select value={editAvis.status || "PUBLISHED"} onChange={e => setEditAvis({ ...editAvis, status: e.target.value as "PUBLISHED" | "DRAFT" })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="PUBLISHED">Publié</option>
                  <option value="DRAFT">Brouillon</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAvis(null)} disabled={isSaving}>Annuler</Button>
            <Button onClick={saveAvis} disabled={isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Action irreversible. L'avis sera definitvement supprime.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteAvis(deleteConfirm)} disabled={isDeleting}>{isDeleting ? "Suppression..." : "Supprimer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
