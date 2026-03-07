import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Clock, MapPin, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import VehiculeCard from "@/components/VehiculeCard";
import { vehicules, getVehiculesByCategorie, temoignages } from "@/data/mock";
import type { Categorie } from "@/data/mock";
import heroBg from "@/assets/hero-bg.jpg";

const categories: { value: Categorie; label: string }[] = [
  { value: "MICRO", label: "Micro" },
  { value: "COMPACTE", label: "Compacte" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
];

const tarifs = [
  { categorie: "Micro", exemple: "Peugeot 108", jour: 35, semaine: 210, mois: 750 },
  { categorie: "Compacte", exemple: "Renault Clio V", jour: 55, semaine: 330, mois: 1100 },
  { categorie: "Berline", exemple: "BMW Série 3", jour: 95, semaine: 570, mois: 2000 },
  { categorie: "SUV", exemple: "Peugeot 3008", jour: 85, semaine: 510, mois: 1800 },
];

const avantages = [
  {
    icon: Shield,
    titre: "Assurance incluse",
    desc: "Tous nos véhicules sont assurés tous risques. Roulez l'esprit tranquille.",
  },
  {
    icon: Clock,
    titre: "Disponibilité 7j/7",
    desc: "Réservez et récupérez votre véhicule à tout moment, même le week-end.",
  },
  {
    icon: MapPin,
    titre: "Livraison gratuite",
    desc: "Nous livrons votre véhicule dans un rayon de 20 km autour de Puteaux.",
  },
  {
    icon: CheckCircle2,
    titre: "Sans engagement",
    desc: "Annulation gratuite jusqu'à 24h avant. Pas de frais cachés.",
  },
];

export default function Index() {
  const getCategorieCount = (cat: Categorie) => getVehiculesByCategorie(cat).length;

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Véhicules WEST DRIVE" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold text-background leading-tight mb-4">
              Location voiture pas cher{" "}
              <span className="text-primary">Paris Ouest</span>
            </h1>
            <p className="text-lg text-background/70 mb-8 max-w-xl">
              Puteaux, La Défense, Nanterre, Rueil-Malmaison, Bougival, Boulogne-Billancourt et environs.
            </p>
            <a href="#vehicules">
              <Button size="lg" className="gap-2 text-base px-8">
                Demander un devis
                <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 bg-card/95 backdrop-blur-sm rounded-xl p-6 border border-border shadow-xl max-w-4xl"
          >
            <SearchForm />
          </motion.div>
        </div>
      </section>

      {/* Véhicules */}
      <section id="vehicules" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Nos Véhicules</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Une flotte variée pour répondre à tous vos besoins de mobilité.
            </p>
          </div>

          <Tabs defaultValue="MICRO" className="w-full">
            <TabsList className="mx-auto flex w-fit mb-8">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-1.5">
                  {cat.label}
                  <span className="text-xs text-muted-foreground">({getCategorieCount(cat.value)})</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.value} value={cat.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getVehiculesByCategorie(cat.value).map((v, i) => (
                    <VehiculeCard key={v.id} vehicule={v} index={i} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="text-center mt-10">
            <Link to="/vehicules">
              <Button variant="outline" size="lg" className="gap-2">
                Voir tout le catalogue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tarification */}
      <section id="tarifs" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Tarification Transparente</h2>
            <p className="text-muted-foreground">Pas de frais cachés. Pas de mauvaises surprises.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto bg-card rounded-xl overflow-hidden border border-border">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="px-6 py-4 text-left font-display font-semibold">Catégorie</th>
                  <th className="px-6 py-4 text-center font-display font-semibold">1 jour</th>
                  <th className="px-6 py-4 text-center font-display font-semibold">7 jours</th>
                  <th className="px-6 py-4 text-center font-display font-semibold">30 jours</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((t, i) => (
                  <tr key={t.categorie} className={i % 2 === 0 ? "bg-card" : "bg-secondary"}>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{t.categorie}</div>
                      <div className="text-xs text-muted-foreground">ex. {t.exemple}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{t.jour}&euro;</td>
                    <td className="px-6 py-4 text-center font-semibold">{t.semaine}&euro;</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-primary">{t.mois}&euro;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pourquoi WEST DRIVE */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Pourquoi WEST DRIVE ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {avantages.map((a, i) => (
              <motion.div
                key={a.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <a.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{a.titre}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Ce que disent nos clients</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {temoignages.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.note }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.commentaire}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.nom}</p>
                  <p className="text-xs text-muted-foreground">{t.vehicule}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
