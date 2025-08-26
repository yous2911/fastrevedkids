#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

console.log('🚀 Test simple du pipeline RevEd Specs');
console.log('=====================================');

// Vérifier que les dossiers existent
const seedsDir = './05-seeds';
const outputDir = './06-output';

console.log(`📁 Vérification du dossier seeds: ${seedsDir}`);
if (await fs.pathExists(seedsDir)) {
  const files = await fs.readdir(seedsDir);
  console.log(`✅ Dossier seeds trouvé avec ${files.length} fichiers`);
  files.forEach(file => console.log(`   - ${file}`));
} else {
  console.log('❌ Dossier seeds non trouvé');
}

console.log(`📁 Vérification du dossier output: ${outputDir}`);
if (await fs.pathExists(outputDir)) {
  console.log('✅ Dossier output existe');
} else {
  console.log('❌ Dossier output non trouvé, création...');
  await fs.ensureDir(outputDir);
  console.log('✅ Dossier output créé');
}

console.log('\n🎉 Test terminé avec succès !');
