import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  { icon: Building2, titleKey: "fleetDedicated" },
  { icon: Users, titleKey: "multiDrivers" },
  { icon: FileText, titleKey: "simplifiedBilling" },
  { icon: Zap, titleKey: "vehicle24h" },
  { icon: Headphones, titleKey: "dedicatedContact" },
  { icon: MapPin, titleKey: "onSiteDelivery" },
];

const formules = [
  {
    key: "formula1",
    featureKeys: ["formula1Feature1", "formula1Feature2", "formula1Feature3"],
    highlight: false,
  },
  {
    key: "formula2",
    featureKeys: ["formula2Feature1", "formula2Feature2", "formula2Feature3"],
    highlight: true,
  },
  {
    key: "formula3",
    featureKeys: ["formula3Feature1", "formula3Feature2", "formula3Feature3"],
    highlight: false,
  },
];

const faq = [
  { id: "CompanyTypes" },
  { id: "EndOfMonth" },
  { id: "Drivers" },
  { id: "LongTerm" },
  { id: "Replacement" },
];

export default function Entreprise() {
  const { t } = useTranslation();
  
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
              {t('entreprise.title')}
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              {t('entreprise.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  {t('entreprise.viewVehicles')} <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <DevisDialog defaultType="entreprise">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10"
                >
                  {t('entreprise.getQuote')}
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
              {t('entreprise.solutions')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('entreprise.solutions_desc')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{t(`entreprise.${s.titleKey}`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`entreprise.${s.titleKey}_desc`)}
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
              {t('entreprise.formulas')}
            </h2>
            <p className="text-muted-foreground">
              {t('entreprise.formulasDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formules.map((f) => (
              <div
                key={f.key}
                className={`rounded-2xl p-8 flex flex-col text-center ${f.highlight ? "border-2 border-primary bg-card" : "bg-card border border-border"}`}
              >
                <h3 className="font-display font-bold text-xl mb-3">{t(`entreprise.${f.key}Title`)}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {t(`entreprise.${f.key}Desc`)}
                </p>
                <ul className="space-y-2.5 flex-1 mb-8 text-left">
                  {f.featureKeys.map((featKey) => (
                    <li key={featKey} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      {t(`entreprise.${featKey}`)}
                    </li>
                  ))}
                </ul>
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
            {t('entreprise.simplifyMobility')}
          </h2>
          <p className="text-background/70 text-lg mb-8">
            {t('entreprise.simplifyMobilityDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <DevisDialog defaultType="entreprise">
              <Button size="lg" className="gap-2 px-8 text-base">
                {t('entreprise.getQuote')} <ChevronRight className="h-4 w-4" />
              </Button>
            </DevisDialog>
            <Link to="/vehicules">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 text-base border-background/20 text-background hover:bg-background/10"
              >
                {t('entreprise.viewVehicles')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10">
            {t('entreprise.faqTitle')}
          </h2>
          <Accordion type="single" collapsible>
            {faq.map((q, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border px-4 my-2 rounded-xl"
              >
                <AccordionTrigger className="text-left">
                  {t(`entreprise.faq${q.id}`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`entreprise.faq${q.id}Ans`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {t('entreprise.projectTalk')}
          </h2>
          <p className="text-background/70 mb-8">
            {t('entreprise.projectTalkDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <DevisDialog defaultType="entreprise">
              <Button size="lg" className="gap-2 px-8">
                {t('entreprise.getQuote')} <ChevronRight className="h-4 w-4" />
              </Button>
            </DevisDialog>
            <Link to="/inscription">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 border-background/20 text-background hover:bg-background/10"
              >
                {t('entreprise.createProAccount')}
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
