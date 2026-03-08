import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehiculeCard from "@/components/VehiculeCard";
import { vehicules, getVehiculesByCategorie } from "@/data/mock";
import type { Categorie, Transmission, Energie } from "@/data/mock";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

const categories: { value: Categorie; label: string }[] = [
  { value: "MICRO", label: "Micro" },
  { value: "COMPACTE", label: "Compacte" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
];

export default function Vehicules() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [transmission, setTransmission] = useState<string>("all");
  const [energie, setEnergie] = useState<string>("all");
  const [tri, setTri] = useState<string>("prix-asc");

  const filtered = useMemo(() => {
    let result = activeTab === "ALL" ? vehicules.filter((v) => v.actif) : getVehiculesByCategorie(activeTab as Categorie);
    if (transmission !== "all") result = result.filter((v) => v.transmission === transmission);
    if (energie !== "all") result = result.filter((v) => v.energie === energie);
    result = [...result].sort((a, b) => {
      if (tri === "prix-asc") return a.prixJour - b.prixJour;
      if (tri === "prix-desc") return b.prixJour - a.prixJour;
      return 0;
    });
    return result;
  }, [activeTab, transmission, energie, tri]);

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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="ALL">Tous ({vehicules.filter((v) => v.actif).length})</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label} ({getVehiculesByCategorie(cat.value).length})
                </TabsTrigger>
              ))}
            </TabsList>

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
          </Tabs>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
