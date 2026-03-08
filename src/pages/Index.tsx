import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import DevisDialog from "@/components/DevisDialog";
import { motion } from "framer-motion";
import { Star, ChevronRight, Check, Phone, Car, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import VehiculeCard from "@/components/VehiculeCard";
import {
  vehicules,
  getVehiculesByCategorie,
  temoignages,
  faqData,
  villes,
} from "@/data/mock";
import type { Categorie } from "@/data/mock";
import heroBg from "@/assets/hero-bg.jpg";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

const categories: { value: Categorie; label: string }[] = [
  { value: "MICRO", label: "Micro" },
  { value: "COMPACTE", label: "Compacte" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
];

const pourquoiCards = [
  {
    titre: "Tarifs B2B compétitifs",
    desc: "Tarifs transparents pour location courte durée, journée ou semaine. Moins cher que les agences traditionnelles, sans frais cachés.",
    highlight: false,
  },
  {
    titre: "Réservation ultra-rapide",
    desc: "Réservation en ligne en 2 minutes. Service rapide 24h/24 pour vos besoins urgents (panne, déménagement, remplacement).",
    highlight: false,
  },
  {
    titre: "Flotte moderne",
    desc: "43+ véhicules entretenus régulièrement",
    highlight: false,
  },
  {
    titre: "Support direct",
    desc: "Assistance 24h/24 par téléphone. Une vraie personne vous répond, pas un chatbot.",
    highlight: false,
  },
  {
    titre: "Facturation simple",
    desc: "Paiement fin de mois possible",
    highlight: false,
  },
  {
    titre: "Assurance incluse",
    desc: "Tous risques, zéro franchise",
    highlight: false,
  },
];

export default function Index() {
  const getCategorieCount = (cat: Categorie) =>
    getVehiculesByCategorie(cat).length;

  return (
    <div className="min-h-screen">
      <div>
        <TopBar />
      </div>

      <div className="pt-10">
        <Header />
      </div>

      {/* Hero */}
      <section
        id="hero"
        className="relative min-h-[105vh] flex items-center justify-center pt-16"
      >
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Véhicules WEST DRIVE"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 flex flex-col items-center text-center">
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
            <p className="text-lg text-background/70 mb-8 max-w-4xl mx-auto">
              Location flexible à Puteaux, La Défense, Neuilly, Levallois,
              Boulogne et Hauts-de-Seine. Weekend, vacances ou remplacement :
              réservez en ligne en 2 minutes.
            </p>
            <DevisDialog>
              <Button size="lg" className="gap-2 text-base px-8">
                Demander un devis
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DevisDialog>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 bg-card/95 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl w-full max-w-4xl"
          >
            <SearchForm />
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-background/80 text-sm"
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="font-semibold text-background">4.9</span>
              <span>Depuis 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-background/70" />
              <span>Support direct</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-background/70" />
              <span className="font-semibold text-background">2,000+</span>
              <span>locations pros</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Véhicules */}
      <section id="vehicules" className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Nos Véhicules
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Une flotte variée pour répondre à tous vos besoins de mobilité.
            </p>
          </div>

          <Tabs defaultValue="MICRO" className="w-full">
            <TabsList className="mx-auto flex w-fit mb-8 border border-border bg-card p-6">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="gap-1.5 p-2 "
                >
                  {cat.label}
                  <span className="text-xs text-muted-foreground">
                    ({getCategorieCount(cat.value)})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.value} value={cat.value}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Tarification Transparente */}
      <section id="tarifs" className="py-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Tarification Transparente
            </h2>
            <p className="text-background/60">
              Tout est inclus. Aucune surprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-card text-foreground rounded-2xl border border-border p-8 flex flex-col">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center mb-6">
                <Star className="h-5 w-5 text-background fill-background" />
              </div>
              <h3 className="font-display font-bold text-lg mb-5">
                Inclus dans TOUS les tarifs
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Assistance 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Assurance tous risques
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Entretien/révisions
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-card text-foreground rounded-2xl border border-border p-8 flex flex-col">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center mb-6">
                <Star className="h-5 w-5 text-background fill-background" />
              </div>
              <h3 className="font-display font-bold text-lg mb-5">
                Inclus dans TOUS les tarifs
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Assistance 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Assurance tous risques
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Entretien/révisions
                </li>
              </ul>
            </div>

            {/* Card 3 — Orange */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center mb-6">
                <Star className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg mb-3">
                Tarifs sur mesure selon vos besoins
              </h3>
              <div className="mt-auto pt-4">
                <DevisDialog>
                  <Button
                    variant="ghost"
                    className="text-primary-foreground underline underline-offset-4 hover:text-primary-foreground/80 px-0 font-semibold"
                  >
                    Demander un devis personnalisé
                  </Button>
                </DevisDialog>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi WESTDRIVE */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Pourquoi WESTDRIVE ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pourquoiCards.map((card, i) => (
              <motion.div
                key={card.titre}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border p-8 text-center ${
                  card.highlight
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-card-foreground border-border"
                }`}
              >
                <h3 className="font-display font-bold text-base mb-3">
                  {card.titre}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${card.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone Couverte */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Zone de Couverture
            </h2>
            <p className="text-muted-foreground">
              Nous opérons dans un rayon de 20 km autour de Puteaux.
            </p>
          </div>
          <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-lg mb-10">
            <iframe
              title="Zone de couverture WEST DRIVE"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d42000!2d2.2384!3d48.8847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2sfr!4v1700000000000!5m2!1sfr!2sfr"
              width="100%"
              height="550"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* City markers overlaid on map */}
            {[
              { name: "Puteaux", top: "46%", left: "50%", major: true, info: "Siège WEST DRIVE — Livraison express" },
              { name: "Courbevoie", top: "42%", left: "51%", major: true, info: "Livraison sous 30 min" },
              { name: "Nanterre", top: "46%", left: "44%", major: true, info: "Point relais disponible" },
              { name: "Neuilly", top: "43%", left: "55%", major: true, info: "Livraison à domicile" },
              { name: "Boulogne-B.", top: "52%", left: "55%", major: true, info: "Livraison sous 30 min" },
              { name: "Rueil", top: "48%", left: "38%", major: true, info: "Point relais disponible" },
              { name: "Paris 16e", top: "48%", left: "59%", major: true, info: "Livraison express" },
              { name: "Paris 17e", top: "38%", left: "58%", major: true, info: "Livraison express" },
              { name: "St-Germain", top: "44%", left: "22%", major: true, info: "Livraison sous 1h" },
              { name: "Colombes", top: "37%", left: "48%", major: true, info: "Livraison sous 30 min" },
              { name: "Levallois", top: "40%", left: "54%", major: false, info: "Livraison sous 30 min" },
              { name: "Suresnes", top: "50%", left: "51%", major: false, info: "Livraison sous 30 min" },
              { name: "La Défense", top: "44%", left: "48%", major: true, info: "Hub principal — retrait sur place" },
              { name: "Clichy", top: "38%", left: "55%", major: false, info: "Livraison sous 45 min" },
              { name: "Asnières", top: "35%", left: "53%", major: false, info: "Livraison sous 45 min" },
              { name: "Gennevilliers", top: "33%", left: "50%", major: false, info: "Livraison sous 45 min" },
              { name: "Issy-les-M.", top: "55%", left: "57%", major: false, info: "Livraison sous 45 min" },
              { name: "Saint-Cloud", top: "53%", left: "49%", major: false, info: "Livraison sous 30 min" },
              { name: "Clamart", top: "59%", left: "53%", major: false, info: "Livraison sous 1h" },
              { name: "Meudon", top: "57%", left: "51%", major: false, info: "Livraison sous 45 min" },
              { name: "Sèvres", top: "56%", left: "47%", major: false, info: "Livraison sous 45 min" },
              { name: "Argenteuil", top: "27%", left: "47%", major: false, info: "Livraison sous 1h" },
              { name: "Bezons", top: "31%", left: "44%", major: false, info: "Livraison sous 1h" },
              { name: "Houilles", top: "30%", left: "40%", major: false, info: "Livraison sous 1h" },
              { name: "Sartrouville", top: "27%", left: "38%", major: false, info: "Livraison sous 1h" },
              { name: "Chatou", top: "40%", left: "35%", major: false, info: "Livraison sous 1h" },
              { name: "Le Vésinet", top: "38%", left: "30%", major: false, info: "Livraison sous 1h" },
              { name: "Poissy", top: "38%", left: "24%", major: false, info: "Livraison sous 1h30" },
              { name: "Maisons-L.", top: "32%", left: "34%", major: false, info: "Livraison sous 1h" },
              { name: "Herblay", top: "25%", left: "40%", major: false, info: "Livraison sous 1h" },
              { name: "Cormeilles", top: "28%", left: "42%", major: false, info: "Livraison sous 1h" },
              { name: "Franconville", top: "23%", left: "44%", major: false, info: "Livraison sous 1h" },
              { name: "Paris 8e", top: "42%", left: "60%", major: false, info: "Livraison express" },
              { name: "Paris 15e", top: "53%", left: "58%", major: false, info: "Livraison express" },
              { name: "Paris 7e", top: "47%", left: "61%", major: false, info: "Livraison express" },
              { name: "Garches", top: "51%", left: "42%", major: false, info: "Livraison sous 45 min" },
              { name: "Montesson", top: "37%", left: "32%", major: false, info: "Livraison sous 1h" },
              { name: "Le Pecq", top: "40%", left: "28%", major: false, info: "Livraison sous 1h" },
              { name: "Carrières", top: "38%", left: "33%", major: false, info: "Livraison sous 1h" },
            ].map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
                className="absolute z-10 flex flex-col items-center group pointer-events-auto cursor-pointer"
                style={{ top: city.top, left: city.left, transform: "translate(-50%, -50%)" }}
              >
                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none z-20">
                  <div className="bg-foreground text-background text-[10px] font-medium px-3 py-2 rounded-xl shadow-xl whitespace-nowrap border border-primary/30">
                    <p className="font-bold text-primary text-[11px]">{city.name}</p>
                    <p className="mt-0.5">{city.info}</p>
                  </div>
                  <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
                </div>
                {city.major ? (
                  <div className="relative transition-transform duration-200 group-hover:scale-125">
                    <MapPin className="h-8 w-8 text-primary drop-shadow-lg" fill="hsl(var(--primary))" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-primary-foreground pb-1">WD</span>
                  </div>
                ) : (
                  <div className="bg-primary rounded-full p-1 shadow-md shadow-primary/30 border border-primary-foreground/50 transition-transform duration-200 group-hover:scale-125">
                    <Car className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="mt-0.5 bg-foreground/80 text-background text-[8px] font-semibold px-1.5 py-px rounded-full whitespace-nowrap shadow">
                  {city.name}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Zone 1 : Hauts-de-Seine (92)",
                subtitle: "Cœur de marché — 0 à 15 km",
                groups: [
                  { label: "Proximité immédiate (0-5 km)", cities: ["Courbevoie", "Nanterre", "Neuilly-sur-Seine", "Levallois-Perret", "Suresnes", "Rueil-Malmaison", "La Défense"] },
                  { label: "Distance moyenne (5-10 km)", cities: ["Colombes", "Asnières-sur-Seine", "Bois-Colombes", "Clichy", "Gennevilliers", "Villeneuve-la-Garenne", "Boulogne-Billancourt", "Issy-les-Moulineaux", "Saint-Cloud", "Garches", "Vaucresson"] },
                  { label: "Zone étendue (10-15 km)", cities: ["Argenteuil", "Bezons", "Houilles", "Sartrouville", "Chatou", "Croissy-sur-Seine", "Le Vésinet", "Clamart", "Meudon", "Sèvres", "Chaville", "Ville-d'Avray"] },
                ],
              },
              {
                title: "Zone 2 : Paris Ouest (75)",
                subtitle: "Arrondissements Ouest",
                groups: [
                  { label: "Arrondissements couverts", cities: ["16e arr. (Trocadéro, Passy, Auteuil)", "17e arr. (Batignolles, Ternes)", "8e arr. (Champs-Élysées, Madeleine)", "15e arr. (Grenelle, Javel)", "7e arr. (Invalides, Tour Eiffel)"] },
                ],
              },
              {
                title: "Zone 3 : Val-d'Oise (95)",
                subtitle: "Nord — 10 à 20 km",
                groups: [
                  { label: "Communes desservies", cities: ["Cormeilles-en-Parisis", "La Frette-sur-Seine", "Herblay", "Montigny-lès-Cormeilles", "Franconville"] },
                ],
              },
              {
                title: "Zone 4 : Yvelines (78)",
                subtitle: "Ouest — 10 à 20 km",
                groups: [
                  { label: "Communes desservies", cities: ["Le Pecq", "Montesson", "Carrières-sur-Seine", "Maisons-Laffitte", "Poissy", "Saint-Germain-en-Laye"] },
                ],
              },
            ].map((zone, zi) => (
              <motion.div
                key={zi}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: zi * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-base">{zone.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4 ml-12">{zone.subtitle}</p>
                {zone.groups.map((group, gi) => (
                  <div key={gi} className="mb-3 last:mb-0">
                    <p className="text-xs font-semibold text-foreground/70 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.cities.map((city) => (
                        <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary border border-border rounded-lg text-xs text-muted-foreground">
                          <Car className="h-3 w-3 text-primary" />
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 ">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Questions Fréquentes
            </h2>
            <p className="text-muted-foreground">
              Retrouvez les réponses aux questions les plus fréquentes.
            </p>
          </div>
          {faqData.map((cat) => (
            <div key={cat.categorie} className="mb-8">
              <h3 className="font-display text-xl font-semibold mb-4">
                {cat.categorie}
              </h3>
              <Accordion type="single" collapsible>
                {cat.questions.map((q, i) => (
                  <AccordionItem className="border px-4 my-2 rounded-sm " key={i} value={`${cat.categorie}-${i}`}>
                    <AccordionTrigger className="text-left">
                      {q.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {q.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Ce que disent nos clients
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {temoignages.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card p-6 rounded-2xl border border-border"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.note }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  "{t.commentaire}"
                </p>
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
      <ScrollToTop />
    </div>
  );
}
