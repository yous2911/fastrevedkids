#!/usr/bin/env node

/**
 * Memory Analyzer Script
 * Detects potential memory leaks and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

class MemoryAnalyzer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.memoryIssues = [];
    this.potentialLeaks = [];
    this.optimizationOpportunities = [];
  }

  async analyze() {
    console.log('🧠 Analyzing code for memory issues...\n');
    
    await this.analyzeComponents();
    await this.analyzeHooks();
    await this.analyzeEventListeners();
    await this.analyzeThreeJS();
    await this.analyzeIntervals();
    await this.generateReport();
  }

  async analyzeComponents() {
    console.log('⚛️  Analyzing React components...');
    
    const componentFiles = await this.getFiles('**/*.{tsx,jsx}');
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcPath, file);
      
      // Check for missing cleanup in useEffect
      const useEffectMatches = content.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\},\s*\[(.*?)\]/g);
      if (useEffectMatches) {
        useEffectMatches.forEach((match, index) => {
          if (!match.includes('return') && 
              (match.includes('setInterval') || 
               match.includes('setTimeout') || 
               match.includes('addEventListener') ||
               match.includes('subscribe'))) {
            this.potentialLeaks.push({
              file: relativePath,
              type: 'missing_cleanup',
              line: this.getLineNumber(content, match),
              description: 'useEffect may be missing cleanup function',
              suggestion: 'Add return statement with cleanup logic'
            });
          }
        });
      }
      
      // Check for direct DOM manipulation without cleanup
      if (content.includes('document.addEventListener') && !content.includes('removeEventListener')) {
        this.potentialLeaks.push({
          file: relativePath,
          type: 'event_listener_leak',
          description: 'Direct DOM event listener without removal',
          suggestion: 'Add removeEventListener in cleanup function'
        });
      }
      
      // Check for large state objects
      const stateMatches = content.match(/useState\s*\(\s*\{[\s\S]*?\}\s*\)/g);
      if (stateMatches) {
        stateMatches.forEach(match => {
          if (match.length > 500) { // Large state object
            this.optimizationOpportunities.push({
              file: relativePath,
              type: 'large_state',
              description: 'Large initial state object detected',
              suggestion: 'Consider breaking down state or using useReducer'
            });
          }
        });
      }
      
      // Check for inline functions in JSX
      const inlineFunctionMatches = content.match(/\w+={[\s]*\([^)]*\)\s*=>/g);
      if (inlineFunctionMatches && inlineFunctionMatches.length > 3) {
        this.optimizationOpportunities.push({
          file: relativePath,
          type: 'inline_functions',
          count: inlineFunctionMatches.length,
          description: 'Multiple inline functions in JSX props',
          suggestion: 'Use useCallback to memoize functions'
        });
      }
    }
    
    console.log(`   Analyzed ${componentFiles.length} component files\n`);
  }

  async analyzeHooks() {
    console.log('🎣 Analyzing custom hooks...');
    
    const hookFiles = await this.getFiles('**/use*.{ts,tsx}');
    
    for (const file of hookFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcPath, file);
      
      // Check for missing dependencies in useEffect/useCallback/useMemo
      const dependencyIssues = this.checkDependencyArrays(content);
      dependencyIssues.forEach(issue => {
        this.memoryIssues.push({
          file: relativePath,
          type: 'dependency_array',
          ...issue
        });
      });
      
      // Check for refs that might not be cleaned up
      if (content.includes('useRef') && content.includes('.current') && 
          !content.includes('cleanup') && !content.includes('dispose')) {
        this.potentialLeaks.push({
          file: relativePath,
          type: 'ref_cleanup',
          description: 'useRef might need manual cleanup',
          suggestion: 'Ensure ref cleanup in useEffect return function'
        });
      }
    }
    
    console.log(`   Analyzed ${hookFiles.length} hook files\n`);
  }

  async analyzeEventListeners() {
    console.log('👂 Analyzing event listeners...');
    
    const files = await this.getFiles('**/*.{ts,tsx,js,jsx}');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcPath, file);
      
      const addListenerMatches = content.match(/addEventListener\s*\(/g) || [];
      const removeListenerMatches = content.match(/removeEventListener\s*\(/g) || [];
      
      if (addListenerMatches.length > removeListenerMatches.length) {
        this.potentialLeaks.push({
          file: relativePath,
          type: 'unbalanced_listeners',
          added: addListenerMatches.length,
          removed: removeListenerMatches.length,
          description: 'More addEventListener than removeEventListener calls',
          suggestion: 'Ensure all event listeners are properly removed'
        });
      }
      
      // Check for global event listeners
      if (content.includes('window.addEventListener') || content.includes('document.addEventListener')) {
        if (!content.includes('removeEventListener')) {
          this.potentialLeaks.push({
            file: relativePath,
            type: 'global_listener_leak',
            description: 'Global event listener without cleanup',
            suggestion: 'Add cleanup function to remove global listeners'
          });
        }
      }
    }
    
    console.log('   Event listener analysis complete\n');
  }

  async analyzeThreeJS() {
    console.log('🎮 Analyzing Three.js usage...');
    
    const files = await this.getFiles('**/*.{ts,tsx,js,jsx}');
    const threeJSFiles = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('three') || content.includes('THREE')) {
        threeJSFiles.push(file);
        const relativePath = path.relative(this.srcPath, file);
        
        // Check for dispose calls
        const hasDispose = content.includes('.dispose()') || content.includes('dispose');
        const hasGeometry = content.includes('Geometry') || content.includes('geometry');
        const hasMaterial = content.includes('Material') || content.includes('material');
        const hasTexture = content.includes('Texture') || content.includes('texture');
        
        if ((hasGeometry || hasMaterial || hasTexture) && !hasDispose) {
          this.potentialLeaks.push({
            file: relativePath,
            type: 'threejs_no_dispose',
            description: 'Three.js objects created but no dispose() calls found',
            suggestion: 'Add dispose() calls for geometries, materials, and textures'
          });
        }
        
        // Check for renderer cleanup
        if (content.includes('WebGLRenderer') && !content.includes('dispose')) {
          this.potentialLeaks.push({
            file: relativePath,
            type: 'threejs_renderer_leak',
            description: 'WebGLRenderer created without proper disposal',
            suggestion: 'Call renderer.dispose() and renderer.forceContextLoss() in cleanup'
          });
        }
        
        // Check for animation loops without cleanup
        if (content.includes('requestAnimationFrame') && !content.includes('cancelAnimationFrame')) {
          this.potentialLeaks.push({
            file: relativePath,
            type: 'animation_loop_leak',
            description: 'Animation loop without cancellation',
            suggestion: 'Use cancelAnimationFrame in cleanup function'
          });
        }
      }
    }
    
    console.log(`   Analyzed ${threeJSFiles.length} Three.js files\n`);
  }

  async analyzeIntervals() {
    console.log('⏰ Analyzing intervals and timeouts...');
    
    const files = await this.getFiles('**/*.{ts,tsx,js,jsx}');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.srcPath, file);
      
      const setIntervalMatches = content.match(/setInterval\s*\(/g) || [];
      const clearIntervalMatches = content.match(/clearInterval\s*\(/g) || [];
      const setTimeoutMatches = content.match(/setTimeout\s*\(/g) || [];
      const clearTimeoutMatches = content.match(/clearTimeout\s*\(/g) || [];
      
      if (setIntervalMatches.length > clearIntervalMatches.length) {
        this.potentialLeaks.push({
          file: relativePath,
          type: 'interval_leak',
          set: setIntervalMatches.length,
          clear: clearIntervalMatches.length,
          description: 'More setInterval than clearInterval calls',
          suggestion: 'Ensure all intervals are cleared in cleanup'
        });
      }
      
      if (setTimeoutMatches.length > clearTimeoutMatches.length) {
        this.optimizationOpportunities.push({
          file: relativePath,
          type: 'timeout_optimization',
          set: setTimeoutMatches.length,
          clear: clearTimeoutMatches.length,
          description: 'Consider clearing long-running timeouts',
          suggestion: 'Clear timeouts in component cleanup if they haven\'t fired'
        });
      }
    }
    
    console.log('   Interval/timeout analysis complete\n');
  }

  async generateReport() {
    console.log('📋 Generating memory analysis report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.memoryIssues.length,
        potentialLeaks: this.potentialLeaks.length,
        optimizationOpportunities: this.optimizationOpportunities.length,
        riskLevel: this.calculateRiskLevel()
      },
      issues: this.memoryIssues,
      leaks: this.potentialLeaks,
      optimizations: this.optimizationOpportunities,
      recommendations: this.generateRecommendations()
    };
    
    // Write detailed report
    const reportPath = path.join(__dirname, '..', 'memory-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    this.displaySummary(report);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  displaySummary(report) {
    console.log('══════════════════════════════════════════');
    console.log('          MEMORY ANALYSIS SUMMARY');
    console.log('══════════════════════════════════════════');
    console.log(`Risk Level: ${this.getRiskIcon(report.summary.riskLevel)} ${report.summary.riskLevel.toUpperCase()}`);
    console.log(`Potential Leaks: ${report.summary.potentialLeaks}`);
    console.log(`Memory Issues: ${report.summary.totalIssues}`);
    console.log(`Optimization Opportunities: ${report.summary.optimizationOpportunities}`);
    console.log();
    
    if (report.summary.potentialLeaks === 0 && report.summary.totalIssues === 0) {
      console.log('✅ No critical memory issues found!');
      return;
    }
    
    console.log('🚨 Critical Issues:');
    const criticalIssues = this.potentialLeaks
      .filter(leak => this.isHighPriority(leak))
      .slice(0, 5);
    
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.description}`);
      console.log(`      📁 File: ${issue.file}`);
      console.log(`      💡 ${issue.suggestion}`);
      console.log();
    });
    
    console.log('⚡ Top Optimization Opportunities:');
    this.optimizationOpportunities.slice(0, 3).forEach((opt, index) => {
      console.log(`   ${index + 1}. ${opt.description}`);
      console.log(`      📁 File: ${opt.file}`);
      console.log(`      💡 ${opt.suggestion}`);
      console.log();
    });
  }

  // Helper methods
  async getFiles(pattern) {
    const files = [];
    const entries = fs.readdirSync(this.srcPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(this.srcPath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await this.getFilesRecursive(fullPath, pattern));
      } else if (entry.isFile() && this.matchesPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async getFilesRecursive(dir, pattern) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await this.getFilesRecursive(fullPath, pattern));
      } else if (entry.isFile() && this.matchesPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  matchesPattern(filename, pattern) {
    // Simple pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\{([^}]+)\}/g, '($1)')
      .replace(/,/g, '|')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^.*${regexPattern}$`);
    return regex.test(filename);
  }

  checkDependencyArrays(content) {
    const issues = [];
    
    // This is a simplified check - real implementation would use AST parsing
    const hookMatches = content.match(/(useEffect|useCallback|useMemo)\s*\([^,]+,\s*\[(.*?)\]/g);
    
    if (hookMatches) {
      hookMatches.forEach((match, index) => {
        const dependencyArray = match.match(/\[(.*?)\]/)?.[1]?.trim();
        
        // Check for empty dependency array with external references
        if (dependencyArray === '' && 
            (match.includes('props.') || match.includes('state.') || match.includes('ref.'))) {
          issues.push({
            line: index + 1,
            description: 'Missing dependencies in dependency array',
            suggestion: 'Add missing dependencies or use useCallback for functions'
          });
        }
      });
    }
    
    return issues;
  }

  getLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return -1;
  }

  calculateRiskLevel() {
    const criticalCount = this.potentialLeaks.filter(leak => this.isHighPriority(leak)).length;
    const totalIssues = this.memoryIssues.length + this.potentialLeaks.length;
    
    if (criticalCount >= 3) return 'high';
    if (totalIssues >= 10) return 'medium';
    if (totalIssues >= 5) return 'low';
    return 'minimal';
  }

  isHighPriority(issue) {
    const highPriorityTypes = [
      'threejs_no_dispose',
      'threejs_renderer_leak',
      'global_listener_leak',
      'interval_leak',
      'animation_loop_leak'
    ];
    
    return highPriorityTypes.includes(issue.type);
  }

  getRiskIcon(level) {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
      minimal: '✅'
    };
    
    return icons[level] || '⚪';
  }

  generateRecommendations() {
    const recommendations = [
      'Use the useMemoryManagement hook for automatic cleanup',
      'Implement useMemorySafeInterval for safer intervals',
      'Use ThreeJSMemoryManager for WebGL resource management',
      'Enable memory leak detector in development',
      'Consider using React.memo for expensive components',
      'Implement lazy loading for heavy components',
      'Use object pooling for frequently created objects'
    ];
    
    return recommendations;
  }
}

// Run the analyzer
async function main() {
  try {
    const analyzer = new MemoryAnalyzer();
    await analyzer.analyze();
    process.exit(0);
  } catch (error) {
    console.error('❌ Memory analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MemoryAnalyzer;