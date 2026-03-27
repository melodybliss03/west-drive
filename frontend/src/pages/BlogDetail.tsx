import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { blogService, BlogArticleDto } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { ArrowLeft, ChevronRight, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { BLOG_ARTICLES, type BlogArticle } from "@/data/blog";

// ── CTA réutilisable ───────────────────────────────────────────────
function CtaBlock() {
  return (
    <div className="my-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-3">
      <p className="font-display font-semibold text-lg">Prêt à prendre la route ?</p>
      <p className="text-sm text-muted-foreground">
        Découvrez nos véhicules disponibles dès aujourd'hui et réservez en quelques clics.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/vehicules">
          <Button className="gap-2">
            Voir les véhicules <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/vehicules">
          <Button variant="outline">Réserver maintenant</Button>
        </Link>
      </div>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: apiData, isLoading, isError } = useQuery<BlogArticleDto>({
    queryKey: ["blog-article", slug],
    queryFn: () => {
      if (!slug) throw new Error("Slug manquant");
      return blogService.getBySlug(slug);
    },
    enabled: Boolean(slug),
    refetchOnWindowFocus: false,
  });

  // Fallback sur les données statiques si l'API ne répond pas
  const staticArticle: BlogArticle | undefined = BLOG_ARTICLES.find(a => a.slug === slug);
  const article = apiData ?? staticArticle;

  // ── États de chargement ───────────────────────────────────────────
  if (isLoading && !staticArticle) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <TopBar />
        <div className="pt-10"><Header /></div>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground">
          Chargement de l'article...
        </div>
        <Footer />
      </main>
    );
  }

  if ((isError && !staticArticle) || !article) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <TopBar />
        <div className="pt-10"><Header /></div>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <p className="text-muted-foreground">Article introuvable.</p>
          <Link to="/blog">
            <Button variant="outline">Retour au blog</Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Sépare le contenu en deux parties pour insérer le CTA au milieu
  const contentParts = article.content.split("</h2>");
  const midpoint = Math.floor(contentParts.length / 2);
  const firstHalf = contentParts.slice(0, midpoint).join("</h2>") + (contentParts.length > 1 ? "</h2>" : "");
  const secondHalf = contentParts.slice(midpoint).join("</h2>");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="pt-10"><Header /></div>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Retour */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> Retour au blog
          </Link>

          {/* Catégorie + date */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {article.category && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                <Tag className="h-3 w-3" /> {article.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </span>
          </div>

          {/* Titre */}
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Image principale */}
          {article.mainImageUrl && (
            <img
              src={article.mainImageUrl}
              alt={article.title}
              className="rounded-2xl w-full h-72 md:h-96 object-cover mb-8"
            />
          )}

          {/* Extrait / Introduction */}
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Contenu — première moitié */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-h2:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: firstHalf }}
          />

          {/* CTA intermédiaire */}
          <CtaBlock />

          {/* Contenu — deuxième moitié */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-semibold prose-h2:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: secondHalf }}
          />

          {/* CTA final */}
          <CtaBlock />

          {/* Navigation retour */}
          <div className="mt-8 pt-8 border-t border-border flex items-center justify-between">
            <Link to="/blog">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Tous les articles
              </Button>
            </Link>
            <Link to="/vehicules">
              <Button className="gap-2">
                Nos véhicules <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}