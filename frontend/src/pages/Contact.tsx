import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { contactService } from "@/lib/api/services";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

export default function Contact() {
  const { t } = useTranslation();
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
        title: t('contact.success'),
        description: t('contact.successDesc'),
      });
      form.reset();
    } catch {
      toast({
        title: t('contact.error'),
        description: t('contact.errorDesc'),
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
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{t('contact.title')}</h1>
          <p className="text-muted-foreground mb-10">{t('contact.subtitle')}</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="nom" className="text-sm font-medium">{t('contact.name')}</label>
                    <Input id="nom" name="nom" required placeholder={t('contact.namePlaceholder')} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium">{t('contact.email')}</label>
                    <Input id="email" name="email" type="email" required placeholder={t('contact.emailPlaceholder')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="telephone" className="text-sm font-medium">{t('contact.phone')}</label>
                  <Input id="telephone" name="telephone" type="tel" placeholder={t('contact.phonePlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sujet" className="text-sm font-medium">{t('contact.subject')}</label>
                  <Input id="sujet" name="sujet" required placeholder={t('contact.subjectPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-medium">{t('contact.message')}</label>
                  <Textarea id="message" name="message" required rows={6} placeholder={t('contact.messagePlaceholder')} />
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? <><Spinner className="mr-1" />{t('contact.sending')}</> : <><Send className="h-4 w-4" />{t('contact.send')}</>}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{t('contact.addressSection')}</p>
                  <p className="text-sm text-muted-foreground">{t('contact.addressText')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{t('contact.telephoneLabel')}</p>
                  <p className="text-sm text-muted-foreground">06 43 66 08 09</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{t('contact.emailLabel')}</p>
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
