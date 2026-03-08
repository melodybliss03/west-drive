import { Star, Phone } from 'lucide-react'
import React from 'react'

const scrollingReviews = [
  { nom: "Sophie M.", note: 5, text: "Service impeccable, véhicule livré à l'heure !" },
  { nom: "Thomas D.", note: 5, text: "Rapport qualité-prix imbattable." },
  { nom: "Marie L.", note: 4, text: "Équipe réactive, véhicules bien entretenus." },
  { nom: "Pierre B.", note: 5, text: "Location sans stress, je recommande." },
  { nom: "Julie R.", note: 5, text: "Processus simple et rapide." },
  { nom: "Alexandre F.", note: 5, text: "Excellent service client 24/7." },
];

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-foreground text-background">
        <div className="flex items-center justify-between h-14 overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <div className="flex animate-marquee whitespace-nowrap gap-8 items-center h-10">
              {[...scrollingReviews, ...scrollingReviews].map((r, i) => (
                <span key={i} className="inline-flex items-center gap-2 text-xs font-medium">
                  <span className="flex gap-0.5">
                    {Array.from({ length: r.note }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </span>
                  <span className="text-background/80">"{r.text}"</span>
                  <span className="text-background/50">— {r.nom}</span>
                </span>
              ))}
            </div>
          </div>
          <a
            href="tel:+330643660809"
            className="flex items-center gap-2 px-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 border-l border-background/10"
          >
            <Phone className="h-3.5 w-3.5" />
            06 43 66 08 09
          </a>
        </div>
      </div>
  )
}
