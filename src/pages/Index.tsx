import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ChevronRight, Check, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import VehiculeCard from "@/components/VehiculeCard";
import { vehicules, getVehiculesByCategorie, temoignages, faqData, villes } from "@/data/mock";
import type { Categorie } from "@/data/mock";
import heroBg from "@/assets/hero-bg.jpg";

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
    highlight: true,
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

const scrollingReviews = [
  { nom: "Sophie M.", note: 5, text: "Service impeccable, véhicule livré à l'heure !" },
  { nom: "Thomas D.", note: 5, text: "Rapport qualité-prix imbattable." },
  { nom: "Marie L.", note: 4, text: "Équipe réactive, véhicules bien entretenus." },
  { nom: "Pierre B.", note: 5, text: "Location sans stress, je recommande." },
  { nom: "Julie R.", note: 5, text: "Processus simple et rapide." },
  { nom: "Alexandre F.", note: 5, text: "Excellent service client 24/7." },
];

export default function Index() {
  const getCategorieCount = (cat: Categorie) => getVehiculesByCategorie(cat).length;

  return (
    <div className="min-h-screen">
      {/* Top Bar — Scrolling Reviews + Phone */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-foreground text-background">
        <div className="flex items-center justify-between h-10 overflow-hidden">
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
            href="tel:+33123456789"
            className="flex items-center gap-2 px-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 border-l border-background/10"
          >
            <Phone className="h-3.5 w-3.5" />
            01 23 45 67 89
          </a>
        </div>
      </div>

      <div className="pt-10">
        <Header />
      </div>

      {/* Hero */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Véhicules WEST DRIVE" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="relative container mx-auto px-4 py-20 flex flex-col items-center text-center">
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
            <p className="text-lg text-background/70 mb-8 max-w-xl mx-auto">
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
            className="mt-12 bg-card/95 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl w-full max-w-4xl"
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
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Tarification Transparente</h2>
            <p className="text-background/60">Tout est inclus. Aucune surprise</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Card 1 */}
            <div className="bg-card text-foreground rounded-2xl border border-border p-8 flex flex-col">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center mb-6">
                <Star className="h-5 w-5 text-background fill-background" />
              </div>
              <h3 className="font-display font-bold text-lg mb-5">Inclus dans TOUS les tarifs</h3>
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
              <h3 className="font-display font-bold text-lg mb-5">Inclus dans TOUS les tarifs</h3>
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
              <h3 className="font-display font-bold text-lg mb-3">Tarifs sur mesure selon vos besoins</h3>
              <div className="mt-auto pt-4">
                <Link to="/contact">
                  <Button variant="ghost" className="text-primary-foreground underline underline-offset-4 hover:text-primary-foreground/80 px-0 font-semibold">
                    Demander une devis personnalisé
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi WESTDRIVE */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Pourquoi WESTDRIVE ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                <h3 className="font-display font-bold text-base mb-3">{card.titre}</h3>
                <p className={`text-sm leading-relaxed ${card.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone Couverte */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Zone de Couverture</h2>
            <p className="text-muted-foreground">Nous opérons dans un rayon de 20 km autour de Puteaux.</p>
          </div>
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              title="Zone de couverture WEST DRIVE"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d42000!2d2.2384!3d48.8847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2sfr!4v1700000000000!5m2!1sfr!2sfr"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {villes.map((v) => (
              <span key={v.id} className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium">
                {v.nom}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Questions Fréquentes</h2>
            <p className="text-muted-foreground">Retrouvez les réponses aux questions les plus fréquentes.</p>
          </div>
          {faqData.map((cat) => (
            <div key={cat.categorie} className="mb-8">
              <h3 className="font-display text-xl font-semibold mb-4">{cat.categorie}</h3>
              <Accordion type="single" collapsible>
                {cat.questions.map((q, i) => (
                  <AccordionItem key={i} value={`${cat.categorie}-${i}`}>
                    <AccordionTrigger className="text-left">{q.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{q.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
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
                className="bg-card p-6 rounded-2xl border border-border"
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
