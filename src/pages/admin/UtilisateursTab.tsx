import { useState } from "react";
import { Eye, Trash2, Search, Mail, Phone, MapPin, Calendar, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MockUser } from "./data";

interface UtilisateursTabProps {
  users: MockUser[];
}

export default function UtilisateursTab({ users }: UtilisateursTabProps) {
  const [searchU, setSearchU] = useState("");
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  const filteredUsers = users.filter(u => u.nom.toLowerCase().includes(searchU.toLowerCase()) || u.email.toLowerCase().includes(searchU.toLowerCase()));

  return (
    <>
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
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
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
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={u.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                          {u.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{u.creeLe}</TableCell>
                      <TableCell>{u.reservations}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.statut === "actif" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {u.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(u)}><Eye className="h-4 w-4" /></Button>
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

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                  {selectedUser.prenom[0]}{selectedUser.nom[0]}
                </div>
                <div>
                  <p className="font-display font-bold text-lg">{selectedUser.prenom} {selectedUser.nom}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={selectedUser.statut === "actif" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {selectedUser.statut}
                    </Badge>
                    <Badge variant="outline" className={selectedUser.type === "entreprise" ? "bg-blue-500/10 text-blue-600 border-blue-200" : ""}>
                      {selectedUser.type === "entreprise" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                      {selectedUser.type}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Coordonnées</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{selectedUser.email}</span></div>
                  {selectedUser.telephone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedUser.telephone}</span></div>}
                  {selectedUser.ville && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedUser.ville}</span></div>}
                  {selectedUser.adresse && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedUser.adresse}</span></div>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Informations</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Réservations</p>
                    <p className="text-lg font-bold">{selectedUser.reservations}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xs text-muted-foreground">Inscrit le</p>
                    <p className="text-sm font-semibold">{selectedUser.creeLe}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
