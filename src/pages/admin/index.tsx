import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarCheck, FileText, Car, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type Vehicule } from "@/data/mock";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { TabKey, TeamMember, Notification as NotifType } from "./data";
import { mockReservations, mockUsers, mockVehicules, initialTeamMembers, mockNotifications, mockDevis } from "./data";
import type { MockDevis } from "./data";
import AdminAuth from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import DashboardTab from "./DashboardTab";
import VehiculesTab from "./VehiculesTab";
import ReservationsTab from "./ReservationsTab";
import FlotteTab from "./FlotteTab";
import UtilisateursTab from "./UtilisateursTab";
import ProfilTab from "./ProfilTab";
import DevisTab from "./DevisTab";

const NOTIF_ICONS: Record<string, typeof Bell> = {
  reservation: CalendarCheck,
  devis: FileText,
  utilisateur: UsersIcon,
  flotte: AlertTriangle,
};

export default function Boss() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Persist tab in localStorage
  const [tab, setTab] = useState<TabKey>(() => {
    const saved = localStorage.getItem("admin_tab");
    return (saved as TabKey) || "kpi";
  });

  useEffect(() => {
    localStorage.setItem("admin_tab", tab);
  }, [tab]);

  const [vehicles, setVehicles] = useState<Vehicule[]>(mockVehicules);
  const [users] = useState(mockUsers);
  const [reservations, setReservations] = useState(mockReservations);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [notifications, setNotifications] = useState<NotifType[]>(mockNotifications);
  const [devis, setDevis] = useState<MockDevis[]>(mockDevis);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.lu).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return <AdminAuth />;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b border-border bg-card px-4 flex-shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Notifications"
                  onClick={() => setShowNotifs(prev => !prev)}
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <p className="text-sm font-semibold">Notifications ({unreadCount})</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">Aucune notification</p>
                      ) : (
                        notifications.map(n => {
                          const Icon = NOTIF_ICONS[n.type] || Bell;
                          return (
                            <button
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!n.lu ? "bg-primary/5" : ""}`}
                            >
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.lu ? "bg-primary/10" : "bg-muted"}`}>
                                <Icon className={`h-4 w-4 ${!n.lu ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.lu ? "font-semibold" : ""}`}>{n.titre}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                              </div>
                              {!n.lu && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setTab("profil")} className="flex items-center gap-2 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user.prenom[0]}{user.nom[0]}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.prenom} {user.nom}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {tab === "kpi" && (
                <DashboardTab
                  reservations={reservations}
                  vehicles={vehicles}
                  usersCount={users.length}
                  teamMembers={teamMembers}
                  setTab={setTab}
                />
              )}
              {tab === "vehicules" && <VehiculesTab vehicles={vehicles} setVehicles={setVehicles} />}
              {tab === "reservations" && <ReservationsTab reservations={reservations} setReservations={setReservations} />}
              {tab === "devis" && <DevisTab devis={devis} setDevis={setDevis} />}
              {tab === "flotte" && <FlotteTab />}
              {tab === "utilisateurs" && <UtilisateursTab users={users} />}
              {tab === "profil" && <ProfilTab teamMembers={teamMembers} setTeamMembers={setTeamMembers} />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
