import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import VehiculeCard from "@/components/VehiculeCard";
import { searchVehicules, villes, vehicules, haversineDistance } from "@/data/mock";
import type { Categorie } from "@/data/mock";
import TopBar from "@/components/TopBar";

export default function Resultats() {
  const [searchParams] = useSearchParams();
  const ville = searchParams.get("ville") || "";
  const debut = searchParams.get("debut") || "";
  const fin = searchParams.get("fin") || "";
  const type = searchParams.get("type") || "";
  const [showForm, setShowForm] = useState(false);

  const results = useMemo(() => {
    return searchVehicules({
      ville: ville || undefined,
      categorie: (type as Categorie) || undefined,
    });
  }, [ville, type]);

  // Nearby cities with available vehicles if no results
  const nearbyResults = useMemo(() => {
    if (results.length > 0 || !ville) return [];
    const searchedVille = villes.find((v) => v.nom === ville);
    if (!searchedVille) return [];

    return villes
      .filter((v) => v.nom !== ville)
      .map((v) => ({
        ville: v,
        distance: haversineDistance(searchedVille.lat, searchedVille.lng, v.lat, v.lng),
        vehicules: vehicules.filter((veh) => veh.actif && veh.villes.includes(v.nom)),
      }))
      .filter((r) => r.vehicules.length > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [results, ville]);

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Recap */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Résultats de recherche</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {ville && `Ville : ${ville}`}
                {type && ` · Type : ${type}`}
                {debut && ` · Du ${new Date(debut).toLocaleDateString("fr-FR")}`}
                {fin && ` au ${new Date(fin).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setShowForm(!showForm)}>
              <ArrowLeft className="h-4 w-4" />
              Modifier ma recherche
            </Button>
          </div>

          {showForm && (
            <div className="mb-8 bg-secondary p-6 rounded-xl border border-border">
              <SearchForm defaultValues={{ ville, debut, fin, type }} compact />
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((v, i) => (
                <VehiculeCard key={v.id} vehicule={v} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg font-semibold mb-2">
                Aucun véhicule disponible{ville ? ` à ${ville}` : ""} pour ces critères
              </p>
              <p className="text-muted-foreground mb-8">
                Voici les véhicules disponibles à proximité.
              </p>

              {nearbyResults.map((nr) => (
                <div key={nr.ville.id} className="mb-10">
                  <h3 className="font-display text-xl font-semibold mb-4 text-left">
                    {nr.ville.nom}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      à {nr.distance} km de {ville}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nr.vehicules.slice(0, 3).map((v, i) => (
                      <VehiculeCard key={v.id} vehicule={v} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
