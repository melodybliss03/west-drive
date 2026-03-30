import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogArticle } from './entities/blog-article.entity';

interface SeedEntry {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  mainImageUrl: string;
  publishedAt: string;
  content: string;
}

const SEED_DATA: SeedEntry[] = [
  {
    slug: 'louer-voiture-ile-de-france-conseils',
    title: '5 conseils pour louer une voiture en Île-de-France sans stress',
    excerpt: "Entre les options de transport, les quartiers à éviter et les bons réflexes à adopter, louer une voiture en région parisienne demande un peu de préparation. Voici nos conseils.",
    category: 'Conseils pratiques',
    mainImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    publishedAt: '2025-03-10T09:00:00.000Z',
    content: `<p>Louer une voiture en Île-de-France peut sembler intimidant au premier abord. Entre les embouteillages, le stationnement difficile et les nombreuses options de mobilité disponibles, il est facile de se sentir dépassé. Pourtant, avec les bons réflexes, une location de voiture devient un vrai atout pour vos déplacements professionnels ou personnels.</p><h2>1. Réservez à l'avance, surtout en haute saison</h2><p>Les mois de juin à septembre, ainsi que les périodes de fêtes, voient la demande exploser. En réservant 3 à 7 jours à l'avance, vous garantissez la disponibilité du véhicule de votre choix et bénéficiez souvent de meilleurs tarifs.</p><h2>2. Choisissez un véhicule adapté à votre usage</h2><p>Pour circuler dans Paris intramuros, une citadine de type Micro ou Compacte est largement suffisante. Elle sera plus facile à garer et consommera moins de carburant. Pour un trajet en famille ou un week-end en dehors de la ville, un SUV ou une berline offre plus de confort.</p><h2>3. Vérifiez les zones de stationnement</h2><p>Depuis 2023, Paris a renforcé ses zones de stationnement payant. Renseignez-vous sur les tarifs selon les arrondissements et prévoyez un budget stationnement si vous comptez vous garer plusieurs heures en centre-ville.</p><h2>4. Anticipez les heures de pointe</h2><p>En semaine, les axes A86, A1 et le périphérique sont saturés entre 7h30-9h30 et 17h-19h30. Planifier vos déplacements en dehors de ces créneaux vous fera gagner un temps précieux.</p><h2>5. Profitez de la livraison à domicile</h2><p>Certains prestataires, dont West Drive, proposent de vous livrer le véhicule directement à votre adresse. Cela vous évite un déplacement supplémentaire et vous permet de partir sereinement.</p><p>En suivant ces conseils, votre location de voiture en Île-de-France se déroulera dans les meilleures conditions. Et si vous avez des questions, notre équipe est disponible 7j/7 pour vous accompagner.</p>`,
  },
  {
    slug: 'location-voiture-entreprise-avantages',
    title: 'Location de voiture pour les entreprises : quels avantages en 2025 ?',
    excerpt: "Flotte externalisée, flexibilité, pas d'immobilisation de capital… La location professionnelle séduit de plus en plus les PME franciliennes. On vous explique pourquoi.",
    category: 'Entreprises',
    mainImageUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
    publishedAt: '2025-02-20T09:00:00.000Z',
    content: `<p>De plus en plus d'entreprises choisissent de louer leurs véhicules plutôt que de les acquérir. Cette tendance, portée par une recherche de flexibilité et d'optimisation des coûts, s'est accélérée depuis 2022. Décryptage.</p><h2>Pas d'immobilisation de capital</h2><p>L'achat d'un véhicule représente un investissement important, souvent entre 20 000 € et 50 000 €. En louant, vous libérez ce capital pour vos activités principales. Les charges sont prévisibles et fixes, ce qui facilite la gestion comptable.</p><h2>Une flexibilité totale</h2><p>Besoin d'un véhicule pour une semaine, un mois, ou plusieurs mois ? La location s'adapte à vos besoins sans engagement long terme. Vous pouvez également changer de catégorie de véhicule selon les missions : berline pour un client VIP, SUV pour un déplacement en famille de collaborateurs.</p><h2>Des véhicules toujours récents et entretenus</h2><p>Avec la location, vous bénéficiez toujours d'un véhicule en bon état, régulièrement entretenu. Fini les soucis de révision, de contrôle technique ou de réparations imprévues.</p><h2>Avantages fiscaux</h2><p>Les loyers de location sont en grande partie déductibles des charges de l'entreprise. Selon votre statut et le type de véhicule, la TVA peut également être récupérable. Un point à vérifier avec votre expert-comptable.</p><h2>Une image professionnelle soignée</h2><p>Accueillir un client ou un partenaire dans un véhicule propre, récent et bien entretenu contribue à une image professionnelle positive. Un détail qui peut faire la différence.</p><p>West Drive propose des offres dédiées aux entreprises avec facturation simplifiée, véhicules livrés sur site et tarifs négociés pour les locations régulières. Contactez-nous pour un devis personnalisé.</p>`,
  },
  {
    slug: 'puteaux-la-defense-guide-mobilite',
    title: 'Puteaux & La Défense : guide de mobilité pour bien se déplacer',
    excerpt: "Transports en commun, stationnement, axes routiers… Le quartier d'affaires de La Défense a ses propres règles. Notre guide pour vous repérer rapidement.",
    category: 'Guide local',
    mainImageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    publishedAt: '2025-01-15T09:00:00.000Z',
    content: `<p>Avec plus de 180 000 salariés qui y travaillent chaque jour, le quartier de La Défense est l'un des pôles d'affaires les plus dynamiques d'Europe. Se déplacer dans cette zone demande de connaître quelques règles et astuces incontournables.</p><h2>Les transports en commun</h2><p>La Défense est desservie par le RER A, la ligne 1 du métro, le tramway T2 et de nombreuses lignes de bus. Pour les déplacements intra-zone, ces options sont souvent les plus rapides. Cependant, elles atteignent leurs limites pour les livraisons, les trajets vers les communes environnantes comme Puteaux, Nanterre ou Rueil, ou simplement lorsque vous transportez du matériel.</p><h2>En voiture : axes et parkings</h2><p>L'accès en voiture se fait principalement par l'A14, l'A86 et le boulevard Circulaire. Les parkings sont nombreux mais onéreux en journée (entre 3 € et 6 €/heure). Pensez aux parkings relais aux abords de la zone pour réduire les coûts.</p><h2>Puteaux, une base idéale</h2><p>Si vous cherchez un point de départ pratique pour rayonner autour de La Défense, Puteaux offre de bonnes conditions : stationnement plus accessible, axes rapides vers l'A86 et l'A14, et une bonne desserte en transports en commun.</p><h2>West Drive, votre partenaire mobilité local</h2><p>Basé à Puteaux, West Drive met à votre disposition des véhicules disponibles à la journée ou à la semaine, avec livraison possible sur votre lieu de travail. Une solution idéale pour les professionnels de La Défense qui ont besoin d'un véhicule ponctuel sans les contraintes d'une flotte propre.</p><p>Que vous soyez salarié, dirigeant ou en mission temporaire dans le secteur, nous avons le véhicule qu'il vous faut.</p>`,
  },
  {
    slug: 'choisir-categorie-voiture-location',
    title: 'Micro, Compacte, Berline ou SUV : comment choisir la bonne catégorie ?',
    excerpt: "Toutes les voitures ne se valent pas selon votre usage. On vous aide à choisir entre les quatre catégories disponibles chez West Drive selon vos besoins réels.",
    category: 'Conseils pratiques',
    mainImageUrl: 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=800&q=80',
    publishedAt: '2024-12-05T09:00:00.000Z',
    content: `<p>Lorsqu'on loue une voiture, la question du choix de catégorie revient systématiquement. Trop grand, et vous payez inutilement. Trop petit, et vous manquez de confort. Voici un guide simple pour faire le bon choix.</p><h2>La Micro : pour la ville avant tout</h2><p>Les citadines Micro (Peugeot 108, Citroën C1, Fiat 500) sont taillées pour la ville. Faciles à garer, économes en carburant et agiles dans les embouteillages, elles sont parfaites pour les déplacements quotidiens en zone dense. En revanche, leur habitacle et leur coffre limités les rendent peu adaptées aux longs trajets ou aux familles.</p><h2>La Compacte : le bon compromis</h2><p>La Compacte (Renault Clio, Peugeot 308, Volkswagen Golf) est la catégorie la plus polyvalente. Elle offre un bon équilibre entre confort, consommation et espace. Idéale pour les trajets mixtes ville/route, elle convient à la plupart des usages professionnels et personnels.</p><h2>La Berline : confort et prestige</h2><p>Les Berlines (BMW Série 3, Mercedes Classe C, Audi A4) sont pensées pour le confort sur les longs trajets et l'image professionnelle. Si vous recevez des clients ou que vous faites régulièrement des trajets Paris-Province, c'est le choix idéal. Leur consommation est cependant plus élevée.</p><h2>Le SUV : espace et polyvalence</h2><p>Les SUV (Peugeot 3008, Audi Q5, Renault Captur) combinent habitacle spacieux, position de conduite haute et polyvalence. Parfaits pour les déplacements en famille, les week-ends ou les missions nécessitant de transporter du matériel. Leur point faible : le stationnement en centre-ville.</p><h2>Notre recommandation</h2><p>Pour un usage professionnel en Île-de-France, la Compacte reste le meilleur rapport usage/coût. Pour un déplacement client ou une réunion importante, optez pour la Berline. Pour les vacances ou les trajets familiaux, le SUV s'impose naturellement.</p>`,
  },
  {
    slug: 'location-voiture-weekend-escapades',
    title: 'Week-end en Île-de-France : 4 escapades à faire en voiture de location',
    excerpt: "Châteaux, forêts, bords de Seine… La région offre des destinations méconnues à moins d'une heure de Paris. On vous propose 4 itinéraires à faire avec un véhicule loué.",
    category: 'Inspiration',
    mainImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    publishedAt: '2024-11-18T09:00:00.000Z',
    content: `<p>Vous pensez qu'il faut partir loin pour se dépayser ? Détrompez-vous. À moins d'une heure de Paris, la région Île-de-France regorge de destinations surprenantes, accessibles facilement en voiture de location pour un week-end ressourçant.</p><h2>1. Le Château de Versailles et ses jardins (30 min)</h2><p>Incontournable, le domaine de Versailles mérite bien plus qu'une matinée. En voiture, vous pouvez explorer le Trianon, le Grand Canal et les jardins en toute liberté, sans dépendre des horaires de train. Prévoyez une journée complète et arrivez tôt pour éviter la foule.</p><h2>2. La forêt de Fontainebleau (50 min)</h2><p>Le massif forestier de Fontainebleau est un terrain de jeu exceptionnel pour les amateurs de randonnée, d'escalade et de nature. Ses rochers gréseux, ses gorges et ses panoramas en font une destination unique à moins d'une heure de Paris. Un SUV sera plus confortable sur certains chemins d'accès.</p><h2>3. Les bords de Seine à La Roche-Guyon (1h)</h2><p>Nichée dans un méandre de la Seine, La Roche-Guyon est l'un des plus beaux villages de France. Son château troglodyte, ses falaises calcaires et ses chemins de halage en font un cadre pittoresque et reposant. Idéal pour un week-end en amoureux.</p><h2>4. Provins, cité médiévale (1h10)</h2><p>Classée au patrimoine mondial de l'UNESCO, Provins est une ville médiévale exceptionnellement bien conservée. Ses remparts, sa tour César et ses ruelles pavées vous plongeront dans l'histoire. Le week-end, des spectacles de fauconnerie et de joutes sont organisés.</p><h2>Louer avec West Drive pour votre week-end</h2><p>Pour ces escapades, nous vous recommandons une Compacte pour les trajets légers, ou un SUV pour plus de confort sur des routes plus variées. Réservez dès le jeudi pour garantir la disponibilité du véhicule le vendredi soir.</p>`,
  },
  {
    slug: 'caution-assurance-location-voiture-questions',
    title: 'Caution, assurance, kilométrage : les questions fréquentes sur la location',
    excerpt: "Avant de louer, vous avez souvent les mêmes interrogations. Nous répondons clairement aux questions les plus posées par nos clients sur la caution, les assurances et le kilométrage.",
    category: 'FAQ',
    mainImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    publishedAt: '2024-10-30T09:00:00.000Z',
    content: `<p>Avant de finaliser une réservation, nos clients nous posent souvent les mêmes questions. Transparence oblige, nous y répondons ici de façon claire et complète.</p><h2>Comment fonctionne la caution ?</h2><p>La caution est une somme bloquée sur votre carte bancaire au moment de la prise en charge du véhicule. Elle n'est pas débitée, mais simplement réservée. Elle est restituée intégralement au retour du véhicule si aucun dommage n'est constaté. Son montant varie selon la catégorie du véhicule, de 200 € pour une Micro à 700 € pour un SUV premium.</p><h2>Quelle assurance couvre ma location ?</h2><p>Tous nos véhicules sont couverts par une assurance tous risques. En cas d'accident, votre responsabilité est limitée au montant de la franchise définie dans votre contrat. Vous pouvez également souscrire à notre option "franchise zéro" pour être totalement couvert.</p><h2>Que se passe-t-il si je dépasse le kilométrage inclus ?</h2><p>Chaque véhicule dispose d'un forfait kilométrique journalier (entre 150 et 300 km selon la catégorie). Si vous dépassez ce forfait, des kilomètres supplémentaires seront facturés à un tarif fixe par kilomètre, indiqué dans votre contrat. Pour les longs trajets, pensez à nous en informer lors de la réservation pour adapter le forfait.</p><h2>Puis-je conduire le véhicule avec un permis récent ?</h2><p>Oui, à condition que votre permis de conduire soit valide depuis au moins 2 ans. Pour les conducteurs ayant moins de 2 ans de permis, certaines catégories peuvent être limitées. Contactez-nous pour vérifier votre situation.</p><h2>Puis-je faire conduire quelqu'un d'autre ?</h2><p>Oui, en déclarant un conducteur additionnel lors de la réservation. Ce conducteur doit être présent lors de la prise en charge et disposer d'un permis valide.</p><h2>Que faire en cas de panne ou d'accident ?</h2><p>Contactez notre numéro d'assistance disponible 24h/24. En cas d'accident, remplissez un constat amiable et prenez des photos. Nous vous guiderons pour la suite des démarches.</p><p>Vous avez d'autres questions ? Notre équipe est disponible par téléphone, email ou via le formulaire de contact de notre site.</p>`,
  },
];

@Injectable()
export class BlogSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BlogSeederService.name);

  constructor(
    @InjectRepository(BlogArticle)
    private readonly blogRepository: Repository<BlogArticle>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const count = await this.blogRepository.count();
      if (count > 0) {
        this.logger.log(`Seeder: ${count} articles déjà en base, skip.`);
        return;
      }

      const placeholders: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const row of SEED_DATA) {
        const base = paramIdx;
        placeholders.push(
          `(gen_random_uuid(), $${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, 'PUBLISHED', $${base + 6}::timestamptz, $${base + 6}::timestamptz, $${base + 6}::timestamptz)`,
        );
        params.push(
          row.title,
          row.slug,
          row.excerpt,
          row.content,
          row.category,
          row.mainImageUrl,
          row.publishedAt,
        );
        paramIdx += 7;
      }

      await this.blogRepository.manager.query(
        `INSERT INTO blog_articles (id, title, slug, excerpt, content, category, main_image_url, status, published_at, created_at, updated_at) VALUES ${placeholders.join(', ')}`,
        params,
      );

      this.logger.log(`Seeder: ${SEED_DATA.length} articles de blog insérés.`);
    } catch (error) {
      this.logger.error('Seeder: échec de la seed des articles', error);
    }
  }
}
