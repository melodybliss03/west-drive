import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  { icon: Car, titleKey: "largeChoice" },
  { icon: Clock, titleKey: "fastBooking" },
  { icon: Shield, titleKey: "insurance" },
  { icon: CreditCard, titleKey: "noSurprise" },
  { icon: Headphones, titleKey: "support" },
  { icon: MapPin, titleKey: "delivery" },
];

const tarifs = [];

const faq = [
  { id: 'MinAge' },
  { id: 'Documents' },
  { id: 'Cancellation' },
  { id: 'Deposit' },
  { id: 'Mileage' },
];

export default function Particulier() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t('particulier.title')}
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              {t('particulier.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  {t('particulier.viewVehicles')} <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <DevisDialog defaultType="particulier">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10">
                  {t('particulier.getQuote')}
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
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('particulier.solutions')}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{t('particulier.solutions_desc')}</p>
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
                <h3 className="font-display font-semibold mb-2">{t(`particulier.${s.titleKey}`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`particulier.${s.titleKey}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparaison */}
      <section className="py-20 bg-secondary">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t('particulier.comparison')}</h2>
            <p className="text-muted-foreground">{t('particulier.comparison_desc')}</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-semibold text-muted-foreground">{t('particulier.criteria')}</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">{t('particulier.carSharing')}</th>
                  <th className="p-4 text-center font-semibold text-primary bg-primary/5">{t('particulier.westdrive')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                [t('particulier.displayedPrice'), "50€", t('particulier.clear')],
                [t('particulier.actualPrice'), "60-75€", t('particulier.fixed')],
                [t('particulier.hiddenFees'), t('particulier.yes'), t('particulier.no')],
                [t('particulier.transparency'), "Moyenne", "100%"],
                [t('particulier.insurance_table'), t('particulier.toCheck'), t('particulier.included')],
                [t('particulier.support_table'), t('particulier.chat'), t('particulier.direct')],
                ].map(([critere, auto, west], i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{critere}</td>
                    <td className="p-4 text-center text-muted-foreground">{auto}</td>
                    <td className="p-4 text-center font-semibold text-primary bg-primary/5">{west}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA avec image */}
      <section
        className="relative py-28 bg-cover bg-center"
        style={{ backgroundImage: "url('/west.jpg')" }}
      >
        <div className="absolute inset-0 bg-foreground/75" />
        <div className="relative max-w-3xl mx-auto px-4 text-center text-background">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{t('particulier.readyToGo')}</h2>
          <p className="text-background/70 text-lg mb-8">{t('particulier.readyToGoDesc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/vehicules">
              <Button size="lg" className="gap-2 text-base px-8">
                {t('particulier.viewVehicles')} <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <DevisDialog defaultType="particulier">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-background/20 text-background hover:bg-background/10">
                {t('particulier.getQuote')}
              </Button>
            </DevisDialog>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10">{t('particulier.faqTitle')}</h2>
          <Accordion type="single" collapsible>
            {faq.map((q, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border px-4 my-2 rounded-xl">
                <AccordionTrigger className="text-left">{t(`particulier.faq${['MinAge', 'Documents', 'Cancellation', 'Deposit', 'Mileage'][i]}`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{t(`particulier.faq${['MinAge', 'Documents', 'Cancellation', 'Deposit', 'Mileage'][i]}Ans`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{t('particulier.contactQuestion')}</h2>
          <p className="text-background/70 mb-8">{t('particulier.contactDesc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact">
              <Button size="lg" className="gap-2 px-8">{t('particulier.contactUs')} <ChevronRight className="h-4 w-4" /></Button>
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
