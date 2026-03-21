import { useState } from "react";
import { Eye, Trash2, Search, Mail, Phone, MapPin, Calendar, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MockUser } from "./data";

interface UtilisateursTabProps {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  meta: PaginationMeta | null;
  setMeta: React.Dispatch<React.SetStateAction<PaginationMeta | null>>;
  limit: number;
}

export default function UtilisateursTab({ users, setUsers, page, setPage, meta, setMeta, limit }: UtilisateursTabProps) {
  const { toast } = useToast();
  const [searchU, setSearchU] = useState("");
  const filteredUsers = users.filter(u => u.nom.toLowerCase().includes(searchU.toLowerCase()) || u.email.toLowerCase().includes(searchU.toLowerCase()));

  const reloadPage = async () => {
    const collection = await usersService.list({ page, limit });
    const items = extractUsersFromResponse(collection);
    const hasPaginatedMeta = !!collection && typeof collection === "object" && "meta" in collection;

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
      setMeta({
        page,
        limit,
        totalItems: mappedUsers.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } else {
      setMeta((collection as { meta: PaginationMeta }).meta);
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    if (loadingUserId) return;

    const nextStatus: UserStatus = user.statut === "actif" ? "SUSPENDU" : "ACTIF";

    try {
      setLoadingUserId(user.id);
      await usersService.patchStatus(user.id, nextStatus);
      await reloadPage();
      toast({ title: "Statut mis à jour" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de mettre à jour le statut.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setLoadingUserId(null);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (loadingUserId) return;

    try {
      setLoadingUserId(user.id);
      await usersService.remove(user.id);
      await reloadPage();
      toast({ title: "Utilisateur supprimé" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer cet utilisateur.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
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
  );
}
