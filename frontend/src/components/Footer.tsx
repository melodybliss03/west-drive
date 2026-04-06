import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, User, Instagram, Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer>
      {/* Contact info bar — like reference image */}
      <div className="bg-foreground">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Support & Email */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-background text-sm">
                  {t("footer.support")}
                </h4>
                <p className="text-background/60 text-sm">
                  contact@westdrive.fr
                </p>
              </div>
            </div>

            {/* Customer Support */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Phone className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-background text-sm">
                  {t("footer.customer")}
                </h4>
                <p className="text-background/60 text-sm">06 43 66 08 09</p>
              </div>
            </div>

            {/* Our Location */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-background text-sm">
                  {t("footer.location")}
                </h4>
                <p className="text-background/60 text-sm">
                  12 Rue de la République, 92800 Puteaux
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="bg-foreground">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-background/10" />
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <Link
                to="/"
                className="font-display font-bold tracking-tight flex items-center mb-2"
                aria-label="WEST DRIVE accueil"
              >
                <img
                  src="/logo_west_drive.png"
                  alt="PARIS WEST DRIVE"
                  className="h-4 w-auto sm:h-2 md:h-8 lg:h-8 xl:h-6 object-contain"
                />
              </Link>
              <p className="text-sm text-background/60 leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">
                {t("footer.navigation")}
              </h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    {t("nav.home")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/vehicules"
                    className="hover:text-primary transition-colors"
                  >
                    {t("nav.vehicles")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    {t("nav.contact")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">
                Services
              </h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li>
                  <Link
                    to="/particulier"
                    className="hover:text-primary transition-colors"
                  >
                    {t("nav.particulier")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/entreprise"
                    className="hover:text-primary transition-colors"
                  >
                    {t("nav.entreprise")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/devis"
                    className="hover:text-primary transition-colors"
                  >
                    Devis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Réseaux sociaux */}
            {/* <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">
                Réseaux sociaux
              </h4>
              <ul className="space-y-3 text-sm text-background/60">
                <li>
                  <a
                    href="https://instagram.com/westdrive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com/westdrive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Facebook className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://tiktok.com/@westdrive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <svg
                      className="h-4 w-4 text-primary flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.81.11v-3.5a6.37 6.37 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.27 8.27 0 0 0 3.76.92V6.18a4.77 4.77 0 0 1-.01.51z" />
                    </svg>
                    <span>TikTok</span>
                  </a>
                </li>
              </ul>
            </div> */}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-primary-foreground font-medium">
            &copy; {new Date().getFullYear()} PARIS WEST DRIVE. {t("footer.followUs")}
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/80">
            <a
              href="#"
              className="hover:text-primary-foreground transition-colors"
            >
              {t("footer.legal")}
            </a>
            <a
              href="#"
              className="hover:text-primary-foreground transition-colors"
            >
              {t("footer.terms")}
            </a>
            <a
              href="#"
              className="hover:text-primary-foreground transition-colors"
            >
              {t("footer.privacy")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
