import { BarChart3, Car, CalendarCheck, Truck, Users, UserCog, LogOut } from "lucide-react";
import type { TabKey } from "./data";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const sidebarItems: { key: TabKey; icon: typeof BarChart3; label: string }[] = [
  { key: "kpi", icon: BarChart3, label: "Tableau de bord" },
  { key: "vehicules", icon: Car, label: "Véhicules" },
  { key: "reservations", icon: CalendarCheck, label: "Réservations" },
  { key: "flotte", icon: Truck, label: "Gestion flotte" },
  { key: "utilisateurs", icon: Users, label: "Utilisateurs" },
  { key: "profil", icon: UserCog, label: "Mon profil" },
];

interface AdminSidebarProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  user: { nom: string; prenom: string; email: string };
  onLogout: () => void;
}

export default function AdminSidebar({ tab, setTab, user, onLogout }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-foreground">
      <SidebarContent className="bg-foreground">
        <div className={`p-4 border-b border-border/20 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <span className="font-display text-lg font-bold text-primary">W</span>
          ) : (
            <div>
              <h1 className="font-display text-lg font-bold text-primary-foreground">
                WEST <span className="text-primary">DRIVE</span>
              </h1>
              <p className="text-xs text-primary-foreground/50 mt-0.5">Administration</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/40 text-[10px] uppercase tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => setTab(item.key)}
                    isActive={tab === item.key}
                    tooltip={item.label}
                    className={`transition-colors ${
                      tab === item.key
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border/20">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-primary-foreground/50 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors ${collapsed ? "justify-center w-full" : "px-1"}`}
            title="Retour au site"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Retour au site</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
