import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { blogService, BlogArticleDto, BlogListResponse } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { BLOG_ARTICLES, BLOG_CATEGORIES, type BlogArticle } from "@/data/blog";

const DEFAULT_PAGE_SIZE = 6;

// Pagination locale sur les articles statiques
function paginateStatic(items: BlogArticle[], page: number, limit: number, category: string, search: string) {
  let filtered = items;
  if (category) filtered = filtered.filter(a => a.category === category);
  if (search) filtered = filtered.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(search.toLowerCase())
  );
  // Tri par date décroissante
  filtered = [...filtered].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const start = (page - 1) * limit;
  return {
    items: filtered.slice(start, start + limit),
    meta: { page, limit, totalItems, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages },
  };
}

export default function Blog() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data: apiData, isLoading, isError } = useQuery<BlogListResponse, Error, BlogListResponse>({
    queryKey: ["blog-articles", page, category, search],
    queryFn: () => blogService.list({ page, limit: DEFAULT_PAGE_SIZE, category, search }),
    refetchOnWindowFocus: false,
  });

  // Si l'API répond avec des articles → on les utilise, sinon données statiques
  const hasApiData = apiData?.items && apiData.items.length > 0;
  const source = hasApiData
    ? { items: apiData.items as BlogArticle[], meta: apiData.meta }
    : paginateStatic(BLOG_ARTICLES, page, DEFAULT_PAGE_SIZE, category, search);

  const articles = source.items;
  const meta = source.meta;

  // Catégories depuis l'API ou depuis les données statiques
  const categories = useMemo(() => {
    if (hasApiData && apiData?.items) {
      const vals = apiData.items.map(a => a.category ?? "").filter(Boolean);
      return Array.from(new Set(vals)).sort();
    }
    return BLOG_CATEGORIES;
  }, [hasApiData, apiData]);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleCategory = (val: string) => { setCategory(val); setPage(1); };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="pt-10"><Header /></div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Blog Mobilité & Astuces voiture
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Conseils, actualités et retours d'expérience pour optimiser votre location de voiture
              et mieux gérer vos déplacements en Île-de-France.
            </p>
            <Link to="/vehicules">
              <Button size="lg" className="gap-2 text-base px-8">
                Voir les véhicules disponibles <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Filtres + Articles ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12">

        {/* Barre de recherche + filtre catégorie */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={category}
            onChange={e => handleCategory(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Chargement uniquement si pas d'articles à afficher */}
        {isLoading && articles.length === 0 && (
          <p className="text-sm text-muted-foreground mb-6">Chargement des articles...</p>
        )}
        {isError && articles.length === 0 && (
          <p className="text-sm text-destructive mb-6">Impossible de charger les articles pour le moment.</p>
        )}

        {/* Grille articles */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {article.mainImageUrl && (
                  <img
                    src={article.mainImageUrl}
                    alt={article.title}
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-primary">{article.category || "Général"}</span>
                    {" · "}
                    {new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h2 className="font-display font-semibold text-lg mb-2 leading-snug">{article.title}</h2>
                  <div className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.excerpt }} />
                  <Link to={`/blog/${article.slug}`}>
                    <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                      Lire l'article <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="text-center text-sm text-muted-foreground py-16">
              Aucun article ne correspond à votre recherche.
            </p>
          )
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.page} / {meta.totalPages}
            </span>
            <Button
              disabled={!meta.hasNextPage}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}