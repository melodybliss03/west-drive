import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Search, Eye, ChevronLeft, ChevronRight, Upload, Loader2 } from "lucide-react";
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
import { blogService, type BlogArticleDto } from "@/lib/api/services";
import { formatDate } from "@/lib/format";
import RichTextEditor from "@/components/ui/RichTextEditor";

// ── Types ──

export interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  mainImageUrl: string;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string;
  createdAt: string;
}

function emptyForm(): Omit<BlogRow, "id" | "createdAt"> & { content: string } {
  return {
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    mainImageUrl: "",
    status: "DRAFT",
    publishedAt: "",
    content: "",
  };
}

// ── Props ──

interface BlogTabProps {
  hasPermission: (perm: string) => boolean;
}

// ── Edit form with rich text + image upload ──

function EditForm({
  editArticle,
  setEditArticle,
  errors,
}: {
  editArticle: Partial<BlogRow> & { content?: string };
  setEditArticle: (val: (Partial<BlogRow> & { content?: string }) | null) => void;
  errors: Record<string, string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Le fichier doit être une image", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "L'image ne doit pas dépasser 8 Mo", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const result = await blogService.adminUploadImage(file);
      setEditArticle({ ...editArticle, mainImageUrl: result.url });
      toast({ title: "Image importée" });
    } catch {
      toast({ title: "Erreur lors de l'import de l'image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>
            Titre <span className="text-destructive">*</span>
          </Label>
          <Input
            value={editArticle.title ?? ""}
            onChange={(e) => setEditArticle({ ...editArticle, title: e.target.value })}
          />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={editArticle.slug ?? ""}
            onChange={(e) => setEditArticle({ ...editArticle, slug: e.target.value })}
            placeholder="Auto-généré si vide"
          />
        </div>
      </div>

      <div>
        <Label>Extrait</Label>
        <RichTextEditor
          value={editArticle.excerpt ?? ""}
          onChange={(html) => setEditArticle({ ...editArticle, excerpt: html })}
          placeholder="Résumé court de l'article..."
          minimal
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Catégorie</Label>
          <Input
            value={editArticle.category ?? ""}
            onChange={(e) => setEditArticle({ ...editArticle, category: e.target.value })}
            placeholder="ex: Conseils pratiques"
          />
        </div>
        <div>
          <Label>Statut</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={editArticle.status ?? "DRAFT"}
            onChange={(e) =>
              setEditArticle({ ...editArticle, status: e.target.value as "PUBLISHED" | "DRAFT" })
            }
          >
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </div>
        <div>
          <Label>Date de publication</Label>
          <Input
            type="datetime-local"
            value={editArticle.publishedAt ? editArticle.publishedAt.slice(0, 16) : ""}
            onChange={(e) =>
              setEditArticle({
                ...editArticle,
                publishedAt: e.target.value ? new Date(e.target.value).toISOString() : "",
              })
            }
          />
        </div>
      </div>

      {/* Image principale : upload fichier + URL */}
      <div>
        <Label>Image principale</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Import...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" /> Importer une image
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">ou</span>
          <Input
            className="flex-1"
            value={editArticle.mainImageUrl ?? ""}
            onChange={(e) => setEditArticle({ ...editArticle, mainImageUrl: e.target.value })}
            placeholder="Coller l'URL de l'image..."
          />
        </div>
        {editArticle.mainImageUrl && (
          <img
            src={editArticle.mainImageUrl}
            alt="Aperçu"
            className="mt-2 h-32 object-cover rounded-md"
          />
        )}
      </div>

      <div>
        <Label>
          Contenu <span className="text-destructive">*</span>
        </Label>
        <RichTextEditor
          value={editArticle.content ?? ""}
          onChange={(html) => setEditArticle({ ...editArticle, content: html })}
          placeholder="Rédigez le contenu de l'article..."
          className="min-h-[250px]"
        />
        {errors.content && <p className="text-xs text-destructive mt-1">{errors.content}</p>}
      </div>
    </div>
  );
}

// ── Component ──

export default function BlogTab({ hasPermission }: BlogTabProps) {
  const { toast } = useToast();

  const [articles, setArticles] = useState<BlogRow[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [viewArticle, setViewArticle] = useState<(BlogRow & { content: string }) | null>(null);
  const [editArticle, setEditArticle] = useState<(Partial<BlogRow> & { content?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Data loading ──

  useEffect(() => {
    if (!hasPermission("blog.read")) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await blogService.adminList({ page, limit: 10 });
        setArticles(
          result.items.map((a: BlogArticleDto) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt ?? "",
            category: a.category ?? "",
            mainImageUrl: a.mainImageUrl ?? "",
            status: a.status,
            publishedAt: a.publishedAt ?? "",
            createdAt: a.createdAt,
          })),
        );
        setMeta(result.meta);
      } catch {
        setArticles([]);
        setMeta(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, refreshKey, hasPermission]);

  // ── Filtered list (client-side for search within loaded page) ──

  const filtered = articles.filter((a) => {
    const q = search.toLowerCase();
    return (
      (!q || a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)) &&
      (!filterStatus || a.status === filterStatus) &&
      (!filterCategory || a.category.toLowerCase() === filterCategory.toLowerCase())
    );
  });

  // ── CRUD ──

  const openNew = () => {
    setEditArticle(emptyForm());
    setIsNew(true);
    setErrors({});
  };

  const openEdit = async (row: BlogRow) => {
    try {
      const full = await blogService.adminGetById(row.id).catch(() => null);
      setEditArticle({
        ...row,
        content: full?.content ?? "",
      });
    } catch {
      setEditArticle({ ...row, content: "" });
    }
    setIsNew(false);
    setErrors({});
  };

  const openView = async (row: BlogRow) => {
    try {
      const full = await blogService.adminGetById(row.id).catch(() => null);
      setViewArticle({
        ...row,
        content: full?.content ?? "",
      });
    } catch {
      setViewArticle({ ...row, content: "<p>Impossible de charger le contenu.</p>" });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editArticle?.title?.trim()) errs.title = "Le titre est requis.";
    if (!editArticle?.content?.trim()) errs.content = "Le contenu est requis.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveArticle = async () => {
    if (!validate() || !editArticle) return;
    setIsSaving(true);
    try {
      if (isNew) {
        await blogService.adminCreate({
          title: editArticle.title!,
          slug: editArticle.slug || undefined,
          excerpt: editArticle.excerpt || undefined,
          content: editArticle.content!,
          category: editArticle.category || undefined,
          mainImageUrl: editArticle.mainImageUrl || undefined,
          status: editArticle.status as "PUBLISHED" | "DRAFT",
          publishedAt: editArticle.publishedAt || undefined,
        });
        toast({ title: "Article créé" });
      } else {
        await blogService.adminUpdate(editArticle.id!, {
          title: editArticle.title!,
          slug: editArticle.slug || undefined,
          excerpt: editArticle.excerpt || undefined,
          content: editArticle.content!,
          category: editArticle.category || undefined,
          mainImageUrl: editArticle.mainImageUrl || undefined,
          status: editArticle.status as "PUBLISHED" | "DRAFT",
          publishedAt: editArticle.publishedAt || undefined,
        });
        toast({ title: "Article mis à jour" });
      }
      setEditArticle(null);
      setRefreshKey((k) => k + 1);
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteArticle = async (id: string) => {
    setIsDeleting(true);
    try {
      await blogService.adminDelete(id);
      setDeleteConfirm(null);
      toast({ title: "Article supprimé" });
      setRefreshKey((k) => k + 1);
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = meta?.totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = meta?.hasNextPage ?? false;

  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort();

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Articles de blog</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta?.totalItems ?? articles.length} article{(meta?.totalItems ?? articles.length) > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasPermission("blog.write") && (
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Nouvel article
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Titre, slug..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-36">
                <Label className="text-xs text-muted-foreground">Statut</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="PUBLISHED">Publié</option>
                  <option value="DRAFT">Brouillon</option>
                </select>
              </div>
              <div className="w-40">
                <Label className="text-xs text-muted-foreground">Catégorie</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">Toutes</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                    <TableHead className="hidden lg:table-cell">Slug</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun article trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">{a.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {a.category ? (
                            <Badge variant="outline" className="text-xs">
                              {a.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono max-w-[180px] truncate">
                          {a.slug}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={a.status === "PUBLISHED" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {a.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {a.publishedAt ? formatDate(a.publishedAt) : formatDate(a.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(a)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {hasPermission("blog.write") && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => setDeleteConfirm(a.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── View dialog ── */}
      <Dialog open={!!viewArticle} onOpenChange={() => setViewArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewArticle?.title}</DialogTitle>
          </DialogHeader>
          {viewArticle && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {viewArticle.category && <Badge variant="outline">{viewArticle.category}</Badge>}
                <Badge variant={viewArticle.status === "PUBLISHED" ? "default" : "secondary"}>
                  {viewArticle.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                </Badge>
                <span>{viewArticle.publishedAt ? formatDate(viewArticle.publishedAt) : formatDate(viewArticle.createdAt)}</span>
              </div>
              {viewArticle.mainImageUrl && (
                <img
                  src={viewArticle.mainImageUrl}
                  alt={viewArticle.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              {viewArticle.excerpt && (
                <div
                  className="text-sm text-muted-foreground italic prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: viewArticle.excerpt }}
                />
              )}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: viewArticle.content }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit/Create dialog ── */}
      <Dialog open={!!editArticle} onOpenChange={() => setEditArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nouvel article" : "Modifier l'article"}</DialogTitle>
          </DialogHeader>
          {editArticle && (
            <EditForm
              editArticle={editArticle}
              setEditArticle={setEditArticle}
              errors={errors}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditArticle(null)}>
              Annuler
            </Button>
            <Button onClick={saveArticle} disabled={isSaving}>
              {isSaving ? "Enregistrement..." : isNew ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cet article ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteArticle(deleteConfirm)}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
