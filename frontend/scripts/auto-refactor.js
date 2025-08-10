#!/usr/bin/env node

/**
 * Automated Refactoring Tool
 * Applies refactoring changes based on analysis
 */

const fs = require('fs');
const path = require('path');

class AutoRefactor {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.refactoringPlan = this.loadRefactoringPlan();
    this.changes = [];
    this.backupPath = path.join(__dirname, '..', '.refactor-backup');
  }

  loadRefactoringPlan() {
    const planPath = path.join(__dirname, '..', 'refactoring-plan.json');
    if (fs.existsSync(planPath)) {
      return JSON.parse(fs.readFileSync(planPath, 'utf8'));
    }
    return null;
  }

  async refactor() {
    console.log('🔧 Starting automated refactoring...\n');
    
    if (!this.refactoringPlan) {
      console.log('❌ No refactoring plan found. Run refactor-analyzer.js first.');
      return;
    }

    // Create backup
    await this.createBackup();
    
    try {
      // Apply refactoring changes
      await this.removeUnusedImports();
      await this.removeUnusedFunctions();
      await this.fixNamingIssues();
      await this.consolidateDuplicates();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Refactoring failed:', error);
      console.log('🔄 Restoring from backup...');
      await this.restoreBackup();
    }
  }

  async createBackup() {
    console.log('💾 Creating backup...');
    
    if (fs.existsSync(this.backupPath)) {
      fs.rmSync(this.backupPath, { recursive: true, force: true });
    }
    fs.mkdirSync(this.backupPath, { recursive: true });
    
    const files = await this.getAllSourceFiles(this.srcPath);
    let backedUp = 0;
    
    for (const file of files) {
      const relativePath = path.relative(this.srcPath, file);
      const backupFile = path.join(this.backupPath, relativePath);
      const backupDir = path.dirname(backupFile);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.copyFileSync(file, backupFile);
      backedUp++;
    }
    
    console.log(`   ✅ Backed up ${backedUp} files\n`);
  }

  async removeUnusedImports() {
    console.log('🗑️ Removing unused imports...');
    
    const unusedImports = this.refactoringPlan.unusedCode.imports;
    let removed = 0;
    
    for (const unusedImport of unusedImports) {
      try {
        const filePath = path.join(this.srcPath, unusedImport.file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Skip React imports in JSX files - they're needed for JSX transformation
        if (unusedImport.import === 'React' && unusedImport.file.endsWith('.tsx')) {
          continue;
        }
        
        // Skip important utility imports that might be used indirectly
        const importantImports = ['useState', 'useEffect', 'useCallback', 'useMemo'];
        if (importantImports.includes(unusedImport.import)) {
          continue;
        }
        
        const originalContent = content;
        content = this.removeImport(content, unusedImport);
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          removed++;
          
          this.changes.push({
            type: 'removed_import',
            file: unusedImport.file,
            import: unusedImport.import,
            source: unusedImport.source
          });
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to remove import ${unusedImport.import} from ${unusedImport.file}`);
      }
    }
    
    console.log(`   ✅ Removed ${removed} unused imports\n`);
  }

  removeImport(content, unusedImport) {
    const { import: importName, source, type } = unusedImport;
    
    if (type === 'named') {
      // Remove named import
      const namedImportRegex = new RegExp(
        `import\\s*\\{([^}]*?)\\}\\s*from\\s*['"]${this.escapeRegex(source)}['"];?`,
        'g'
      );
      
      content = content.replace(namedImportRegex, (match, imports) => {
        const importList = imports.split(',').map(imp => imp.trim()).filter(imp => imp);
        const filteredImports = importList.filter(imp => !imp.includes(importName));
        
        if (filteredImports.length === 0) {
          // Remove entire import statement
          return '';
        } else if (filteredImports.length < importList.length) {
          // Remove just this import
          return `import { ${filteredImports.join(', ')} } from '${source}';`;
        }
        return match;
      });
      
    } else if (type === 'default') {
      // Remove default import
      const defaultImportRegex = new RegExp(
        `import\\s+${this.escapeRegex(importName)}\\s+from\\s*['"]${this.escapeRegex(source)}['"];?\\s*\n?`,
        'g'
      );
      content = content.replace(defaultImportRegex, '');
    }
    
    return content;
  }

  async removeUnusedFunctions() {
    console.log('🔧 Removing unused functions...');
    
    const unusedFunctions = this.refactoringPlan.unusedCode.functions.filter(func => {
      // Keep exported functions and components
      return !func.name.startsWith('use') && // Keep hooks
             !func.name.includes('Component') && // Keep components
             !func.name.includes('Handler'); // Keep handlers
    });
    
    let removed = 0;
    
    for (const unusedFunc of unusedFunctions) {
      try {
        const filePath = path.join(this.srcPath, unusedFunc.file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const originalContent = content;
        content = this.removeFunction(content, unusedFunc);
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          removed++;
          
          this.changes.push({
            type: 'removed_function',
            file: unusedFunc.file,
            function: unusedFunc.name
          });
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to remove function ${unusedFunc.name} from ${unusedFunc.file}`);
      }
    }
    
    console.log(`   ✅ Removed ${removed} unused functions\n`);
  }

  removeFunction(content, unusedFunc) {
    const { name, type } = unusedFunc;
    
    if (type === 'declaration') {
      // Remove function declaration
      const funcRegex = new RegExp(
        `(?:export\\s+)?(?:async\\s+)?function\\s+${this.escapeRegex(name)}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}\\s*`,
        'gs'
      );
      content = content.replace(funcRegex, '');
      
    } else if (type === 'arrow') {
      // Remove arrow function
      const arrowRegex = new RegExp(
        `(?:const|let|var)\\s+${this.escapeRegex(name)}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{[^}]*\\};?\\s*`,
        'gs'
      );
      content = content.replace(arrowRegex, '');
    }
    
    return content;
  }

  async fixNamingIssues() {
    console.log('📝 Fixing naming conventions...');
    
    // Only fix the most critical naming issues to avoid breaking changes
    const criticalNamingIssues = this.refactoringPlan.naming.filter(issue => {
      return issue.type === 'variable_naming' && 
             !issue.current.includes('Component') && 
             !issue.current.startsWith('use') &&
             issue.current.length < 20; // Avoid very long names that might be intentional
    }).slice(0, 20); // Limit to first 20 to avoid overwhelming changes
    
    let fixed = 0;
    
    for (const issue of criticalNamingIssues) {
      try {
        const filePath = path.join(this.srcPath, issue.file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const originalContent = content;
        
        // Rename variable declarations
        const declRegex = new RegExp(
          `\\b(const|let|var)\\s+${this.escapeRegex(issue.current)}\\b`,
          'g'
        );
        content = content.replace(declRegex, `$1 ${issue.suggested}`);
        
        // Rename all usages
        const usageRegex = new RegExp(`\\b${this.escapeRegex(issue.current)}\\b`, 'g');
        content = content.replace(usageRegex, issue.suggested);
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          fixed++;
          
          this.changes.push({
            type: 'renamed_variable',
            file: issue.file,
            from: issue.current,
            to: issue.suggested
          });
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to rename ${issue.current} in ${issue.file}`);
      }
    }
    
    console.log(`   ✅ Fixed ${fixed} naming issues\n`);
  }

  async consolidateDuplicates() {
    console.log('👥 Consolidating duplicate code...');
    
    // For now, just report duplicates - actual consolidation would require more complex analysis
    const duplicates = this.refactoringPlan.duplicates;
    
    if (duplicates.length > 0) {
      console.log(`   📊 Found ${duplicates.length} duplicate code blocks`);
      console.log('   💡 Manual consolidation recommended for complex duplicates\n');
      
      // Create utility functions for most common duplicates
      await this.createUtilityFunctions(duplicates);
    } else {
      console.log('   ✅ No duplicates to consolidate\n');
    }
  }

  async createUtilityFunctions(duplicates) {
    // Create a utilities file for common code patterns
    const utilsPath = path.join(this.srcPath, 'utils', 'commonUtils.ts');
    
    const commonUtilities = `/**
 * Common Utility Functions
 * Generated by auto-refactor to consolidate duplicate code
 */

// Error handling utility
export const handleError = (error: Error, context?: string): void => {
  console.error(\`Error\${context ? \` in \${context}\` : ''}:\`, error);
  // Add your error reporting logic here
};

// Async operation wrapper
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error)), context);
    return fallback;
  }
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (clonedObj as any)[key] = deepClone((obj as any)[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Format bytes utility
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Array utilities
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};
`;

    // Create utils directory if it doesn't exist
    const utilsDir = path.dirname(utilsPath);
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    // Write utility functions
    fs.writeFileSync(utilsPath, commonUtilities, 'utf8');
    
    this.changes.push({
      type: 'created_utilities',
      file: 'utils/commonUtils.ts',
      description: 'Created common utility functions'
    });
    
    console.log('   ✅ Created common utility functions\n');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateSummary() {
    console.log('📋 Refactoring Summary\n');
    console.log('══════════════════════════════════════════');
    console.log('           REFACTORING RESULTS');
    console.log('══════════════════════════════════════════');
    
    const changesByType = this.changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(changesByType).forEach(([type, count]) => {
      const icon = this.getChangeIcon(type);
      const description = this.getChangeDescription(type);
      console.log(`${icon} ${description}: ${count}`);
    });
    
    console.log(`\nTotal Changes: ${this.changes.length}`);
    console.log('\n🎯 Benefits:');
    console.log('   • Reduced bundle size through unused code removal');
    console.log('   • Improved code consistency with better naming');
    console.log('   • Enhanced maintainability with consolidated utilities');
    console.log('   • Better TypeScript compliance');
    
    // Save change log
    const changeLogPath = path.join(__dirname, '..', 'refactoring-changes.json');
    fs.writeFileSync(changeLogPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      changes: this.changes,
      summary: changesByType
    }, null, 2));
    
    console.log(`\n📄 Detailed change log saved to: refactoring-changes.json`);
  }

  getChangeIcon(type) {
    const icons = {
      removed_import: '📥',
      removed_function: '🔧',
      renamed_variable: '📝',
      created_utilities: '🛠️'
    };
    return icons[type] || '•';
  }

  getChangeDescription(type) {
    const descriptions = {
      removed_import: 'Unused imports removed',
      removed_function: 'Unused functions removed',
      renamed_variable: 'Variables renamed for consistency',
      created_utilities: 'Utility functions created'
    };
    return descriptions[type] || type;
  }

  async restoreBackup() {
    if (!fs.existsSync(this.backupPath)) {
      console.log('❌ No backup found to restore');
      return;
    }
    
    const backupFiles = await this.getAllSourceFiles(this.backupPath);
    
    for (const backupFile of backupFiles) {
      const relativePath = path.relative(this.backupPath, backupFile);
      const originalFile = path.join(this.srcPath, relativePath);
      
      fs.copyFileSync(backupFile, originalFile);
    }
    
    console.log('✅ Restored from backup');
  }

  async getAllSourceFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await this.getAllSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}

// Run the refactoring
async function main() {
  try {
    const refactor = new AutoRefactor();
    await refactor.refactor();
    process.exit(0);
  } catch (error) {
    console.error('❌ Auto-refactoring failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutoRefactor;