import { Link } from "react-router-dom";
import DevisDialog from "@/components/DevisDialog";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Check,
  Building2,
  Users,
  FileText,
  Zap,
  Headphones,
  MapPin,
} from "lucide-react";
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
  {
    icon: Building2,
    title: "Flotte dédiée",
    desc: "Accédez à un pool de véhicules réservé à votre entreprise, sans immobilisation de capital.",
  },
  {
    icon: Users,
    title: "Multi-conducteurs",
    desc: "Ajoutez et gérez les conducteurs autorisés depuis votre espace pro en quelques clics.",
  },
  {
    icon: FileText,
    title: "Facturation simplifiée",
    desc: "Facture mensuelle unique, export CSV et paiement en fin de mois. Comptabilité facile.",
  },
  {
    icon: Zap,
    title: "Véhicule sous 24h",
    desc: "Besoin urgent ? Nous mettons à disposition un véhicule de remplacement en moins de 24h.",
  },
  {
    icon: Headphones,
    title: "Interlocuteur dédié",
    desc: "Un chargé de compte unique pour centraliser toutes vos demandes.",
  },
  {
    icon: MapPin,
    title: "Livraison sur site",
    desc: "Nous livrons directement sur votre lieu de travail dans toute notre zone de couverture.",
  },
];

const formules = [
  {
    nom: "Entreprises La Défense",
    desc: "Déplacements salariés, missions, séminaires. Facturation simplifiée et contrats sur-mesure.",
    features: [
      "Facturation centralisée",
      "Tarifs dégressifs",
      "Reporting mensuel",
    ],
    btnLabel: "En savoir plus",
    btnVariant: "outline" as const,
    highlight: false,
    link: "/#",
  },
  {
    nom: "Professionnels Mobiles",
    desc: "Infirmiers, commerciaux, consultants, artisans : ne laissez jamais une panne stopper votre activité.",
    features: [
      "Disponibilité sous 2h",
      "Facturation professionnelle",
      "Tarifs dégressifs",
    ],
    btnLabel: "Découvrir",
    btnVariant: "default" as const,
    highlight: true,
    link: "/#",
  },
  {
    nom: "Partenariats Professionnels",
    desc: "Assurances, garages, assistance : offrez la mobilité à vos clients avec notre solution clé en main.",
    features: ["Tarifs négociés", "Facturation dédiée", "Service prioritaire"],
    btnLabel: "Devenir partenaire",
    btnVariant: "default" as const,
    highlight: false,
    link: "/#",
  },
];

const faq = [
  {
    q: "Quels types de sociétés peuvent louer ?",
    a: "Toute société (SARL, SAS, SA, auto-entrepreneur) avec un SIRET valide peut ouvrir un compte entreprise.",
  },
  {
    q: "Peut-on payer en fin de mois ?",
    a: "Oui, les entreprises bénéficient d'un paiement différé avec facturation mensuelle.",
  },
  {
    q: "Combien de conducteurs par véhicule ?",
    a: "Vous pouvez ajouter autant de conducteurs autorisés que nécessaire depuis votre espace pro.",
  },
  {
    q: "Proposez-vous des contrats longue durée ?",
    a: "Oui, nous proposons des formules de 3 à 24 mois avec des tarifs très compétitifs.",
  },
  {
    q: "Comment fonctionne le véhicule de remplacement ?",
    a: "En cas de panne ou d'entretien programmé, un véhicule équivalent est livré sous 24h.",
  },
];

export default function Entreprise() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Location pour <span className="text-primary">Entreprises</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Flotte dédiée, facturation simplifiée et interlocuteur unique.
              Optimisez la mobilité de vos équipes avec WEST DRIVE.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  Voir nos véhicules <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <DevisDialog defaultType="particulier">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10"
                >
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
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Nos solutions B2B
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Des services conçus pour les professionnels exigeants.
            </p>
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Formules entreprise */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Nos formules entreprise
            </h2>
            <p className="text-muted-foreground">
              Tarifs personnalisés selon vos besoins et votre volume.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formules.map((t) => (
              <div
                key={t.nom}
                className={`rounded-2xl p-8 flex flex-col text-center ${t.highlight ? "border-2 border-primary bg-card" : "bg-card border border-border"}`}
              >
                <h3 className="font-display font-bold text-xl mb-3">{t.nom}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {t.desc}
                </p>
                <ul className="space-y-2.5 flex-1 mb-8 text-left">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {t.btnLabel === "Devenir partenaire" ? (
                  <Link to={t.link}>
                    <Button className="w-full" variant={t.btnVariant}>
                      {t.btnLabel}
                    </Button>
                  </Link>
                ) : t.btnVariant === "outline" ? (
                  <DevisDialog defaultType="entreprise">
                    <Button className="w-full" variant="outline">
                      {t.btnLabel}
                    </Button>
                  </DevisDialog>
                ) : (
                  <Link to={t.link}>
                    <Button className="w-full">{t.btnLabel}</Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA avec image background */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/west.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/80" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center text-background">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Simplifiez la mobilité de votre entreprise
          </h2>
          <p className="text-background/70 text-lg mb-8">
            Un interlocuteur dédié, une facturation unique, des véhicules
            toujours disponibles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <DevisDialog defaultType="entreprise">
              <Button size="lg" className="gap-2 px-8 text-base">
                Demander un devis <ChevronRight className="h-4 w-4" />
              </Button>
            </DevisDialog>
            <Link to="/vehicules">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 text-base border-background/20 text-background hover:bg-background/10"
              >
                Voir nos véhicules
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10">
            Questions fréquentes
          </h2>
          <Accordion type="single" collapsible>
            {faq.map((q, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border px-4 my-2 rounded-xl"
              >
                <AccordionTrigger className="text-left">{q.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {q.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Zone de couverture */}
      <section className="py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Zone de couverture
            </h2>
            <p className="text-muted-foreground">
              Livraison et prise en charge dans toute notre zone.
            </p>
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
              <span
                key={v.id}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground"
              >
                {v.nom}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Parlons de votre projet
          </h2>
          <p className="text-background/70 mb-8">
            Recevez un devis personnalisé en moins de 24h.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <DevisDialog defaultType="entreprise">
              <Button size="lg" className="gap-2 px-8">
                Demander un devis <ChevronRight className="h-4 w-4" />
              </Button>
            </DevisDialog>
            <Link to="/inscription">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 border-background/20 text-background hover:bg-background/10"
              >
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
