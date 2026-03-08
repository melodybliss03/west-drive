import { Link } from "react-router-dom";
import DevisDialog from "@/components/DevisDialog";
import { motion } from "framer-motion";
import { ChevronRight, Check, Building2, Users, FileText, Zap, Headphones, MapPin } from "lucide-react";
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
  { icon: Building2, title: "Flotte dédiée", desc: "Accédez à un pool de véhicules réservé à votre entreprise, sans immobilisation de capital." },
  { icon: Users, title: "Multi-conducteurs", desc: "Ajoutez et gérez les conducteurs autorisés depuis votre espace pro en quelques clics." },
  { icon: FileText, title: "Facturation simplifiée", desc: "Facture mensuelle unique, export CSV et paiement en fin de mois. Comptabilité facile." },
  { icon: Zap, title: "Véhicule sous 24h", desc: "Besoin urgent ? Nous mettons à disposition un véhicule de remplacement en moins de 24h." },
  { icon: Headphones, title: "Interlocuteur dédié", desc: "Un chargé de compte unique pour centraliser toutes vos demandes." },
  { icon: MapPin, title: "Livraison sur site", desc: "Nous livrons directement sur votre lieu de travail dans toute notre zone de couverture." },
];

const tarifs = [
  {
    nom: "Ponctuel",
    prix: "Sur devis",
    desc: "Location à la demande",
    features: ["Tarifs B2B négociés", "Assurance incluse", "Assistance 24h/24"],
    highlight: false,
  },
  {
    nom: "Flotte",
    prix: "Sur devis",
    desc: "3+ véhicules en simultané",
    features: ["Tarifs dégressifs", "Gestion multi-conducteurs", "Facturation unique", "Interlocuteur dédié"],
    highlight: true,
  },
  {
    nom: "Longue durée",
    prix: "Sur devis",
    desc: "Engagement 3+ mois",
    features: ["Meilleur tarif garanti", "Kilométrage illimité", "Véhicule de remplacement", "Livraison incluse", "Facturation mensuelle"],
    highlight: false,
  },
];

const faq = [
  { q: "Quels types de sociétés peuvent louer ?", a: "Toute société (SARL, SAS, SA, auto-entrepreneur) avec un SIRET valide peut ouvrir un compte entreprise." },
  { q: "Peut-on payer en fin de mois ?", a: "Oui, les entreprises bénéficient d'un paiement différé avec facturation mensuelle." },
  { q: "Combien de conducteurs par véhicule ?", a: "Vous pouvez ajouter autant de conducteurs autorisés que nécessaire depuis votre espace pro." },
  { q: "Proposez-vous des contrats longue durée ?", a: "Oui, nous proposons des formules de 3 à 24 mois avec des tarifs très compétitifs." },
  { q: "Comment fonctionne le véhicule de remplacement ?", a: "En cas de panne ou d'entretien programmé, un véhicule équivalent est livré sous 24h." },
];

export default function Entreprise() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Location pour <span className="text-primary">Entreprises</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Flotte dédiée, facturation simplifiée et interlocuteur unique. Optimisez la mobilité de vos équipes avec WEST DRIVE.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/contact">
                <Button size="lg" className="gap-2 text-base px-8">
                  Demander un devis <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="tel:+330643660809">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10">
                  06 43 66 08 09
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Nos solutions B2B</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Des services conçus pour les professionnels exigeants.</p>
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
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Nos formules entreprise</h2>
            <p className="text-muted-foreground">Tarifs personnalisés selon vos besoins et votre volume.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tarifs.map((t) => (
              <div
                key={t.nom}
                className={`rounded-2xl p-8 flex flex-col ${t.highlight ? "bg-primary text-primary-foreground ring-2 ring-primary" : "bg-card border border-border"}`}
              >
                <h3 className="font-display font-bold text-lg mb-1">{t.nom}</h3>
                <p className={`text-sm mb-4 ${t.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.desc}</p>
                <div className="mb-6">
                  <span className="text-2xl font-display font-bold">{t.prix}</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${t.highlight ? "text-primary-foreground" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="mt-6">
                  <Button
                    className={`w-full ${t.highlight ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`}
                    variant={t.highlight ? "secondary" : "default"}
                  >
                    Demander un devis
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
            <p className="text-muted-foreground">Livraison et prise en charge dans toute notre zone.</p>
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
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Parlons de votre projet</h2>
          <p className="text-background/70 mb-8">Recevez un devis personnalisé en moins de 24h.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact">
              <Button size="lg" className="gap-2 px-8">Demander un devis <ChevronRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/inscription">
              <Button size="lg" variant="outline" className="gap-2 px-8 border-background/20 text-background hover:bg-background/10">
                Créer un compte pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
