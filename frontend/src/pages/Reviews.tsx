import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { reviewsService, ReviewsListResponse } from "@/lib/api/services";
import { motion } from "framer-motion";

const LIMIT = 12;

export default function Reviews() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<ReviewsListResponse>({
    queryKey: ["reviews", page],
    queryFn: () => reviewsService.list({ page, limit: LIMIT }),
    refetchOnWindowFocus: false,
  });

  const reviews = data?.items ?? [];
  const meta = data?.meta ?? {
    page: 1,
    limit: LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="pt-10">
        <Header />
      </div>

      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Avis de nos <span className="text-primary">Clients</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Retrouvez les retours publies apres location.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  Voir nos vehicules <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Note moyenne (page courante)</p>
            <p className="font-display text-2xl font-bold text-primary">{average}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Avis affiches</p>
            <p className="font-display text-2xl font-bold">{reviews.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total avis</p>
            <p className="font-display text-2xl font-bold">{meta.totalItems}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} / {meta.totalPages} · {meta.totalItems} avis
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPreviousPage || isLoading}
            >
              Precedent
            </Button>
            <Button
              size="sm"
              onClick={() => setPage((p) => (meta.hasNextPage ? p + 1 : p))}
              disabled={!meta.hasNextPage || isLoading}
            >
              Suivant
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground mb-6">Chargement des avis...</p>
        ) : null}

        {isError ? (
          <p className="text-sm text-destructive mb-6">Impossible de recuperer les avis pour le moment.</p>
        ) : null}

        {!isLoading && !isError && reviews.length === 0 ? (
          <div className="text-center py-16 border border-border rounded-2xl bg-card">
            <p className="text-muted-foreground">Aucun avis publie pour le moment.</p>
          </div>
        ) : null}

        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 transition-all duration-300 ease-out">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="break-inside-avoid border border-border rounded-2xl p-4 bg-card shadow-sm hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{review.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={`${review.id}-${i}`}
                    className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                ))}
              </div>

              {review.title ? <h3 className="font-semibold mb-1">{review.title}</h3> : null}
              <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
