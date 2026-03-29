import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { reviewsService, ReviewsListResponse } from "@/lib/api/services";
import { motion } from "framer-motion";
import { REVIEWS } from "@/data/reviews";

type UiReview = {
  id: string;
  authorName: string;
  title?: string;
  rating: number;
  content: string;
  createdAt: string;
  source: "static" | "api";
};

const API_LIMIT = 50;

export default function Reviews() {
  const { data, isLoading, isError } = useQuery<ReviewsListResponse>({
    queryKey: ["reviews", "public"],
    queryFn: () => reviewsService.list({ page: 1, limit: API_LIMIT }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const staticReviews = useMemo<UiReview[]>(
    () =>
      REVIEWS.map((review) => ({
        id: `static-${review.id}`,
        authorName: review.authorName,
        title: review.title,
        rating: Number(review.rating ?? 0),
        content: review.content,
        createdAt: review.createdAt,
        source: "static",
      })),
    [],
  );

  const apiReviews = useMemo<UiReview[]>(
    () =>
      (data?.items ?? []).map((review) => ({
        id: `api-${review.id}`,
        authorName: review.authorName,
        title: review.title,
        rating: Number(review.rating ?? 0),
        content: review.content,
        createdAt: review.createdAt,
        source: "api",
      })),
    [data],
  );

  const reviews = useMemo<UiReview[]>(() => {
    const deduped = new Map<string, UiReview>();
    [...apiReviews, ...staticReviews].forEach((review) => {
      const key = `${review.authorName}|${review.title ?? ""}|${review.content}`
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      if (!deduped.has(key)) {
        deduped.set(key, review);
      }
    });

    return Array.from(deduped.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [apiReviews, staticReviews]);

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
            <p className="text-xs text-muted-foreground">Note moyenne</p>
            <p className="font-display text-2xl font-bold text-primary">{average}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Avis affiches</p>
            <p className="font-display text-2xl font-bold">{reviews.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Avis API ajoutes</p>
            <p className="font-display text-2xl font-bold">{apiReviews.length}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground mb-6">Chargement des avis API...</p>
        ) : null}

        {isError ? (
          <p className="text-sm text-muted-foreground mb-6">
            Les avis API sont temporairement indisponibles, affichage des avis historiques.
          </p>
        ) : null}

        {!isLoading && reviews.length === 0 ? (
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
