import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  showDots?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
}

export default function ImageCarousel({
  images,
  alt,
  className = "aspect-[4/3]",
  showDots = true,
  autoplay = true,
  autoplayInterval = 5000,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasMultiple = images.length > 1;
  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoscroll logic
  useEffect(() => {
    if (!autoplay || !hasMultiple) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, autoplayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, hasMultiple, autoplayInterval, images.length]);

  // Reset timer on manual navigation
  const handleManualNavigation = useCallback(
    (action: () => void) => {
      if (intervalRef.current && autoplay) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }, autoplayInterval);
      }
      action();
    },
    [autoplay, autoplayInterval, images.length]
  );

  if (!images.length) {
    return (
      <div className={cn("bg-muted overflow-hidden rounded-lg flex items-center justify-center", className)}>
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Car className="h-10 w-10 mb-2" />
          <span className="text-sm">Aucune image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-muted overflow-hidden rounded-lg group", className)}>
      {/* Image */}
      <img
        src={currentImage}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />

      {/* Navigation Buttons */}
      {hasMultiple && (
        <>
          <button
            onClick={() => handleManualNavigation(goToPrevious)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleManualNavigation(goToNext)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2.5 py-1 rounded text-xs font-medium">
          {currentIndex + 1}/{images.length}
        </div>
      )}

      {/* Dots */}
      {hasMultiple && showDots && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60 w-1.5",
              )}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
