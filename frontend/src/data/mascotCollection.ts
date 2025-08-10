import { MascotItem } from '../types/wahoo.types';
// ==========================================
// 🎭 INVENTAIRE COMPLET DE LA GARDE-ROBE
// ==========================================
export const MASCOT_COLLECTION: MascotItem[] = [
  // ===================================
  // 🟢 COMMON (18 items)
  // ===================================
  {
    id: "cap_blue",
    name: "Casquette Bleue",
    type: "hat",
    emoji: "🧢",
    rarity: "common",
    unlockCondition: "Terminer 5 exercices",
    description: "Un classique pour commencer l'aventure.",
    unlocked: false,
    equipped: false
  },
  {
    id: "sunglasses_classic",
    name: "Lunettes de Soleil",
    type: "glasses",
    emoji: "🕶️",
    rarity: "common",
    unlockCondition: "Réussir 3 exercices d'affilée",
    description: "Pour avoir l'air cool en calculant.",
    unlocked: false,
    equipped: false
  },
  {
    id: "scarf_red",
    name: "Écharpe Rouge",
    type: "accessory",
    emoji: "🧣",
    rarity: "common",
    unlockCondition: "Jouer pendant l'hiver",
    description: "Pour ne pas attraper froid entre deux leçons.",
    unlocked: false,
    equipped: false
  },
  {
    id: "tshirt_star",
    name: "T-shirt Étoilé",
    type: "outfit",
    emoji: "🌟",
    rarity: "common",
    unlockCondition: "Gagner 500 points au total",
    description: "Montre que tu es une étoile montante.",
    unlocked: false,
    equipped: false
  },
  {
    id: "beanie_wool",
    name: "Bonnet de Laine",
    type: "hat",
    emoji: "🧶",
    rarity: "common",
    unlockCondition: "Jouer 3 jours différents",
    description: "Confortable et parfait pour réfléchir.",
    unlocked: false,
    equipped: false
  },
  {
    id: "reading_glasses",
    name: "Lunettes de Lecture",
    type: "glasses",
    emoji: "👓",
    rarity: "common",
    unlockCondition: "Terminer une Masterclass de lecture",
    description: "Pour voir les mots encore plus clairement.",
    unlocked: false,
    equipped: false
  },
  {
    id: "backpack_school",
    name: "Sac à Dos d'Écolier",
    type: "accessory",
    emoji: "🎒",
    rarity: "common",
    unlockCondition: "Compléter 10 exercices de français",
    description: "Rempli de savoir et de bonnes réponses.",
    unlocked: false,
    equipped: false
  },
  {
    id: "bowler_hat",
    name: "Chapeau Melon",
    type: "hat",
    emoji: "🎩",
    rarity: "common",
    unlockCondition: "Réussir un quiz sans utiliser d'indice",
    description: "Une touche de classe pour un esprit brillant.",
    unlocked: false,
    equipped: false
  },
  {
    id: "friendship_bracelet",
    name: "Bracelet d'Amitié",
    type: "accessory",
    emoji: "❤️",
    rarity: "common",
    unlockCondition: "Fonctionnalité sociale : 'Aider un ami'",
    description: "Le savoir est plus fun quand il est partagé.",
    unlocked: false,
    equipped: false
  },
  {
    id: "flower_pot",
    name: "Pot de Fleur",
    type: "accessory",
    emoji: "🪴",
    rarity: "common",
    unlockCondition: "Terminer un exercice du 'Jardin Magique'",
    description: "Un souvenir de ta première victoire contre l'erreur.",
    unlocked: false,
    equipped: false
  },
  {
    id: "party_hat",
    name: "Chapeau de Fête",
    type: "hat",
    emoji: "🎉",
    rarity: "common",
    unlockCondition: "Lancer l'application le jour de son anniversaire",
    description: "Même les mascottes aiment faire la fête !",
    unlocked: false,
    equipped: false
  },
  {
    id: "goggles_swim",
    name: "Lunettes de Natation",
    type: "glasses",
    emoji: "🥽",
    rarity: "common",
    unlockCondition: "Terminer un module sur le thème de l'eau",
    description: "Pour plonger dans l'océan du savoir.",
    unlocked: false,
    equipped: false
  },
  {
    id: "bandana_red",
    name: "Bandana Rouge",
    type: "hat",
    emoji: "🧣",
    rarity: "common",
    unlockCondition: "Atteindre une série de 5",
    description: "Le style des aventuriers.",
    unlocked: false,
    equipped: false
  },
  {
    id: "paint_palette",
    name: "Palette de Peinture",
    type: "accessory",
    emoji: "🎨",
    rarity: "common",
    unlockCondition: "Utiliser 3 couleurs différentes",
    description: "Pour colorer le monde avec tes idées.",
    unlocked: false,
    equipped: false
  },
  {
    id: "raincoat_yellow",
    name: "Imperméable Jaune",
    type: "outfit",
    emoji: "🧥",
    rarity: "common",
    unlockCondition: "Jouer un jour de pluie",
    description: "Pour rester au sec même sous une pluie de questions.",
    unlocked: false,
    equipped: false
  },
  {
    id: "simple_watch",
    name: "Montre Simple",
    type: "accessory",
    emoji: "⌚",
    rarity: "common",
    unlockCondition: "Terminer la Masterclass 'Lecture de l'Heure'",
    description: "Tu sais maintenant l'utiliser !",
    unlocked: false,
    equipped: false
  },
  {
    id: "magnifying_glass",
    name: "Loupe",
    type: "glasses",
    emoji: "🔎",
    rarity: "common",
    unlockCondition: "Utiliser un indice dans 'Mot Mystère'",
    description: "Parfois, il faut regarder de plus près.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_forest",
    name: "Forêt Paisible",
    type: "background",
    emoji: "🌳",
    rarity: "common",
    unlockCondition: "Terminer 10 exercices sur la nature",
    description: "Un endroit calme pour se concentrer.",
    unlocked: false,
    equipped: false
  },
  // ===================================
  // 💎 RARE (15 items)
  // ===================================
  {
    id: "beret_artist",
    name: "Béret d'Artiste",
    type: "hat",
    emoji: "🎨",
    rarity: "rare",
    unlockCondition: "Personnaliser sa mascotte pour la première fois",
    description: "Pour les esprits créatifs et originaux.",
    unlocked: false,
    equipped: false
  },
  {
    id: "smart_glasses_nerd",
    name: "Lunettes de Génie",
    type: "glasses",
    emoji: "🤓",
    rarity: "rare",
    unlockCondition: "Réussir 5 exercices 'difficiles' d'affilée",
    description: "Augmente l'intelligence de +10 (selon la légende).",
    unlocked: false,
    equipped: false
  },
  {
    id: "explorer_outfit",
    name: "Tenue d'Explorateur",
    type: "outfit",
    emoji: "🧭",
    rarity: "rare",
    unlockCondition: "Terminer 3 modules différents",
    description: "Pour partir à la découverte de nouvelles connaissances.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_library",
    name: "Bibliothèque Chaleureuse",
    type: "background",
    emoji: "📚",
    rarity: "rare",
    unlockCondition: "Résoudre 10 Mots Mystères",
    description: "L'endroit parfait pour les amoureux des mots.",
    unlocked: false,
    equipped: false
  },
  {
    id: "knight_helmet",
    name: "Casque de Chevalier",
    type: "hat",
    emoji: "🛡️",
    rarity: "rare",
    unlockCondition: "Terminer la Masterclass 'Château des Dizaines'",
    description: "Protège contre les erreurs de calcul.",
    unlocked: false,
    equipped: false
  },
  {
    id: "monocle_detective",
    name: "Monocle de Détective",
    type: "glasses",
    emoji: "🧐",
    rarity: "rare",
    unlockCondition: "Trouver un mot 'difficile' dans Mot Mystère",
    description: "Pour inspecter les syllabes de près.",
    unlocked: false,
    equipped: false
  },
  {
    id: "compass_golden",
    name: "Boussole Dorée",
    type: "accessory",
    emoji: "🧭",
    rarity: "rare",
    unlockCondition: "Terminer un module de Géométrie",
    description: "Ne perds jamais le nord dans tes exercices.",
    unlocked: false,
    equipped: false
  },
  {
    id: "chef_hat",
    name: "Toque de Chef",
    type: "hat",
    emoji: "👨‍🍳",
    rarity: "rare",
    unlockCondition: "Réussir 5 problèmes mathématiques",
    description: "La recette du succès : un peu de logique et beaucoup de pratique.",
    unlocked: false,
    equipped: false
  },
  {
    id: "lab_coat",
    name: "Blouse de Scientifique",
    type: "outfit",
    emoji: "🥼",
    rarity: "rare",
    unlockCondition: "Terminer un 'Laboratoire Cognitif'",
    description: "Pour mener des expériences sur le savoir.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_beach",
    name: "Plage Ensoleillée",
    type: "background",
    emoji: "🏖️",
    rarity: "rare",
    unlockCondition: "Jouer pendant les vacances d'été",
    description: "Apprendre, même en vacances !",
    unlocked: false,
    equipped: false
  },
  {
    id: "pirate_hat",
    name: "Chapeau de Pirate",
    type: "hat",
    emoji: "🏴‍☠️",
    rarity: "rare",
    unlockCondition: "Trouver le mot 'TRESOR' dans Mot Mystère",
    description: "À l'abordage des connaissances !",
    unlocked: false,
    equipped: false
  },
  {
    id: "spy_glasses",
    name: "Lunettes d'Espion",
    type: "glasses",
    emoji: "🕵️",
    rarity: "rare",
    unlockCondition: "Réussir 3 exercices sans aucun indice",
    description: "Pour voir les réponses cachées.",
    unlocked: false,
    equipped: false
  },
  {
    id: "map_treasure",
    name: "Carte au Trésor",
    type: "accessory",
    emoji: "🗺️",
    rarity: "rare",
    unlockCondition: "Terminer un parcours narratif",
    description: "X marque l'emplacement de la bonne réponse.",
    unlocked: false,
    equipped: false
  },
  {
    id: "jester_hat",
    name: "Chapeau de Bouffon",
    type: "hat",
    emoji: "🃏",
    rarity: "rare",
    unlockCondition: "Réussir un exercice après une 'Quête de Remédiation'",
    description: "Transformer l'échec en rire et en succès.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_mountains",
    name: "Sommets Enneigés",
    type: "background",
    emoji: "🏔️",
    rarity: "rare",
    unlockCondition: "Atteindre une série de 10",
    description: "Tu as gravi les premières montagnes.",
    unlocked: false,
    equipped: false
  },
  // ===================================
  // 🔮 EPIC (12 items)
  // ===================================
  {
    id: "wizard_hat_epic",
    name: "Chapeau de Magicien",
    type: "hat",
    emoji: "🧙",
    rarity: "epic",
    unlockCondition: "Maîtriser 10 compétences de Maths",
    description: "Un chapeau qui connaît toutes les formules magiques.",
    unlocked: false,
    equipped: false
  },
  {
    id: "cyber_visor",
    name: "Visière Cybernétique",
    type: "glasses",
    emoji: "🤖",
    rarity: "epic",
    unlockCondition: "Terminer un module en 'Mode Rapide'",
    description: "Analyse les données à la vitesse de la lumière.",
    unlocked: false,
    equipped: false
  },
  {
    id: "magic_wand_epic",
    name: "Baguette Magique",
    type: "accessory",
    emoji: "🪄",
    rarity: "epic",
    unlockCondition: "Découvrir 25 mots mystères",
    description: "Permet de lancer des sorts d'orthographe.",
    unlocked: false,
    equipped: false
  },
  {
    id: "superhero_cape_epic",
    name: "Cape de Super-Héros",
    type: "outfit",
    emoji: "🦸",
    rarity: "epic",
    unlockCondition: "Aider 3 amis dans le mode collaboratif",
    description: "Pour voler au secours des problèmes difficiles !",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_castle",
    name: "Château Magique",
    type: "background",
    emoji: "🏰",
    rarity: "epic",
    unlockCondition: "Compléter tous les modules de Français CP",
    description: "Un château où règne la connaissance.",
    unlocked: false,
    equipped: false
  },
  {
    id: "astronaut_helmet",
    name: "Casque d'Astronaute",
    type: "hat",
    emoji: "🧑‍🚀",
    rarity: "epic",
    unlockCondition: "Terminer la Masterclass 'Mission Spatiale'",
    description: "Pour explorer la galaxie des nombres.",
    unlocked: false,
    equipped: false
  },
  {
    id: "jetpack",
    name: "Jetpack",
    type: "accessory",
    emoji: "🚀",
    rarity: "epic",
    unlockCondition: "Atteindre une série de 15",
    description: "Propulse tes connaissances vers de nouveaux sommets.",
    unlocked: false,
    equipped: false
  },
  {
    id: "knight_armor",
    name: "Armure Scintillante",
    type: "outfit",
    emoji: "✨",
    rarity: "epic",
    unlockCondition: "Réussir 100 exercices de calcul",
    description: "Invulnérable aux soustractions avec retenue.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_underwater",
    name: "Cité Sous-Marine",
    type: "background",
    emoji: "🐠",
    rarity: "epic",
    unlockCondition: "Maîtriser 20 compétences",
    description: "Explore les profondeurs du savoir.",
    unlocked: false,
    equipped: false
  },
  {
    id: "phoenix_feather",
    name: "Plume de Phénix",
    type: "accessory",
    emoji: "🔥",
    rarity: "epic",
    unlockCondition: "Réussir un exercice difficile après 3 échecs",
    description: "Renaître de ses erreurs pour atteindre le succès.",
    unlocked: false,
    equipped: false
  },
  {
    id: "top_hat_sparkle",
    name: "Haut-de-forme Scintillant",
    type: "hat",
    emoji: "🎩",
    rarity: "epic",
    unlockCondition: "Obtenir 3 célébrations 'Épiques' du Moteur Wahoo",
    description: "Pour les moments de pure brillance.",
    unlocked: false,
    equipped: false
  },
  {
    id: "x_ray_specs",
    name: "Lunettes à Rayons X",
    type: "glasses",
    emoji: "🔬",
    rarity: "epic",
    unlockCondition: "Réussir 3 'Laboratoires Cognitifs'",
    description: "Pour voir la structure cachée des problèmes.",
    unlocked: false,
    equipped: false
  },
  // ===================================
  // 🌟 LEGENDARY (5 items)
  // ===================================
  {
    id: "crown_legendary",
    name: "Couronne de la Sagesse",
    type: "hat",
    emoji: "👑",
    rarity: "legendary",
    unlockCondition: "Atteindre une série de 30 bonnes réponses",
    description: "Réservée aux véritables monarques de la connaissance.",
    unlocked: false,
    equipped: false
  },
  {
    id: "time_turner_necklace",
    name: "Collier du Maître du Temps",
    type: "accessory",
    emoji: "⏳",
    rarity: "legendary",
    unlockCondition: "Se connecter 30 jours d'affilée",
    description: "Permet de revoir ses leçons passées avec une nouvelle perspective.",
    unlocked: false,
    equipped: false
  },
  {
    id: "dragon_armor_legendary",
    name: "Armure du Dragon Ancien",
    type: "outfit",
    emoji: "🐲",
    rarity: "legendary",
    unlockCondition: "Atteindre le niveau 50",
    description: "Une protection forgée dans le feu du savoir ancestral.",
    unlocked: false,
    equipped: false
  },
  {
    id: "background_space",
    name: "Observatoire Spatial",
    type: "background",
    emoji: "🌌",
    rarity: "legendary",
    unlockCondition: "Maîtriser 50 compétences",
    description: "Une vue imprenable sur l'univers infini de l'apprentissage.",
    unlocked: false,
    equipped: false
  },
  {
    id: "golden_medal_legendary",
    name: "Médaille d'Or du Savoir",
    type: "accessory",
    emoji: "🥇",
    rarity: "legendary",
    unlockCondition: "Terminer 100% du curriculum d'un niveau scolaire",
    description: "La récompense ultime pour un travail exceptionnel.",
    unlocked: false,
    equipped: false
  }
];
// ==========================================
// 🛠️ UTILITAIRES POUR LA GARDE-ROBE
// ==========================================
export const getItemsByType = (type: MascotItem['type']) => {
  return MASCOT_COLLECTION.filter(item => item.type === type);
};

export const getItemsByRarity = (rarity: MascotItem['rarity']) => {
  return MASCOT_COLLECTION.filter(item => item.rarity === rarity);
};

export const getUnlockedItems = () => {
  return MASCOT_COLLECTION.filter(item => item.unlocked);
};

export const getEquippedItems = () => {
  return MASCOT_COLLECTION.filter(item => item.equipped);
};
export const unlockItem = (itemId: string) => {
  const item = MASCOT_COLLECTION.find(item => item.id === itemId);
  if (item && !item.unlocked) {
    item.unlocked = true;
    item.unlockDate = new Date().toISOString();
    return item;
  }
  return null;
};

export const equipItem = (itemId: string) => {
  const item = MASCOT_COLLECTION.find(item => item.id === itemId);
  if (item && item.unlocked) {
    // Déséquiper les autres items du même type
    MASCOT_COLLECTION.forEach(otherItem => {
      if (otherItem.type === item.type) {
        otherItem.equipped = false;
      }
    });
    
    item.equipped = true;
    return item;
  }
  return null;
};

export const unequipItem = (type: MascotItem['type']) => {
  const item = MASCOT_COLLECTION.find(item => item.type === type && item.equipped);
  if (item) {
    item.equipped = false;
    return item;
  }
  return null;
}; 
