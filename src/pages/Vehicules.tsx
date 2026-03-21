import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Settings, Headset } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehiculeCard from "@/components/VehiculeCard";
import type { Categorie, Transmission, Energie } from "@/data/mock";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { useVehiclesCatalogPage } from "@/hooks/useVehiclesCatalog";

const categories: { value: Categorie; label: string }[] = [
  { value: "MICRO", label: "Micro" },
  { value: "COMPACTE", label: "Compacte" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
];

export default function Vehicules() {
  const [page, setPage] = useState(1);
  const limit = 12;
  const { vehicles, isLoading, meta } = useVehiclesCatalogPage(page, limit);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [transmission, setTransmission] = useState<string>("all");
  const [energie, setEnergie] = useState<string>("all");
  const [tri, setTri] = useState<string>("prix-asc");

  const totalPages = Math.max(meta?.totalPages || 1, 1);

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(clamped);
  };

  const filtered = useMemo(() => {
    let result = activeTab === "ALL"
      ? vehicles.filter((v) => v.actif)
      : vehicles.filter((v) => v.actif && v.categorie === (activeTab as Categorie));
    if (transmission !== "all") result = result.filter((v) => v.transmission === transmission);
    if (energie !== "all") result = result.filter((v) => v.energie === energie);
    result = [...result].sort((a, b) => {
      if (tri === "prix-asc") return a.prixJour - b.prixJour;
      if (tri === "prix-desc") return b.prixJour - a.prixJour;
      return 0;
    });
    return result;
  }, [vehicles, activeTab, transmission, energie, tri]);

  const activeCount = vehicles.filter((v) => v.actif).length;
  const countByCategory = (categorie: Categorie) => vehicles.filter((v) => v.actif && v.categorie === categorie).length;

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Nos Véhicules</h1>
          <p className="text-muted-foreground mb-8">Découvrez notre flotte disponible en Île-de-France.</p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Select value={transmission} onValueChange={setTransmission}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Transmission" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="MANUELLE">Manuelle</SelectItem>
                <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={energie} onValueChange={setEnergie}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Énergie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="ESSENCE">Essence</SelectItem>
                <SelectItem value="DIESEL">Diesel</SelectItem>
                <SelectItem value="HYBRIDE">Hybride</SelectItem>
                <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tri} onValueChange={setTri}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trier par" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prix-asc">Prix croissant</SelectItem>
                <SelectItem value="prix-desc">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
            <TabsList className="mb-8">
              <TabsTrigger value="ALL">Tous ({activeCount})</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label} ({countByCategory(cat.value)})
                </TabsTrigger>
              ))}
            </TabsList>

            {isLoading && (
              <div className="text-sm text-muted-foreground mb-4">Chargement des véhicules...</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v, i) => (
                <VehiculeCard key={v.id} vehicule={v} index={i} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                Aucun véhicule ne correspond à vos critères.
              </div>
            )}

            {meta && totalPages > 1 && (
              <div className="mt-8 space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Page {meta.page} sur {totalPages} · {meta.totalItems} véhicules
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (meta.hasPreviousPage) {
                            goToPage(page - 1);
                          }
                        }}
                        className={!meta.hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        {meta.page}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (meta.hasNextPage) {
                            goToPage(page + 1);
                          }
                        }}
                        className={!meta.hasNextPage ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
        </Tabs>
        </div>

        {/* Inclusions section */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Tous nos véhicules incluent</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Assurance tous risques",
                description: "Tous nos véhicules sont couverts par une assurance tous risques avec franchise zéro.",
              },
              {
                icon: Settings,
                title: "Entretien régulier",
                description: "Véhicules entretenus régulièrement et contrôlés avant chaque location.",
              },
              {
                icon: Headset,
                title: "Assistance 24/7",
                description: "Une équipe disponible 7j/7 pour vous assister en cas de besoin.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-foreground" />
                  <h3 className="font-display font-bold text-lg">{item.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
