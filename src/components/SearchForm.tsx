import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Car, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { villes } from "@/data/mock";
import type { Categorie } from "@/data/mock";

interface SearchFormProps {
  defaultValues?: {
    ville?: string;
    debut?: string;
    fin?: string;
    type?: string;
  };
  compact?: boolean;
}

export default function SearchForm({ defaultValues, compact }: SearchFormProps) {
  const navigate = useNavigate();
  const [ville, setVille] = useState(defaultValues?.ville || "");
  const [debut, setDebut] = useState(defaultValues?.debut || "");
  const [fin, setFin] = useState(defaultValues?.fin || "");
  const [type, setType] = useState(defaultValues?.type || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ville || !debut || !fin) {
      setError("Veuillez renseigner la ville, la date de début et la date de fin.");
      return;
    }
    setError("");
    const params = new URLSearchParams();
    if (ville) params.set("ville", ville);
    if (debut) params.set("debut", debut);
    if (fin) params.set("fin", fin);
    if (type) params.set("type", type);
    navigate(`/resultats?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`${compact ? "space-y-3" : "space-y-4"}`}>
      <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div className="space-y-1.5">
          <label htmlFor="ville" className="text-sm font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Ville de prise en charge
          </label>
          <Select value={ville} onValueChange={setVille}>
            <SelectTrigger id="ville" className="bg-background">
              <SelectValue placeholder="Choisir une ville" />
            </SelectTrigger>
            <SelectContent>
              {villes.map((v) => (
                <SelectItem key={v.id} value={v.nom}>{v.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="debut" className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Date de début
          </label>
          <Input
            id="debut"
            type="datetime-local"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fin" className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Date de fin
          </label>
          <Input
            id="fin"
            type="datetime-local"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="type" className="text-sm font-medium flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-primary" />
            Type de véhicule
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type" className="bg-background">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MICRO">Micro</SelectItem>
              <SelectItem value="COMPACTE">Compacte</SelectItem>
              <SelectItem value="BERLINE">Berline</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto gap-2 px-8" size="lg">
        <Search className="h-4 w-4" />
        Rechercher
      </Button>
    </form>
  );
}
