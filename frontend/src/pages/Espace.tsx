import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import { notificationsService, reservationsService, ReservationDto, ReservationEventDto, usersService } from "@/lib/api/services";

type UiNotification = {
  id: string;
  title: string;
  desc: string;
  date: string;
  read: boolean;
};

type UiReservation = {
  id: string;
  vehicule: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  montant: number;
  ville: string;
};

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-amber-500/10 text-amber-600 border-amber-200",
  CONFIRMEE: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  EN_COURS: "bg-blue-500/10 text-blue-600 border-blue-200",
  TERMINEE: "bg-muted text-muted-foreground border-border",
  CLOTUREE: "bg-muted text-muted-foreground border-border",
  ANNULEE: "bg-destructive/10 text-destructive border-destructive/20",
};

const statutLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
  REFUSEE: "Refusée",
  EN_ANALYSE: "En analyse",
  PROPOSITION_ENVOYEE: "Proposition envoyée",
  NOUVELLE_DEMANDE: "Nouvelle demande",
};

function mapReservationDto(dto: ReservationDto): UiReservation {
  return {
    id: dto.id,
    vehicule: dto.vehicleName || dto.requestedVehicleType,
    dateDebut: dto.startAt,
    dateFin: dto.endAt,
    statut: dto.status,
    montant: dto.amountTtc,
    ville: dto.pickupCity,
  };
}

export default function Espace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("reservations");
  const [reservations, setReservations] = useState<UiReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<UiReservation | null>(null);
  const [reservationEvents, setReservationEvents] = useState<ReservationEventDto[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.prenom || "",
    lastName: user?.nom || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
    }
  }, [user, navigate]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.prenom || "",
      lastName: user?.nom || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user?.prenom, user?.nom, user?.email, user?.phone]);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        // Load user's own reservations by passing userId filter
        const collection = await reservationsService.list({ page: 1, limit: 50 }, user?.id);
        const list = Array.isArray(collection) ? collection : collection.items;
        const mapped = list.map(mapReservationDto);
        setReservations(mapped);
      } catch {
        setReservations([]);
      } finally {
        setLoadingReservations(false);
      }
    };

    if (user?.id) {
      loadReservations();
    } else {
      setLoadingReservations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setLoadingNotifications(false);
        return;
      }

      try {
        const collection = await notificationsService.list({ page: 1, limit: 50 });
        const items = Array.isArray(collection) ? collection : collection.items;
        setNotifications(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            desc: item.message,
            date: new Date(item.createdAt).toLocaleString("fr-FR"),
            read: item.isRead,
          })),
        );
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();
  }, [user]);

  const openReservationDetails = async (reservation: UiReservation) => {
    setSelectedReservation(reservation);
    setLoadingDetails(true);
    try {
      const collection = await reservationsService.findEvents(reservation.id, { page: 1, limit: 100 });
      const items = Array.isArray(collection) ? collection : collection.items;
      setReservationEvents(
        items.filter((evt) => {
          const payload = (evt.payload || {}) as Record<string, unknown>;
          return payload.visibleClient !== false;
        }),
      );
    } catch {
      setReservationEvents([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsService.markAsRead(id);
    } catch {
      // optimistic UI keeps UX fluid
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsService.markAllAsRead();
    } catch {
      // optimistic UI keeps UX fluid
    }
  };

  const saveProfile = async () => {
    try {
      await usersService.updateMe({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour votre profil.", variant: "destructive" });
    }
  };

  const factures = useMemo(
    () =>
      reservations
        .filter((r) => ["CONFIRMEE", "EN_COURS", "CLOTUREE", "TERMINEE"].includes(r.statut))
        .map((r) => ({
          id: `F-${r.id}`,
          reservation: r.id,
          date: r.dateFin,
          montant: r.montant,
          vehicule: r.vehicule,
        })),
    [reservations]
  );

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
              <p className="text-muted-foreground text-sm mt-1">Bienvenue, {user?.prenom || "Client"} {user?.nom || ""}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/vehicules">
                <Button size="sm" className="gap-2">
                  <Car className="h-4 w-4" />
                  Nouvelle réservation
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                logout();
                toast({ title: "Déconnexion", description: "Vous avez été déconnecté avec succès." });
              }}>
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
              <p className="font-display text-2xl font-bold">{reservations.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                En cours
              </div>
              <p className="font-display text-2xl font-bold">
                {reservations.filter((r) => r.statut === "CONFIRMEE" || r.statut === "EN_COURS").length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5" />
                Factures
              </div>
              <p className="font-display text-2xl font-bold">{factures.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </div>
              <p className="font-display text-2xl font-bold">
                {notifications.filter((n) => !n.read).length}
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
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
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
              {loadingReservations && <p className="text-sm text-muted-foreground mb-4">Chargement des réservations...</p>}
              <div className="space-y-4">
                {reservations.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-semibold">{r.vehicule}</h3>
                        <Badge variant="outline" className={statutColors[r.statut] || ""}>
                          {statutLabels[r.statut] || r.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.id} · {r.ville} · Du {new Date(r.dateDebut).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(r.dateFin).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-lg text-primary">{r.montant}€</span>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReservationDetails(r)}>
                        Détails <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                  Tout marquer comme lu
                </Button>
              </div>
              <div className="space-y-3">
                {loadingNotifications && (
                  <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
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
                {factures.map((f) => (
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
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Téléchargement", description: `Facture ${f.id} téléchargée.` })}>
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
                      <input
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom</label>
                      <input
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Téléphone</label>
                    <input
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                </div>
                  <Button className="mt-2" onClick={saveProfile}>Enregistrer les modifications</Button>
              </div>
            </TabsContent>
          </Tabs>

            <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedReservation ? `Détails réservation ${selectedReservation.id}` : "Détails réservation"}
                  </DialogTitle>
                </DialogHeader>
                {selectedReservation && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedReservation.vehicule} · {selectedReservation.ville}
                    </p>
                    <Badge variant="outline" className={statutColors[selectedReservation.statut] || ""}>
                      {statutLabels[selectedReservation.statut] || selectedReservation.statut}
                    </Badge>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Historique</p>
                      {loadingDetails ? (
                        <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
                      ) : reservationEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun événement visible pour le moment.</p>
                      ) : (
                        reservationEvents.map((evt) => (
                          <div key={evt.id} className="border border-border rounded-lg p-3">
                            <p className="text-sm font-medium">{(evt.payload as Record<string, unknown>)?.title as string || evt.type}</p>
                            {typeof (evt.payload as Record<string, unknown>)?.description === "string" && (
                              <p className="text-sm text-muted-foreground mt-1">{(evt.payload as Record<string, unknown>).description as string}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(evt.occurredAt).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
