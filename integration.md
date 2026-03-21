# WestDrive Backend Integration Guide (Frontend, One-Shot)

Ce document est un playbook d integration frontend pour consommer l API WestDrive sans erreur.
Il est concu pour une IA d integration: conventions globales, auth, payloads exacts, workflows et cas d erreur.

## 1. Base API et conventions globales

### Base URL
- Dev local: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

### Format de reponse global
Toutes les reponses HTTP sont enveloppees.

Succes:
```json
{
  "status": "success",
  "code": 200,
  "data": {},
  "message": "Data retrieved successfully"
}
```

### Pagination des GET collection
Tous les GET qui retournent une collection sont pagines via query params:
- `page` (optionnel, defaut: `1`)
- `limit` (optionnel, defaut: `20`, max backend: `100`)

Format `data` pour un GET collection:
```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Erreur:
```json
{
  "status": "error",
  "code": 400,
  "data": {
    "path": "/auth/register",
    "timestamp": "2026-03-20T12:00:00.000Z"
  },
  "message": "..."
}
```

### Headers a envoyer
- `Content-Type: application/json` pour JSON
- `Authorization: Bearer <accessToken>` pour endpoints proteges
- Upload image: `Content-Type: multipart/form-data` (gerer par client FormData)

### CORS
Configuration backend par `.env`:
- `CORS_WHITELIST=https://app.domain.com,https://admin.domain.com`
- `CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`
- `CORS_ALLOW_NO_ORIGIN=true|false`

### Codes HTTP a gerer cote frontend
- `200/201`: succes
- `400`: validation ou regle metier
- `401`: token absent/invalide
- `403`: permission manquante
- `404`: ressource introuvable
- `409`: conflit metier (ex: overlap reservation)
- `500`: erreur interne

## 2. Auth Integration (namespace `/auth`)

## 2.1 POST /auth/register
Demarre une inscription OTP.

Payload particulier:
```json
{
  "accountType": "PARTICULIER",
  "email": "client@westdrive.fr",
  "password": "MonMotDePasseTresFort123!",
  "firstName": "Sami",
  "lastName": "Diallo",
  "phone": "+33612345678"
}
```

Payload entreprise:
```json
{
  "accountType": "ENTREPRISE",
  "email": "contact@acme.fr",
  "password": "MonMotDePasseTresFort123!",
  "firstName": "Amine",
  "lastName": "Diallo",
  "phone": "+33612345678",
  "companyName": "Acme SAS",
  "siret": "12345678901234",
  "contactName": "Amine Diallo",
  "contactEmail": "contact@acme.fr",
  "contactPhone": "+33612345678"
}
```

Succes data:
```json
{ "message": "OTP sent" }
```

## 2.2 POST /auth/register/confirm
Confirme OTP et cree le compte.

Payload:
```json
{
  "email": "client@westdrive.fr",
  "otp": "123456"
}
```

Succes data:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer"
}
```

## 2.3 POST /auth/login
Payload:
```json
{
  "email": "client@westdrive.fr",
  "password": "MonMotDePasseTresFort123!"
}
```
Retourne paire JWT.

## 2.4 POST /auth/refresh
Payload:
```json
{ "refreshToken": "..." }
```
Important: remplacer access + refresh en frontend (rotation refresh).

## 2.5 POST /auth/forgot-password
Payload:
```json
{ "email": "client@westdrive.fr" }
```
Toujours afficher message generique, meme si compte inexistant.

## 2.6 POST /auth/reset-password
Payload:
```json
{
  "email": "client@westdrive.fr",
  "otp": "123456",
  "newPassword": "NouveauMotDePasseTresFort123!"
}
```

### Strategie frontend auth recommandee
1. Conserver `accessToken` en memoire (state/store) pour limiter exposition.
2. Conserver `refreshToken` en stockage securise (si pas cookie httpOnly).
3. Interceptor HTTP:
- injecte `Authorization`.
- sur `401`, tente `/auth/refresh` une seule fois puis rejoue requete.
- si refresh echoue, logout + redirection login.

## 3. Users Integration (namespace `/users`)

Permissions backend:
- `users.read`
- `users.write`
- `users.status.write`
- `users.delete`

## 3.1 GET /users/me
Retourne contexte securite du token:
- `sub`, `email`, `role`, `roles[]`, `permissions[]`

A utiliser pour construire les guards UI (RBAC frontend).

## 3.2 GET /users
Liste utilisateurs (admin/backoffice).
Query supportee: `?page=1&limit=20`.

## 3.3 POST /users
Payload:
```json
{
  "email": "agent.operations@westdrive.fr",
  "password": "SuperSecurePassword123!",
  "firstName": "Lina",
  "lastName": "Khan",
  "phone": "+33622334455",
  "role": "CUSTOMER",
  "status": "ACTIF"
}
```

## 3.4 GET /users/:id
Recuperation detail utilisateur.

## 3.5 PATCH /users/:id
Patch partiel (meme champs que create, tous optionnels).

## 3.6 PATCH /users/:id/status
Payload:
```json
{ "status": "SUSPENDU" }
```

## 3.7 DELETE /users/:id
Supprime l utilisateur.

## 4. IAM Integration (namespace `/iam`)

Permissions backend:
- `roles.read`
- `roles.write`
- `roles.assign`

## 4.1 GET /iam/permissions
Retourne permissions systeme disponibles.
Query supportee: `?page=1&limit=20`.

## 4.2 GET /iam/roles
Retourne roles + rolePermissions detaillees.
Query supportee: `?page=1&limit=20`.

## 4.3 POST /iam/roles
Payload:
```json
{
  "name": "FLEET_MANAGER",
  "description": "Gestion quotidienne flotte",
  "permissionCodes": ["fleet.read", "fleet.manage"]
}
```

## 4.4 PATCH /iam/roles/:roleId/permissions
Payload:
```json
{ "permissionCodes": ["users.read", "roles.read"] }
```
Remplace totalement les permissions du role.

## 4.5 POST /iam/roles/:roleId/users/:userId
Assigne role a user (idempotent).

## 5. Vehicles Integration (namespace `/vehicles`)

Permissions backend:
- `vehicles.read`
- `vehicles.write`
- `vehicles.delete`

## 5.1 POST /vehicles
Payload minimal:
```json
{
  "name": "Tesla Model X 2024",
  "brand": "Tesla",
  "model": "Model X",
  "year": 2024,
  "category": "SUV",
  "transmission": "AUTOMATIQUE",
  "energy": "ELECTRIQUE",
  "seats": 7,
  "includedKmPerDay": 200,
  "pricePerDay": 159.99,
  "streetAddress": "12 Rue de Rivoli",
  "city": "Paris",
  "latitude": 48.856614,
  "longitude": 2.3522219,
  "availableCities": ["Paris"],
  "images": [
    {
      "url": "https://...",
      "sortOrder": 0
    }
  ]
}
```

## 5.2 GET /vehicles
Liste vehicules + images.
Query supportee: `?page=1&limit=20`.

## 5.3 GET /vehicles/:id
Detail vehicule.

## 5.4 GET /vehicles/:id/availability?startAt=...&endAt=...
Retourne:
```json
{
  "vehicleId": "...",
  "available": true
}
```

## 5.5 PATCH /vehicles/:id
Patch partiel.

## 5.6 POST /vehicles/:id/images/upload
Upload image Cloudinary.

Type: `multipart/form-data`
- champ fichier: `file` (obligatoire)
- query optionnelle: `sortOrder`

Exemple JS (fetch):
```ts
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await fetch(`${API_URL}/vehicles/${vehicleId}/images/upload?sortOrder=1`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});
```

## 5.7 DELETE /vehicles/:id/images/:imageId
Supprime image en DB + Cloudinary.

## 5.8 DELETE /vehicles/:id
Supprime vehicule et nettoie ses assets Cloudinary.

## 6. Fleet Integration (namespace `/fleet`)

Permissions backend:
- `fleet.read`
- `fleet.manage`

## 6.1 GET /fleet/overview
KPI flotte: `bonEtat`, `entretienRequis`, `enPanne`, `totalIncidentsOuverts`.

## 6.2 GET /fleet/vehicles
Liste flotte.
Query supportee: `?page=1&limit=20`.

## 6.3 PATCH /fleet/vehicles/:vehicleId/status
Payload:
```json
{ "operationalStatus": "INDISPONIBLE" }
```

## 6.4 Incidents
- POST /fleet/incidents
- GET /fleet/incidents?page=1&limit=20
- GET /fleet/incidents/:incidentId
- PATCH /fleet/incidents/:incidentId
- DELETE /fleet/incidents/:incidentId

Payload create incident:
```json
{
  "vehicleId": "uuid",
  "incidentType": "PANNE",
  "severity": "MAJEUR",
  "status": "OUVERT",
  "description": "Perte de puissance moteur",
  "openedAt": "2026-03-20T10:15:00Z"
}
```

Regle metier: incident `CRITIQUE` => vehicule force en `INDISPONIBLE`.

## 6.5 Schedule slots
- POST /fleet/schedule-slots
- GET /fleet/schedule-slots?vehicleId=...&page=1&limit=20
- GET /fleet/schedule-slots/:slotId
- PATCH /fleet/schedule-slots/:slotId
- DELETE /fleet/schedule-slots/:slotId

Payload create:
```json
{
  "vehicleId": "uuid",
  "startAt": "2026-04-01T08:00:00Z",
  "endAt": "2026-04-01T12:00:00Z",
  "slotType": "MAINTENANCE"
}
```

## 7. Reservations Integration (namespace `/reservations`)

Permissions backend:
- `reservations.read`
- `reservations.manage`

Statuts backend:
- `NOUVELLE_DEMANDE`
- `EN_ANALYSE`
- `PROPOSITION_ENVOYEE`
- `EN_ATTENTE_PAIEMENT`
- `CONFIRMEE`
- `EN_COURS`
- `CLOTUREE`
- `ANNULEE`
- `REFUSEE`

## 7.1 POST /reservations
Payload:
```json
{
  "userId": "uuid optionnel",
  "vehicleId": "uuid optionnel",
  "requesterType": "PARTICULIER",
  "requesterName": "John Doe",
  "requesterEmail": "john@doe.com",
  "requesterPhone": "+33612345678",
  "companyName": null,
  "companySiret": null,
  "startAt": "2026-07-10T09:00:00Z",
  "endAt": "2026-07-12T09:00:00Z",
  "pickupCity": "Paris",
  "requestedVehicleType": "SUV",
  "amountTtc": 420,
  "depositAmount": 1200
}
```

Regles metier backend importantes:
- `startAt < endAt`
- `startAt` dans le futur
- vehicule actif + disponible operationnellement
- anti double-booking (409 si overlap)
- conflit si slot flotte overlap (409)

## 7.2 GET /reservations
Liste reservations.
Query supportee: `?page=1&limit=20`.

## 7.3 GET /reservations/:id
Detail reservation + timeline.

## 7.4 PATCH /reservations/:id
Patch reservation.

## 7.5 PATCH /reservations/:id/status
Payload:
```json
{ "status": "EN_ANALYSE" }
```
Transitions strictes backend: gerer les erreurs 400 en UI.

## 7.6 POST /reservations/:id/stripe-preauth
Payload:
```json
{ "amount": 1200 }
```
Autorise uniquement depuis `EN_ATTENTE_PAIEMENT`.
Effet: preauth event + passage `CONFIRMEE`.

## 7.7 POST /reservations/:id/events
Payload:
```json
{
  "type": "reservation_vehicle_handover",
  "occurredAt": "2026-07-10T09:00:00Z",
  "payload": { "actor": "agent_123", "notes": "Vehicule remis" }
}
```

Types metier utilises:
- `reservation_created`
- `reservation_ack_email_sent`
- `reservation_admin_notified`
- `reservation_commercial_reviewed`
- `reservation_counter_offer_sent`
- `reservation_stripe_preauth_created`
- `reservation_vehicle_handover`
- `reservation_vehicle_returned`
- `reservation_closed`
- `reservation_status_changed`

## 7.8 GET /reservations/:id/events
Liste timeline chronologique.
Query supportee: `?page=1&limit=20`.

## 7.9 DELETE /reservations/:id
Suppression reservation.

## 8. System endpoints

- GET /
- GET /health

A utiliser pour monitoring frontend et checks availability avant bootstrap app.

## 9. Matrice permissions UI (gating frontend)

Depuis `/users/me`, construire ces gates:
- `canReadUsers`: `users.read`
- `canWriteUsers`: `users.write`
- `canSuspendUsers`: `users.status.write`
- `canDeleteUsers`: `users.delete`
- `canReadRoles`: `roles.read`
- `canWriteRoles`: `roles.write`
- `canAssignRoles`: `roles.assign`
- `canReadVehicles`: `vehicles.read`
- `canWriteVehicles`: `vehicles.write`
- `canDeleteVehicles`: `vehicles.delete`
- `canReadFleet`: `fleet.read`
- `canManageFleet`: `fleet.manage`
- `canReadReservations`: `reservations.read`
- `canManageReservations`: `reservations.manage`

Ne pas se baser sur `role` seul en frontend. Toujours preferer `permissions[]`.

## 10. Workflow frontend recommande (one-shot)

1. Boot app
- ping `GET /health`.
- si token present: `GET /users/me`.

2. Auth
- register OTP -> confirm -> stocker token pair.
- login -> stocker token pair.
- refresh auto sur 401.

3. Data services
- creer client API unique (baseURL, interceptors, parser enveloppe).
- parser universel:
  - si `status=success` => renvoyer `data`
  - si `status=error` => throw erreur metier avec `code/message/path`

4. RBAC UI
- router guards + hides/actions conditionnelles par permissions.

5. Upload fichiers
- upload multipart vers `/vehicles/:id/images/upload`.
- stocker retour image id/url et maj state.
- delete image via `/vehicles/:id/images/:imageId`.

## 11. Checklist anti-erreur d integration

- Toujours lire `response.data.data` (pas `response.data` directement).
- Pour les GET collection, lire `response.data.data.items` et `response.data.data.meta`.
- Toujours envoyer `Authorization` sur endpoints proteges.
- Toujours gerer `401/403/409` explicitement.
- Toujours normaliser dates en ISO UTC (`toISOString()`).
- Toujours envoyer les UUID valides (sinon 400 ParseUUID).
- Pour upload: ne pas forcer `Content-Type` manuellement, laisser `FormData`.
- Pour reservations: respecter l ordre de statuts avant preauth/events.

## 12. Exemple minimal de client API (TypeScript)

```ts
type ApiSuccess<T> = {
  status: 'success';
  code: number;
  data: T;
  message: string;
};

type ApiError = {
  status: 'error';
  code: number;
  data: { path: string; timestamp: string };
  message: string;
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok || json.status === 'error') {
    const err = json as ApiError;
    throw new Error(`${err.code}: ${err.message}`);
  }

  return (json as ApiSuccess<T>).data;
}
```

Ce document couvre l etat actuel des modules exposes: `system`, `auth`, `users`, `iam`, `vehicles`, `fleet`, `reservations`.
