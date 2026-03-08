import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Users, CalendarCheck, BarChart3, Plus, Edit, Trash2, Eye,
  ChevronDown, Search, Filter, Download, TrendingUp, TrendingDown,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Truck, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { vehicules as mockVehicules, villes, type Vehicule, type Categorie, type Transmission, type Energie } from "@/data/mock";

// ── Mock data ──
const mockReservations = [
  { id: "R001", client: "Sophie Martin", email: "sophie@mail.com", vehicule: "Peugeot 108", debut: "2025-03-10", fin: "2025-03-15", statut: "confirmée", montant: 175 },
  { id: "R002", client: "Thomas Dubois", email: "thomas@mail.com", vehicule: "BMW Série 3", debut: "2025-03-12", fin: "2025-03-14", statut: "en cours", montant: 190 },
  { id: "R003", client: "Marie Laurent", email: "marie@mail.com", vehicule: "Renault Clio V", debut: "2025-03-08", fin: "2025-03-10", statut: "terminée", montant: 110 },
  { id: "R004", client: "Entreprise ABC", email: "contact@abc.com", vehicule: "Audi Q5", debut: "2025-03-20", fin: "2025-03-25", statut: "en attente", montant: 600 },
  { id: "R005", client: "Paul Leroy", email: "paul@mail.com", vehicule: "Mercedes Classe C", debut: "2025-03-05", fin: "2025-03-07", statut: "annulée", montant: 210 },
];

const mockUsers = [
  { id: "U001", nom: "Martin", prenom: "Sophie", email: "sophie@mail.com", type: "particulier", creeLe: "2025-01-15", reservations: 3, statut: "actif" },
  { id: "U002", nom: "Dubois", prenom: "Thomas", email: "thomas@mail.com", type: "particulier", creeLe: "2025-02-01", reservations: 1, statut: "actif" },
  { id: "U003", nom: "Laurent", prenom: "Marie", email: "marie@mail.com", type: "particulier", creeLe: "2024-12-10", reservations: 5, statut: "actif" },
  { id: "U004", nom: "Entreprise ABC", prenom: "—", email: "contact@abc.com", type: "entreprise", creeLe: "2025-01-20", reservations: 8, statut: "actif" },
  { id: "U005", nom: "Leroy", prenom: "Paul", email: "paul@mail.com", type: "particulier", creeLe: "2025-03-01", reservations: 0, statut: "suspendu" },
];

const mockFlotte = [
  { id: "F001", vehicule: "Peugeot 108", plaque: "AB-123-CD", km: 24500, dernierEntretien: "2025-02-01", prochainEntretien: "2025-05-01", etat: "bon" },
  { id: "F002", vehicule: "Fiat 500", plaque: "EF-456-GH", km: 18200, dernierEntretien: "2025-01-15", prochainEntretien: "2025-04-15", etat: "bon" },
  { id: "F003", vehicule: "BMW Série 3", plaque: "IJ-789-KL", km: 45000, dernierEntretien: "2025-01-20", prochainEntretien: "2025-04-20", etat: "entretien requis" },
  { id: "F004", vehicule: "Audi Q5", plaque: "MN-012-OP", km: 32000, dernierEntretien: "2025-02-10", prochainEntretien: "2025-05-10", etat: "bon" },
  { id: "F005", vehicule: "Mercedes Classe C", plaque: "QR-345-ST", km: 52000, dernierEntretien: "2024-12-20", prochainEntretien: "2025-03-20", etat: "en panne" },
];

type TabKey = "kpi" | "vehicules" | "reservations" | "flotte" | "utilisateurs";

const statColors: Record<string, string> = {
  "confirmée": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "en cours": "bg-blue-500/10 text-blue-600 border-blue-200",
  "terminée": "bg-muted text-muted-foreground border-border",
  "en attente": "bg-amber-500/10 text-amber-600 border-amber-200",
  "annulée": "bg-destructive/10 text-destructive border-destructive/20",
};

const etatColors: Record<string, string> = {
  "bon": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "entretien requis": "bg-amber-500/10 text-amber-600 border-amber-200",
  "en panne": "bg-destructive/10 text-destructive border-destructive/20",
};

const emptyVehicle: Partial<Vehicule> = {
  nom: "", marque: "", modele: "", annee: 2024, categorie: "COMPACTE",
  transmission: "MANUELLE", energie: "ESSENCE", nbPlaces: 5, kmInclus: 200,
  prixJour: 50, description: "", actif: true, villes: [], disponible: true,
  note: 0, nbAvis: 0, photos: [],
};

export default function Boss() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("kpi");
  const [vehicles, setVehicles] = useState<Vehicule[]>(mockVehicules);
  const [editVehicle, setEditVehicle] = useState<Partial<Vehicule> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchV, setSearchV] = useState("");
  const [searchR, setSearchR] = useState("");
  const [searchU, setSearchU] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── KPI data ──
  const totalCA = mockReservations.filter(r => r.statut !== "annulée").reduce((s, r) => s + r.montant, 0);
  const activeRes = mockReservations.filter(r => ["confirmée", "en cours"].includes(r.statut)).length;
  const totalUsers = mockUsers.length;
  const availableVehicles = vehicles.filter(v => v.disponible && v.actif).length;

  // ── Vehicle CRUD ──
  const openNew = () => { setEditVehicle({ ...emptyVehicle, id: `v-${Date.now()}` }); setIsNew(true); };
  const openEdit = (v: Vehicule) => { setEditVehicle({ ...v }); setIsNew(false); };
  const saveVehicle = () => {
    if (!editVehicle) return;
    if (isNew) setVehicles(prev => [...prev, editVehicle as Vehicule]);
    else setVehicles(prev => prev.map(v => v.id === editVehicle.id ? editVehicle as Vehicule : v));
    setEditVehicle(null);
  };
  const deleteVehicle = (id: string) => { setVehicles(prev => prev.filter(v => v.id !== id)); setDeleteConfirm(null); };

  const filteredVehicles = vehicles.filter(v => v.nom.toLowerCase().includes(searchV.toLowerCase()) || v.marque.toLowerCase().includes(searchV.toLowerCase()));
  const filteredRes = mockReservations.filter(r => r.client.toLowerCase().includes(searchR.toLowerCase()) || r.vehicule.toLowerCase().includes(searchR.toLowerCase()));
  const filteredUsers = mockUsers.filter(u => u.nom.toLowerCase().includes(searchU.toLowerCase()) || u.email.toLowerCase().includes(searchU.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-background text-sidebar-foreground flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-display text-lg font-bold">WEST <span className="text-primary">DRIVE</span></h1>
          <p className="text-xs text-sidebar-foreground/50 mt-1">Administration</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {([
            { key: "kpi" as TabKey, icon: BarChart3, label: "Tableau de bord" },
            { key: "vehicules" as TabKey, icon: Car, label: "Véhicules" },
            { key: "reservations" as TabKey, icon: CalendarCheck, label: "Réservations" },
            { key: "flotte" as TabKey, icon: Truck, label: "Gestion flotte" },
            { key: "utilisateurs" as TabKey, icon: Users, label: "Utilisateurs" },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tab === item.key ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" /> Retour au site
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="font-display text-lg font-bold">WEST <span className="text-primary">DRIVE</span> Admin</h1>
          <Select value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="kpi">Tableau de bord</SelectItem>
              <SelectItem value="vehicules">Véhicules</SelectItem>
              <SelectItem value="reservations">Réservations</SelectItem>
              <SelectItem value="flotte">Gestion flotte</SelectItem>
              <SelectItem value="utilisateurs">Utilisateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {/* ═══ KPI ═══ */}
          {tab === "kpi" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-display font-bold">Tableau de bord</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Chiffre d'affaires", value: `${totalCA.toLocaleString()} €`, icon: DollarSign, trend: "+12%", up: true },
                  { label: "Réservations actives", value: activeRes, icon: CalendarCheck, trend: "+3", up: true },
                  { label: "Véhicules disponibles", value: `${availableVehicles}/${vehicles.length}`, icon: Car, trend: "", up: true },
                  { label: "Utilisateurs inscrits", value: totalUsers, icon: Users, trend: "+2", up: true },
                ].map((kpi, i) => (
                  <Card key={i} className="relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                          {kpi.trend && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                              {kpi.up ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                              <span className={kpi.up ? "text-emerald-600" : "text-destructive"}>{kpi.trend}</span>
                              <span className="text-muted-foreground">ce mois</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 rounded-xl bg-primary/10">
                          <kpi.icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent reservations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dernières réservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Véhicule</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockReservations.slice(0, 5).map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.id}</TableCell>
                            <TableCell className="font-medium">{r.client}</TableCell>
                            <TableCell>{r.vehicule}</TableCell>
                            <TableCell className="text-xs">{r.debut} → {r.fin}</TableCell>
                            <TableCell className="font-semibold">{r.montant} €</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statColors[r.statut] || ""}>{r.statut}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ VÉHICULES ═══ */}
          {tab === "vehicules" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold">Véhicules</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher…" value={searchV} onChange={e => setSearchV(e.target.value)} className="pl-9 w-56" />
                  </div>
                  <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Véhicule</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Prix/jour</TableHead>
                          <TableHead>Villes</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVehicles.map(v => (
                          <TableRow key={v.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{v.nom}</p>
                                <p className="text-xs text-muted-foreground">{v.transmission} · {v.energie}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{v.categorie}</Badge></TableCell>
                            <TableCell className="font-semibold">{v.prixJour} €</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{v.villes.join(", ")}</TableCell>
                            <TableCell>
                              {v.disponible && v.actif ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Disponible</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Indisponible</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(v.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ RÉSERVATIONS ═══ */}
          {tab === "reservations" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold">Réservations</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher…" value={searchR} onChange={e => setSearchR(e.target.value)} className="pl-9 w-56" />
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Véhicule</TableHead>
                          <TableHead>Début</TableHead>
                          <TableHead>Fin</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRes.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.id}</TableCell>
                            <TableCell className="font-medium">{r.client}</TableCell>
                            <TableCell className="text-xs">{r.email}</TableCell>
                            <TableCell>{r.vehicule}</TableCell>
                            <TableCell className="text-xs">{r.debut}</TableCell>
                            <TableCell className="text-xs">{r.fin}</TableCell>
                            <TableCell className="font-semibold">{r.montant} €</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statColors[r.statut] || ""}>{r.statut}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ FLOTTE ═══ */}
          {tab === "flotte" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-display font-bold">Gestion de flotte</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "En bon état", count: mockFlotte.filter(f => f.etat === "bon").length, icon: CheckCircle, color: "text-emerald-500" },
                  { label: "Entretien requis", count: mockFlotte.filter(f => f.etat === "entretien requis").length, icon: AlertTriangle, color: "text-amber-500" },
                  { label: "En panne", count: mockFlotte.filter(f => f.etat === "en panne").length, icon: XCircle, color: "text-destructive" },
                ].map((s, i) => (
                  <Card key={i}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <s.icon className={`h-8 w-8 ${s.color}`} />
                      <div>
                        <p className="text-2xl font-bold">{s.count}</p>
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Véhicule</TableHead>
                          <TableHead>Plaque</TableHead>
                          <TableHead>Kilométrage</TableHead>
                          <TableHead>Dernier entretien</TableHead>
                          <TableHead>Prochain entretien</TableHead>
                          <TableHead>État</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockFlotte.map(f => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.vehicule}</TableCell>
                            <TableCell className="font-mono text-xs">{f.plaque}</TableCell>
                            <TableCell>{f.km.toLocaleString()} km</TableCell>
                            <TableCell className="text-xs">{f.dernierEntretien}</TableCell>
                            <TableCell className="text-xs">{f.prochainEntretien}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={etatColors[f.etat] || ""}>{f.etat}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ UTILISATEURS ═══ */}
          {tab === "utilisateurs" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-display font-bold">Utilisateurs</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher…" value={searchU} onChange={e => setSearchU(e.target.value)} className="pl-9 w-56" />
                </div>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Inscrit le</TableHead>
                          <TableHead>Réservations</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                            <TableCell className="text-xs">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                                {u.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{u.creeLe}</TableCell>
                            <TableCell>{u.reservations}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={u.statut === "actif" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                                {u.statut}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* ═══ Vehicle Edit Dialog ═══ */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un véhicule" : "Modifier le véhicule"}</DialogTitle>
          </DialogHeader>
          {editVehicle && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marque *</Label>
                  <Input value={editVehicle.marque || ""} onChange={e => setEditVehicle({ ...editVehicle, marque: e.target.value })} />
                </div>
                <div>
                  <Label>Modèle *</Label>
                  <Input value={editVehicle.modele || ""} onChange={e => setEditVehicle({ ...editVehicle, modele: e.target.value, nom: `${editVehicle.marque} ${e.target.value}` })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Année</Label>
                  <Input type="number" value={editVehicle.annee || 2024} onChange={e => setEditVehicle({ ...editVehicle, annee: +e.target.value })} />
                </div>
                <div>
                  <Label>Prix/jour (€) *</Label>
                  <Input type="number" value={editVehicle.prixJour || 0} onChange={e => setEditVehicle({ ...editVehicle, prixJour: +e.target.value })} />
                </div>
                <div>
                  <Label>Places</Label>
                  <Input type="number" value={editVehicle.nbPlaces || 5} onChange={e => setEditVehicle({ ...editVehicle, nbPlaces: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={editVehicle.categorie} onValueChange={v => setEditVehicle({ ...editVehicle, categorie: v as Categorie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["MICRO", "COMPACTE", "BERLINE", "SUV"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transmission</Label>
                  <Select value={editVehicle.transmission} onValueChange={v => setEditVehicle({ ...editVehicle, transmission: v as Transmission })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUELLE">Manuelle</SelectItem>
                      <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Énergie</Label>
                  <Select value={editVehicle.energie} onValueChange={v => setEditVehicle({ ...editVehicle, energie: v as Energie })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Km inclus/jour</Label>
                <Input type="number" value={editVehicle.kmInclus || 200} onChange={e => setEditVehicle({ ...editVehicle, kmInclus: +e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editVehicle.description || ""} onChange={e => setEditVehicle({ ...editVehicle, description: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.disponible} onCheckedChange={v => setEditVehicle({ ...editVehicle, disponible: v })} />
                  <Label>Disponible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editVehicle.actif} onCheckedChange={v => setEditVehicle({ ...editVehicle, actif: v })} />
                  <Label>Actif</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)}>Annuler</Button>
            <Button onClick={saveVehicle}>{isNew ? "Créer" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteVehicle(deleteConfirm)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
