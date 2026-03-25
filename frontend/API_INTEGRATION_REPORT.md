# WestDrive Frontend - API Integration Report

## Objectif
Ce document résume ce qui a été intégré côté frontend pour consommer l'API backend WestDrive, et explique comment valider l'intégration en local.

## Variables d'environnement
Le projet lit actuellement la variable suivante:

- VITE_API_BASE_URL: URL de base du backend.

Référence:
- [.env.example](.env.example)

## Ce qui a été intégré

### 1. Socle API centralisé
- Client HTTP unique avec parsing d'enveloppe backend success/error.
- Gestion des erreurs métier via type ApiHttpError.
- Injection du token Bearer pour routes protégées.
- Retry automatique après refresh token sur 401 (une seule tentative).

Fichiers:
- [src/lib/api/client.ts](src/lib/api/client.ts)
- [src/lib/api/types.ts](src/lib/api/types.ts)
- [src/lib/api/services.ts](src/lib/api/services.ts)
- [src/lib/api/tokenStorage.ts](src/lib/api/tokenStorage.ts)
- [src/lib/mappers.ts](src/lib/mappers.ts)

### 2. Session/Auth
- Auth context refactoré pour:
  - stocker access token en mémoire,
  - stocker refresh token en storage,
  - rafraîchir session au boot,
  - charger le profil via users/me.
- Déconnexion forcée si refresh échoue.

Fichier:
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

### 3. Auth pages connectées backend
- Connexion client: auth/login.
- Inscription: auth/register puis auth/register/confirm (OTP).
- Mot de passe oublié: auth/forgot-password + auth/reset-password.
- Admin auth: login backend + création de compte initiée via register OTP.

Fichiers:
- [src/pages/Connexion.tsx](src/pages/Connexion.tsx)
- [src/pages/Inscription.tsx](src/pages/Inscription.tsx)
- [src/pages/MotDePasseOublie.tsx](src/pages/MotDePasseOublie.tsx)
- [src/pages/AdminMotDePasseOublie.tsx](src/pages/AdminMotDePasseOublie.tsx)
- [src/pages/admin/AdminAuth.tsx](src/pages/admin/AdminAuth.tsx)

### 4. Véhicules (catalogue, résultats, détail)
- Récupération du catalogue via API vehicles/list.
- Recherche/résultats alimentés par le catalogue API.
- Détail véhicule connecté au catalogue API.
- Fallback image robuste si image backend absente.

Fichiers:
- [src/hooks/useVehiclesCatalog.ts](src/hooks/useVehiclesCatalog.ts)
- [src/pages/Vehicules.tsx](src/pages/Vehicules.tsx)
- [src/pages/Resultats.tsx](src/pages/Resultats.tsx)
- [src/pages/VehiculeDetail.tsx](src/pages/VehiculeDetail.tsx)
- [src/components/VehiculeCard.tsx](src/components/VehiculeCard.tsx)
- [src/components/SearchForm.tsx](src/components/SearchForm.tsx)

### 5. Réservations
- Création de réservation réelle depuis le dialog de réservation.
- Données envoyées en ISO UTC (startAt/endAt).
- Espace client connecté à la liste backend des réservations.
- Actions admin sur statuts de réservation connectées au backend.

Fichiers:
- [src/components/ReservationDialog.tsx](src/components/ReservationDialog.tsx)
- [src/pages/Espace.tsx](src/pages/Espace.tsx)
- [src/pages/admin/ReservationsTab.tsx](src/pages/admin/ReservationsTab.tsx)

### 6. Admin data principale
- Chargement backend pour véhicules, réservations, utilisateurs.
- Gestion flotte connectée aux endpoints fleet (overview + vehicles).
- CRUD véhicules admin branché sur endpoints vehicles.

Fichiers:
- [src/pages/admin/index.tsx](src/pages/admin/index.tsx)
- [src/pages/admin/VehiculesTab.tsx](src/pages/admin/VehiculesTab.tsx)
- [src/pages/admin/FlotteTab.tsx](src/pages/admin/FlotteTab.tsx)

### 7. Health check au démarrage
- Ping backend sur health au boot frontend.

Fichier:
- [src/App.tsx](src/App.tsx)

## Ce qui n'est pas totalement couvert
- Devis: pas d'endpoint devis dédié dans le guide, donc flux devis encore local (à finaliser selon décision backend).
- Filtrage strict mes réservations côté client: dépend de la stratégie backend/permissions (endpoint dédié conseillé).

## Comment tester

### 1. Pré-requis
1. Démarrer le backend WestDrive (par défaut sur http://localhost:3000).
2. Copier [.env.example](.env.example) vers .env.local et vérifier VITE_API_BASE_URL.
3. Installer dépendances frontend:
   - npm install
4. Démarrer le frontend:
   - npm run dev

### 2. Vérification rapide de build
1. Exécuter:
   - npm run build
2. Résultat attendu:
   - Build OK sans erreur TypeScript bloquante.

### 3. Scénarios fonctionnels à valider

#### Auth utilisateur
1. Aller sur la page inscription.
2. Créer un compte (particulier puis entreprise).
3. Saisir OTP de confirmation.
4. Vérifier redirection vers espace client.
5. Se déconnecter puis se reconnecter via page connexion.

#### Mot de passe oublié
1. Lancer mot de passe oublié.
2. Demander OTP.
3. Saisir OTP + nouveau mot de passe.
4. Vérifier connexion avec nouveau mot de passe.

#### Catalogue véhicule
1. Ouvrir la page véhicules.
2. Vérifier chargement des véhicules backend.
3. Tester filtres (catégorie, énergie, transmission, tri).
4. Ouvrir un détail véhicule.

#### Réservation client
1. Depuis une carte véhicule, cliquer réserver.
2. Soumettre le formulaire.
3. Vérifier création backend puis passage sur checkout.
4. Vérifier présence de la réservation dans espace client.

#### Admin
1. Se connecter sur espace admin.
2. Vérifier chargement des tableaux (véhicules, réservations, utilisateurs).
3. Modifier un statut de réservation.
4. Créer/modifier/supprimer un véhicule.
5. Vérifier section flotte (KPI + liste).

### 4. Contrôles API recommandés
- Vérifier dans Network que les réponses respectent l'enveloppe backend.
- Vérifier présence du header Authorization sur endpoints protégés.
- Simuler 401 pour vérifier le refresh automatique.
- Simuler conflit réservation (409) pour vérifier le message d'erreur côté UI.

## Notes d'exploitation
- Si VITE_API_BASE_URL est absent, fallback automatique sur http://localhost:3000.
- En cas de permissions backend insuffisantes en admin, le frontend garde des fallbacks pour éviter un écran bloquant.
