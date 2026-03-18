import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { type Vehicule } from "@/data/mock";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { TabKey, TeamMember } from "./data";
import { mockReservations, mockUsers, mockVehicules, initialTeamMembers } from "./data";
import AdminAuth from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import DashboardTab from "./DashboardTab";
import VehiculesTab from "./VehiculesTab";
import ReservationsTab from "./ReservationsTab";
import FlotteTab from "./FlotteTab";
import UtilisateursTab from "./UtilisateursTab";
import ProfilTab from "./ProfilTab";

export default function Boss() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("kpi");
  const [vehicles, setVehicles] = useState<Vehicule[]>(mockVehicules);
  const [users] = useState(mockUsers);
  const [reservations, setReservations] = useState(mockReservations);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);

  if (!user) return <AdminAuth />;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 border-b border-border bg-card px-4 flex-shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-border" />
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
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
