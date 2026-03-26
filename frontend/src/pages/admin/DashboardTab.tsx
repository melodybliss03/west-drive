import { Car, Users, CalendarCheck, DollarSign, TrendingUp, ArrowRight, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TabKey, Reservation, TeamMember } from "./data";
import { statColors, roleColors } from "./data";
import type { Vehicule } from "@/data/mock";

interface DashboardTabProps {
  reservations: Reservation[];
  vehicles: Vehicule[];
  usersCount: number;
  teamMembers: TeamMember[];
  setTab: (t: TabKey) => void;
}

export default function DashboardTab({ reservations, vehicles, usersCount, teamMembers, setTab }: DashboardTabProps) {
  const totalCA = reservations.filter(r => r.statut !== "annulée").reduce((s, r) => s + r.montant, 0);
  const activeRes = reservations.filter(r => ["confirmée", "en cours"].includes(r.statut)).length;
  const availableVehicles = vehicles.filter(v => v.disponible && v.actif).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-display font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activité</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chiffre d'affaires", value: `${totalCA.toLocaleString()} €`, icon: DollarSign, trend: "+12%", up: true },
          { label: "Réservations actives", value: activeRes, icon: CalendarCheck, trend: "+3", up: true },
          { label: "Véhicules dispo.", value: `${availableVehicles}/${vehicles.length}`, icon: Car, trend: "", up: true },
          { label: "Utilisateurs", value: usersCount, icon: Users, trend: "+2", up: true },
        ].map((kpi, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <kpi.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </div>
              {kpi.trend && (
                <div className="flex items-center gap-1 mt-3 text-xs">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600">{kpi.trend}</span>
                  <span className="text-muted-foreground">ce mois</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Réservations récentes
                <span className="text-sm font-normal text-muted-foreground">({String(reservations.length).padStart(2, "0")})</span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs" onClick={() => setTab("reservations")}>
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations.slice(0, 5).map(r => {
                const img = r.vehicleImageUrl;
                return (
                  <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    {img ? (
                      <img src={img} alt={r.vehicule} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <Car className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.client}</p>
                      <p className="text-xs text-muted-foreground">{r.vehicule} · {r.debut}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{r.montant} €</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statColors[r.statut] || ""}`}>{r.statut}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Équipe & Rôles</CardTitle>
            <p className="text-xs text-muted-foreground">Membres avec un rôle attribué</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
                    {member.prenom ? member.prenom[0] : member.nom[0]}{member.nom[member.nom.length > 1 ? 1 : 0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.prenom ? `${member.prenom} ${member.nom}` : member.email}
                    </p>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 ${roleColors[member.role] || "bg-muted text-muted-foreground border-border"}`}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun membre assigné</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 gap-1 text-xs" onClick={() => setTab("profil")}>
              <UserPlus className="h-3.5 w-3.5" /> Gérer les rôles
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
