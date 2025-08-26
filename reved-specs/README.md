# Référentiel Pédagogique RevEd ("reved-specs")

Ce référentiel est la **source de vérité unique** pour tout le contenu pédagogique de l'application RevEd. Il sert de "Constitution" et garantit la qualité, la cohérence et la scalabilité de notre usine cognitive.

## Installation & Utilisation

```bash
# Installation des dépendances
npm install

# Valider la conformité de tous les exercices dans /05-seeds/
npm run validate

# Détecter les doublons pédagogiques et générer un rapport
npm run dedupe

# Préparer le fichier seed.json final pour la base de données
npm run seed:prep
```
