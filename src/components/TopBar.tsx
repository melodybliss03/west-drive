import { Star, Phone } from 'lucide-react'

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
      <div className="flex items-center h-10 overflow-hidden">
        {/* Reviews - shrink to give space to phone */}
        <div className="flex-1 overflow-hidden relative min-w-0">
          <div className="flex animate-marquee whitespace-nowrap gap-8 items-center h-10">
            {[...scrollingReviews, ...scrollingReviews].map((r, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="flex gap-0.5">
                  {Array.from({ length: r.note }).map((_, j) => (
                    <Star key={j} className="h-2.5 w-2.5 fill-primary text-primary" />
                  ))}
                </span>
                <span className="text-background/60">"{r.text}"</span>
                <span className="text-background/40">— {r.nom}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Phone - prominent */}
        <a
          href="tel:+330643660809"
          className="flex items-center gap-2 px-5 h-full bg-primary text-primary-foreground text-sm font-bold shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">06 43 66 08 09</span>
          <span className="sm:hidden">Appeler</span>
        </a>
      </div>
    </div>
  )
}
