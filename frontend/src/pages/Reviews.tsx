import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { reviewsService, ReviewsListResponse } from "@/lib/api/services";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { motion } from "framer-motion";

const LIMIT = 15;

const SOURCE_BADGE: Record<string, { label: string; dotClass: string; textClass: string }> = {
  getaround: { label: "Getaround", dotClass: "bg-violet-500", textClass: "text-violet-600" },
  turo: { label: "Turo", dotClass: "bg-gray-800", textClass: "text-gray-700" },
  google: { label: "Google", dotClass: "bg-blue-500", textClass: "text-blue-600" },
  direct: { label: "Direct", dotClass: "bg-emerald-500", textClass: "text-emerald-600" },
};
function sourceBadge(source?: string | null) {
  if (!source) return null;
  const key = source.toLowerCase();
  const cfg = SOURCE_BADGE[key] ?? { label: source, dotClass: "bg-muted-foreground", textClass: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold ${cfg.textClass}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

export default function Reviews() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<ReviewsListResponse>({
    queryKey: ["reviews", page],
    queryFn: () => reviewsService.list({ page, limit: LIMIT }),
    refetchOnWindowFocus: false,
  });

  const reviews = data?.items ?? [];
  const meta = data?.meta;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="pt-10">
        <Header />
      </div>

      {/* Hero */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t('reviews.title')} <span className="text-primary">{t('reviews.titleHighlight')}</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              {t('reviews.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  {t('reviews.viewVehicles')} <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avis */}
      <section className="max-w-6xl mx-auto px-4 py-12">

        {/* Status */}
        {isLoading && (
          <p className="text-sm text-muted-foreground mb-6">{t('reviews.loading')}</p>
        )}
        {isError && (
          <p className="text-sm text-destructive mb-6">{t('reviews.error')}</p>
        )}
        {!isLoading && !isError && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground mb-6">{t('reviews.noReviews')}</p>
        )}

        {/* Pagination haut */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground">
              {t('reviews.pageInfo', { page: meta.page, totalPages: meta.totalPages, total: meta.totalItems })}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPreviousPage || isLoading}>
                {t('reviews.previous')}
              </Button>
              <Button size="sm" onClick={() => setPage(p => meta.hasNextPage ? p + 1 : p)} disabled={!meta.hasNextPage || isLoading}>
                {t('reviews.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Grille masonry */}
        {reviews.length > 0 && (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 transition-all duration-300 ease-out">
            {reviews.map(review => (
              <article
                key={review.id}
                className="break-inside-avoid border border-border rounded-2xl p-4 bg-card shadow-sm hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  {sourceBadge(review.source)}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "dd MMM yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                {review.title && <h3 className="mb-2">{review.title}</h3>}
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.content}</p>
                <p className="text-sm font-medium">— {review.authorName}</p>
              </article>
            ))}
          </div>
        )}

        {/* Pagination bas */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPreviousPage || isLoading}>
              {t('reviews.previous')}
            </Button>
            <span className="text-sm text-muted-foreground px-2">{meta.page} / {meta.totalPages}</span>
            <Button size="sm" onClick={() => setPage(p => meta.hasNextPage ? p + 1 : p)} disabled={!meta.hasNextPage || isLoading}>
              {t('reviews.next')}
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
