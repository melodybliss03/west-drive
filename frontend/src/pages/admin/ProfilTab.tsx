import { useEffect, useMemo, useState } from "react";
import { Edit, Save, Shield, Mail, Phone, UserPlus, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { iamService, usersService } from "@/lib/api/services";
import { Spinner } from "@/components/ui/spinner";

type PermissionOption = {
  code: string;
  label: string;
  description?: string;
};

type RoleOption = {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionCodes: string[];
};

type TeamUserRole = {
  id: string;
  name: string;
};

type TeamUser = {
  id: string;
  fullName: string;
  email: string;
  roles: TeamUserRole[];
};

const STAFF_HIDDEN_PERMISSION_CODES = new Set([
  "user.delete",
  "user.write",
  "users.status.write",
]);

function extractItems<T>(collection: unknown): T[] {
  if (Array.isArray(collection)) {
    return collection as T[];
  }

  if (collection && typeof collection === "object") {
    const maybeItems = (collection as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems as T[];
    }
  }

  return [];
}

export default function ProfilTab() {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    email: user?.email || "",
    telephone: "06 12 34 56 78",
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);
  const [isLoadingIam, setIsLoadingIam] = useState(true);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [removingRoleKey, setRemovingRoleKey] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  const roleNames = useMemo(
    () =>
      Array.from(
        new Set(
          [user?.role, ...(user?.roles ?? [])]
            .filter((role): role is string => typeof role === "string" && role.trim().length > 0)
            .map((role) => role.trim().toLowerCase()),
        ),
      ),
    [user?.role, user?.roles],
  );

  const isAdmin = roleNames.includes("admin");
  const hasIamPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return user.permissions.includes(permission);
  };

  const canReadRoles = hasIamPermission("roles.read");
  const canAssignRoles = hasIamPermission("roles.assign");
  const canWriteRoles = hasIamPermission("roles.write");
  const canAccessRoleSection = canReadRoles || canAssignRoles || canWriteRoles;

  const saveProfile = () => {
    login({
      id: user.id,
      nom: profileForm.nom,
      prenom: profileForm.prenom,
      email: profileForm.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles,
      permissions: user.permissions,
      photo: user.photo,
    });
    setProfileEditing(false);
    toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
  };

  useEffect(() => {
    if (!canAccessRoleSection) {
      setPermissions([]);
      setRoles([]);
      setTeamUsers([]);
      setIsLoadingIam(false);
      return;
    }

    const loadIamData = async () => {
      setIsLoadingIam(true);
      try {
        const [permissionsResponse, rolesResponse, usersResponse] = await Promise.all([
          iamService.permissions({ page: 1, limit: 100 }),
          iamService.roles({ page: 1, limit: 100 }),
          usersService.list({ page: 1, limit: 100 }),
        ]);

        const mappedPermissions = extractItems<Record<string, unknown>>(permissionsResponse).map((permission) => {
          const code = String(permission.code || "");
          const label = String(permission.label || permission.description || code);
          return { code, label, description: String(permission.description || "") };
        }).filter((permission) => {
          if (!permission.code.length) return false;
          // Toujours masquer ces permissions dans le back-office profil.
          if (STAFF_HIDDEN_PERMISSION_CODES.has(permission.code)) {
            return false;
          }
          return true;
        });

        const mappedRoles = extractItems<Record<string, unknown>>(rolesResponse).map((role) => {
          const rolePermissions = Array.isArray(role.rolePermissions) ? role.rolePermissions : [];
          const explicitPermissionCodes = Array.isArray(role.permissionCodes)
            ? role.permissionCodes.map((code) => String(code))
            : [];

          const nestedPermissionCodes = rolePermissions
            .map((rp) => {
              if (rp && typeof rp === "object" && "permission" in rp) {
                const permission = (rp as { permission?: { code?: unknown } }).permission;
                return permission?.code ? String(permission.code) : "";
              }
              return "";
            })
            .filter(Boolean);

          return {
            id: String(role.id || ""),
            name: String(role.name || ""),
            description: String(role.description || ""),
            isSystem: Boolean(role.isSystem),
            permissionCodes: Array.from(new Set([...explicitPermissionCodes, ...nestedPermissionCodes])),
          };
        }).filter((role) => role.id.length > 0);

        setPermissions(mappedPermissions);
        setRoles(mappedRoles);

        const mappedTeamUsers = extractItems<Record<string, unknown>>(usersResponse)
          .map((item) => {
            const firstName = String(item.firstName || "").trim();
            const lastName = String(item.lastName || "").trim();
            const fullName = `${firstName} ${lastName}`.trim() || "Utilisateur";

            const userRoles = Array.isArray(item.userRoles)
              ? item.userRoles
              : [];

            const roles = userRoles
              .map((userRole) => {
                if (!userRole || typeof userRole !== "object") return null;
                const linkId = "id" in userRole ? String((userRole as { id?: unknown }).id || "") : "";
                const roleObject = "role" in userRole ? (userRole as { role?: Record<string, unknown> }).role : undefined;
                const roleName = roleObject?.name ? String(roleObject.name) : "";
                const roleId = roleObject?.id ? String(roleObject.id) : "";
                if (!roleName || !roleId) return null;
                return {
                  id: roleId,
                  name: roleName,
                  linkId,
                };
              })
              .filter((role): role is { id: string; name: string; linkId: string } => !!role)
              .filter((role) => !["customer", "client", "admin"].includes(role.name.toLowerCase()));

            return {
              id: String(item.id || ""),
              fullName,
              email: String(item.email || ""),
              roles: roles.map((role) => ({ id: role.id, name: role.name })),
            };
          })
          .filter((member) => member.id.length > 0 && member.roles.length > 0);

        setTeamUsers(mappedTeamUsers);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossible de charger les données IAM.";
        toast({ title: "Erreur IAM", description: message, variant: "destructive" });
      } finally {
        setIsLoadingIam(false);
      }
    };

    loadIamData();
  }, [canAccessRoleSection, isAdmin, toast]);

  const togglePermission = (code: string) => {
    setSelectedPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const createCustomRole = async () => {
    if (!canWriteRoles) {
      toast({
        title: "Permission insuffisante",
        description: "La permission roles.write est requise.",
        variant: "destructive",
      });
      return;
    }

    if (!newRoleName.trim() || selectedPermissionCodes.length === 0) {
      toast({
        title: "Role incomplet",
        description: "Renseignez un nom de rôle et au moins une permission.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingRole(true);
      const created = await iamService.createRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || undefined,
        permissionCodes: selectedPermissionCodes,
      });

      setRoles((prev) => [
        {
          id: created.id,
          name: created.name,
          description: created.description,
          isSystem: false,
          permissionCodes: selectedPermissionCodes,
        },
        ...prev,
      ]);

      setSelectedRoleId(created.id);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissionCodes([]);
      toast({ title: "Rôle créé", description: `Le rôle ${created.name} a été créé.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de créer ce rôle.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsCreatingRole(false);
    }
  };

  const assignRole = async () => {
    if (!canAssignRoles) {
      toast({
        title: "Permission insuffisante",
        description: "La permission roles.assign est requise.",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail.trim() || !selectedRoleId) {
      toast({
        title: "Attribution incomplète",
        description: "Saisissez un email et sélectionnez un rôle.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAssigningRole(true);
      const result = await iamService.inviteAndAssignRoleByEmail(
        selectedRoleId,
        inviteEmail.trim(),
      );
      setInviteEmail("");
      toast({
        title: "Rôle attribué",
        description: result.invited
          ? "Invitation envoyée et rôle assigné."
          : "Le rôle a été assigné à l'utilisateur existant.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'assigner ce rôle.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsAssigningRole(false);
    }
  };

  const removeRoleFromMember = async (member: TeamUser, role: TeamUserRole) => {
    if (!canAssignRoles) {
      toast({
        title: "Permission insuffisante",
        description: "La permission roles.assign est requise.",
        variant: "destructive",
      });
      return;
    }

    const operationKey = `${member.id}:${role.id}`;
    if (removingRoleKey) return;

    try {
      setRemovingRoleKey(operationKey);
      await iamService.removeRoleFromUser(role.id, member.id);

      setTeamUsers((prev) =>
        prev
          .map((entry) =>
            entry.id === member.id
              ? {
                  ...entry,
                  roles: entry.roles.filter((entryRole) => entryRole.id !== role.id),
                }
              : entry,
          )
          .filter((entry) => entry.roles.length > 0),
      );

      toast({
        title: "Rôle supprimé",
        description: `Le rôle ${role.name} a été retiré de ${member.fullName}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer ce rôle.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setRemovingRoleKey(null);
    }
  };

  const deleteCustomRole = async (role: RoleOption) => {
    if (!canWriteRoles) {
      toast({
        title: "Permission insuffisante",
        description: "La permission roles.write est requise.",
        variant: "destructive",
      });
      return;
    }

    if (role.isSystem) {
      toast({
        title: "Action interdite",
        description: "Les rôles système ne peuvent pas être supprimés.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingRoleId(role.id);
      await iamService.deleteRole(role.id);

      setRoles((prev) => prev.filter((entry) => entry.id !== role.id));
      setTeamUsers((prev) =>
        prev
          .map((member) => ({
            ...member,
            roles: member.roles.filter((memberRole) => memberRole.id !== role.id),
          }))
          .filter((member) => member.roles.length > 0),
      );

      if (selectedRoleId === role.id) {
        setSelectedRoleId("");
      }

      toast({
        title: "Rôle supprimé",
        description: `Le rôle ${role.name} a été supprimé.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer ce rôle.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setDeletingRoleId(null);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Mon profil</h2>
        {!profileEditing ? (
          <Button variant="outline" className="gap-2" onClick={() => setProfileEditing(true)}>
            <Edit className="h-4 w-4" /> Modifier
          </Button>
        ) : (
          <Button className="gap-2" onClick={saveProfile}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <h3 className="font-display font-bold text-lg">{user.prenom} {user.nom}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-3 bg-primary/10 text-primary border-primary/20" variant="outline">Administrateur</Badge>
            <div className="w-full mt-6 pt-4 border-t border-border space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profileForm.telephone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rôle : Administrateur</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input value={profileForm.prenom} onChange={e => setProfileForm(p => ({ ...p, prenom: e.target.value }))} disabled={!profileEditing} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={profileForm.nom} onChange={e => setProfileForm(p => ({ ...p, nom: e.target.value }))} disabled={!profileEditing} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} disabled={!profileEditing} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input type="tel" value={profileForm.telephone} onChange={e => setProfileForm(p => ({ ...p, telephone: e.target.value }))} disabled={!profileEditing} />
            </div>
            {profileEditing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={saveProfile} className="gap-2">
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
                <Button variant="outline" onClick={() => {
                  setProfileEditing(false);
                  setProfileForm({ prenom: user.prenom, nom: user.nom, email: user.email, telephone: profileForm.telephone });
                }}>
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attribution des rôles */}
      {canAccessRoleSection && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Attribution des rôles — Équipe West Drive
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajoutez des membres à votre équipe et attribuez-leur un rôle avec des permissions spécifiques.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingIam ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Chargement des rôles, permissions et utilisateurs...
            </div>
          ) : (
            <>
              {canWriteRoles && (
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 space-y-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Créer un rôle personnalisé
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Nom du rôle (ex: ROLE_BACKOFFICE_ASSISTANT)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <Input
                    placeholder="Description du rôle"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Permissions système</p>
                  <div className="flex flex-wrap gap-3">
                    {permissions.map((permission) => (
                      <label key={permission.code} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selectedPermissionCodes.includes(permission.code)}
                          onCheckedChange={() => togglePermission(permission.code)}
                        />
                        <span>{permission.code}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={createCustomRole} className="gap-2" disabled={isCreatingRole}>
                  {isCreatingRole ? <Spinner /> : <Shield className="h-4 w-4" />}
                  Créer le rôle
                </Button>
              </div>
              )}

              {canAssignRoles && (
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 space-y-4">
                <p className="text-sm font-medium flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Assigner un rôle à un utilisateur</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@entreprise.com"
                  />

                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={assignRole} className="gap-2" disabled={isAssigningRole}>
                    {isAssigningRole ? <Spinner /> : <UserPlus className="h-4 w-4" />}
                    Inviter & assigner
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si l'email n'existe pas encore, un compte invité est créé automatiquement et un email d'invitation est envoyé.
                </p>
              </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Rôles disponibles ({roles.length})</p>
                {roles.map((role) => (
                  <div key={role.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.description ? (
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isSystem ? (
                          <Badge variant="outline">Système</Badge>
                        ) : null}
                        <Badge variant="outline">{role.permissionCodes.length} permissions</Badge>
                        {canWriteRoles && !role.isSystem ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => void deleteCustomRole(role)}
                            disabled={deletingRoleId === role.id}
                            title={`Supprimer le rôle ${role.name}`}
                          >
                            {deletingRoleId === role.id ? <Spinner className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.permissionCodes.map((code) => (
                        <span key={code} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun rôle disponible pour le moment.</p>
                ) : null}

                {selectedRole ? (
                  <p className="text-xs text-muted-foreground">
                    Rôle sélectionné: {selectedRole.name} ({selectedRole.permissionCodes.length} permissions)
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Rôles attribués aux membres</p>
                {teamUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun membre avec rôle attribué.</p>
                ) : (
                  teamUsers.map((member) => (
                    <div key={member.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.roles.length} rôle(s)</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {member.roles.map((role) => {
                          const operationKey = `${member.id}:${role.id}`;
                          const isRemoving = removingRoleKey === operationKey;

                          return (
                            <div key={`${member.id}-${role.id}`} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                              <span>{role.name}</span>
                              {canAssignRoles && (
                              <button
                                type="button"
                                onClick={() => removeRoleFromMember(member, role)}
                                disabled={isRemoving}
                                className="inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
                                aria-label={`Supprimer le rôle ${role.name}`}
                                title={`Supprimer le rôle ${role.name}`}
                              >
                                {isRemoving ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </motion.div>
  );
}
