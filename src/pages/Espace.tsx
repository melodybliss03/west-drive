import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  FileText,
  Bell,
  CalendarDays,
  Clock,
  Download,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";

// Mock data for client dashboard
const mockReservations = [
  {
    id: "R-2024-001",
    vehicule: "Renault Clio V",
    dateDebut: "2024-03-15",
    dateFin: "2024-03-18",
    statut: "CONFIRMEE",
    montant: 165,
    ville: "Puteaux",
  },
  {
    id: "R-2024-002",
    vehicule: "BMW Série 3",
    dateDebut: "2024-02-10",
    dateFin: "2024-02-14",
    statut: "TERMINEE",
    montant: 380,
    ville: "La Défense",
  },
  {
    id: "R-2024-003",
    vehicule: "Peugeot 3008",
    dateDebut: "2024-04-01",
    dateFin: "2024-04-05",
    statut: "EN_ATTENTE",
    montant: 340,
    ville: "Nanterre",
  },
];

const mockNotifications = [
  { id: 1, title: "Réservation confirmée", desc: "Votre Renault Clio V est confirmée pour le 15 mars.", date: "Il y a 2h", read: false },
  { id: 2, title: "Rappel J-1", desc: "Votre location BMW Série 3 commence demain à 9h.", date: "Il y a 1j", read: true },
  { id: 3, title: "Facture disponible", desc: "La facture F-2024-002 est prête à télécharger.", date: "Il y a 3j", read: true },
];

const mockFactures = [
  { id: "F-2024-001", reservation: "R-2024-002", date: "2024-02-14", montant: 380, vehicule: "BMW Série 3" },
  { id: "F-2024-002", reservation: "R-2024-001", date: "2024-03-18", montant: 165, vehicule: "Renault Clio V" },
];

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-amber-500/10 text-amber-600 border-amber-200",
  CONFIRMEE: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  EN_COURS: "bg-blue-500/10 text-blue-600 border-blue-200",
  TERMINEE: "bg-muted text-muted-foreground border-border",
  ANNULEE: "bg-destructive/10 text-destructive border-destructive/20",
};

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

export default function Espace() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("reservations");

  return (
    <div className="min-h-screen">
      <TopBar />
      <Header />
      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Mon espace</h1>
              <p className="text-muted-foreground text-sm mt-1">Bienvenue, Sophie Martin</p>
            </div>
            <div className="flex gap-2">
              <Link to="/vehicules">
                <Button size="sm" className="gap-2">
                  <Car className="h-4 w-4" />
                  Nouvelle réservation
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Car className="h-3.5 w-3.5" />
                Réservations
              </div>
              <p className="font-display text-2xl font-bold">{mockReservations.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                En cours
              </div>
              <p className="font-display text-2xl font-bold">
                {mockReservations.filter((r) => r.statut === "CONFIRMEE" || r.statut === "EN_COURS").length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5" />
                Factures
              </div>
              <p className="font-display text-2xl font-bold">{mockFactures.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </div>
              <p className="font-display text-2xl font-bold">
                {mockNotifications.filter((n) => !n.read).length}
                <span className="text-sm font-normal text-muted-foreground"> nouvelles</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none p-0 h-auto mb-6">
              <TabsTrigger
                value="reservations"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Réservations
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {mockNotifications.filter((n) => !n.read).length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {mockNotifications.filter((n) => !n.read).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="factures"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                Factures
              </TabsTrigger>
              <TabsTrigger
                value="profil"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3"
              >
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
            </TabsList>

            {/* Réservations */}
            <TabsContent value="reservations">
              <div className="space-y-4">
                {mockReservations.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-semibold">{r.vehicule}</h3>
                        <Badge variant="outline" className={statutColors[r.statut]}>
                          {statutLabels[r.statut]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.id} · {r.ville} · Du {new Date(r.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(r.dateFin).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-lg text-primary">{r.montant}€</span>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Détails <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <div className="space-y-3">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`bg-card border rounded-xl p-5 ${!n.read ? "border-primary/30 bg-primary/[0.02]" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <h3 className="font-semibold text-sm">{n.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{n.desc}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Factures */}
            <TabsContent value="factures">
              <div className="space-y-3">
                {mockFactures.map((f) => (
                  <div
                    key={f.id}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-sm">{f.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {f.vehicule} · Réservation {f.reservation} · {new Date(f.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-primary">{f.montant}€</span>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Profil */}
            <TabsContent value="profil">
              <div className="max-w-lg space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Prénom</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue="Sophie" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom</label>
                    <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue="Martin" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue="sophie.martin@email.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card" defaultValue="06 12 34 56 78" />
                </div>
                <Button className="mt-2">Enregistrer les modifications</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
