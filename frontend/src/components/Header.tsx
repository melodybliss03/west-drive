import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/useLanguageHook";
import { isBackofficeUser } from "@/lib/auth/roles";
import { useTranslation } from "react-i18next";

const navLinksKeys = [
  { labelKey: "nav.home", href: "/", anchor: "#hero" },
  { labelKey: "nav.particulier", href: "/particulier", anchor: null },
  { labelKey: "nav.entreprise", href: "/entreprise", anchor: null },
  { labelKey: "nav.vehicles", href: "/vehicules", anchor: null },
  { labelKey: "nav.blog", href: "/blog", anchor: null },
  { labelKey: "nav.reviews", href: "/reviews", anchor: null },
  { labelKey: "nav.contact", href: "/contact", anchor: null },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

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

  const firstName = sanitizeProfileValue(user?.prenom);
  const lastName = sanitizeProfileValue(user?.nom);
  const email = sanitizeProfileValue(user?.email);
  const accountRoute = isBackofficeUser(user) ? "/boss" : "/espace";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    (email ? email.split("@")[0] : "User");
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const LangToggle = () => (
    <button
      onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
      className="flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-background"
      aria-label={t("nav.changeLanguage")}
    >
      {language === "fr" ? (
        <svg width="20" height="14" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" className="rounded">
          <rect width="1" height="2" fill="#002395" />
          <rect x="1" width="1" height="2" fill="white" />
          <rect x="2" width="1" height="2" fill="#F31830" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Gb-England--Streamline-Flagpack" height="20" width="20" className="rounded">
          <desc>GB England Streamline Icon</desc>
          <path fill="#f7fcff" fillRule="evenodd" d="M0 3v18h24V3H0Z" clipRule="evenodd" strokeWidth="0.75"></path>
          <path fill="#f50302" fillRule="evenodd" d="M13.5 3h-3v7.5H0v3h10.5v7.5h3V13.5h10.5v-3H13.5V3Z" clipRule="evenodd" strokeWidth="0.75"></path>
        </svg>
      )}
      {language.toUpperCase()}
    </button>
  );

  return (
    <header className="fixed top-10 left-0 right-0 z-50 glass-header">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-20 px-4">
        {/* Logo — toujours visible */}
        <Link
          to="/"
          className="font-display font-bold tracking-tight flex items-center"
          aria-label="WEST DRIVE accueil"
        >
          <img 
            src="/logo_westdrive.png" 
            alt="PARIS WEST DRIVE" 
            className="h-4 w-auto sm:h-2 md:h-8 lg:h-8 xl:h-6 object-contain"
          />
        </Link>

        {/* Nav desktop — visible uniquement sur grands écrans (lg+) */}
        <nav
          className="hidden lg:flex items-center gap-6"
          aria-label="Navigation principale"
        >
          {navLinksKeys.map((link) => {
            const isActive =
              link.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.href);
            function handleNavClick(link: { labelKey: string; href: string; anchor: string; }): void {
              throw new Error("Function not implemented.");
            }

            return (
              <Link
                key={link.labelKey}
                to={isHome && link.anchor ? "/" : link.href}
                onClick={() => handleNavClick(link)}
                className={`text-sm font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-foreground/70 hover:text-foreground"}`}
              >
                {t(link.labelKey)}
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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email || "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate(accountRoute);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" /> {t("header.myAccount")}
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> {t("header.logout")}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/inscription">
              <Button size="sm" className="font-medium">
                {t("header.login")}
              </Button>
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
              <Button size="sm" className="font-medium text-xs px-3">
                {t("header.login")}
              </Button>
            </Link>
          )}

          {/* Burger — déclenché dès tablette */}
          <button
            className="p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
              <nav
                className="flex flex-col p-4 gap-1"
                aria-label="Navigation mobile"
              >
                {navLinksKeys.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.href);
                  function handleNavClick(link: { labelKey: string; href: string; anchor: string; }): void {
                    throw new Error("Function not implemented.");
                  }

                  return (
                    <Link
                      key={link.labelKey}
                      to={isHome && link.anchor ? "/" : link.href}
                      onClick={() => handleNavClick(link)}
                      className={`text-sm font-medium py-3 px-3 rounded-lg transition-colors ${
                        isActive
                          ? "text-primary font-semibold bg-primary/5"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {t(link.labelKey)}
                    </Link>
                  );
                })}

                {/* Actions utilisateur dans le burger si connecté */}
                {user && (
                  <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-border">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {email || "-"}
                      </p>
                    </div>
                    <Link
                      to={accountRoute}
                      onClick={() => setMobileOpen(false)}
                    >
                      <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> {t("header.myAccount")}
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> {t("header.logout")}
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
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-4 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden lg:hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {email || "-"}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(accountRoute);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" /> Mon espace
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  navigate("/");
                }}
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
