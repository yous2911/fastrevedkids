/**
 * Production Build Verification Script for RevEd Kids Frontend
 * Validates build output, checks performance budgets, and ensures production readiness
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProductionVerifier {
  constructor() {
    this.buildDir = path.join(__dirname, '../build');
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
    this.budgets = {
      bundleSize: 3 * 1024 * 1024, // 3MB
      chunkSize: 1024 * 1024, // 1MB
      imageSize: 200 * 1024, // 200KB
      totalAssets: 10 * 1024 * 1024, // 10MB
    };
  }

  async run() {
    console.log('🚀 Starting Production Build Verification...\n');
    
    try {
      // Core verification tests
      await this.verifyBuildExists();
      await this.verifyBundleSizes();
      await this.verifyAssetOptimization();
      await this.verifySecurityHeaders();
      await this.verifyServiceWorker();
      await this.verifyPWAManifest();
      await this.verifyAccessibility();
      await this.verifyPerformanceBudgets();
      await this.verifyEnvironmentConfig();
      await this.verifySEOOptimization();
      await this.verifyCompression();
      await this.verifySourceMaps();
      await this.verifyThreeJSOptimization();
      await this.verifyAudioOptimization();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  }

  async verifyBuildExists() {
    this.startTest('Build Directory Exists');
    
    try {
      const buildStat = await fs.stat(this.buildDir);
      if (!buildStat.isDirectory()) {
        throw new Error('Build directory is not a directory');
      }
      
      // Check for essential files
      const essentialFiles = ['index.html', 'static/js', 'static/css'];
      for (const file of essentialFiles) {
        const filePath = path.join(this.buildDir, file);
        await fs.access(filePath);
      }
      
      this.passTest('Build directory and essential files exist');
    } catch (error) {
      this.failTest(`Build verification failed: ${error.message}`);
    }
  }

  async verifyBundleSizes() {
    this.startTest('Bundle Size Verification');
    
    try {
      const jsDir = path.join(this.buildDir, 'static/js');
      const jsFiles = await fs.readdir(jsDir);
      
      let totalSize = 0;
      const chunks = [];
      
      for (const file of jsFiles) {
        if (file.endsWith('.js') && !file.includes('.map')) {
          const filePath = path.join(jsDir, file);
          const stat = await fs.stat(filePath);
          const size = stat.size;
          totalSize += size;
          
          chunks.push({ file, size });
          
          // Check individual chunk size
          if (size > this.budgets.chunkSize) {
            this.warnTest(`Large chunk detected: ${file} (${this.formatBytes(size)})`);
          }
        }
      }
      
      if (totalSize > this.budgets.bundleSize) {
        this.failTest(`Total bundle size exceeds budget: ${this.formatBytes(totalSize)} > ${this.formatBytes(this.budgets.bundleSize)}`);
      } else {
        this.passTest(`Bundle size within budget: ${this.formatBytes(totalSize)}`);
      }
      
      // Log chunk breakdown
      console.log('   📦 Chunk breakdown:');
      chunks.forEach(chunk => {
        console.log(`      ${chunk.file}: ${this.formatBytes(chunk.size)}`);
      });
      
    } catch (error) {
      this.failTest(`Bundle size verification failed: ${error.message}`);
    }
  }

  async verifyAssetOptimization() {
    this.startTest('Asset Optimization');
    
    try {
      const staticDir = path.join(this.buildDir, 'static');
      const assetChecks = {
        webp: 0,
        images: 0,
        compression: 0,
        largeImages: 0,
      };
      
      await this.walkDirectory(staticDir, async (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const stat = await fs.stat(filePath);
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          assetChecks.images++;
          
          if (ext === '.webp') {
            assetChecks.webp++;
          }
          
          if (stat.size > this.budgets.imageSize) {
            assetChecks.largeImages++;
            this.warnTest(`Large image: ${path.relative(this.buildDir, filePath)} (${this.formatBytes(stat.size)})`);
          }
        }
        
        // Check for compressed assets
        if (filePath.endsWith('.gz') || filePath.endsWith('.br')) {
          assetChecks.compression++;
        }
      });
      
      // Verify optimizations
      if (assetChecks.webp === 0 && assetChecks.images > 0) {
        this.warnTest('No WebP images found - consider implementing WebP optimization');
      }
      
      if (assetChecks.compression === 0) {
        this.warnTest('No compressed assets found - ensure compression is enabled');
      }
      
      if (assetChecks.largeImages > 0) {
        this.warnTest(`${assetChecks.largeImages} large images detected`);
      }
      
      this.passTest(`Asset optimization checked: ${assetChecks.images} images, ${assetChecks.webp} WebP, ${assetChecks.compression} compressed`);
      
    } catch (error) {
      this.failTest(`Asset optimization verification failed: ${error.message}`);
    }
  }

  async verifySecurityHeaders() {
    this.startTest('Security Headers');
    
    try {
      const indexPath = path.join(this.buildDir, 'index.html');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      const securityChecks = {
        csp: indexContent.includes('Content-Security-Policy'),
        xss: indexContent.includes('X-XSS-Protection'),
        nosniff: indexContent.includes('X-Content-Type-Options'),
        frameOptions: indexContent.includes('X-Frame-Options'),
      };
      
      const passedChecks = Object.values(securityChecks).filter(Boolean).length;
      const totalChecks = Object.keys(securityChecks).length;
      
      if (passedChecks === totalChecks) {
        this.passTest('All security headers present');
      } else {
        this.warnTest(`${passedChecks}/${totalChecks} security headers present`);
      }
      
    } catch (error) {
      this.failTest(`Security headers verification failed: ${error.message}`);
    }
  }

  async verifyServiceWorker() {
    this.startTest('Service Worker');
    
    try {
      const swPath = path.join(this.buildDir, 'service-worker.js');
      await fs.access(swPath);
      
      const swContent = await fs.readFile(swPath, 'utf-8');
      
      // Check for essential SW features
      const swChecks = {
        precaching: swContent.includes('precache'),
        caching: swContent.includes('cache'),
        offline: swContent.includes('offline'),
        sync: swContent.includes('sync'),
      };
      
      const passedChecks = Object.values(swChecks).filter(Boolean).length;
      
      if (passedChecks >= 3) {
        this.passTest(`Service Worker configured with ${passedChecks}/4 features`);
      } else {
        this.warnTest(`Service Worker missing features: ${passedChecks}/4`);
      }
      
    } catch (error) {
      this.warnTest(`Service Worker verification failed: ${error.message}`);
    }
  }

  async verifyPWAManifest() {
    this.startTest('PWA Manifest');
    
    try {
      const manifestPath = path.join(this.buildDir, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length === 0) {
        this.passTest('PWA manifest complete');
      } else {
        this.warnTest(`PWA manifest missing fields: ${missingFields.join(', ')}`);
      }
      
      // Check icons
      if (manifest.icons && manifest.icons.length >= 2) {
        this.passTest('PWA icons configured');
      } else {
        this.warnTest('Insufficient PWA icons');
      }
      
    } catch (error) {
      this.failTest(`PWA manifest verification failed: ${error.message}`);
    }
  }

  async verifyAccessibility() {
    this.startTest('Accessibility');
    
    try {
      const indexPath = path.join(this.buildDir, 'index.html');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      const a11yChecks = {
        lang: indexContent.includes('lang='),
        viewport: indexContent.includes('viewport'),
        title: indexContent.includes('<title>'),
        skipLinks: indexContent.includes('skip') || indexContent.includes('SkipLinks'),
      };
      
      const passedChecks = Object.values(a11yChecks).filter(Boolean).length;
      
      if (passedChecks >= 3) {
        this.passTest(`Accessibility basics configured: ${passedChecks}/4`);
      } else {
        this.warnTest(`Accessibility issues: ${passedChecks}/4 checks passed`);
      }
      
    } catch (error) {
      this.failTest(`Accessibility verification failed: ${error.message}`);
    }
  }

  async verifyPerformanceBudgets() {
    this.startTest('Performance Budgets');
    
    try {
      let totalSize = 0;
      
      await this.walkDirectory(path.join(this.buildDir, 'static'), async (filePath) => {
        const stat = await fs.stat(filePath);
        totalSize += stat.size;
      });
      
      if (totalSize > this.budgets.totalAssets) {
        this.failTest(`Total assets exceed budget: ${this.formatBytes(totalSize)} > ${this.formatBytes(this.budgets.totalAssets)}`);
      } else {
        this.passTest(`Asset budget maintained: ${this.formatBytes(totalSize)}`);
      }
      
    } catch (error) {
      this.failTest(`Performance budget verification failed: ${error.message}`);
    }
  }

  async verifyEnvironmentConfig() {
    this.startTest('Environment Configuration');
    
    try {
      const staticJsDir = path.join(this.buildDir, 'static/js');
      const jsFiles = await fs.readdir(staticJsDir);
      
      // Check that development code is not included
      let hasDevCode = false;
      
      for (const file of jsFiles) {
        if (file.endsWith('.js') && !file.includes('.map')) {
          const filePath = path.join(staticJsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Check for dev-only code
          if (content.includes('console.log') && !content.includes('production')) {
            hasDevCode = true;
          }
        }
      }
      
      if (hasDevCode) {
        this.warnTest('Development console.log statements detected in production build');
      } else {
        this.passTest('No development code detected in production build');
      }
      
    } catch (error) {
      this.failTest(`Environment configuration verification failed: ${error.message}`);
    }
  }

  async verifySEOOptimization() {
    this.startTest('SEO Optimization');
    
    try {
      const indexPath = path.join(this.buildDir, 'index.html');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      const seoChecks = {
        title: indexContent.includes('<title>') && !indexContent.includes('<title>React App</title>'),
        description: indexContent.includes('meta name="description"'),
        openGraph: indexContent.includes('property="og:'),
        twitter: indexContent.includes('property="twitter:'),
        structuredData: indexContent.includes('application/ld+json'),
      };
      
      const passedChecks = Object.values(seoChecks).filter(Boolean).length;
      
      if (passedChecks >= 4) {
        this.passTest(`SEO optimization complete: ${passedChecks}/5`);
      } else {
        this.warnTest(`SEO optimization incomplete: ${passedChecks}/5`);
      }
      
    } catch (error) {
      this.failTest(`SEO optimization verification failed: ${error.message}`);
    }
  }

  async verifyCompression() {
    this.startTest('Asset Compression');
    
    try {
      const staticDir = path.join(this.buildDir, 'static');
      let gzipFiles = 0;
      let brotliFiles = 0;
      
      await this.walkDirectory(staticDir, async (filePath) => {
        if (filePath.endsWith('.gz')) gzipFiles++;
        if (filePath.endsWith('.br')) brotliFiles++;
      });
      
      if (gzipFiles > 0 && brotliFiles > 0) {
        this.passTest(`Compression enabled: ${gzipFiles} gzip, ${brotliFiles} brotli files`);
      } else if (gzipFiles > 0 || brotliFiles > 0) {
        this.warnTest(`Partial compression: ${gzipFiles} gzip, ${brotliFiles} brotli files`);
      } else {
        this.warnTest('No compressed assets found');
      }
      
    } catch (error) {
      this.failTest(`Compression verification failed: ${error.message}`);
    }
  }

  async verifySourceMaps() {
    this.startTest('Source Maps');
    
    try {
      const jsDir = path.join(this.buildDir, 'static/js');
      const jsFiles = await fs.readdir(jsDir);
      
      const mapFiles = jsFiles.filter(file => file.endsWith('.map')).length;
      const jsFileCount = jsFiles.filter(file => file.endsWith('.js') && !file.endsWith('.map')).length;
      
      if (mapFiles === 0) {
        this.passTest('Source maps disabled in production (recommended)');
      } else if (mapFiles < jsFileCount) {
        this.warnTest(`Partial source maps: ${mapFiles}/${jsFileCount} files`);
      } else {
        this.warnTest('Source maps enabled in production (security risk)');
      }
      
    } catch (error) {
      this.failTest(`Source map verification failed: ${error.message}`);
    }
  }

  async verifyThreeJSOptimization() {
    this.startTest('Three.js Optimization');
    
    try {
      const jsDir = path.join(this.buildDir, 'static/js');
      const jsFiles = await fs.readdir(jsDir);
      
      let threeJsChunk = null;
      
      for (const file of jsFiles) {
        if (file.includes('three') || file.includes('3d')) {
          const filePath = path.join(jsDir, file);
          const stat = await fs.stat(filePath);
          threeJsChunk = { file, size: stat.size };
          break;
        }
      }
      
      if (threeJsChunk) {
        if (threeJsChunk.size < 500 * 1024) { // 500KB
          this.passTest(`Three.js chunk optimized: ${this.formatBytes(threeJsChunk.size)}`);
        } else {
          this.warnTest(`Large Three.js chunk: ${this.formatBytes(threeJsChunk.size)}`);
        }
      } else {
        this.passTest('Three.js chunk not found (may be tree-shaken)');
      }
      
    } catch (error) {
      this.failTest(`Three.js optimization verification failed: ${error.message}`);
    }
  }

  async verifyAudioOptimization() {
    this.startTest('Audio Optimization');
    
    try {
      const soundsDir = path.join(this.buildDir, 'sounds');
      
      try {
        await fs.access(soundsDir);
        
        let audioFiles = 0;
        let largeAudioFiles = 0;
        
        await this.walkDirectory(soundsDir, async (filePath) => {
          const ext = path.extname(filePath).toLowerCase();
          if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
            audioFiles++;
            const stat = await fs.stat(filePath);
            if (stat.size > 500 * 1024) { // 500KB
              largeAudioFiles++;
            }
          }
        });
        
        if (largeAudioFiles === 0) {
          this.passTest(`Audio files optimized: ${audioFiles} files`);
        } else {
          this.warnTest(`${largeAudioFiles} large audio files detected`);
        }
        
      } catch {
        this.passTest('No audio files to optimize');
      }
      
    } catch (error) {
      this.failTest(`Audio optimization verification failed: ${error.message}`);
    }
  }

  async walkDirectory(dir, callback) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, callback);
      } else {
        await callback(fullPath);
      }
    }
  }

  startTest(name) {
    console.log(`🔍 ${name}...`);
  }

  passTest(message) {
    console.log(`   ✅ ${message}`);
    this.results.passed++;
    this.results.tests.push({ name: message, status: 'pass' });
  }

  warnTest(message) {
    console.log(`   ⚠️  ${message}`);
    this.results.warnings++;
    this.results.tests.push({ name: message, status: 'warning' });
  }

  failTest(message) {
    console.log(`   ❌ ${message}`);
    this.results.failed++;
    this.results.tests.push({ name: message, status: 'fail' });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateReport() {
    console.log('\n📊 Production Build Verification Report');
    console.log('========================================');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = ((this.results.passed + this.results.warnings) / total * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Build verification failed! Please fix the following issues:');
      this.results.tests
        .filter(test => test.status === 'fail')
        .forEach(test => console.log(`   • ${test.name}`));
      
      process.exit(1);
    } else if (this.results.warnings > 0) {
      console.log('\n⚠️  Build verification passed with warnings. Consider addressing:');
      this.results.tests
        .filter(test => test.status === 'warning')
        .forEach(test => console.log(`   • ${test.name}`));
    } else {
      console.log('\n✅ All tests passed! Build is production ready.');
    }
    
    // Save report to file
    const reportPath = path.join(this.buildDir, 'verification-report.json');
    fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      buildSize: this.formatBytes(this.getBuildSize()),
    }, null, 2)).then(() => {
      console.log(`\n📄 Report saved to: ${reportPath}`);
    });
  }

  getBuildSize() {
    try {
      const result = execSync(`du -sb "${this.buildDir}"`, { encoding: 'utf-8' });
      return parseInt(result.split('\t')[0]);
    } catch {
      return 0;
    }
  }
}

// Run verification
if (require.main === module) {
  const verifier = new ProductionVerifier();
  verifier.run().catch(console.error);
}

module.exports = ProductionVerifier;