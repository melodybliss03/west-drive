import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { type Vehicule } from "@/data/mock";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { TabKey, TeamMember } from "./data";
import type { AdminUser } from "./types";
import { mockReservations, initialTeamMembers } from "./data";
import AdminAuth from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import DashboardTab from "./DashboardTab";
import VehiculesTab from "./VehiculesTab";
import ReservationsTab from "./ReservationsTab";
import FlotteTab from "./FlotteTab";
import UtilisateursTab from "./UtilisateursTab";
import ProfilTab from "./ProfilTab";
import { reservationsService, usersService, vehiclesService } from "@/lib/api/services";
import { mapReservationDtoToAdminReservation, mapVehicleDtoToVehicule } from "@/lib/mappers";
import { PaginationMeta } from "@/lib/api/types";

function extractUsersFromResponse(collection: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(collection)) {
    return collection as Array<Record<string, unknown>>;
  }

  if (collection && typeof collection === "object") {
    const maybeItems = (collection as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems as Array<Record<string, unknown>>;
    }

    const maybeUsers = (collection as { users?: unknown }).users;
    if (Array.isArray(maybeUsers)) {
      return maybeUsers as Array<Record<string, unknown>>;
    }
  }

  return [];
}

export default function Boss() {
  const navigate = useNavigate();
  const { user, logout, isBootstrapping } = useAuth();
  const [tab, setTab] = useState<TabKey>("kpi");
  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesLimit] = useState(10);
  const [vehiclesMeta, setVehiclesMeta] = useState<PaginationMeta | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta | null>(null);
  const [reservations, setReservations] = useState(mockReservations);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user || (tab !== "vehicules" && tab !== "kpi")) {
      return;
    }

    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const vehiclesCollection = await vehiclesService.list({ page: vehiclesPage, limit: vehiclesLimit }, true);
        setVehicles(vehiclesCollection.items.map(mapVehicleDtoToVehicule));
        setVehiclesMeta(vehiclesCollection.meta);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [isBootstrapping, user, tab, vehiclesPage, vehiclesLimit]);

  useEffect(() => {
    if (isBootstrapping || !user || tab !== "utilisateurs") {
      return;
    }

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      try {
        const reservationsDto = await reservationsService.list();
        setReservations(reservationsDto.map(mapReservationDtoToAdminReservation));
      } finally {
        setIsLoadingReservations(false);
      }
    };

    loadReservations();
  }, [isBootstrapping, user]);

  useEffect(() => {
    if (isBootstrapping || !user) {
      return;
    }

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersCollection = await usersService.list({ page: usersPage, limit: usersLimit });
        const items = extractUsersFromResponse(usersCollection);
        const hasPaginatedMeta = !!usersCollection && typeof usersCollection === "object" && "meta" in usersCollection;

        const mappedUsers: AdminUser[] = items.map((item) => {
          const firstName = String(item.firstName || "");
          const lastName = String(item.lastName || "");
          return {
            id: String(item.id),
            nom: lastName || String(item.companyName || "Client"),
            prenom: firstName || "-",
            email: String(item.email || ""),
            type: String(item.accountType || "particulier").toLowerCase(),
            creeLe: String(item.createdAt || ""),
            reservations: Number(item.reservationsCount || 0),
            statut: String(item.status || "actif").toLowerCase(),
            role: String(item.role || "client").toLowerCase(),
          };
        });

        setUsers(mappedUsers);

        if (!hasPaginatedMeta) {
          setUsersMeta({
            page: usersPage,
            limit: usersLimit,
            totalItems: mappedUsers.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        } else {
          setUsersMeta((usersCollection as { meta: PaginationMeta }).meta);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [isBootstrapping, user, tab, usersPage, usersLimit]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Chargement de la session...
      </div>
    );
  }

  if (!user) return <AdminAuth />;

  const isLoadingActiveTab =
    tab === "vehicules"
      ? isLoadingVehicles
      : tab === "reservations"
        ? isLoadingReservations
        : tab === "utilisateurs"
          ? isLoadingUsers
          : false;

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
              {isLoadingActiveTab && <p className="text-sm text-muted-foreground">Chargement des données...</p>}
              {tab === "kpi" && (
                <DashboardTab
                  reservations={reservations}
                  vehicles={vehicles}
                  usersCount={users.length}
                  teamMembers={teamMembers}
                  setTab={setTab}
                />
              )}
              {tab === "vehicules" && (
                <VehiculesTab
                  vehicles={vehicles}
                  setVehicles={setVehicles}
                  page={vehiclesPage}
                  setPage={setVehiclesPage}
                  meta={vehiclesMeta}
                  setMeta={setVehiclesMeta}
                  limit={vehiclesLimit}
                />
              )}
              {tab === "reservations" && <ReservationsTab reservations={reservations} setReservations={setReservations} />}
              {tab === "flotte" && <FlotteTab />}
              {tab === "utilisateurs" && (
                <UtilisateursTab
                  users={users}
                  setUsers={setUsers}
                  page={usersPage}
                  setPage={setUsersPage}
                  meta={usersMeta}
                  setMeta={setUsersMeta}
                  limit={usersLimit}
                />
              )}
              {tab === "profil" && <ProfilTab teamMembers={teamMembers} setTeamMembers={setTeamMembers} />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
