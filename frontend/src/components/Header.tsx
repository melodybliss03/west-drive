import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Accueil", href: "/", anchor: "#hero" },
  { label: "Particulier", href: "/particulier", anchor: null },
  { label: "Entreprise", href: "/entreprise", anchor: null },
  { label: "Nos Véhicules", href: "/vehicules", anchor: null },
  { label: "Nous contacter", href: "/contact", anchor: null },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lang, setLang] = useState<"FR" | "EN">("FR");
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { user, logout } = useAuth();

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileOpen(false);
    if (isHome && link.anchor) {
      const el = document.querySelector(link.anchor);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const initials = user ? (user.prenom[0] + user.nom[0]).toUpperCase() : "";

  return (
    <header className="fixed top-10 left-0 right-0 z-50 glass-header">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="WEST DRIVE accueil">
          WEST <span className="text-primary">DRIVE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? location.pathname === "/" : location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.label}
                to={isHome && link.anchor ? "/" : link.href}
                onClick={() => handleNavClick(link)}
                className={`text-sm font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-foreground/70 hover:text-foreground"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
            className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-background"
            aria-label="Changer de langue"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang}
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity"
                aria-label="Menu utilisateur"
              >
                {initials}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setDropdownOpen(false); navigate("/espace"); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Mon espace
                      </button>
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); navigate("/"); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/inscription">
              <Button size="sm" className="font-medium">Créer un compte</Button>
            </Link>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border">
            <nav className="flex flex-col p-4 gap-3" aria-label="Navigation mobile">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? location.pathname === "/" : location.pathname.startsWith(link.href);
                return (
                  <Link key={link.label} to={isHome && link.anchor ? "/" : link.href} onClick={() => handleNavClick(link)}
                    className={`text-sm font-medium py-2 ${isActive ? "text-primary font-semibold" : "text-foreground/70 hover:text-foreground"}`}>{link.label}</Link>
                );
              })}
              <div className="flex items-center gap-2 pb-3">
                <button
                  onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
                  className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-background"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {lang}
                </button>
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                {user ? (
                  <>
                    <Link to="/espace" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2"><LayoutDashboard className="h-4 w-4" /> Mon espace</Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => { setMobileOpen(false); logout(); navigate("/"); }}>
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </Button>
                  </>
                ) : (
                  <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Créer un compte</Button>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
