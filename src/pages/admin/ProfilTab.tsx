import { useState } from "react";
import { Edit, Save, Shield, Mail, Phone, Trash2, UserPlus } from "lucide-react";
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
import type { TeamMember } from "./data";
import { roleColors, allPermissions } from "./data";

interface ProfilTabProps {
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}

export default function ProfilTab({ teamMembers, setTeamMembers }: ProfilTabProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    prenom: user?.prenom || "",
    nom: user?.nom || "",
    email: user?.email || "",
    telephone: "06 12 34 56 78",
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberPermissions, setNewMemberPermissions] = useState<string[]>([]);

  const saveProfile = () => {
    login({ nom: profileForm.nom, prenom: profileForm.prenom, email: profileForm.email });
    setProfileEditing(false);
    toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
  };

  const addTeamMember = () => {
    if (!newMemberEmail.trim() || !newMemberRole) {
      toast({ title: "Erreur", description: "Veuillez remplir l'email et le rôle.", variant: "destructive" });
      return;
    }
    const newMember: TeamMember = {
      id: `T-${Date.now()}`,
      nom: newMemberEmail.split("@")[0],
      prenom: "",
      email: newMemberEmail,
      role: newMemberRole,
      permissions: newMemberPermissions,
      dateAttribution: new Date().toISOString().split("T")[0],
    };
    setTeamMembers(prev => [...prev, newMember]);
    setNewMemberEmail("");
    setNewMemberRole("");
    setNewMemberPermissions([]);
    toast({ title: "Membre ajouté", description: `${newMemberEmail} a été ajouté avec le rôle "${newMemberRole}".` });
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Membre retiré" });
  };

  const togglePermission = (key: string) => {
    setNewMemberPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

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
          {/* Add new member */}
          <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 space-y-4">
            <p className="text-sm font-medium flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Ajouter un membre</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="email@westdrive.fr" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="comptable">Comptable</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addTeamMember} className="gap-2"><UserPlus className="h-4 w-4" /> Ajouter</Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Permissions :</p>
              <div className="flex flex-wrap gap-3">
                {allPermissions.map(perm => (
                  <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={newMemberPermissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Existing team members */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Membres actuels ({teamMembers.length})</p>
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-bold flex-shrink-0">
                  {member.prenom ? member.prenom[0] : member.nom[0]}{member.nom[member.nom.length > 1 ? 1 : 0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {member.prenom ? `${member.prenom} ${member.nom}` : member.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant="outline" className={`${roleColors[member.role] || ""} flex-shrink-0`}>
                  {member.role}
                </Badge>
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                  {member.permissions.map(p => (
                    <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {allPermissions.find(ap => ap.key === p)?.label || p}
                    </span>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => removeTeamMember(member.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
