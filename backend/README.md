<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend NestJS de WestDrive (location de vehicules) avec socle de production initialise.

Phases implementees:
- Phase 0: cadrage/gouvernance documentes
- Phase 1: architecture et standards documentes
- Phase 2: socle runtime (config, securite, Docker, PostgreSQL, TypeORM, migration initiale, seed admin)

## Environment setup

1. Copier `.env.example` vers `.env`
2. Ajuster les secrets et identifiants

Variables critiques:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

SMTP Hostinger (OTP email):
- `MAIL_ENABLED=true`
- `MAIL_HOST=smtp.hostinger.com`
- `MAIL_PORT=465`
- `MAIL_SECURE=true`
- `MAIL_USER=noreply@your-domain.com`
- `MAIL_PASSWORD=...`
- `MAIL_FROM_EMAIL=noreply@your-domain.com`
- `MAIL_FROM_NAME=WestDrive`

Note: en environnement de test, gardez `MAIL_ENABLED=false` pour eviter toute emission externe.

Cloudinary (upload images vehicules):
- `CLOUDINARY_ENABLED=true`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`
- `CLOUDINARY_FOLDER=westdrive`

Stripe sandbox (paiements reservations + devis):
- `STRIPE_SECRET_KEY=sk_test_...`
- `FRONTEND_BASE_URL=http://localhost:8080` (ou URL frontend reelle)
- `STRIPE_WEBHOOK_SECRET=whsec_...` (recommande, optionnel en local)

Webhook Stripe expose par l API:
- `POST /payments/stripe/webhook`

Test rapide local (sans friction):
1. Ajouter `STRIPE_SECRET_KEY` dans `.env.local`.
2. Lancer backend + frontend.
3. Ouvrir Stripe CLI dans un terminal:
```bash
stripe listen --forward-to localhost:3000/payments/stripe/webhook
```
4. Copier le secret `whsec_...` fourni par Stripe CLI vers `STRIPE_WEBHOOK_SECRET`.
5. Relancer le backend.
6. Faire un paiement de reservation depuis `/checkout`.
7. Utiliser la carte test Stripe: `4242 4242 4242 4242`, date future, CVC `123`.

Resultat attendu:
- redirection Stripe puis retour frontend,
- reservation confirmee,
- email de confirmation de paiement envoye.

Endpoints upload vehicules:
- `POST /vehicles/:id/images/upload` (multipart/form-data, champ `file`)
- `DELETE /vehicles/:id/images/:imageId`

## Docker Development (API + PostgreSQL)

```bash
docker compose up --build -d
```

Si les credentials PostgreSQL ont ete modifies entre deux iterations, reinitialiser le volume local:

```bash
docker compose down -v
docker compose up --build -d
```

## Docker Production (API + PostgreSQL)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Contact API (public)

Endpoint public pour le formulaire de contact frontend:

- `POST /contact/messages`

Payload:
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@email.com",
  "phone": "+33601020304",
  "subject": "Demande de disponibilite",
  "message": "Bonjour, je souhaite connaitre vos disponibilites."
}
```

## Deployment VPS Hostinger (API + PostgreSQL)

### 1. Preparation locale

1. Copier `.env.production.example` vers `.env.production`.
2. Remplir toutes les valeurs `CHANGE_ME_*`.
3. Verifier la build locale:

```bash
npm run build
docker compose -f docker-compose.prod.yml --env-file .env.production config
```

### 2. Preparation serveur

Sur le VPS (Ubuntu):

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

### 3. Deploiement

```bash
# depuis ta machine locale
scp -r ./backend user@VPS_IP:/opt/westdrive-backend

# sur le VPS
cd /opt/westdrive-backend
cp .env.production.example .env.production
nano .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
docker compose -f docker-compose.prod.yml ps
```

### 4. Verification post-deploiement

```bash
docker compose -f docker-compose.prod.yml logs -f api
curl http://127.0.0.1:3000/health
```

### 5. Reverse proxy (Nginx) + SSL

Configurer Nginx pour proxy `https://api.your-domain.com` vers `http://127.0.0.1:3000`, puis installer TLS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

### 6. Mises a jour

```bash
cd /opt/westdrive-backend
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

## CI/CD GitHub Actions (push main => deploy automatique)

Workflow livre: `.github/workflows/deploy-backend-vps.yml`

Ce workflow fait:
1. Build backend
2. Build + tests frontend
3. Copie du dossier `backend/` sur le VPS
4. `docker compose up --build -d` automatique
5. Health-check local sur le VPS

Secrets GitHub requis (Settings > Secrets and variables > Actions):
- `VPS_HOST`: IP ou domaine du VPS
- `VPS_USER`: utilisateur SSH (ex: `ubuntu`)
- `VPS_PASSWORD`: mot de passe SSH de `VPS_USER`
- `VPS_SSH_PORT`: port SSH (souvent `22`)
- `VPS_APP_PATH`: chemin cible sur VPS (ex: `/opt/west-drive`)
- `VPS_API_DOMAIN`: sous-domaine API (ex: `api.votre-domaine.com`)
- `LETSENCRYPT_EMAIL`: email utilise pour le certificat SSL Let's Encrypt
- `BACKEND_ENV_PRODUCTION` (optionnel): contenu complet du fichier `.env.production`

Prerequis VPS:
1. Le sous-domaine `VPS_API_DOMAIN` pointe deja vers l'IP du VPS (A record)
2. L'utilisateur SSH a les droits sudo (installation nginx/certbot/ufw)
3. Fichier `${VPS_APP_PATH}/backend/.env.production` present

Le workflow execute automatiquement:
1. Provision VPS idempotent (`backend/scripts/provision-vps.sh`)
2. Installation/verification Docker, Nginx, UFW, Certbot
3. Reverse proxy Nginx sur `https://VPS_API_DOMAIN` vers `127.0.0.1:3000`
4. Certificat Let's Encrypt + redirection HTTPS
5. Deploiement Docker Compose + health-check HTTP local et HTTPS public

Si `BACKEND_ENV_PRODUCTION` est defini, le workflow ecrit automatiquement `.env.production` sur le VPS a chaque deploy.

Premier bootstrap rapide sur VPS:

```bash
sudo mkdir -p /opt/west-drive/backend
sudo chown -R $USER:$USER /opt/west-drive
cp /opt/west-drive/backend/.env.production.example /opt/west-drive/backend/.env.production
nano /opt/west-drive/backend/.env.production
```

Ensuite, chaque push sur `main` declenche le deploiement automatiquement.

## Database lifecycle

```bash
# generate migration from entities (never write by hand)
npm run migration:generate

# run migrations
npm run migration:run

# revert last migration
npm run migration:revert

# create default admin user
npm run seed:admin
```

## API docs

Swagger UI: `http://localhost:3000/docs`

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
