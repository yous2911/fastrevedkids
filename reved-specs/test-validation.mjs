#!/usr/bin/env node

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs-extra';
import path from 'path';

console.log('🔍 Test de validation simplifié...');

try {
  // Initialiser AJV
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  console.log('✅ AJV initialisé');

  // Charger le schéma
  const schemaPath = './02-json-schema/exercise.schema.json';
  const schema = await fs.readJson(schemaPath);
  const validate = ajv.compile(schema);
  console.log('✅ Schéma chargé et compilé');

  // Charger l'exercice de test
  const exercisePath = './05-seeds/ex-cp-n2-0001.json';
  const exercise = await fs.readJson(exercisePath);
  console.log('✅ Exercice chargé');

  // Valider
  const isValid = validate(exercise);
  console.log(`📊 Résultat de validation: ${isValid ? 'VALIDÉ' : 'INVALIDÉ'}`);

  if (!isValid) {
    console.log('❌ Erreurs de validation:');
    validate.errors.forEach(error => {
      console.log(`   - ${error.message} (${error.instancePath})`);
    });
  } else {
    console.log('🎉 Exercice validé avec succès !');
  }

} catch (error) {
  console.error('💥 Erreur:', error.message);
  console.error(error.stack);
}
