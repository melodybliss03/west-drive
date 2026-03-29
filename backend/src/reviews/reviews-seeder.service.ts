import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

interface SeedEntry {
  authorName: string;
  title: string;
  rating: number;
  content: string;
  source: string;
  createdAt: string;
}

const SEED_DATA: SeedEntry[] = [
  // ── Getaround ──────────────────────────────────────────────────────────────
  { authorName: 'Naomie G.', title: 'Ghislain est une personne agréable', rating: 5, content: "Ghislain est une personne agréable, sympathique et arrangeant. Son véhicule Citroën C3 est récent, une bonne prise en mains pour la conduite et consomme peu. Je le recommande vivement.", source: 'Getaround', createdAt: '2020-12-23T00:00:00.000Z' },
  { authorName: 'Omar R.', title: 'Très bon contact', rating: 5, content: 'It went very well, the car is in good conditions and the owner is welcoming.', source: 'Getaround', createdAt: '2020-12-13T00:00:00.000Z' },
  { authorName: 'Daniel D.', title: 'Très sérieux', rating: 5, content: "Très sérieux, toute c'est bien passé.", source: 'Getaround', createdAt: '2020-11-17T00:00:00.000Z' },
  { authorName: 'Fabien M.', title: 'Très bien', rating: 5, content: 'Très bien.', source: 'Getaround', createdAt: '2020-10-15T00:00:00.000Z' },
  { authorName: 'Ursula A.', title: 'Disponible et sans souci', rating: 5, content: 'Ghislain est très disponible, aucun souci avec la voiture !', source: 'Getaround', createdAt: '2020-09-26T00:00:00.000Z' },
  { authorName: 'Elodie Z.', title: 'Véhicule économique', rating: 5, content: 'Super véhicule économique avec grand coffre pour les vacances. Propriétaire très gentil, agréable et disponible. Je recommande grandement.', source: 'Getaround', createdAt: '2020-08-02T00:00:00.000Z' },
  { authorName: 'Ahmed M.', title: 'Propriétaire arrangeant', rating: 5, content: 'Propriétaire sympathique, ponctuel, arrangeant se déplace pour nous ramener la voiture.', source: 'Getaround', createdAt: '2021-09-12T00:00:00.000Z' },
  { authorName: 'Sandy Y.', title: 'Très bien', rating: 5, content: 'Très bien. Propriétaire très disponible en cas de besoin. Voiture très opérationnelle.', source: 'Getaround', createdAt: '2021-09-02T00:00:00.000Z' },
  { authorName: 'Mohamed B.', title: 'Top', rating: 5, content: 'Ghislain est au top. Je recommande vivement!', source: 'Getaround', createdAt: '2021-08-22T00:00:00.000Z' },
  { authorName: 'Adel B.', title: 'Voiture en bon état', rating: 5, content: 'Voiture en bon état, propriétaire sympathique.', source: 'Getaround', createdAt: '2021-08-09T00:00:00.000Z' },
  { authorName: 'Robert C.', title: 'Sympa', rating: 5, content: 'Sympa.', source: 'Getaround', createdAt: '2021-08-03T00:00:00.000Z' },
  { authorName: 'Zrafi S.', title: 'Parfait !', rating: 5, content: 'Parfait !', source: 'Getaround', createdAt: '2021-04-06T00:00:00.000Z' },
  { authorName: 'Caroline H.', title: "Tout s'est bien passé", rating: 5, content: "Tout s'est bien passé.", source: 'Getaround', createdAt: '2021-02-20T00:00:00.000Z' },
  { authorName: 'Victorien G.', title: 'Véhicule confortable', rating: 5, content: "Véhicule très confortable pour de longs trajets. Ghislain est un propriétaire en or, très accommodant et disponible. Je recommande vivement !", source: 'Getaround', createdAt: '2021-08-18T00:00:00.000Z' },
  { authorName: 'Garance D.', title: 'Propriétaire arrangeant', rating: 5, content: 'Propriétaire très arrangeant.', source: 'Getaround', createdAt: '2021-07-18T00:00:00.000Z' },
  { authorName: 'Severine M.', title: 'Bonne voiture', rating: 5, content: 'Bonne voiture qui roule bien facile à conduire, propriétaire très gentil.', source: 'Getaround', createdAt: '2021-05-02T00:00:00.000Z' },
  { authorName: 'Oumou D.', title: 'Recommandé fortement', rating: 5, content: "Je recommande fortement Ghislain. En plus d'être avenant, il a su trouver une solution de dernière minute pour me permettre de faire la location dans les meilleures conditions.", source: 'Getaround', createdAt: '2021-02-28T00:00:00.000Z' },
  { authorName: 'Graziano T.', title: 'Bon contact', rating: 5, content: 'Bon contact. Très gentil.', source: 'Getaround', createdAt: '2021-12-24T00:00:00.000Z' },
  { authorName: 'Hamdi H.', title: 'Nice ride', rating: 5, content: "It's was a nice ride.", source: 'Getaround', createdAt: '2021-09-09T00:00:00.000Z' },
  { authorName: 'Guillaume C.', title: 'Bonne voiture', rating: 5, content: 'Bonne voiture.', source: 'Getaround', createdAt: '2021-09-02T00:00:00.000Z' },
  { authorName: 'Assmahane B.', title: 'Impeccable', rating: 5, content: "Impeccable. Citadine pratique et stylée, pour de la ville ou de la grande route ! Tout est fonctionnel dans la voiture qui est propre et comme neuve !", source: 'Getaround', createdAt: '2021-06-14T00:00:00.000Z' },
  { authorName: 'Sofia B.', title: 'Très gentil et arrangeant', rating: 5, content: "Très gentil et très arrangeant. Ghislain a accepté de nous ramener la voiture à l'adresse indiqué. Voiture économique et conforme pour des petits trajets.", source: 'Getaround', createdAt: '2021-06-17T00:00:00.000Z' },
  { authorName: 'Nicolas P.', title: 'Bon rapport qualité/prix', rating: 5, content: 'Bonne petite voiture confortable, bon rapport qualité/prix. Très bon contact avec le propriétaire.', source: 'Getaround', createdAt: '2021-05-22T00:00:00.000Z' },
  { authorName: 'Antony D.', title: 'Sans pb', rating: 5, content: 'sans pb.', source: 'Getaround', createdAt: '2021-05-16T00:00:00.000Z' },
  { authorName: 'Amelie G.', title: 'Très bien', rating: 5, content: "Très bien. Ghislain m'a transmis toutes les infos pour trouver la voiture et a été réactif en cas d'interrogation. Je recommande.", source: 'Getaround', createdAt: '2021-05-13T00:00:00.000Z' },
  { authorName: 'Fred P.', title: 'Arrangeant', rating: 4, content: "Gislain est très arrangeant et la localisation s'est bien passée.", source: 'Getaround', createdAt: '2021-06-22T00:00:00.000Z' },
  { authorName: 'Remi L.', title: "La location s'est bien passée", rating: 5, content: "La location s'est bien passée.", source: 'Getaround', createdAt: '2021-06-19T00:00:00.000Z' },
  { authorName: 'Caryle C.', title: 'Une préférence', rating: 5, content: "Une préférence pour la voiture que j'avais loué précédemment.", source: 'Getaround', createdAt: '2021-12-01T00:00:00.000Z' },
  { authorName: 'Saida D.', title: 'Bien', rating: 4, content: 'Bien.', source: 'Getaround', createdAt: '2021-11-17T00:00:00.000Z' },
  { authorName: 'Patrice O.', title: 'Très bien', rating: 5, content: 'Très bien.', source: 'Getaround', createdAt: '2021-11-11T00:00:00.000Z' },
  { authorName: 'Benoit L.', title: 'Proprio disponible', rating: 5, content: 'Nikel. Proprio disponible en 2min pour récupérer la voiture car pas de stationnement libre. Merci !', source: 'Getaround', createdAt: '2021-10-24T00:00:00.000Z' },
  { authorName: 'Alexandre C.', title: 'Parfait pour un week-end', rating: 5, content: "Merci encore pour votre voiture. c'était parfait pour un week-end.", source: 'Getaround', createdAt: '2021-10-03T00:00:00.000Z' },
  { authorName: 'Frederic C.', title: 'Très bien entretenu', rating: 5, content: "Véhicule très bien entretenu. Tout s'est très bien passé comme d'habitude.", source: 'Getaround', createdAt: '2022-04-10T00:00:00.000Z' },
  { authorName: 'Joy B.', title: 'Super sympa', rating: 5, content: 'Ghislain était super sympa, arrangeant et réactif. Je recommande.', source: 'Getaround', createdAt: '2022-04-18T00:00:00.000Z' },
  { authorName: 'Marin D.', title: 'Propriétaire agréable', rating: 5, content: 'Propriétaire très agréable, disponible et arrangeant.', source: 'Getaround', createdAt: '2022-03-27T00:00:00.000Z' },
  { authorName: 'Mathilde W.', title: 'Excellente expérience', rating: 5, content: 'Excellente expérience ! Merci pour votre disponibilité.', source: 'Getaround', createdAt: '2022-03-10T00:00:00.000Z' },
  { authorName: 'Abdelmoumen K.', title: 'Aimable et professionnel', rating: 5, content: 'Le proprio est très aimable, disponible et professionnel. Je vous le recommande.', source: 'Getaround', createdAt: '2022-02-06T00:00:00.000Z' },
  { authorName: 'Souâd B.', title: "Conforme à l'annonce", rating: 5, content: "La voiture est conforme à l'annonce, tiens très bien la route.", source: 'Getaround', createdAt: '2022-01-30T00:00:00.000Z' },
  { authorName: 'Perrin M.', title: 'Très bien', rating: 5, content: 'Très bien. Je recommande.', source: 'Getaround', createdAt: '2022-01-16T00:00:00.000Z' },
  { authorName: 'Vlad P.', title: 'Très bien', rating: 5, content: 'Très bien.', source: 'Getaround', createdAt: '2021-12-30T00:00:00.000Z' },
  { authorName: 'Gilles F.', title: 'Super pour les vacances', rating: 5, content: 'Voiture toujours très bien pour une semaine de vacances !', source: 'Getaround', createdAt: '2022-12-26T00:00:00.000Z' },
  { authorName: 'Nicolas M.', title: 'Sérieux et aimable', rating: 5, content: "Sérieux, très aimable, je recommande Ghislain. Si besoin, je ferais de nouveau volontiers appel à ses services.", source: 'Getaround', createdAt: '2022-11-06T00:00:00.000Z' },
  { authorName: 'Adriana C.', title: 'Très bien passée', rating: 5, content: 'Très bien passée.', source: 'Getaround', createdAt: '2023-01-19T00:00:00.000Z' },
  { authorName: 'Alix S.', title: 'Très bonne expérience', rating: 5, content: 'Très bonne expérience pour un premier essai.', source: 'Getaround', createdAt: '2023-02-08T00:00:00.000Z' },
  { authorName: 'François F.', title: "Véhicule conforme", rating: 5, content: "Véhicule conforme à l'annonce.", source: 'Getaround', createdAt: '2023-03-01T00:00:00.000Z' },
  { authorName: 'Axelle Melanie Odile G.', title: 'Voiture conforme', rating: 5, content: 'Voiture conforme aux photos, je recommande.', source: 'Getaround', createdAt: '2023-04-05T00:00:00.000Z' },
  { authorName: 'Utilisateur Anonyme', title: 'Parfait', rating: 5, content: 'Parfait.', source: 'Getaround', createdAt: '2023-04-17T00:00:00.000Z' },
  { authorName: 'Nicolas M.', title: '2ème location', rating: 5, content: "2ème location avec Ghislain et encore ravi de son accueil, réactivité et gentillesse. Je le recommande.", source: 'Getaround', createdAt: '2023-04-30T00:00:00.000Z' },
  { authorName: 'Gilles F.', title: 'Top pour un week-end', rating: 5, content: "Voiture toujours ok pour un week-end !", source: 'Getaround', createdAt: '2023-04-10T00:00:00.000Z' },
  { authorName: 'Thierry C.', title: 'Très bien', rating: 5, content: 'Très bien.', source: 'Getaround', createdAt: '2023-06-16T00:00:00.000Z' },
  { authorName: 'Issam Eddine L.', title: 'Voiture en bon état', rating: 5, content: 'Voiture en bon état et propre.', source: 'Getaround', createdAt: '2023-06-22T00:00:00.000Z' },
  { authorName: 'Philippe D.', title: 'Facilitateur', rating: 5, content: 'Voiture parfaite pour la ville. Guislain est facilement joignable et facilitateur.', source: 'Getaround', createdAt: '2023-06-25T00:00:00.000Z' },
  { authorName: 'Olivier A.', title: 'Clim non fonctionnelle', rating: 4, content: 'Clim non fonctionnelle sinon véhicule en bon état et bonne relation avec le propriétaire.', source: 'Getaround', createdAt: '2023-07-06T00:00:00.000Z' },
  { authorName: 'Hilary S.', title: 'Top', rating: 5, content: 'Top.', source: 'Getaround', createdAt: '2023-07-21T00:00:00.000Z' },
  { authorName: 'Amber J.', title: 'Very friendly', rating: 5, content: 'Very friendly nice and easy to organize getting the car. I would highly recommend!', source: 'Getaround', createdAt: '2023-07-31T00:00:00.000Z' },
  { authorName: 'Laurent D.', title: 'Top', rating: 5, content: 'Top.', source: 'Getaround', createdAt: '2023-08-01T00:00:00.000Z' },
  { authorName: 'Niclaitte', title: 'Très sérieux', rating: 4, content: 'Le voyage s\'est très bien passé. Ghislain est très sérieux et sympathique.', source: 'Getaround', createdAt: '2024-11-03T00:00:00.000Z' },
  { authorName: 'Julien', title: 'Simple et efficace', rating: 5, content: 'Ghislain est très sympa et sa voiture fonctionne bien. Simple et efficace.', source: 'Getaround', createdAt: '2024-10-23T00:00:00.000Z' },
  { authorName: 'Eric', title: 'Génial', rating: 5, content: 'Génial !', source: 'Getaround', createdAt: '2024-10-20T00:00:00.000Z' },
  { authorName: 'Rania', title: 'Très propre', rating: 5, content: 'The car is not young but drives safely and well. Very clean and host excellent and charming. Thank you!', source: 'Getaround', createdAt: '2024-11-28T00:00:00.000Z' },
  { authorName: 'Franck', title: 'Bienveillant', rating: 4, content: 'Bien gentil et bienveillant.', source: 'Getaround', createdAt: '2024-12-01T00:00:00.000Z' },
  { authorName: 'Elodie', title: 'Parfait', rating: 5, content: 'Parfait, rien à dire ! Je recommande.', source: 'Getaround', createdAt: '2024-12-01T00:00:00.000Z' },
  { authorName: 'Thierry', title: 'Conforme', rating: 5, content: 'Véhicule parfaitement conforme.', source: 'Getaround', createdAt: '2024-12-29T00:00:00.000Z' },
  { authorName: 'Valérie', title: 'Très réactif', rating: 5, content: 'Tout s\'est bien passé. Ghislain a été très réactif pour la prise et le retour du véhicule 😁👍', source: 'Getaround', createdAt: '2024-12-28T00:00:00.000Z' },
  { authorName: 'Lucrèce', title: 'Excellente expérience', rating: 5, content: "Excellente expérience, voiture conforme et agréable à conduire. L'hôte est disponible.", source: 'Getaround', createdAt: '2024-12-28T00:00:00.000Z' },
  { authorName: 'Zurad', title: 'Amical', rating: 5, content: 'Véhicule très agréable à conduire, propriétaire très amical et aimable ✨', source: 'Getaround', createdAt: '2024-12-25T00:00:00.000Z' },
  { authorName: 'Walid', title: 'Top', rating: 5, content: 'Top.', source: 'Getaround', createdAt: '2024-12-24T00:00:00.000Z' },
  { authorName: 'Luc', title: 'Pratique', rating: 5, content: 'Très pratique de louer avec Ghislain !', source: 'Getaround', createdAt: '2024-12-27T00:00:00.000Z' },
  { authorName: 'Antoine', title: 'Impeccable', rating: 5, content: 'Voiture impeccable, roule très bien !', source: 'Getaround', createdAt: '2025-01-01T00:00:00.000Z' },
  { authorName: 'Damien', title: 'Très bien passé', rating: 5, content: "Tout s'est bien passé. Voiture agréable à conduire.", source: 'Getaround', createdAt: '2025-01-19T00:00:00.000Z' },
  { authorName: 'Vipul', title: 'Good car', rating: 4, content: 'Good car, helpful and responsive host. All good.', source: 'Getaround', createdAt: '2025-01-12T00:00:00.000Z' },
  { authorName: 'Laetitia', title: 'Hôte adorable', rating: 5, content: "L'hôte a été adorable tout le long du process. Voiture robuste, tout s'est bien passé. Merci encore !", source: 'Getaround', createdAt: '2025-01-03T00:00:00.000Z' },
  { authorName: 'Julian', title: 'Super hôte', rating: 5, content: 'Super hôte, super voiture, rien à dire.', source: 'Getaround', createdAt: '2025-01-02T00:00:00.000Z' },
  { authorName: 'Ian de Renzie', title: 'Everything perfect', rating: 5, content: 'Everything was perfect.', source: 'Getaround', createdAt: '2025-04-25T00:00:00.000Z' },
  { authorName: 'Karine', title: 'Très bien', rating: 4, content: 'Très bien, voiture pratique pour les petits trajets du quotidien.', source: 'Getaround', createdAt: '2025-04-23T00:00:00.000Z' },
  { authorName: 'Kamal', title: 'Parfait', rating: 5, content: 'Parfait, très bien passé.', source: 'Getaround', createdAt: '2025-04-18T00:00:00.000Z' },
  { authorName: 'Andressa', title: 'Good value', rating: 5, content: 'The car was good for the price. The first car had a light issue and the host offered to change the car. Very attentive host and fast communication.', source: 'Getaround', createdAt: '2025-05-10T00:00:00.000Z' },
  { authorName: 'Mohamed', title: 'Processus simple', rating: 5, content: "La location de la voiture s'est déroulée à la perfection. Ghislain est une personne sympathique, professionnelle et flexible, ce qui a rendu le processus très simple !", source: 'Getaround', createdAt: '2025-05-11T00:00:00.000Z' },
  { authorName: 'Pape', title: 'Très sympa', rating: 5, content: "La location s'est très bien passée avec Ghislain. Il est très sympa. Je recommande fortement !", source: 'Getaround', createdAt: '2025-05-18T00:00:00.000Z' },
  { authorName: 'Stéphanie', title: '1ère expérience', rating: 5, content: "1ère expérience et je ne suis pas déçue. Ghislain est une personne sympathique et arrangeante. Merci beaucoup.", source: 'Getaround', createdAt: '2025-05-15T00:00:00.000Z' },
  { authorName: 'Fab', title: 'Bon', rating: 4, content: "Tout s'est bien passé, le véhicule avait quelques traces d'usage mais rien de dramatique en soi.", source: 'Getaround', createdAt: '2025-05-28T00:00:00.000Z' },
  { authorName: 'Alizé', title: 'Très sympathique', rating: 5, content: 'Personne très sympathique, très bon véhicule.', source: 'Getaround', createdAt: '2025-05-31T00:00:00.000Z' },
  { authorName: 'Angèle', title: 'Très bien', rating: 5, content: 'Très bien !', source: 'Getaround', createdAt: '2025-06-01T00:00:00.000Z' },
  { authorName: 'Lynda', title: 'Très satisfaite', rating: 5, content: "Je suis très satisfaite de ma location avec Ghislain ! Tout s'est déroulé parfaitement, du processus de réservation à la remise du véhicule. Voiture propre, bien entretenue et hôte très professionnel. Je recommande vivement !", source: 'Getaround', createdAt: '2025-06-02T00:00:00.000Z' },
  { authorName: 'Lounas', title: 'Carré', rating: 5, content: 'Carré.', source: 'Getaround', createdAt: '2025-12-30T00:00:00.000Z' },
  // ── Turo ───────────────────────────────────────────────────────────────────
  { authorName: 'Justine', title: 'Très flexible', rating: 5, content: 'Ghislain a été très flexible et très sympathique. La voiture était propre.', source: 'Turo', createdAt: '2025-09-20T00:00:00.000Z' },
  { authorName: 'Florent', title: 'Compréhensif', rating: 4, content: 'Problèmes techniques liés à la batterie du véhicule. Ghislain a été très compréhensif et fait au mieux pour régler le problème.', source: 'Turo', createdAt: '2025-09-28T00:00:00.000Z' },
  { authorName: 'Francisco', title: 'Flexible and friendly', rating: 5, content: 'Thanks to Ghislain for being so flexible and friendly.', source: 'Turo', createdAt: '2025-10-08T00:00:00.000Z' },
  { authorName: 'Michel-Ange', title: "Hôte à l'écoute", rating: 5, content: "La voiture est pratique avec un grand coffre, la prise en charge parfaite avec un hôte à l'écoute. Je le recommande.", source: 'Turo', createdAt: '2025-10-23T00:00:00.000Z' },
  { authorName: 'Thierry', title: 'Sympathique et arrangeant', rating: 5, content: 'Véhicule sans problème très économique et Ghislain toujours sympathique et arrangeant 👍', source: 'Turo', createdAt: '2025-12-07T00:00:00.000Z' },
];

@Injectable()
export class ReviewsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReviewsSeederService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const count = await this.reviewRepository.count();
      if (count > 0) {
        this.logger.log(`Seeder: ${count} avis déjà en base, skip.`);
        return;
      }

      const placeholders: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const row of SEED_DATA) {
        const base = paramIdx;
        placeholders.push(
          `(gen_random_uuid(), $${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, 'PUBLISHED', $${base + 5}::timestamptz, $${base + 5}::timestamptz)`,
        );
        params.push(
          row.authorName,
          row.title,
          row.rating,
          row.content,
          row.source,
          row.createdAt,
        );
        paramIdx += 6;
      }

      await this.reviewRepository.manager.query(
        `INSERT INTO reviews (id, author_name, title, rating, content, source, status, created_at, updated_at) VALUES ${placeholders.join(', ')}`,
        params,
      );

      this.logger.log(`Seeder: ${SEED_DATA.length} avis insérés.`);
    } catch (error) {
      this.logger.error('Seeder: échec de la seed des avis', error);
    }
  }
}
