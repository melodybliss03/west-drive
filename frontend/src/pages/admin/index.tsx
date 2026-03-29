import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarCheck, FileText, Car, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type Vehicule } from "@/data/mock";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { TabKey, TeamMember, Notification as NotifType, Reservation } from "./data";
import type { DevisRow, AvisRow } from "./data";
import type { AdminUser } from "./types";
import AdminAuth from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import DashboardTab from "./DashboardTab";
import VehiculesTab from "./VehiculesTab";
import ReservationsTab from "./ReservationsTab";
import FlotteTab from "./FlotteTab";
import AvisTab from "./AvisTab";
import UtilisateursTab from "./UtilisateursTab";
import ProfilTab from "./ProfilTab";
import DevisTab from "./DevisTab.tsx";
import {
  reservationsService,
  notificationsService,
  quotesService,
  reviewsService,
  usersService,
  vehiclesService,
} from "@/lib/api/services";
import {
  mapQuoteDtoToDevisRow,
  mapReservationDtoToAdminReservation,
  mapVehicleDtoToVehicule,
} from "@/lib/mappers";
import { PaginationMeta } from "@/lib/api/types";

const NOTIF_ICONS: Record<string, typeof Bell> = {
  reservation: CalendarCheck,
  devis: FileText,
  utilisateur: UsersIcon,
  flotte: AlertTriangle,
};

const TAB_REQUIRED_PERMISSIONS: Partial<Record<TabKey, string>> = {
  kpi: "admin.kpi.read",
  vehicules: "vehicles.read",
  reservations: "reservations.read",
  devis: "quotes.read",
  flotte: "fleet.read",
  avis: "avis.read",
  utilisateurs: "users.read",

};

const CUSTOMER_ROLE_NAMES = new Set(["customer", "client"]);

function extractUsersFromResponse(
  collection: unknown,
): Array<Record<string, unknown>> {
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

  // Persist tab in localStorage
  const [tab, setTab] = useState<TabKey>(() => {
    const saved = localStorage.getItem("admin_tab");
    return (saved as TabKey) || "kpi";
  });

  useEffect(() => {
    localStorage.setItem("admin_tab", tab);
  }, [tab]);

  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesLimit] = useState(10);
  const [vehiclesMeta, setVehiclesMeta] = useState<PaginationMeta | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [reservationsLimit] = useState(10);
  const [reservationsMeta, setReservationsMeta] = useState<PaginationMeta | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [devis, setDevis] = useState<DevisRow[]>([]);
  const [devisPage, setDevisPage] = useState(1);
  const [devisLimit] = useState(10);
  const [devisMeta, setDevisMeta] = useState<PaginationMeta | null>(null);
  const [avis, setAvis] = useState<AvisRow[]>([]);
  const [avisPage, setAvisPage] = useState(1);
  const [avisLimit] = useState(10);
  const [avisMeta, setAvisMeta] = useState<PaginationMeta | null>(null);
  const [avisRefreshKey, setAvisRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingAvis, setIsLoadingAvis] = useState(false);

  const unreadCount = notifications.filter(n => !n.lu).length;

  const roleNames = Array.from(
    new Set(
      [user?.role, ...(user?.roles ?? [])]
        .filter((role): role is string => typeof role === "string" && role.trim().length > 0)
        .map((role) => role.trim().toLowerCase()),
    ),
  );

  const isAdmin = roleNames.includes("admin");
  const isBackofficeUser = roleNames.some((role) => !CUSTOMER_ROLE_NAMES.has(role));

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return user.permissions.includes(permission);
  };

  const allowedTabs = (Object.keys(TAB_REQUIRED_PERMISSIONS) as TabKey[])
    .filter((key) => {
      const permission = TAB_REQUIRED_PERMISSIONS[key];
      return permission ? hasPermission(permission) : true;
    })
    .concat(["profil"])
    .filter((value, index, array) => array.indexOf(value) === index);

  const markAsRead = (id: string) => {
    notificationsService.markAsRead(id).catch(() => {
      // UI stays optimistic in case of transient API failure.
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAllAsRead = () => {
    notificationsService.markAllAsRead().catch(() => {
      // UI stays optimistic in case of transient API failure.
    });
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const collection = await notificationsService.list({ page: 1, limit: 25 });
      const items = Array.isArray(collection) ? collection : collection.items;
      const mapped: NotifType[] = items.map((n) => ({
        id: n.id,
        type: (n.type === "reservation" || n.type === "devis" || n.type === "utilisateur" || n.type === "flotte" || n.type === "avis")
          ? n.type
          : "reservation",
        titre: n.title,
        message: n.message,
        date: new Date(n.createdAt).toLocaleString("fr-FR"),
        lu: n.isRead,
      }));
      setNotifications(mapped);
    } catch {
      setNotifications([]);
    }
  }, [user]);

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

  useEffect(() => {
    if (isBootstrapping) return;
    if (user && !isBackofficeUser) {
      navigate("/espace", { replace: true });
    }
  }, [isBootstrapping, isBackofficeUser, navigate, user]);

  useEffect(() => {
    if (!user) return;
    if (allowedTabs.length === 0) return;
    if (!allowedTabs.includes(tab)) {
      setTab(allowedTabs[0]);
    }
  }, [allowedTabs, tab, user]);

  useEffect(() => {
    if (isBootstrapping || !user || !hasPermission("vehicles.read") || (tab !== "vehicules" && tab !== "kpi")) return;

    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const vehiclesCollection = await vehiclesService.list(
          { page: vehiclesPage, limit: vehiclesLimit },
          true,
        );
        setVehicles(vehiclesCollection.items.map(mapVehicleDtoToVehicule));
        setVehiclesMeta(vehiclesCollection.meta);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [isBootstrapping, user, tab, vehiclesPage, vehiclesLimit]);

  useEffect(() => {
    if (isBootstrapping || !user || !hasPermission("reservations.read") || (tab !== "reservations" && tab !== "kpi")) return;

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      try {
        const collection = await reservationsService.list(
          { page: reservationsPage, limit: reservationsLimit },
        );

        if (Array.isArray(collection)) {
          const mapped = collection.map(mapReservationDtoToAdminReservation);
          setReservations(mapped);
          setReservationsMeta({
            page: reservationsPage,
            limit: reservationsLimit,
            totalItems: mapped.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: reservationsPage > 1,
          });
        } else {
          setReservations(collection.items.map(mapReservationDtoToAdminReservation));
          setReservationsMeta(collection.meta);
        }
      } finally {
        setIsLoadingReservations(false);
      }
    };

    loadReservations();
  }, [isBootstrapping, tab, user, reservationsPage, reservationsLimit]);

  useEffect(() => {
    if (isBootstrapping || !user || !hasPermission("users.read") || (tab !== "utilisateurs" && tab !== "kpi")) return;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersCollection = await usersService.list({ page: usersPage, limit: usersLimit });
        const items = extractUsersFromResponse(usersCollection);
        const hasPaginatedMeta =
          !!usersCollection &&
          typeof usersCollection === "object" &&
          "meta" in usersCollection;

        const mappedUsers: AdminUser[] = items.map((item) => {
          const userRoles = Array.isArray(item.userRoles)
            ? item.userRoles
            : [];
          const roleFromAssignments = userRoles
            .map((userRole) => {
              if (userRole && typeof userRole === "object" && "role" in userRole) {
                const maybeRole = (userRole as { role?: { name?: unknown } }).role;
                return maybeRole?.name ? String(maybeRole.name) : "";
              }
              return "";
            })
            .find(Boolean);

          const effectiveRole = String(roleFromAssignments || item.role || "client").toLowerCase();
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
            role: effectiveRole,
            telephone: item.telephone ? String(item.telephone) : undefined,
            ville: item.ville ? String(item.ville) : undefined,
            adresse: item.adresse ? String(item.adresse) : undefined,
          };
        });

        const currentUserId = user.id ?? "";
        const visibleUsers = mappedUsers.filter(
          (candidate) =>
            candidate.id !== currentUserId && candidate.role !== "admin",
        );

        setUsers(visibleUsers);
        setTeamMembers(
          mappedUsers
            .filter((u) => !["client", "customer", "admin"].includes(u.role))
            .map((u) => ({
              id: u.id,
              nom: u.nom,
              prenom: u.prenom,
              email: u.email,
              role: u.role,
              permissions: [],
              dateAttribution: u.creeLe || "",
            })),
        );

        if (!hasPaginatedMeta) {
          setUsersMeta({
            page: usersPage,
            limit: usersLimit,
            totalItems: visibleUsers.length,
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

  useEffect(() => {
    if (isBootstrapping || !user) return;
    void loadNotifications();
  }, [isBootstrapping, user, loadNotifications]);

  useEffect(() => {
    if (!showNotifs) return;
    void loadNotifications();
  }, [showNotifs, loadNotifications]);

  useEffect(() => {
    if (isBootstrapping || !user || !hasPermission("quotes.read") || tab !== "devis") return;

    const loadQuotes = async () => {
      setIsLoadingQuotes(true);
      try {
        const collection = await quotesService.list({ page: devisPage, limit: devisLimit });
        if (Array.isArray(collection)) {
          const mapped = collection.map(mapQuoteDtoToDevisRow);
          setDevis(mapped);
          setDevisMeta({
            page: devisPage,
            limit: devisLimit,
            totalItems: mapped.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: devisPage > 1,
          });
        } else {
          setDevis(collection.items.map(mapQuoteDtoToDevisRow));
          setDevisMeta(collection.meta);
        }
      } catch {
        setDevis([]);
        setDevisMeta(null);
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    loadQuotes();
  }, [isBootstrapping, user, tab, devisPage, devisLimit]);

  useEffect(() => {
    if (isBootstrapping || !user || !hasPermission("avis.read") || tab !== "avis") return;

    const loadAvis = async () => {
      setIsLoadingAvis(true);
      try {
        const result = await reviewsService.adminList({ page: avisPage, limit: avisLimit });
        setAvis(result.items.map(r => ({
          id: r.id,
          auteur: r.authorName,
          titre: r.title ?? "",
          contenu: r.content,
          note: r.rating,
          source: r.source ?? "Direct",
          date: r.createdAt,
          status: r.status,
        })));
        setAvisMeta(result.meta);
      } catch {
        setAvis([]);
        setAvisMeta(null);
      } finally {
        setIsLoadingAvis(false);
      }
    };

    loadAvis();
  }, [isBootstrapping, user, tab, avisPage, avisLimit, avisRefreshKey]);

  if (!user) return <AdminAuth />;
  if (!isBackofficeUser) return null;

  const isLoadingActiveTab =
    tab === "vehicules"
      ? isLoadingVehicles
      : tab === "reservations"
        ? isLoadingReservations
        : tab === "utilisateurs"
          ? isLoadingUsers
          : tab === "devis"
            ? isLoadingQuotes
          : false;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar tab={tab} setTab={setTab} allowedTabs={allowedTabs} user={user} onLogout={handleLogout} />

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

              <button
                onClick={() => setTab("profil")}
                className="flex items-center gap-2 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user.prenom[0]}{user.nom[0]}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.prenom} {user.nom}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {isLoadingActiveTab && (
                <p className="text-sm text-muted-foreground">Chargement des données...</p>
              )}
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
                  hasPermission={hasPermission}
                />
              )}
              {tab === "reservations" && (
                <ReservationsTab
                  reservations={reservations}
                  setReservations={setReservations}
                  page={reservationsPage}
                  setPage={setReservationsPage}
                  meta={reservationsMeta}
                  hasPermission={hasPermission}
                />
              )}
              {tab === "devis" && (
                <DevisTab
                  devis={devis}
                  setDevis={setDevis}
                  page={devisPage}
                  setPage={setDevisPage}
                  meta={devisMeta}
                  hasPermission={hasPermission}
                />
              )}
              {tab === "flotte" && <FlotteTab hasPermission={hasPermission} />}
              {tab === "avis" && (
                <AvisTab
                  avis={avis}
                  setAvis={setAvis}
                  page={avisPage}
                  setPage={setAvisPage}
                  meta={avisMeta}
                  onRefresh={() => setAvisRefreshKey(k => k + 1)}
                  hasPermission={hasPermission}
                />
              )}
              {tab === "utilisateurs" && (
                <UtilisateursTab
                  users={users}
                  setUsers={setUsers}
                  page={usersPage}
                  setPage={setUsersPage}
                  meta={usersMeta}
                  setMeta={setUsersMeta}
                  limit={usersLimit}
                  hasPermission={hasPermission}
                />
              )}
              {tab === "profil" && <ProfilTab />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}