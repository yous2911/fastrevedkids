# Quality Gates - RevEd Specs

## Critères de Validation Obligatoires

### 1. Conformité JSON Schema
- ✅ Validation stricte contre `exercise.schema.json`
- ✅ Tous les champs requis présents
- ✅ Types de données corrects
- ✅ Contraintes respectées (min/max, patterns, etc.)

### 2. Scores de Qualité Minimum
- **Clarity**: ≥ 8.0/10
- **Factuality**: ≥ 9.0/10  
- **Age Fit**: ≥ 8.5/10
- **Overall**: ≥ 8.5/10

### 3. Contenu Pédagogique
- ✅ Question claire et sans ambiguïté
- ✅ Solution étape par étape complète
- ✅ Key concept takeaway défini
- ✅ Tags pertinents assignés
- ✅ XP reward et hint penalty cohérents

### 4. Métadonnées Techniques
- ✅ Exercise ID unique et formaté
- ✅ Version et locale correctes
- ✅ Generator meta complet
- ✅ Content hash calculé
- ✅ License et visibility définis

## Processus de Validation

1. **Validation JSON Schema** (obligatoire)
2. **Vérification des scores** (obligatoire)
3. **Contrôle de contenu** (obligatoire)
4. **Validation des métadonnées** (obligatoire)
5. **Test de déduplication** (recommandé)

## Actions en Cas d'Échec

- **Score < 8.0**: Retour au générateur avec feedback
- **Erreur JSON**: Correction immédiate requise
- **Contenu inapproprié**: Rejet automatique
- **Doublon détecté**: Fusion ou suppression
