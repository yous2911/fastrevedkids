#!/usr/bin/env node

/**
 * Comprehensive Refactoring Analyzer
 * Detects unused code, duplicates, and naming issues
 */

const fs = require('fs');
const path = require('path');

class RefactorAnalyzer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.unusedCode = {
      imports: [],
      functions: [],
      variables: [],
      components: [],
      types: []
    };
    this.duplicateCode = [];
    this.namingIssues = [];
    this.fileContents = new Map();
    this.allExports = new Map();
    this.allImports = new Map();
    this.functionSignatures = new Map();
  }

  async analyze() {
    console.log('🔍 Analyzing codebase for refactoring opportunities...\n');
    
    await this.loadAllFiles();
    await this.analyzeExportsAndImports();
    await this.detectUnusedCode();
    await this.findDuplicateCode();
    await this.analyzeNamingConventions();
    await this.generateRefactoringPlan();
  }

  async loadAllFiles() {
    console.log('📂 Loading all source files...');
    
    const files = await this.getAllSourceFiles(this.srcPath);
    let loaded = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.srcPath, file);
        this.fileContents.set(relativePath, content);
        loaded++;
      } catch (error) {
        console.warn(`   ⚠️ Failed to load ${file}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Loaded ${loaded} files\n`);
  }

  async analyzeExportsAndImports() {
    console.log('🔄 Analyzing exports and imports...');
    
    for (const [filePath, content] of this.fileContents) {
      // Extract exports
      const exports = this.extractExports(content);
      if (exports.length > 0) {
        this.allExports.set(filePath, exports);
      }
      
      // Extract imports
      const imports = this.extractImports(content);
      if (imports.length > 0) {
        this.allImports.set(filePath, imports);
      }
    }
    
    console.log(`   📤 Found exports in ${this.allExports.size} files`);
    console.log(`   📥 Found imports in ${this.allImports.size} files\n`);
  }

  async detectUnusedCode() {
    console.log('🗑️ Detecting unused code...');
    
    // Find unused imports
    this.detectUnusedImports();
    
    // Find unused functions
    this.detectUnusedFunctions();
    
    // Find unused variables
    this.detectUnusedVariables();
    
    // Find unused components
    this.detectUnusedComponents();
    
    // Find unused types
    this.detectUnusedTypes();
    
    const totalUnused = Object.values(this.unusedCode).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`   🗑️ Found ${totalUnused} unused code items\n`);
  }

  detectUnusedImports() {
    for (const [filePath, imports] of this.allImports) {
      const content = this.fileContents.get(filePath);
      
      for (const importItem of imports) {
        if (importItem.type === 'named') {
          for (const namedImport of importItem.imports) {
            if (!this.isUsedInFile(namedImport, content, importItem.source)) {
              this.unusedCode.imports.push({
                file: filePath,
                import: namedImport,
                source: importItem.source,
                type: 'named'
              });
            }
          }
        } else if (importItem.type === 'default') {
          if (!this.isUsedInFile(importItem.name, content)) {
            this.unusedCode.imports.push({
              file: filePath,
              import: importItem.name,
              source: importItem.source,
              type: 'default'
            });
          }
        }
      }
    }
  }

  detectUnusedFunctions() {
    for (const [filePath, content] of this.fileContents) {
      const functions = this.extractFunctions(content);
      
      for (const func of functions) {
        if (!this.isFunctionUsed(func.name, filePath)) {
          this.unusedCode.functions.push({
            file: filePath,
            name: func.name,
            line: func.line,
            type: func.type
          });
        }
      }
    }
  }

  detectUnusedVariables() {
    for (const [filePath, content] of this.fileContents) {
      const variables = this.extractVariables(content);
      
      for (const variable of variables) {
        const usageCount = this.countUsages(variable.name, content);
        if (usageCount <= 1) { // Only declaration, no usage
          this.unusedCode.variables.push({
            file: filePath,
            name: variable.name,
            line: variable.line,
            type: variable.type
          });
        }
      }
    }
  }

  detectUnusedComponents() {
    const componentFiles = Array.from(this.fileContents.keys())
      .filter(file => file.includes('/components/') || file.includes('/pages/'));
    
    for (const componentFile of componentFiles) {
      const componentName = this.getComponentNameFromFile(componentFile);
      if (componentName && !this.isComponentUsed(componentName, componentFile)) {
        this.unusedCode.components.push({
          file: componentFile,
          name: componentName,
          type: 'component'
        });
      }
    }
  }

  detectUnusedTypes() {
    for (const [filePath, content] of this.fileContents) {
      const types = this.extractTypeDefinitions(content);
      
      for (const type of types) {
        if (!this.isTypeUsed(type.name, filePath)) {
          this.unusedCode.types.push({
            file: filePath,
            name: type.name,
            line: type.line,
            kind: type.kind // interface, type, enum
          });
        }
      }
    }
  }

  async findDuplicateCode() {
    console.log('👥 Finding duplicate code...');
    
    const codeBlocks = new Map();
    
    for (const [filePath, content] of this.fileContents) {
      const blocks = this.extractCodeBlocks(content);
      
      for (const block of blocks) {
        const hash = this.hashCodeBlock(block.code);
        
        if (!codeBlocks.has(hash)) {
          codeBlocks.set(hash, []);
        }
        
        codeBlocks.get(hash).push({
          file: filePath,
          line: block.line,
          code: block.code,
          type: block.type
        });
      }
    }
    
    // Find duplicates (blocks that appear in multiple places)
    for (const [hash, blocks] of codeBlocks) {
      if (blocks.length > 1 && blocks[0].code.trim().length > 50) { // Ignore small blocks
        this.duplicateCode.push({
          hash,
          occurrences: blocks,
          similarity: 100,
          suggestion: this.suggestDeduplication(blocks)
        });
      }
    }
    
    console.log(`   👥 Found ${this.duplicateCode.length} duplicate code blocks\n`);
  }

  async analyzeNamingConventions() {
    console.log('📝 Analyzing naming conventions...');
    
    for (const [filePath, content] of this.fileContents) {
      // Check file naming
      this.checkFileNaming(filePath);
      
      // Check variable naming
      this.checkVariableNaming(filePath, content);
      
      // Check function naming
      this.checkFunctionNaming(filePath, content);
      
      // Check component naming
      this.checkComponentNaming(filePath, content);
      
      // Check constant naming
      this.checkConstantNaming(filePath, content);
    }
    
    console.log(`   📝 Found ${this.namingIssues.length} naming issues\n`);
  }

  // Helper methods for analysis
  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({
        name: match[1],
        type: 'named',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    // Export statements
    const exportStatementRegex = /export\s+\{([^}]+)\}/g;
    while ((match = exportStatementRegex.exec(content)) !== null) {
      const namedExports = match[1].split(',').map(name => name.trim());
      namedExports.forEach(name => {
        exports.push({
          name: name,
          type: 'named',
          line: this.getLineNumber(content, match.index)
        });
      });
    }
    
    // Default export
    if (content.includes('export default')) {
      exports.push({
        name: 'default',
        type: 'default',
        line: this.getLineNumber(content, content.indexOf('export default'))
      });
    }
    
    return exports;
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"];?/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importClause = match[1].trim();
      const source = match[2];
      
      if (importClause.startsWith('{') && importClause.endsWith('}')) {
        // Named imports
        const namedImports = importClause
          .slice(1, -1)
          .split(',')
          .map(name => name.trim().split(' as ')[0]);
        
        imports.push({
          type: 'named',
          imports: namedImports,
          source,
          line: this.getLineNumber(content, match.index)
        });
      } else if (importClause.includes(',')) {
        // Mixed imports (default + named)
        const parts = importClause.split(',');
        const defaultImport = parts[0].trim();
        const namedPart = parts[1].trim();
        
        imports.push({
          type: 'default',
          name: defaultImport,
          source,
          line: this.getLineNumber(content, match.index)
        });
        
        if (namedPart.startsWith('{') && namedPart.endsWith('}')) {
          const namedImports = namedPart
            .slice(1, -1)
            .split(',')
            .map(name => name.trim());
          
          imports.push({
            type: 'named',
            imports: namedImports,
            source,
            line: this.getLineNumber(content, match.index)
          });
        }
      } else {
        // Default import
        imports.push({
          type: 'default',
          name: importClause,
          source,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    return imports;
  }

  extractFunctions(content) {
    const functions = [];
    
    // Function declarations
    const funcDeclRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'declaration',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    // Arrow functions assigned to variables
    const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'arrow',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    return functions;
  }

  extractVariables(content) {
    const variables = [];
    const variableRegex = /(?:const|let|var)\s+(\w+)(?:\s*:\s*[^=]+)?\s*=/g;
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const name = match[1];
      if (!name.startsWith('_') && name !== name.toUpperCase()) { // Skip private and constants
        variables.push({
          name,
          type: 'variable',
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    return variables;
  }

  extractTypeDefinitions(content) {
    const types = [];
    
    // Interfaces
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      types.push({
        name: match[1],
        kind: 'interface',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    // Type aliases
    const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=/g;
    while ((match = typeRegex.exec(content)) !== null) {
      types.push({
        name: match[1],
        kind: 'type',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    // Enums
    const enumRegex = /(?:export\s+)?enum\s+(\w+)/g;
    while ((match = enumRegex.exec(content)) !== null) {
      types.push({
        name: match[1],
        kind: 'enum',
        line: this.getLineNumber(content, match.index)
      });
    }
    
    return types;
  }

  extractCodeBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    let currentBlock = [];
    let blockStart = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
        if (currentBlock.length > 5) { // Minimum block size
          blocks.push({
            code: currentBlock.join('\n'),
            line: blockStart + 1,
            type: 'block'
          });
        }
        currentBlock = [];
        blockStart = i + 1;
      } else {
        currentBlock.push(line);
      }
    }
    
    // Add final block
    if (currentBlock.length > 5) {
      blocks.push({
        code: currentBlock.join('\n'),
        line: blockStart + 1,
        type: 'block'
      });
    }
    
    return blocks;
  }

  hashCodeBlock(code) {
    // Simple hash function for code similarity
    return code
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim()
      .split('')
      .reduce((hash, char) => {
        const chr = char.charCodeAt(0);
        hash = ((hash << 5) - hash) + chr;
        return hash & hash; // Convert to 32-bit integer
      }, 0);
  }

  isUsedInFile(identifier, content, excludeImport = '') {
    // Remove the import statement to avoid false positives
    const contentWithoutImport = excludeImport ? 
      content.replace(new RegExp(`from\\s+['"]${excludeImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'), '') :
      content;
    
    // Escape special regex characters in identifier
    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedIdentifier}\\b`, 'g');
    const matches = contentWithoutImport.match(regex) || [];
    return matches.length > 1; // More than just the declaration
  }

  isFunctionUsed(functionName, filePath) {
    // Check if function is used in any file
    for (const [otherFile, content] of this.fileContents) {
      if (otherFile === filePath) {
        // In same file, check for usage beyond declaration
        const usageCount = this.countUsages(functionName, content);
        if (usageCount > 1) return true;
      } else {
        // In other files, check for any usage
        if (this.isUsedInFile(functionName, content)) return true;
      }
    }
    return false;
  }

  isComponentUsed(componentName, filePath) {
    // Check if component is imported and used in other files
    for (const [otherFile, content] of this.fileContents) {
      if (otherFile !== filePath) {
        const imports = this.allImports.get(otherFile) || [];
        const isImported = imports.some(imp => 
          (imp.type === 'default' && imp.name === componentName) ||
          (imp.type === 'named' && imp.imports.includes(componentName))
        );
        
        if (isImported && this.isUsedInFile(componentName, content)) {
          return true;
        }
      }
    }
    return false;
  }

  isTypeUsed(typeName, filePath) {
    // Check if type is used in any file
    for (const [otherFile, content] of this.fileContents) {
      if (this.isUsedInFile(typeName, content)) {
        return true;
      }
    }
    return false;
  }

  countUsages(identifier, content) {
    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedIdentifier}\\b`, 'g');
    const matches = content.match(regex) || [];
    return matches.length;
  }

  getComponentNameFromFile(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName.charAt(0).toUpperCase() + fileName.slice(1);
  }

  checkFileNaming(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const dirName = path.dirname(filePath);
    
    // Check for camelCase in components
    if (dirName.includes('components') && !/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
      this.namingIssues.push({
        type: 'file_naming',
        file: filePath,
        issue: 'Component file should use PascalCase',
        current: fileName,
        suggested: this.toPascalCase(fileName)
      });
    }
    
    // Check for kebab-case in utilities
    if (dirName.includes('utils') && !/^[a-z][a-zA-Z0-9]*$/.test(fileName)) {
      this.namingIssues.push({
        type: 'file_naming',
        file: filePath,
        issue: 'Utility file should use camelCase',
        current: fileName,
        suggested: this.toCamelCase(fileName)
      });
    }
  }

  checkVariableNaming(filePath, content) {
    const variables = this.extractVariables(content);
    
    variables.forEach(variable => {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(variable.name)) {
        this.namingIssues.push({
          type: 'variable_naming',
          file: filePath,
          line: variable.line,
          issue: 'Variable should use camelCase',
          current: variable.name,
          suggested: this.toCamelCase(variable.name)
        });
      }
    });
  }

  checkFunctionNaming(filePath, content) {
    const functions = this.extractFunctions(content);
    
    functions.forEach(func => {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(func.name)) {
        this.namingIssues.push({
          type: 'function_naming',
          file: filePath,
          line: func.line,
          issue: 'Function should use camelCase',
          current: func.name,
          suggested: this.toCamelCase(func.name)
        });
      }
    });
  }

  checkComponentNaming(filePath, content) {
    if (filePath.includes('/components/') || filePath.includes('/pages/')) {
      const componentRegex = /(?:const|function)\s+(\w+).*?(?:React\.FC|React\.Component|\(\s*props|\(\s*\{)/g;
      let match;
      
      while ((match = componentRegex.exec(content)) !== null) {
        const componentName = match[1];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
          this.namingIssues.push({
            type: 'component_naming',
            file: filePath,
            line: this.getLineNumber(content, match.index),
            issue: 'Component should use PascalCase',
            current: componentName,
            suggested: this.toPascalCase(componentName)
          });
        }
      }
    }
  }

  checkConstantNaming(filePath, content) {
    const constantRegex = /(?:const|let)\s+([A-Z_][A-Z_0-9]*)\s*=/g;
    let match;
    
    while ((match = constantRegex.exec(content)) !== null) {
      const constantName = match[1];
      if (!/^[A-Z][A-Z_0-9]*$/.test(constantName)) {
        this.namingIssues.push({
          type: 'constant_naming',
          file: filePath,
          line: this.getLineNumber(content, match.index),
          issue: 'Constant should use SCREAMING_SNAKE_CASE',
          current: constantName,
          suggested: this.toScreamingSnakeCase(constantName)
        });
      }
    }
  }

  // Naming convention helpers
  toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
              .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  toPascalCase(str) {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
              .replace(/^[a-z]/, char => char.toUpperCase());
  }

  toScreamingSnakeCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2')
              .replace(/[-\s]/g, '_')
              .toUpperCase();
  }

  suggestDeduplication(blocks) {
    const suggestion = `Extract common code into a utility function or shared component`;
    return suggestion;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  async getAllSourceFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await this.getAllSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async generateRefactoringPlan() {
    console.log('📋 Generating refactoring plan...\n');
    
    const plan = {
      timestamp: new Date().toISOString(),
      summary: {
        unusedCodeItems: Object.values(this.unusedCode).reduce((sum, arr) => sum + arr.length, 0),
        duplicateBlocks: this.duplicateCode.length,
        namingIssues: this.namingIssues.length,
        totalFiles: this.fileContents.size,
        recommendations: this.generateRecommendations()
      },
      unusedCode: this.unusedCode,
      duplicates: this.duplicateCode,
      naming: this.namingIssues,
      refactoringActions: this.generateRefactoringActions()
    };
    
    // Write detailed plan
    const planPath = path.join(__dirname, '..', 'refactoring-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    // Display summary
    this.displaySummary(plan);
    
    console.log(`\n📄 Detailed refactoring plan saved to: ${planPath}`);
    
    return plan;
  }

  displaySummary(plan) {
    console.log('══════════════════════════════════════════');
    console.log('         REFACTORING ANALYSIS SUMMARY');
    console.log('══════════════════════════════════════════');
    console.log(`Files Analyzed: ${plan.summary.totalFiles}`);
    console.log(`Unused Code Items: ${plan.summary.unusedCodeItems}`);
    console.log(`Duplicate Code Blocks: ${plan.summary.duplicateBlocks}`);
    console.log(`Naming Issues: ${plan.summary.namingIssues}`);
    console.log();
    
    if (plan.summary.unusedCodeItems === 0 && plan.summary.duplicateBlocks === 0 && plan.summary.namingIssues === 0) {
      console.log('✅ No major refactoring opportunities found!');
      return;
    }
    
    console.log('🗑️ Top Unused Code Issues:');
    const topUnused = [
      ...plan.unusedCode.imports.slice(0, 3),
      ...plan.unusedCode.functions.slice(0, 2),
      ...plan.unusedCode.components.slice(0, 2)
    ];
    
    topUnused.forEach((item, index) => {
      console.log(`   ${index + 1}. Unused ${item.type || 'import'}: ${item.name || item.import}`);
      console.log(`      📁 File: ${item.file}`);
    });
    
    if (plan.duplicates.length > 0) {
      console.log('\n👥 Top Duplicate Code:');
      plan.duplicates.slice(0, 3).forEach((duplicate, index) => {
        console.log(`   ${index + 1}. ${duplicate.occurrences.length} occurrences of similar code`);
        console.log(`      💡 ${duplicate.suggestion}`);
      });
    }
    
    if (plan.naming.length > 0) {
      console.log('\n📝 Top Naming Issues:');
      plan.naming.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.issue}: ${issue.current} → ${issue.suggested}`);
        console.log(`      📁 File: ${issue.file}`);
      });
    }
    
    console.log('\n🎯 Recommendations:');
    plan.summary.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }

  generateRecommendations() {
    const recommendations = [];
    
    const unusedTotal = Object.values(this.unusedCode).reduce((sum, arr) => sum + arr.length, 0);
    if (unusedTotal > 10) {
      recommendations.push('High amount of unused code detected - consider aggressive cleanup');
    }
    
    if (this.unusedCode.imports.length > 5) {
      recommendations.push('Remove unused imports to reduce bundle size');
    }
    
    if (this.duplicateCode.length > 3) {
      recommendations.push('Extract duplicate code into shared utilities');
    }
    
    if (this.namingIssues.length > 10) {
      recommendations.push('Establish and enforce consistent naming conventions');
    }
    
    if (this.unusedCode.components.length > 0) {
      recommendations.push('Remove or consolidate unused components');
    }
    
    return recommendations;
  }

  generateRefactoringActions() {
    return {
      removeUnusedImports: this.unusedCode.imports.length,
      removeUnusedFunctions: this.unusedCode.functions.length,
      removeUnusedComponents: this.unusedCode.components.length,
      extractDuplicates: this.duplicateCode.length,
      fixNaming: this.namingIssues.length
    };
  }
}

// Run the analyzer
async function main() {
  try {
    const analyzer = new RefactorAnalyzer();
    await analyzer.analyze();
    process.exit(0);
  } catch (error) {
    console.error('❌ Refactoring analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RefactorAnalyzer;