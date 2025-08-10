/**
 * Image Optimization Script for RevEd Kids Frontend
 * Converts images to WebP format and creates responsive variants
 */

const fs = require('fs').promises;
const path = require('path');
const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const sharp = require('sharp');

class ImageOptimizer {
  constructor() {
    this.inputDir = path.join(__dirname, '../public/images');
    this.outputDir = path.join(__dirname, '../public/images/optimized');
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif'];
    this.responsiveSizes = [320, 640, 768, 1024, 1200, 1920];
    this.qualitySettings = {
      webp: { quality: 80 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.6, 0.8] },
    };
  }

  async initialize() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
    
    // Create subdirectories for different categories
    const categories = ['backgrounds', 'exercises', 'sparky', 'ui'];
    for (const category of categories) {
      const categoryDir = path.join(this.outputDir, category);
      try {
        await fs.access(categoryDir);
      } catch {
        await fs.mkdir(categoryDir, { recursive: true });
      }
    }
  }

  async getImageFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getImageFiles(fullPath);
          files.push(...subFiles);
        } else if (this.supportedFormats.includes(path.extname(entry.name).toLowerCase())) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
    
    return files;
  }

  async optimizeImage(inputPath) {
    const inputBuffer = await fs.readFile(inputPath);
    const relativePath = path.relative(this.inputDir, inputPath);
    const outputDir = path.join(this.outputDir, path.dirname(relativePath));
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = {
      original: inputPath,
      optimized: [],
      stats: {
        originalSize: inputBuffer.length,
        optimizedSize: 0,
        compressionRatio: 0,
        formats: [],
      }
    };

    try {
      // Get original image metadata
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      console.log(`📸 Processing: ${relativePath} (${originalWidth}x${originalHeight})`);

      // Generate responsive variants
      for (const size of this.responsiveSizes) {
        if (size >= originalWidth) continue; // Don't upscale

        const resizedBuffer = await sharp(inputBuffer)
          .resize(size, Math.round((originalHeight * size) / originalWidth), {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer();

        // WebP format
        const webpBuffer = await sharp(resizedBuffer)
          .webp(this.qualitySettings.webp)
          .toBuffer();
        
        const webpPath = path.join(outputDir, `${baseName}-${size}w.webp`);
        await fs.writeFile(webpPath, webpBuffer);
        
        results.optimized.push({
          path: webpPath,
          format: 'webp',
          width: size,
          size: webpBuffer.length,
        });

        // JPEG/PNG fallback
        const fallbackExt = metadata.format === 'png' ? '.png' : '.jpg';
        let fallbackBuffer;
        
        if (metadata.format === 'png') {
          fallbackBuffer = await sharp(resizedBuffer)
            .png({ quality: this.qualitySettings.pngquant.quality[1] * 100 })
            .toBuffer();
        } else {
          fallbackBuffer = await sharp(resizedBuffer)
            .jpeg({ quality: this.qualitySettings.mozjpeg.quality })
            .toBuffer();
        }
        
        const fallbackPath = path.join(outputDir, `${baseName}-${size}w${fallbackExt}`);
        await fs.writeFile(fallbackPath, fallbackBuffer);
        
        results.optimized.push({
          path: fallbackPath,
          format: fallbackExt.substring(1),
          width: size,
          size: fallbackBuffer.length,
        });
      }

      // Original size WebP
      const originalWebpBuffer = await sharp(inputBuffer)
        .webp(this.qualitySettings.webp)
        .toBuffer();
      
      const originalWebpPath = path.join(outputDir, `${baseName}.webp`);
      await fs.writeFile(originalWebpPath, originalWebpBuffer);
      
      results.optimized.push({
        path: originalWebpPath,
        format: 'webp',
        width: originalWidth,
        size: originalWebpBuffer.length,
      });

      // Calculate statistics
      results.stats.optimizedSize = results.optimized.reduce((sum, file) => sum + file.size, 0);
      results.stats.compressionRatio = ((results.stats.originalSize - results.stats.optimizedSize) / results.stats.originalSize) * 100;
      results.stats.formats = [...new Set(results.optimized.map(f => f.format))];

      console.log(`✅ Optimized: ${relativePath}`);
      console.log(`   📊 Size: ${this.formatBytes(results.stats.originalSize)} → ${this.formatBytes(results.stats.optimizedSize)}`);
      console.log(`   📉 Compression: ${results.stats.compressionRatio.toFixed(1)}%`);

    } catch (error) {
      console.error(`❌ Failed to optimize ${relativePath}:`, error.message);
    }

    return results;
  }

  async generateImageManifest(optimizationResults) {
    const manifest = {
      generated: new Date().toISOString(),
      images: {},
      stats: {
        totalImages: optimizationResults.length,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        totalSavings: 0,
        formats: {},
      }
    };

    for (const result of optimizationResults) {
      const relativePath = path.relative(this.inputDir, result.original);
      const baseName = path.basename(result.original, path.extname(result.original));
      
      manifest.images[relativePath] = {
        original: relativePath,
        variants: result.optimized.map(opt => ({
          path: path.relative(path.join(this.outputDir, '..'), opt.path),
          format: opt.format,
          width: opt.width,
          size: opt.size,
        })),
        stats: result.stats,
      };

      // Update global stats
      manifest.stats.totalOriginalSize += result.stats.originalSize;
      manifest.stats.totalOptimizedSize += result.stats.optimizedSize;
      
      for (const format of result.stats.formats) {
        manifest.stats.formats[format] = (manifest.stats.formats[format] || 0) + 1;
      }
    }

    manifest.stats.totalSavings = ((manifest.stats.totalOriginalSize - manifest.stats.totalOptimizedSize) / manifest.stats.totalOriginalSize) * 100;

    const manifestPath = path.join(this.outputDir, 'image-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('\n📋 Image Optimization Manifest Generated:');
    console.log(`   🖼️  Total Images: ${manifest.stats.totalImages}`);
    console.log(`   📊 Original Size: ${this.formatBytes(manifest.stats.totalOriginalSize)}`);
    console.log(`   📊 Optimized Size: ${this.formatBytes(manifest.stats.totalOptimizedSize)}`);
    console.log(`   💾 Total Savings: ${manifest.stats.totalSavings.toFixed(1)}%`);
    console.log(`   📁 Formats: ${Object.keys(manifest.stats.formats).join(', ')}`);

    return manifest;
  }

  async generateResponsiveImageComponent() {
    const componentCode = `
/**
 * ResponsiveImage Component
 * Automatically serves WebP when supported with fallbacks
 * Generated by image-optimizer.js
 */

import React, { useState, useRef, useEffect } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw',
  className = '',
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  // Generate srcSet for WebP and fallback formats
  const generateSrcSet = (baseSrc: string, format: 'webp' | 'jpg' | 'png') => {
    const baseName = baseSrc.replace(/\\.[^/.]+$/, '');
    const responsiveSizes = [320, 640, 768, 1024, 1200, 1920];
    
    return responsiveSizes
      .map(size => \`\${baseName}-\${size}w.\${format} \${size}w\`)
      .join(', ');
  };

  const baseSrc = src.replace(/\\.[^/.]+$/, '');
  const originalExt = src.split('.').pop()?.toLowerCase();
  
  if (hasError) {
    return (
      <div className={\`bg-gray-200 rounded flex items-center justify-center \${className}\`}>
        <span className="text-gray-400 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* WebP sources */}
      <source
        srcSet={generateSrcSet(baseSrc, 'webp')}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback sources */}
      <source
        srcSet={generateSrcSet(baseSrc, originalExt === 'png' ? 'png' : 'jpg')}
        sizes={sizes}
        type={\`image/\${originalExt === 'png' ? 'png' : 'jpeg'}\`}
      />
      
      {/* Fallback img */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : loading}
        className={\`transition-opacity duration-300 \${isLoaded ? 'opacity-100' : 'opacity-0'} \${className}\`}
        decoding="async"
      />
      
      {!isLoaded && (
        <div className={\`absolute inset-0 bg-gray-200 animate-pulse rounded \${className}\`} />
      )}
    </picture>
  );
};

export default ResponsiveImage;
`;

    const componentPath = path.join(__dirname, '../src/components/ui/ResponsiveImage.tsx');
    await fs.writeFile(componentPath, componentCode.trim());
    
    console.log('📱 Generated ResponsiveImage component');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    console.log('🚀 Starting Image Optimization...\n');
    
    await this.initialize();
    const imageFiles = await this.getImageFiles(this.inputDir);
    
    if (imageFiles.length === 0) {
      console.log('ℹ️  No images found to optimize');
      return;
    }

    console.log(`📸 Found ${imageFiles.length} images to optimize\n`);

    const results = [];
    for (const imagePath of imageFiles) {
      const result = await this.optimizeImage(imagePath);
      results.push(result);
    }

    await this.generateImageManifest(results);
    await this.generateResponsiveImageComponent();
    
    console.log('\n✨ Image optimization complete!');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new ImageOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = ImageOptimizer;