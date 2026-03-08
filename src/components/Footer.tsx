import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer>
      {/* Main footer */}
      <div className="bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="font-display text-2xl font-bold mb-4">
                WEST <span className="text-primary">DRIVE</span>
              </h3>
              <p className="text-sm text-background/60 leading-relaxed max-w-xs">
                Location de véhicules en Île-de-France. Qualité, transparence et proximité.
              </p>
              <p className="text-xs text-background/40 mt-4">WEST DRIVE, 2025.</p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li><Link to="/" className="hover:text-primary transition-colors">Accueil</Link></li>
                <li><Link to="/vehicules" className="hover:text-primary transition-colors">Nos Véhicules</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li><Link to="/particulier" className="hover:text-primary transition-colors">Particulier</Link></li>
                <li><Link to="/entreprise" className="hover:text-primary transition-colors">Entreprise</Link></li>
                <li><Link to="/devis" className="hover:text-primary transition-colors">Devis</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold mb-4 text-background/80 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm text-background/60">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>12 Rue de la République, 92800 Puteaux</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>06 43 66 08 09</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>contact@westdrive.fr</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — accent colored like reference */}
      <div className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-primary-foreground font-medium">
            &copy; {new Date().getFullYear()} WEST DRIVE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/80">
            <a href="#" className="hover:text-primary-foreground transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">CGV</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
