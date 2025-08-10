// ==========================================
// MAPPING COMPÉTENCES CP 2025
// ==========================================

export interface CP2025Competence {
  code: string; // Format: CP.FR.L1.1
  titre: string;
  description: string;
  periode: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  domaine: 'LECTURE' | 'ECRITURE' | 'COMPREHENSION' | 'GRAMMAIRE' | 'NOMBRES' | 'CALCUL' | 'PROBLEMES' | 'GEOMETRIE' | 'MESURES';
  seuil_maitrise: number; // % minimum pour validation
  prerequis: string[];
  objectifs: string[];
  exemples: string[];
}

// Base de compétences CP 2025 complète
export const CP2025_COMPETENCES: Record<string, CP2025Competence> = {
  // === FRANÇAIS - LECTURE ===
  'CP.FR.L1.1': {
    code: 'CP.FR.L1.1',
    titre: 'Maîtriser les 15 CGP de la Période 1',
    description: 'Correspondances Graphème-Phonème de base (voyelles + consonnes)',
    periode: 'P1',
    domaine: 'LECTURE',
    seuil_maitrise: 90,
    prerequis: [],
    objectifs: ['Reconnaître voyelles a,e,i,o,u', 'Identifier consonnes m,n,p,t,r,l,s'],
    exemples: ['papa', 'mama', 'moto', 'nana']
  },
  'CP.FR.L1.2': {
    code: 'CP.FR.L1.2',
    titre: 'Maîtriser les 25-30 CGP supplémentaires de la Période 2',
    description: 'Extension des correspondances graphème-phonème',
    periode: 'P2',
    domaine: 'LECTURE',
    seuil_maitrise: 90,
    prerequis: ['CP.FR.L1.1'],
    objectifs: ['Reconnaître consonnes b,d,f,g,h,j,k,q,v,w,x,y,z', 'Identifier digraphes simples'],
    exemples: ['bébé', 'dodo', 'fifi', 'gogo']
  },
  'CP.FR.L1.3': {
    code: 'CP.FR.L1.3',
    titre: 'Maîtriser consonnes complexes et voyelles nasales',
    description: 'Sons complexes de la Période 3',
    periode: 'P3',
    domaine: 'LECTURE',
    seuil_maitrise: 85,
    prerequis: ['CP.FR.L1.2'],
    objectifs: ['Reconnaître ch,ou,an,in,on', 'Distinguer voyelles nasales'],
    exemples: ['cheval', 'mouton', 'grand', 'matin']
  },

  // === FRANÇAIS - ÉCRITURE ===
  'CP.FR.E1.1': {
    code: 'CP.FR.E1.1',
    titre: 'Maîtriser l\'écriture cursive sur réglure 3mm',
    description: 'Formation correcte des lettres en cursive',
    periode: 'P1',
    domaine: 'ECRITURE',
    seuil_maitrise: 80,
    prerequis: [],
    objectifs: ['Former lettres minuscules', 'Respecter lignes de réglure', 'Liaisons cursives'],
    exemples: ['a', 'i', 'o', 'u', 'l', 'm', 'n']
  },
  'CP.FR.E1.2': {
    code: 'CP.FR.E1.2',
    titre: 'Maîtriser l\'écriture cursive sur réglure 2,5mm',
    description: 'Perfectionnement technique cursive',
    periode: 'P3',
    domaine: 'ECRITURE',
    seuil_maitrise: 85,
    prerequis: ['CP.FR.E1.1'],
    objectifs: ['Réduire réglure', 'Fluidité cursive', 'Régularité tracé'],
    exemples: ['papa', 'maman', 'école', 'ami']
  },

  // === MATHÉMATIQUES - NOMBRES ===
  'CP.MA.N1.1': {
    code: 'CP.MA.N1.1',
    titre: 'Maîtriser nombres 0-10',
    description: 'Écriture, lecture et ordre des nombres jusqu\'à 10',
    periode: 'P1',
    domaine: 'NOMBRES',
    seuil_maitrise: 95,
    prerequis: [],
    objectifs: ['Compter jusqu\'à 10', 'Écrire chiffres 0-10', 'Ordonner nombres'],
    exemples: ['Dénombrer collections', 'Écrire en chiffres', 'Ranger croissant']
  },
  'CP.MA.N1.2': {
    code: 'CP.MA.N1.2',
    titre: 'Maîtriser nombres 11-20',
    description: 'Extension aux nombres de 11 à 20',
    periode: 'P1',
    domaine: 'NOMBRES',
    seuil_maitrise: 90,
    prerequis: ['CP.MA.N1.1'],
    objectifs: ['Compter jusqu\'à 20', 'Comprendre dizaine/unités'],
    exemples: ['Quinze', 'Dix-huit', 'Vingt']
  },
  'CP.MA.N3.1': {
    code: 'CP.MA.N3.1',
    titre: 'Automatiser additions dans les 10',
    description: 'Calcul mental rapide pour additions simples',
    periode: 'P2',
    domaine: 'CALCUL',
    seuil_maitrise: 90,
    prerequis: ['CP.MA.N1.1'],
    objectifs: ['Calculer mentalement a+b ≤ 10', 'Mémoriser compléments à 10'],
    exemples: ['3+2', '5+4', '7+3', '6+4']
  }
}; 