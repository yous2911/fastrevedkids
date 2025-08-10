#!/usr/bin/env node

/**
 * Bundle Optimization Script
 * Analyzes and optimizes bundle size before build
 */

const fs = require('fs');
const path = require('path');

// Bundle size thresholds (in bytes)
const THRESHOLDS = {
  COMPONENT_MAX_SIZE: 50000, // 50KB
  UTILITY_MAX_SIZE: 25000,   // 25KB
  SERVICE_MAX_SIZE: 30000,   // 30KB
};

// Large dependencies to analyze
const LARGE_DEPENDENCIES = [
  'three',
  'framer-motion',
  '@sentry/react',
  'howler',
  'react-router-dom'
];

class BundleOptimizer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.optimizationSuggestions = [];
    this.largeFiles = [];
  }

  async analyze() {
    console.log('🔍 Analyzing bundle for optimization opportunities...\n');
    
    await this.analyzeFilesSizes();
    await this.analyzeDependencies();
    await this.analyzeImports();
    await this.generateReport();
  }

  async analyzeFilesSizes() {
    console.log('📊 Analyzing file sizes...');
    
    const files = await this.getAllSourceFiles(this.srcPath);
    
    for (const file of files) {
      const stats = fs.statSync(file);
      const relativePath = path.relative(this.srcPath, file);
      const fileType = this.getFileType(file);
      const threshold = THRESHOLDS[`${fileType.toUpperCase()}_MAX_SIZE`] || THRESHOLDS.COMPONENT_MAX_SIZE;
      
      if (stats.size > threshold) {
        this.largeFiles.push({
          path: relativePath,
          size: stats.size,
          type: fileType,
          threshold
        });
        
        this.optimizationSuggestions.push({
          type: 'large_file',
          file: relativePath,
          description: `File exceeds ${fileType} size limit: ${this.formatBytes(stats.size)} > ${this.formatBytes(threshold)}`,
          suggestion: this.getSizeSuggestion(fileType, relativePath)
        });
      }
    }
    
    console.log(`   Found ${this.largeFiles.length} large files\n`);
  }

  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of LARGE_DEPENDENCIES) {
      if (dependencies[dep]) {
        const usage = await this.analyzeDependencyUsage(dep);
        
        if (usage.unusedImports.length > 0) {
          this.optimizationSuggestions.push({
            type: 'unused_imports',
            dependency: dep,
            description: `${dep} has unused imports that can be tree-shaken`,
            suggestion: `Remove unused imports: ${usage.unusedImports.join(', ')}`,
            files: usage.files
          });
        }
        
        if (usage.canBeLazyLoaded.length > 0) {
          this.optimizationSuggestions.push({
            type: 'lazy_load_opportunity',
            dependency: dep,
            description: `${dep} usage can be lazy-loaded`,
            suggestion: `Convert to lazy loading in: ${usage.canBeLazyLoaded.join(', ')}`,
            files: usage.canBeLazyLoaded
          });
        }
      }
    }
    
    console.log('   Dependency analysis complete\n');
  }

  async analyzeImports() {
    console.log('🌳 Analyzing import patterns...');
    
    const files = await this.getAllSourceFiles(this.srcPath);
    const importAnalysis = new Map();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = this.extractImports(content);
      
      for (const imp of imports) {
        if (!importAnalysis.has(imp.source)) {
          importAnalysis.set(imp.source, {
            totalImports: 0,
            namedImports: new Set(),
            defaultImports: new Set(),
            files: new Set()
          });
        }
        
        const analysis = importAnalysis.get(imp.source);
        analysis.totalImports++;
        analysis.files.add(path.relative(this.srcPath, file));
        
        if (imp.type === 'named') {
          imp.imports.forEach(name => analysis.namedImports.add(name));
        } else if (imp.type === 'default') {
          analysis.defaultImports.add(imp.name);
        }
      }
    }
    
    // Find optimization opportunities
    importAnalysis.forEach((analysis, source) => {
      if (source.includes('lodash') && !source.includes('lodash-es')) {
        this.optimizationSuggestions.push({
          type: 'tree_shaking',
          source,
          description: 'Using lodash instead of lodash-es reduces tree-shaking effectiveness',
          suggestion: 'Replace lodash with lodash-es for better tree shaking',
          files: Array.from(analysis.files)
        });
      }
      
      if (analysis.totalImports > 10 && analysis.namedImports.size < 3) {
        this.optimizationSuggestions.push({
          type: 'import_consolidation',
          source,
          description: `${source} is imported in many places with few named imports`,
          suggestion: 'Consider creating a barrel export or utility module',
          files: Array.from(analysis.files)
        });
      }
    });
    
    console.log('   Import analysis complete\n');
  }

  async generateReport() {
    console.log('📋 Generating optimization report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuggestions: this.optimizationSuggestions.length,
        largeFiles: this.largeFiles.length,
        categories: this.categorizeSuggestions()
      },
      largeFiles: this.largeFiles,
      suggestions: this.optimizationSuggestions
    };
    
    // Write detailed report
    const reportPath = path.join(__dirname, '..', 'bundle-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    this.displaySummary(report);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  displaySummary(report) {
    console.log('══════════════════════════════════════════');
    console.log('           BUNDLE OPTIMIZATION SUMMARY');
    console.log('══════════════════════════════════════════');
    console.log(`Total Suggestions: ${report.summary.totalSuggestions}`);
    console.log(`Large Files: ${report.summary.largeFiles}`);
    console.log();
    
    if (report.summary.totalSuggestions === 0) {
      console.log('✅ No major optimization opportunities found!');
      return;
    }
    
    console.log('📊 Suggestion Categories:');
    Object.entries(report.summary.categories).forEach(([category, count]) => {
      console.log(`   ${this.getCategoryIcon(category)} ${category}: ${count}`);
    });
    
    console.log('\n🏆 Top Optimization Opportunities:');
    const topSuggestions = this.optimizationSuggestions
      .sort((a, b) => this.getSuggestionPriority(b) - this.getSuggestionPriority(a))
      .slice(0, 5);
    
    topSuggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.description}`);
      console.log(`      💡 ${suggestion.suggestion}`);
      if (suggestion.files) {
        console.log(`      📁 Files: ${suggestion.files.slice(0, 3).join(', ')}${suggestion.files.length > 3 ? '...' : ''}`);
      }
      console.log();
    });
  }

  // Helper methods
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

  getFileType(filePath) {
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/pages/')) return 'component';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/hooks/')) return 'utility';
    return 'component';
  }

  getSizeSuggestion(fileType, filePath) {
    const suggestions = {
      component: 'Consider splitting into smaller components or lazy loading',
      utility: 'Break into focused utility modules',
      service: 'Split into separate service modules'
    };
    
    return suggestions[fileType] || suggestions.component;
  }

  async analyzeDependencyUsage(dependency) {
    // Simplified analysis - in a real implementation, this would use AST parsing
    const files = await this.getAllSourceFiles(this.srcPath);
    const usage = {
      files: [],
      unusedImports: [],
      canBeLazyLoaded: []
    };
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(dependency)) {
        usage.files.push(path.relative(this.srcPath, file));
        
        // Check for potential lazy loading opportunities
        if (content.includes('import') && content.includes(dependency) && 
            (file.includes('pages/') || file.includes('components/') && content.length > 10000)) {
          usage.canBeLazyLoaded.push(path.relative(this.srcPath, file));
        }
      }
    }
    
    return usage;
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
          .map(name => name.trim());
        
        imports.push({
          type: 'named',
          imports: namedImports,
          source
        });
      } else {
        // Default import
        imports.push({
          type: 'default',
          name: importClause,
          source
        });
      }
    }
    
    return imports;
  }

  categorizeSuggestions() {
    const categories = {};
    
    this.optimizationSuggestions.forEach(suggestion => {
      categories[suggestion.type] = (categories[suggestion.type] || 0) + 1;
    });
    
    return categories;
  }

  getSuggestionPriority(suggestion) {
    const priorities = {
      large_file: 10,
      lazy_load_opportunity: 9,
      tree_shaking: 8,
      unused_imports: 7,
      import_consolidation: 5
    };
    
    return priorities[suggestion.type] || 1;
  }

  getCategoryIcon(category) {
    const icons = {
      large_file: '📏',
      lazy_load_opportunity: '⚡',
      tree_shaking: '🌳',
      unused_imports: '🗑️',
      import_consolidation: '📦'
    };
    
    return icons[category] || '🔧';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the optimizer
async function main() {
  try {
    const optimizer = new BundleOptimizer();
    await optimizer.analyze();
    process.exit(0);
  } catch (error) {
    console.error('❌ Bundle optimization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BundleOptimizer;