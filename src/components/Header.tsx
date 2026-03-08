import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Accueil", href: "/", anchor: "#hero" },
  { label: "Nos Véhicules", href: "/vehicules", anchor: "#vehicules" },
  { label: "Tarifs", href: "/#tarifs", anchor: "#tarifs" },
  { label: "Nous contacter", href: "/contact", anchor: "#contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileOpen(false);
    if (isHome && link.anchor) {
      const el = document.querySelector(link.anchor);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-10 left-0 right-0 z-50 glass-header">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="WEST DRIVE accueil">
          WEST <span className="text-primary">DRIVE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={isHome && link.anchor ? "/" : link.href}
              onClick={() => handleNavClick(link)}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
          <Link to="/inscription">
            <Button size="sm" className="font-medium">
              Créer un compte
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <nav className="flex flex-col p-4 gap-3" aria-label="Navigation mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={isHome && link.anchor ? "/" : link.href}
                  onClick={() => handleNavClick(link)}
                  className="text-sm font-medium py-2 text-foreground/70 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Créer un compte</Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
