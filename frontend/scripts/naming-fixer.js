#!/usr/bin/env node

/**
 * Naming Convention Fixer
 * Fixes common naming issues while preserving functionality
 */

const fs = require('fs');
const path = require('path');

class NamingFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixes = [];
  }

  async fix() {
    console.log('📝 Fixing naming conventions...\n');
    
    await this.fixFileNaming();
    await this.fixConstantNaming();
    await this.fixEventHandlerNaming();
    await this.fixTypeNaming();
    
    this.generateSummary();
  }

  async fixFileNaming() {
    console.log('📂 Fixing file naming conventions...');
    
    const files = await this.getAllFiles(this.srcPath);
    let fixed = 0;
    
    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      const dirName = path.dirname(file);
      const ext = path.extname(file);
      
      let suggestedName = fileName;
      let shouldRename = false;
      
      // Component files should use PascalCase
      if (dirName.includes('components') || dirName.includes('pages')) {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(fileName) && !fileName.includes('index')) {
          suggestedName = this.toPascalCase(fileName);
          shouldRename = true;
        }
      }
      
      // Utility files should use camelCase
      else if (dirName.includes('utils') || dirName.includes('hooks')) {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(fileName) && 
            !fileName.includes('index') && 
            !fileName.includes('.test') && 
            !fileName.includes('.spec')) {
          suggestedName = this.toCamelCase(fileName);
          shouldRename = true;
        }
      }
      
      if (shouldRename && suggestedName !== fileName) {
        console.log(`   📄 ${fileName}${ext} → ${suggestedName}${ext}`);
        fixed++;
        
        this.fixes.push({
          type: 'file_rename',
          from: fileName + ext,
          to: suggestedName + ext,
          path: path.relative(this.srcPath, dirName)
        });
      }
    }
    
    console.log(`   ✅ Found ${fixed} files with naming issues\n`);
  }

  async fixConstantNaming() {
    console.log('🔤 Fixing constant naming...');
    
    const files = await this.getAllFiles(this.srcPath);
    let fixed = 0;
    
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
      
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix constants that should use SCREAMING_SNAKE_CASE
      const constantPattern = /(?:const|let)\s+([a-z][a-zA-Z0-9]*)\s*=\s*(?:'[^']*'|"[^"]*"|\d+|true|false|\[|\{)/g;
      let match;
      
      while ((match = constantPattern.exec(originalContent)) !== null) {
        const constantName = match[1];
        
        // Skip if it's clearly not a constant
        if (constantName.includes('element') || 
            constantName.includes('component') ||
            constantName.includes('ref') ||
            constantName.includes('state')) continue;
        
        // Check if it's used as a constant (not reassigned)
        const usageRegex = new RegExp(`\\b${constantName}\\s*=(?!=)`, 'g');
        const assignments = (originalContent.match(usageRegex) || []).length;
        
        if (assignments === 1) { // Only the declaration
          const suggestedName = this.toScreamingSnakeCase(constantName);
          
          if (suggestedName !== constantName && suggestedName.length > 3) {
            content = content.replace(
              new RegExp(`\\b${constantName}\\b`, 'g'),
              suggestedName
            );
            
            this.fixes.push({
              type: 'constant_rename',
              from: constantName,
              to: suggestedName,
              file: path.relative(this.srcPath, file)
            });
          }
        }
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixed++;
      }
    }
    
    console.log(`   ✅ Fixed ${fixed} files with constant naming issues\n`);
  }

  async fixEventHandlerNaming() {
    console.log('⚡ Fixing event handler naming...');
    
    const files = await this.getAllFiles(this.srcPath);
    let fixed = 0;
    
    for (const file of files) {
      if (!file.endsWith('.tsx')) continue;
      
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix event handlers that don't follow handle* or on* convention
      const eventHandlerPattern = /(const|let)\s+([a-z][a-zA-Z0-9]*(?:Click|Change|Submit|Focus|Blur|Input|KeyDown|KeyUp|MouseOver|MouseOut))\s*=/g;
      
      content = content.replace(eventHandlerPattern, (match, declaration, handlerName) => {
        if (!handlerName.startsWith('handle') && !handlerName.startsWith('on')) {
          const suggestedName = 'handle' + this.capitalizeFirst(handlerName);
          
          // Replace all occurrences in the file
          const handlerRegex = new RegExp(`\\b${handlerName}\\b`, 'g');
          content = content.replace(handlerRegex, suggestedName);
          
          this.fixes.push({
            type: 'event_handler_rename',
            from: handlerName,
            to: suggestedName,
            file: path.relative(this.srcPath, file)
          });
          
          return `${declaration} ${suggestedName}=`;
        }
        return match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixed++;
      }
    }
    
    console.log(`   ✅ Fixed ${fixed} files with event handler naming issues\n`);
  }

  async fixTypeNaming() {
    console.log('🏷️ Fixing type naming...');
    
    const files = await this.getAllFiles(this.srcPath);
    let fixed = 0;
    
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
      
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix interface names that don't start with 'I' or use PascalCase
      const interfacePattern = /interface\s+([a-z][a-zA-Z0-9]*)/g;
      
      content = content.replace(interfacePattern, (match, interfaceName) => {
        let suggestedName = this.toPascalCase(interfaceName);
        
        // Add 'I' prefix if not present and interface is not a Props/State interface
        if (!suggestedName.startsWith('I') && 
            !suggestedName.endsWith('Props') && 
            !suggestedName.endsWith('State') &&
            !suggestedName.endsWith('Config') &&
            !suggestedName.endsWith('Options')) {
          suggestedName = 'I' + suggestedName;
        }
        
        if (suggestedName !== interfaceName) {
          // Replace all occurrences in the file
          const typeRegex = new RegExp(`\\b${interfaceName}\\b`, 'g');
          content = content.replace(typeRegex, suggestedName);
          
          this.fixes.push({
            type: 'interface_rename',
            from: interfaceName,
            to: suggestedName,
            file: path.relative(this.srcPath, file)
          });
          
          return `interface ${suggestedName}`;
        }
        
        return match;
      });
      
      // Fix type alias names
      const typePattern = /type\s+([a-z][a-zA-Z0-9]*)\s*=/g;
      
      content = content.replace(typePattern, (match, typeName) => {
        const suggestedName = this.toPascalCase(typeName);
        
        if (suggestedName !== typeName) {
          const typeRegex = new RegExp(`\\b${typeName}\\b`, 'g');
          content = content.replace(typeRegex, suggestedName);
          
          this.fixes.push({
            type: 'type_rename',
            from: typeName,
            to: suggestedName,
            file: path.relative(this.srcPath, file)
          });
          
          return `type ${suggestedName} =`;
        }
        
        return match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixed++;
      }
    }
    
    console.log(`   ✅ Fixed ${fixed} files with type naming issues\n`);
  }

  // Naming conversion utilities
  toCamelCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[a-z]/, char => char.toUpperCase());
  }

  toScreamingSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toUpperCase();
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await this.getAllFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  generateSummary() {
    console.log('📋 Naming Convention Fix Summary\n');
    console.log('══════════════════════════════════════════');
    console.log('       NAMING CONVENTION FIXES');
    console.log('══════════════════════════════════════════');
    
    const fixesByType = this.fixes.reduce((acc, fix) => {
      acc[fix.type] = (acc[fix.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(fixesByType).forEach(([type, count]) => {
      const icon = this.getFixIcon(type);
      const description = this.getFixDescription(type);
      console.log(`${icon} ${description}: ${count}`);
    });
    
    console.log(`\nTotal Fixes: ${this.fixes.length}`);
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 Recent Fixes:');
      this.fixes.slice(0, 10).forEach(fix => {
        console.log(`   • ${fix.from} → ${fix.to} (${fix.type})`);
      });
      
      if (this.fixes.length > 10) {
        console.log(`   ... and ${this.fixes.length - 10} more`);
      }
    }
    
    console.log('\n✨ Benefits:');
    console.log('   • Improved code readability and consistency');
    console.log('   • Better adherence to TypeScript/React conventions');
    console.log('   • Enhanced developer experience');
    console.log('   • Easier code maintenance and collaboration');
    
    // Save detailed fix log
    const logPath = path.join(__dirname, '..', 'naming-fixes.json');
    fs.writeFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      fixes: this.fixes,
      summary: fixesByType
    }, null, 2));
    
    console.log(`\n📄 Detailed fix log saved to: naming-fixes.json`);
  }

  getFixIcon(type) {
    const icons = {
      file_rename: '📄',
      constant_rename: '🔤',
      event_handler_rename: '⚡',
      interface_rename: '🏷️',
      type_rename: '🏷️'
    };
    return icons[type] || '🔧';
  }

  getFixDescription(type) {
    const descriptions = {
      file_rename: 'Files renamed',
      constant_rename: 'Constants fixed',
      event_handler_rename: 'Event handlers renamed',
      interface_rename: 'Interfaces renamed',
      type_rename: 'Types renamed'
    };
    return descriptions[type] || type;
  }
}

// Run the naming fixer
async function main() {
  try {
    const fixer = new NamingFixer();
    await fixer.fix();
    process.exit(0);
  } catch (error) {
    console.error('❌ Naming convention fixing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = NamingFixer;