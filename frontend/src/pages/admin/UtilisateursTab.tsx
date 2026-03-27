import { useState } from "react";
import { Eye, Trash2, Search, Mail, Phone, MapPin, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usersService } from "@/lib/api/services";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaginationMeta, UserStatus } from "@/lib/api/types";
import type { AdminUser } from "./types";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchU, setSearchU] = useState("");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const visibleUsers = users.filter((candidate) => {
    const isConnectedUser = !!user?.id && candidate.id === user.id;
    const isAdminUser = candidate.role.toLowerCase() === "admin";
    return !isConnectedUser && !isAdminUser;
  });

  const filteredUsers = visibleUsers.filter(u => u.nom.toLowerCase().includes(searchU.toLowerCase()) || u.email.toLowerCase().includes(searchU.toLowerCase()));

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
    telephone: item.telephone ? String(item.telephone) : undefined,  // ← ajouté
    ville: item.ville ? String(item.ville) : undefined,              // ← ajouté
    adresse: item.adresse ? String(item.adresse) : undefined,        // ← ajouté
  };
});

    const currentUserId = user?.id ?? "";
    const visibleMappedUsers = mappedUsers.filter(
      (candidate) =>
        candidate.id !== currentUserId &&
        candidate.role.toLowerCase() !== "admin",
    );

    setUsers(visibleMappedUsers);

    if (!hasPaginatedMeta) {
      setMeta({
        page,
        limit,
        totalItems: visibleMappedUsers.length,
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
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        {users.length === 0
                          ? "Aucun utilisateur disponible pour le moment."
                          : "Aucun utilisateur ne correspond à votre recherche."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(u => (
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
                          <button
                            type="button"
                            className="inline-flex"
                            onClick={() => toggleStatus(u)}
                            disabled={!!loadingUserId}
                          >
                            <Badge variant="outline" className={u.statut === "actif" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/20"}>
                              {loadingUserId === u.id ? <Spinner className="mr-2 h-3.5 w-3.5" /> : null}
                              {u.statut}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(u)}> {/* ← activé */}
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteUser(u)}
                              disabled={!!loadingUserId}
                            >
                              {loadingUserId === u.id ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {meta && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Page {meta.page} sur {Math.max(meta.totalPages, 1)} · {meta.totalItems} utilisateurs
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (meta.hasPreviousPage) {
                        setPage((prev) => Math.max(prev - 1, 1));
                      }
                    }}
                    className={!meta.hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {meta.page}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (meta.hasNextPage) {
                        setPage((prev) => prev + 1);
                      }
                    }}
                    className={!meta.hasNextPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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