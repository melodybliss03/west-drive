import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import {
  reviewsService,
  ReviewDto,
  ReviewsListResponse,
} from "@/lib/api/services";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import DevisDialog from "@/components/DevisDialog";
import { motion } from "framer-motion";

// Extension locale pour gérer la source (Getaround ou Turo)
type StaticReview = ReviewDto & { source: "getaround" | "turo" };

// ─── Vrais avis clients ───────────────────────────────────────────────────────
const STATIC_REVIEWS: StaticReview[] = [
  // ── Getaround ────────────────────────────────────────────────────────────
  {
    id: "g-1",
    authorName: "Naomie G.",
    title: "Ghislain est une personne agréable",
    rating: 5,
    content:
      "Ghislain est une personne agréable, sympathique et arrangeant. Son véhicule Citroën C3 est récent, une bonne prise en mains pour la conduite et consomme peu. Je le recommande vivement.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-12-23T00:00:00.000Z",
    updatedAt: "2020-12-23T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-2",
    authorName: "Omar R.",
    title: "Très bon contact",
    rating: 5,
    content:
      "It went very well, the car is in good conditions and the owner is welcoming.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-12-13T00:00:00.000Z",
    updatedAt: "2020-12-13T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-3",
    authorName: "Daniel D.",
    title: "Très sérieux",
    rating: 5,
    content: "Très sérieux, toute c'est bien passé.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-11-17T00:00:00.000Z",
    updatedAt: "2020-11-17T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-4",
    authorName: "Fabien M.",
    title: "Très bien",
    rating: 5,
    content: "Très bien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-10-15T00:00:00.000Z",
    updatedAt: "2020-10-15T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-5",
    authorName: "Ursula A.",
    title: "Disponible et sans souci",
    rating: 5,
    content: "Ghislain est très disponible, aucun souci avec la voiture !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-09-26T00:00:00.000Z",
    updatedAt: "2020-09-26T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-6",
    authorName: "Elodie Z.",
    title: "Véhicule économique",
    rating: 5,
    content:
      "Super véhicule économique avec grand coffre pour les vacances. Propriétaire très gentil, agréable et disponible. Je recommande grandement.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2020-08-02T00:00:00.000Z",
    updatedAt: "2020-08-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-7",
    authorName: "Ahmed M.",
    title: "Propriétaire arrangeant",
    rating: 5,
    content:
      "Propriétaire sympathique, ponctuel, arrangeant se déplace pour nous ramener la voiture.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-09-12T00:00:00.000Z",
    updatedAt: "2021-09-12T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-8",
    authorName: "Sandy Y.",
    title: "Très bien",
    rating: 5,
    content:
      "Très bien. Propriétaire très disponible en cas de besoin. Voiture très opérationnelle.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-09-02T00:00:00.000Z",
    updatedAt: "2021-09-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-9",
    authorName: "Mohamed B.",
    title: "Top",
    rating: 5,
    content: "Ghislain est au top. Je recommande vivement!",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-08-22T00:00:00.000Z",
    updatedAt: "2021-08-22T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-10",
    authorName: "Adel B.",
    title: "Voiture en bon état",
    rating: 5,
    content: "Voiture en bon état, propriétaire sympathique.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-08-09T00:00:00.000Z",
    updatedAt: "2021-08-09T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-11",
    authorName: "Robert C.",
    title: "Sympa",
    rating: 5,
    content: "Sympa.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-08-03T00:00:00.000Z",
    updatedAt: "2021-08-03T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-12",
    authorName: "Zrafi S.",
    title: "Parfait !",
    rating: 5,
    content: "Parfait !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-04-06T00:00:00.000Z",
    updatedAt: "2021-04-06T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-13",
    authorName: "Caroline H.",
    title: "Tout s'est bien passé",
    rating: 5,
    content: "Tout s'est bien passé.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-02-20T00:00:00.000Z",
    updatedAt: "2021-02-20T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-14",
    authorName: "Victorien G.",
    title: "Véhicule confortable",
    rating: 5,
    content:
      "Véhicule très confortable pour de longs trajets. Ghislain est un propriétaire en or, très accommodant et disponible. Je recommande vivement !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-08-18T00:00:00.000Z",
    updatedAt: "2021-08-18T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-15",
    authorName: "Garance D.",
    title: "Propriétaire arrangeant",
    rating: 5,
    content: "Propriétaire très arrangeant.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-07-18T00:00:00.000Z",
    updatedAt: "2021-07-18T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-16",
    authorName: "Severine M.",
    title: "Bonne voiture",
    rating: 5,
    content:
      "Bonne voiture qui roule bien facile à conduire, propriétaire très gentil.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-05-02T00:00:00.000Z",
    updatedAt: "2021-05-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-17",
    authorName: "Oumou D.",
    title: "Recommandé fortement",
    rating: 5,
    content:
      "Je recommande fortement Ghislain. En plus d'être avenant, il a su trouver une solution de dernière minute pour me permettre de faire la location dans les meilleures conditions.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-02-28T00:00:00.000Z",
    updatedAt: "2021-02-28T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-18",
    authorName: "Graziano T.",
    title: "Bon contact",
    rating: 5,
    content: "Bon contact. Très gentil.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-12-24T00:00:00.000Z",
    updatedAt: "2021-12-24T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-19",
    authorName: "Hamdi H.",
    title: "Nice ride",
    rating: 5,
    content: "It's was a nice ride.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-09-09T00:00:00.000Z",
    updatedAt: "2021-09-09T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-20",
    authorName: "Guillaume C.",
    title: "Bonne voiture",
    rating: 5,
    content: "Bonne voiture.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-09-02T00:00:00.000Z",
    updatedAt: "2021-09-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-21",
    authorName: "Assmahane B.",
    title: "Impeccable",
    rating: 5,
    content:
      "Impeccable. Citadine pratique et stylée, pour de la ville ou de la grande route ! Tout est fonctionnel dans la voiture qui est propre et comme neuve !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-06-14T00:00:00.000Z",
    updatedAt: "2021-06-14T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-22",
    authorName: "Sofia B.",
    title: "Très gentil et arrangeant",
    rating: 5,
    content:
      "Très gentil et très arrangeant. Ghislain a accepté de nous ramener la voiture à l'adresse indiqué. Voiture économique et conforme pour des petits trajets.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-06-17T00:00:00.000Z",
    updatedAt: "2021-06-17T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-23",
    authorName: "Nicolas P.",
    title: "Bon rapport qualité/prix",
    rating: 5,
    content:
      "Bonne petite voiture confortable, bon rapport qualité/prix. Très bon contact avec le propriétaire.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-05-22T00:00:00.000Z",
    updatedAt: "2021-05-22T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-24",
    authorName: "Antony D.",
    title: "Sans pb",
    rating: 5,
    content: "sans pb.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-05-16T00:00:00.000Z",
    updatedAt: "2021-05-16T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-25",
    authorName: "Amelie G.",
    title: "Très bien",
    rating: 5,
    content:
      "Très bien. Ghislain m'a transmis toutes les infos pour trouver la voiture et a été réactif en cas d'interrogation. Je recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-05-13T00:00:00.000Z",
    updatedAt: "2021-05-13T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-26",
    authorName: "Fred P.",
    title: "Arrangeant",
    rating: 4,
    content:
      "Gislain est très arrangeant et la localisation s'est bien passée.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-06-22T00:00:00.000Z",
    updatedAt: "2021-06-22T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-27",
    authorName: "Remi L.",
    title: "La location s'est bien passée",
    rating: 5,
    content: "La location s'est bien passée.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-06-19T00:00:00.000Z",
    updatedAt: "2021-06-19T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-28",
    authorName: "Caryle C.",
    title: "Une préférence",
    rating: 5,
    content: "Une préférence pour la voiture que j'avais loué précédemment.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-12-01T00:00:00.000Z",
    updatedAt: "2021-12-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-29",
    authorName: "Saida D.",
    title: "Bien",
    rating: 4,
    content: "Bien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-11-17T00:00:00.000Z",
    updatedAt: "2021-11-17T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-30",
    authorName: "Patrice O.",
    title: "Très bien",
    rating: 5,
    content: "Très bien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-11-11T00:00:00.000Z",
    updatedAt: "2021-11-11T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-31",
    authorName: "Benoit L.",
    title: "Proprio disponible",
    rating: 5,
    content:
      "Nikel. Proprio disponible en 2min pour récupérer la voiture car pas de stationnement libre. Merci !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-10-24T00:00:00.000Z",
    updatedAt: "2021-10-24T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-32",
    authorName: "Alexandre C.",
    title: "Parfait pour un week-end",
    rating: 5,
    content:
      "Merci encore pour votre voiture. c'était parfait pour un week-end.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-10-03T00:00:00.000Z",
    updatedAt: "2021-10-03T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-33",
    authorName: "Frederic C.",
    title: "Très bien entretenu",
    rating: 5,
    content:
      "Véhicule très bien entretenu. Tout s'est très bien passé comme d'habitude.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-04-10T00:00:00.000Z",
    updatedAt: "2022-04-10T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-34",
    authorName: "Joy B.",
    title: "Super sympa",
    rating: 5,
    content:
      "Ghislain était super sympa, arrangeant et réactif. Je recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-04-18T00:00:00.000Z",
    updatedAt: "2022-04-18T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-35",
    authorName: "Marin D.",
    title: "Propriétaire agréable",
    rating: 5,
    content: "Propriétaire très agréable, disponible et arrangeant.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-03-27T00:00:00.000Z",
    updatedAt: "2022-03-27T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-36",
    authorName: "Mathilde W.",
    title: "Excellente expérience",
    rating: 5,
    content: "Excellente expérience ! Merci pour votre disponibilité.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-03-10T00:00:00.000Z",
    updatedAt: "2022-03-10T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-37",
    authorName: "Abdelmoumen K.",
    title: "Aimable et professionnel",
    rating: 5,
    content:
      "Le proprio est très aimable, disponible et professionnel. Je vous le recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-02-06T00:00:00.000Z",
    updatedAt: "2022-02-06T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-38",
    authorName: "Souâd B.",
    title: "Conforme à l'annonce",
    rating: 5,
    content: "La voiture est conforme à l'annonce, tiens très bien la route.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-01-30T00:00:00.000Z",
    updatedAt: "2022-01-30T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-39",
    authorName: "Perrin M.",
    title: "Très bien",
    rating: 5,
    content: "Très bien. Je recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-01-16T00:00:00.000Z",
    updatedAt: "2022-01-16T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-40",
    authorName: "Vlad P.",
    title: "Très bien",
    rating: 5,
    content: "Très bien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2021-12-30T00:00:00.000Z",
    updatedAt: "2021-12-30T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-41",
    authorName: "Gilles F.",
    title: "Super pour les vacances",
    rating: 5,
    content: "Voiture toujours très bien pour une semaine de vacances !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-12-26T00:00:00.000Z",
    updatedAt: "2022-12-26T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-42",
    authorName: "Nicolas M.",
    title: "Sérieux et aimable",
    rating: 5,
    content:
      "Sérieux, très aimable, je recommande Ghislain. Si besoin, je ferais de nouveau volontiers appel à ses services.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2022-11-06T00:00:00.000Z",
    updatedAt: "2022-11-06T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-43",
    authorName: "Adriana C.",
    title: "Très bien passée",
    rating: 5,
    content: "Très bien passée.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-01-19T00:00:00.000Z",
    updatedAt: "2023-01-19T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-44",
    authorName: "Alix S.",
    title: "Très bonne expérience",
    rating: 5,
    content: "Très bonne expérience pour un premier essai.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-02-08T00:00:00.000Z",
    updatedAt: "2023-02-08T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-45",
    authorName: "François F.",
    title: "Véhicule conforme",
    rating: 5,
    content: "Véhicule conforme à l'annonce.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-03-01T00:00:00.000Z",
    updatedAt: "2023-03-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-46",
    authorName: "Axelle Melanie Odile G.",
    title: "Voiture conforme",
    rating: 5,
    content: "Voiture conforme aux photos, je recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-04-05T00:00:00.000Z",
    updatedAt: "2023-04-05T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-47",
    authorName: "Utilisateur Anonyme",
    title: "Parfait",
    rating: 5,
    content: "Parfait.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-04-17T00:00:00.000Z",
    updatedAt: "2023-04-17T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-48",
    authorName: "Nicolas M.",
    title: "2ème location",
    rating: 5,
    content:
      "2ème location avec Ghislain et encore ravi de son accueil, réactivité et gentillesse. Je le recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-04-30T00:00:00.000Z",
    updatedAt: "2023-04-30T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-49",
    authorName: "Gilles F.",
    title: "Top pour un week-end",
    rating: 5,
    content: "Voiture toujours ok pour un week-end !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-04-10T00:00:00.000Z",
    updatedAt: "2023-04-10T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-50",
    authorName: "Thierry C.",
    title: "Très bien",
    rating: 5,
    content: "Très bien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-06-16T00:00:00.000Z",
    updatedAt: "2023-06-16T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-51",
    authorName: "Issam Eddine L.",
    title: "Voiture en bon état",
    rating: 5,
    content: "Voiture en bon état et propre.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-06-22T00:00:00.000Z",
    updatedAt: "2023-06-22T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-52",
    authorName: "Philippe D.",
    title: "Facilitateur",
    rating: 5,
    content:
      "Voiture parfaite pour la ville. Guislain est facilement joignable et facilitateur.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-06-25T00:00:00.000Z",
    updatedAt: "2023-06-25T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-53",
    authorName: "Olivier A.",
    title: "Clim non fonctionnelle",
    rating: 4,
    content:
      "Clim non fonctionnelle sinon véhicule en bon état et bonne relation avec le propriétaire.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-07-06T00:00:00.000Z",
    updatedAt: "2023-07-06T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-54",
    authorName: "Hilary S.",
    title: "Top",
    rating: 5,
    content: "Top.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-07-21T00:00:00.000Z",
    updatedAt: "2023-07-21T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-55",
    authorName: "Amber J.",
    title: "Very friendly",
    rating: 5,
    content:
      "Very friendly nice and easy to organize getting the car. I would highly recommend!",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-07-31T00:00:00.000Z",
    updatedAt: "2023-07-31T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-56",
    authorName: "Laurent D.",
    title: "Top",
    rating: 5,
    content: "Top.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2023-08-01T00:00:00.000Z",
    updatedAt: "2023-08-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-57",
    authorName: "Niclaitte",
    title: "Très sérieux",
    rating: 4,
    content:
      "Le voyage s'est très bien passé. Ghislain est très sérieux et sympathique.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-11-03T00:00:00.000Z",
    updatedAt: "2024-11-03T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-58",
    authorName: "Julien",
    title: "Simple et efficace",
    rating: 5,
    content:
      "Ghislain est très sympa et sa voiture fonctionne bien. Simple et efficace.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-10-23T00:00:00.000Z",
    updatedAt: "2024-10-23T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-59",
    authorName: "Eric",
    title: "Génial",
    rating: 5,
    content: "Génial !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-10-20T00:00:00.000Z",
    updatedAt: "2024-10-20T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-60",
    authorName: "Rania",
    title: "Très propre",
    rating: 5,
    content:
      "The car is not young but drives safely and well. Very clean and host excellent and charming. Thank you!",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-11-28T00:00:00.000Z",
    updatedAt: "2024-11-28T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-61",
    authorName: "Franck",
    title: "Bienveillant",
    rating: 4,
    content: "Bien gentil et bienveillant.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-62",
    authorName: "Elodie",
    title: "Parfait",
    rating: 5,
    content: "Parfait, rien à dire ! Je recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-63",
    authorName: "Thierry",
    title: "Conforme",
    rating: 5,
    content: "Véhicule parfaitement conforme.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-29T00:00:00.000Z",
    updatedAt: "2024-12-29T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-64",
    authorName: "Valérie",
    title: "Très réactif",
    rating: 5,
    content:
      "Tout s'est bien passé. Ghislain a été très réactif pour la prise et le retour du véhicule 😁👍",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-28T00:00:00.000Z",
    updatedAt: "2024-12-28T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-65",
    authorName: "Lucrèce",
    title: "Excellente expérience",
    rating: 5,
    content:
      "Excellente expérience, voiture conforme et agréable à conduire. L'hôte est disponible.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-28T00:00:00.000Z",
    updatedAt: "2024-12-28T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-66",
    authorName: "Zurad",
    title: "Amical",
    rating: 5,
    content:
      "Véhicule très agréable à conduire, propriétaire très amical et aimable ✨",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-25T00:00:00.000Z",
    updatedAt: "2024-12-25T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-67",
    authorName: "Walid",
    title: "Top",
    rating: 5,
    content: "Top.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-24T00:00:00.000Z",
    updatedAt: "2024-12-24T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-68",
    authorName: "Luc",
    title: "Pratique",
    rating: 5,
    content: "Très pratique de louer avec Ghislain !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2024-12-27T00:00:00.000Z",
    updatedAt: "2024-12-27T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-69",
    authorName: "Antoine",
    title: "Impeccable",
    rating: 5,
    content: "Voiture impeccable, roule très bien !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-70",
    authorName: "Damien",
    title: "Très bien passé",
    rating: 5,
    content: "Tout s'est bien passé. Voiture agréable à conduire.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-01-19T00:00:00.000Z",
    updatedAt: "2025-01-19T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-71",
    authorName: "Vipul",
    title: "Good car",
    rating: 4,
    content: "Good car, helpful and responsive host. All good.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-01-12T00:00:00.000Z",
    updatedAt: "2025-01-12T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-72",
    authorName: "Laetitia",
    title: "Hôte adorable",
    rating: 5,
    content:
      "L'hôte a été adorable tout le long du process. Voiture robuste, tout s'est bien passé. Merci encore !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-73",
    authorName: "Julian",
    title: "Super hôte",
    rating: 5,
    content: "Super hôte, super voiture, rien à dire.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-74",
    authorName: "Ian de Renzie",
    title: "Everything perfect",
    rating: 5,
    content: "Everything was perfect.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-04-25T00:00:00.000Z",
    updatedAt: "2025-04-25T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-75",
    authorName: "Karine",
    title: "Très bien",
    rating: 4,
    content:
      "Très bien, voiture pratique pour les petits trajets du quotidien.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-04-23T00:00:00.000Z",
    updatedAt: "2025-04-23T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-76",
    authorName: "Kamal",
    title: "Parfait",
    rating: 5,
    content: "Parfait, très bien passé.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-04-18T00:00:00.000Z",
    updatedAt: "2025-04-18T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-77",
    authorName: "Andressa",
    title: "Good value",
    rating: 5,
    content:
      "The car was good for the price. The first car had a light issue and the host offered to change the car. Very attentive host and fast communication.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-10T00:00:00.000Z",
    updatedAt: "2025-05-10T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-78",
    authorName: "Mohamed",
    title: "Processus simple",
    rating: 5,
    content:
      "La location de la voiture s'est déroulée à la perfection. Ghislain est une personne sympathique, professionnelle et flexible, ce qui a rendu le processus très simple !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-11T00:00:00.000Z",
    updatedAt: "2025-05-11T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-79",
    authorName: "Pape",
    title: "Très sympa",
    rating: 5,
    content:
      "La location s'est très bien passée avec Ghislain. Il est très sympa. Je recommande fortement !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-18T00:00:00.000Z",
    updatedAt: "2025-05-18T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-80",
    authorName: "Stéphanie",
    title: "1ère expérience",
    rating: 5,
    content:
      "1ère expérience et je ne suis pas déçue. Ghislain est une personne sympathique et arrangeante. Merci beaucoup.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-15T00:00:00.000Z",
    updatedAt: "2025-05-15T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-81",
    authorName: "Fab",
    title: "Bon",
    rating: 4,
    content:
      "Tout s'est bien passé, le véhicule avait quelques traces d'usage mais rien de dramatique en soi.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-28T00:00:00.000Z",
    updatedAt: "2025-05-28T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-82",
    authorName: "Alizé",
    title: "Très sympathique",
    rating: 5,
    content: "Personne très sympathique, très bon véhicule.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-05-31T00:00:00.000Z",
    updatedAt: "2025-05-31T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-83",
    authorName: "Angèle",
    title: "Très bien",
    rating: 5,
    content: "Très bien !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-84",
    authorName: "Lynda",
    title: "Très satisfaite",
    rating: 5,
    content:
      "Je suis très satisfaite de ma location avec Ghislain ! Tout s'est déroulé parfaitement, du processus de réservation à la remise du véhicule. Voiture propre, bien entretenue et hôte très professionnel. Je recommande vivement !",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-06-02T00:00:00.000Z",
    updatedAt: "2025-06-02T00:00:00.000Z",
    source: "getaround",
  },
  {
    id: "g-85",
    authorName: "Lounas",
    title: "Carré",
    rating: 5,
    content: "Carré.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-12-30T00:00:00.000Z",
    updatedAt: "2025-12-30T00:00:00.000Z",
    source: "getaround",
  },

  // ── Turo ─────────────────────────────────────────────────────────────────
  {
    id: "t-1",
    authorName: "Justine",
    title: "Très flexible",
    rating: 5,
    content:
      "Ghislain a été très flexible et très sympathique. La voiture était propre.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-09-20T00:00:00.000Z",
    updatedAt: "2025-09-20T00:00:00.000Z",
    source: "turo",
  },
  {
    id: "t-2",
    authorName: "Florent",
    title: "Compréhensif",
    rating: 4,
    content:
      "Problèmes techniques liés à la batterie du véhicule. Ghislain a été très compréhensif et fait au mieux pour régler le problème.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-09-28T00:00:00.000Z",
    updatedAt: "2025-09-28T00:00:00.000Z",
    source: "turo",
  },
  {
    id: "t-3",
    authorName: "Francisco",
    title: "Flexible and friendly",
    rating: 5,
    content: "Thanks to Ghislain for being so flexible and friendly.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-10-08T00:00:00.000Z",
    updatedAt: "2025-10-08T00:00:00.000Z",
    source: "turo",
  },
  {
    id: "t-4",
    authorName: "Michel-Ange",
    title: "Hôte à l'écoute",
    rating: 5,
    content:
      "La voiture est pratique avec un grand coffre, la prise en charge parfaite avec un hôte à l'écoute. Je le recommande.",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-10-23T00:00:00.000Z",
    updatedAt: "2025-10-23T00:00:00.000Z",
    source: "turo",
  },
  {
    id: "t-5",
    authorName: "Thierry",
    title: "Sympathique et arrangeant",
    rating: 5,
    content:
      "Véhicule sans problème très économique et Ghislain toujours sympathique et arrangeant 👍",
    imageUrl: null,
    status: "PUBLISHED",
    createdAt: "2025-12-07T00:00:00.000Z",
    updatedAt: "2025-12-07T00:00:00.000Z",
    source: "turo",
  },
];

const LIMIT = 15;

function paginateStatic(items: StaticReview[], page: number, limit: number) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

export default function Reviews() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<
    ReviewsListResponse,
    Error,
    ReviewsListResponse
  >({
    queryKey: ["reviews", page],
    queryFn: () => reviewsService.list({ page, limit: LIMIT }),
    refetchOnWindowFocus: false,
  });

  const hasApiData = data?.items && data.items.length > 0;
  const source = hasApiData
    ? data
    : paginateStatic(STATIC_REVIEWS, page, LIMIT);
  const reviews = source.items as StaticReview[];
  const meta = source.meta;

  const average = (
    STATIC_REVIEWS.reduce((acc, r) => acc + r.rating, 0) / STATIC_REVIEWS.length
  ).toFixed(1);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="pt-10">
        <Header />
      </div>

      {/* Hero */}

      <section className="pt-40 pb-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Avis de nos <span className="text-primary">Clients</span>
            </h1>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-8">
              Plus de confiance pour vos réservations grâce à nos retours
              clients 100% vérifiés.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/vehicules">
                <Button size="lg" className="gap-2 text-base px-8">
                  Voir nos véhicules <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avis */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {isLoading && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Chargement des avis...
          </p>
        )}
        {isError && reviews.length === 0 && (
          <p className="text-sm text-destructive mb-6">
            Impossible de récupérer les avis pour le moment.
          </p>
        )}

        {/* Pagination haut */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} / {meta.totalPages} · {meta.totalItems} avis
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPreviousPage || isLoading}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              onClick={() => setPage((p) => (meta.hasNextPage ? p + 1 : p))}
              disabled={!meta.hasNextPage || isLoading}
            >
              Suivant
            </Button>
          </div>
        </div>

        {/* Grille masonry — style conservé */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 transition-all duration-300 ease-out">
          {reviews.map((review) => {
            const isTuro = (review as StaticReview).source === "turo";
            return (
              <article
                key={review.id}
                className="break-inside-avoid border border-border rounded-2xl p-4 bg-card shadow-sm hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  {/* Badge source */}
                  {isTuro ? (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-gray-800" /> Turo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-600">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />{" "}
                      Getaround
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "dd MMM yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {review.title && (
                  <h3 className="mb-2">{review.title}</h3>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.content}</p>
                <p className="text-sm font-medium">— {review.authorName}</p>
              </article>
            );
          })}
        </div>

        {/* Pagination bas */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPreviousPage || isLoading}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              size="sm"
              onClick={() => setPage((p) => (meta.hasNextPage ? p + 1 : p))}
              disabled={!meta.hasNextPage || isLoading}
            >
              Suivant
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
