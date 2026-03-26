import { useState } from "react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { contactService } from "@/lib/api/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setLoading(true);

    try {
      await contactService.createMessage({
        name: String(formData.get("nom") || "").trim(),
        email: String(formData.get("email") || "").trim().toLowerCase(),
        phone: String(formData.get("telephone") || "").trim() || undefined,
        subject: String(formData.get("sujet") || "").trim(),
        message: String(formData.get("message") || "").trim(),
      });

      toast({
        title: "Message envoye",
        description: "Nous vous repondrons dans les plus brefs delais.",
      });
      form.reset();
    } catch {
      toast({
        title: "Envoi impossible",
        description: "Le message n'a pas pu etre envoye. Merci de reessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Nous contacter</h1>
          <p className="text-muted-foreground mb-10">Une question ? N'hésitez pas à nous écrire.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="nom" className="text-sm font-medium">Nom</label>
                    <Input id="nom" name="nom" required placeholder="Votre nom" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" name="email" type="email" required placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="telephone" className="text-sm font-medium">Telephone (optionnel)</label>
                  <Input id="telephone" name="telephone" type="tel" placeholder="06 00 00 00 00" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sujet" className="text-sm font-medium">Sujet</label>
                  <Input id="sujet" name="sujet" required placeholder="Sujet de votre message" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <Textarea id="message" name="message" required rows={6} placeholder="Votre message..." />
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                  <Send className="h-4 w-4" />
                  {loading ? "Envoi en cours..." : "Envoyer"}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Adresse</p>
                  <p className="text-sm text-muted-foreground">Paris Ouest île-de-France</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Téléphone</p>
                  <p className="text-sm text-muted-foreground">06 43 66 08 09</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-sm text-muted-foreground">contact@pariswestdrive.fr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
