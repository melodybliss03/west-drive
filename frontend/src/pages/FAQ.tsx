import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { faqData } from "@/data/mock";

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Foire aux questions</h1>
          <p className="text-muted-foreground mb-10">Retrouvez les réponses aux questions les plus fréquentes.</p>

          {faqData.map((cat) => (
            <div key={cat.categorie} className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-4">{cat.categorie}</h2>
              <Accordion type="single" collapsible>
                {cat.questions.map((q, i) => (
                  <AccordionItem key={i} value={`${cat.categorie}-${i}`} className="border px-4 my-2 rounded-xl">
                    <AccordionTrigger className="text-left">{q.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{q.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
