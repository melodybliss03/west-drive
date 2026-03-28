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
  { label: "Blog", href: "/blog", anchor: null },
  { label: "Avis clients", href: "/reviews", anchor: null },
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

  const sanitizeProfileValue = (value?: string | null): string => {
    if (typeof value !== "string") return "";
    const normalized = value.trim();
    if (!normalized) return "";

    const lowered = normalized.toLowerCase();
    if (lowered === "undefined" || lowered === "null") {
      return "";
    }

    return normalized;
  };

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileOpen(false);
    if (isHome && link.anchor) {
      const el = document.querySelector(link.anchor);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const firstName = sanitizeProfileValue(user?.prenom);
  const lastName = sanitizeProfileValue(user?.nom);
  const email = sanitizeProfileValue(user?.email);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || (email ? email.split("@")[0] : "Utilisateur");
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const LangToggle = () => (
    <button
      onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
      className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-background"
      aria-label="Changer de langue"
    >
      <Globe className="h-3.5 w-3.5" />
      {lang}
    </button>
  );

  return (
    <header className="fixed top-10 left-0 right-0 z-50 glass-header">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-20 px-4">

        {/* Logo — toujours visible */}
        <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="WEST DRIVE accueil">
          WEST <span className="text-primary">DRIVE</span>
        </Link>

        {/* Nav desktop — visible uniquement sur grands écrans (lg+) */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Navigation principale">
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

        {/* Actions desktop — visibles sur lg+ */}
        <div className="hidden lg:flex items-center gap-3">
          <LangToggle />
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
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{email || "-"}</p>
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

        {/* ── Tablette & Mobile : logo + FR/EN + compte + burger ── */}
        {/* Toujours visibles sur < lg */}
        <div className="flex lg:hidden items-center gap-2">
          <LangToggle />

          {/* Compte ou bouton inscription */}
          {user ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity"
              aria-label="Menu utilisateur"
            >
              {initials}
            </button>
          ) : (
            <Link to="/inscription">
              <Button size="sm" className="font-medium text-xs px-3">Créer un compte</Button>
            </Link>
          )}

          {/* Burger — déclenché dès tablette */}
          <button
            className="p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Menu burger (tablette & mobile) ─────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background border-b border-border relative z-50"
            >
              <nav className="flex flex-col p-4 gap-1" aria-label="Navigation mobile">
                {navLinks.map((link) => {
                  const isActive = link.href === "/" ? location.pathname === "/" : location.pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.label}
                      to={isHome && link.anchor ? "/" : link.href}
                      onClick={() => handleNavClick(link)}
                      className={`text-sm font-medium py-3 px-3 rounded-lg transition-colors ${
                        isActive
                          ? "text-primary font-semibold bg-primary/5"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Actions utilisateur dans le burger si connecté */}
                {user && (
                  <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-border">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{email || "-"}</p>
                    </div>
                    <Link to="/espace" onClick={() => setMobileOpen(false)}>
                      <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> Mon espace
                      </button>
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dropdown avatar tablette (en dehors du burger) */}
      <AnimatePresence>
        {dropdownOpen && user && (
          <>
            <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDropdownOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-4 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden lg:hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{email || "-"}</p>
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
    </header>
  );
}