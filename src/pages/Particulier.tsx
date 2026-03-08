import { Link } from "react-router-dom";
import DevisDialog from "@/components/DevisDialog";
import { motion } from "framer-motion";
import { ChevronRight, Check, Car, Shield, Clock, CreditCard, Headphones, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { villes } from "@/data/mock";

const solutions = [
  { icon: Car, title: "Large choix de véhicules", desc: "Du micro-urbain au SUV familial, trouvez le véhicule idéal pour chaque besoin." },
  { icon: Clock, title: "Réservation en 2 minutes", desc: "Processus 100% en ligne, rapide et intuitif. Réservez même au dernier moment." },
  { icon: Shield, title: "Assurance tous risques incluse", desc: "Roulez l'esprit tranquille, tous nos véhicules sont assurés sans franchise." },
  { icon: CreditCard, title: "Tarifs sans surprise", desc: "Pas de frais cachés. Kilométrage inclus, entretien et assistance compris." },
  { icon: Headphones, title: "Support 24h/24", desc: "Un problème ? Notre équipe est joignable à tout moment par téléphone." },
  { icon: MapPin, title: "Livraison à domicile", desc: "Nous livrons le véhicule à l'adresse de votre choix dans notre zone." },
];

const tarifs = [
  {
    nom: "Journée",
    prix: "35",
    unite: "/jour",
    desc: "Idéal pour un besoin ponctuel",
    features: ["Assurance incluse", "150 km inclus", "Assistance 24h/24"],
    highlight: false,
  },
  {
    nom: "Semaine",
    prix: "199",
    unite: "/semaine",
    desc: "Le meilleur rapport qualité-prix",
    features: ["Assurance incluse", "1 000 km inclus", "Assistance 24h/24", "Livraison offerte"],
    highlight: true,
  },
  {
    nom: "Mois",
    prix: "699",
    unite: "/mois",
    desc: "Pour vos besoins longue durée",
    features: ["Assurance incluse", "Kilométrage illimité", "Assistance 24h/24", "Livraison offerte", "Véhicule de remplacement"],
    highlight: false,
  },
];

const faq = [
  { q: "Quel âge minimum pour louer ?", a: "Vous devez avoir au moins 21 ans et être titulaire du permis B depuis 2 ans minimum." },
  { q: "Quels documents dois-je fournir ?", a: "Permis de conduire valide, pièce d'identité et justificatif de domicile de moins de 3 mois." },
  { q: "Puis-je annuler ma réservation ?", a: "Oui, annulation gratuite jusqu'à 24h avant la prise en charge. Au-delà, des frais s'appliquent." },
  { q: "Y a-t-il une caution ?", a: "Oui, une empreinte bancaire est prise au moment de la prise en charge et restituée au retour." },
  { q: "Le kilométrage est-il limité ?", a: "Chaque formule inclut un kilométrage généreux. Au-delà, un supplément de 0,15€/km s'applique." },
];

export default function Particulier() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Location pour <span className="text-primary">Particuliers</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Weekend, vacances, déménagement ou remplacement : louez un véhicule adapté à vos besoins, sans engagement et à prix transparent.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  Voir nos véhicules <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <DevisDialog defaultType="particulier">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10">
                  Demander un devis
                </Button>
              </DevisDialog>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Nos solutions pour vous</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Tout ce dont vous avez besoin pour rouler en toute sérénité.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs comparaison */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Comparaison des tarifs</h2>
            <p className="text-muted-foreground">Tarifs à partir de — catégorie Micro. Tous risques inclus.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tarifs.map((t) => (
              <div
                key={t.nom}
                className={`rounded-2xl p-8 flex flex-col ${t.highlight ? "bg-primary text-primary-foreground ring-2 ring-primary" : "bg-card border border-border"}`}
              >
                <h3 className="font-display font-bold text-lg mb-1">{t.nom}</h3>
                <p className={`text-sm mb-4 ${t.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-bold">{t.prix}€</span>
                  <span className={`text-sm ${t.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.unite}</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${t.highlight ? "text-primary-foreground" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/vehicules" className="mt-6">
                  <Button
                    className={`w-full ${t.highlight ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`}
                    variant={t.highlight ? "secondary" : "default"}
                  >
                    Réserver
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10">Questions fréquentes</h2>
          <Accordion type="single" collapsible>
            {faq.map((q, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border px-4 my-2 rounded-xl">
                <AccordionTrigger className="text-left">{q.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{q.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Zone de couverture */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Zone de couverture</h2>
            <p className="text-muted-foreground">Service disponible dans un rayon de 20 km autour de Puteaux.</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              title="Zone de couverture WEST DRIVE"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d42000!2d2.2384!3d48.8847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2sfr!4v1700000000000!5m2!1sfr!2sfr"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {villes.map((v) => (
              <span key={v.id} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground">{v.nom}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Une question ?</h2>
          <p className="text-background/70 mb-8">Notre équipe est disponible pour vous accompagner dans votre projet de location.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact">
              <Button size="lg" className="gap-2 px-8">Nous contacter <ChevronRight className="h-4 w-4" /></Button>
            </Link>
            <a href="tel:+330643660809">
              <Button size="lg" variant="outline" className="gap-2 px-8 border-background/20 text-background hover:bg-background/10">
                06 43 66 08 09
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
