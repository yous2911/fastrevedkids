/**
 * Service de validation de fichiers avec vérification magic bytes
 * Protection contre l'upload de fichiers malveillants
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedType?: string;
  errors: string[];
  warnings: string[];
}

export interface MagicBytesSignature {
  extension: string;
  mimeType: string;
  signatures: number[][];
  maxSize?: number;
}

export class FileValidationService {
  
  // Signatures magic bytes pour les types de fichiers autorisés
  private static readonly MAGIC_SIGNATURES: MagicBytesSignature[] = [
    // Images JPEG
    {
      extension: 'jpg',
      mimeType: 'image/jpeg',
      signatures: [
        [0xFF, 0xD8, 0xFF], // JPEG standard
        [0xFF, 0xD8, 0xFF, 0xE0], // JFIF
        [0xFF, 0xD8, 0xFF, 0xE1], // EXIF
      ],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    
    // Images PNG
    {
      extension: 'png',
      mimeType: 'image/png',
      signatures: [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG signature
      ],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    
    // Images GIF
    {
      extension: 'gif',
      mimeType: 'image/gif',
      signatures: [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
      ],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    
    // Images WebP
    {
      extension: 'webp',
      mimeType: 'image/webp',
      signatures: [
        [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] // RIFF...WEBP
      ],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    
    // Documents PDF
    {
      extension: 'pdf',
      mimeType: 'application/pdf',
      signatures: [
        [0x25, 0x50, 0x44, 0x46] // %PDF
      ],
      maxSize: 20 * 1024 * 1024 // 20MB
    }
  ];

  private static readonly DANGEROUS_SIGNATURES = [
    [0x4D, 0x5A], // PE/EXE
    [0x7F, 0x45, 0x4C, 0x46], // ELF
    [0xCF, 0xFA, 0xED, 0xFE], // Mach-O
    [0x50, 0x4B, 0x03, 0x04], // ZIP (peut contenir des exécutables)
    [0x1F, 0x8B], // GZIP
    [0x42, 0x5A, 0x68], // BZIP2
    [0x52, 0x61, 0x72, 0x21], // RAR
  ];

  /**
   * Valide un fichier complet avec toutes les vérifications
   */
  static validateFile(
    buffer: Buffer,
    originalName: string,
    declaredMimeType: string,
    maxSize?: number
  ): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // 1. Vérification taille
      const fileSizeLimit = maxSize || 10 * 1024 * 1024; // 10MB par défaut
      if (buffer.length > fileSizeLimit) {
        result.isValid = false;
        result.errors.push(`Fichier trop volumineux: ${buffer.length} bytes (max: ${fileSizeLimit})`);
      }

      // 2. Vérification extension
      const extension = this.extractExtension(originalName);
      if (!extension) {
        result.isValid = false;
        result.errors.push('Extension de fichier manquante');
        return result;
      }

      // 3. Vérification magic bytes
      const magicBytesResult = this.validateMagicBytes(buffer, extension, declaredMimeType);
      if (!magicBytesResult.isValid) {
        result.isValid = false;
        result.errors.push(...magicBytesResult.errors);
      }
      
      result.detectedType = magicBytesResult.detectedType;
      result.warnings.push(...magicBytesResult.warnings);

      // 4. Détection de signatures dangereuses
      const dangerousCheck = this.checkDangerousSignatures(buffer);
      if (!dangerousCheck.isValid) {
        result.isValid = false;
        result.errors.push(...dangerousCheck.errors);
      }

      // 5. Vérifications spécifiques par type
      const typeSpecificResult = this.performTypeSpecificValidation(buffer, extension);
      if (!typeSpecificResult.isValid) {
        result.isValid = false;
        result.errors.push(...typeSpecificResult.errors);
      }
      result.warnings.push(...typeSpecificResult.warnings);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Erreur de validation: ${error.message}`);
    }

    return result;
  }

  /**
   * Valide les magic bytes du fichier
   */
  private static validateMagicBytes(
    buffer: Buffer,
    expectedExtension: string,
    declaredMimeType: string
  ): FileValidationResult {
    const result: FileValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (buffer.length < 8) {
      result.errors.push('Fichier trop petit pour être valide');
      return result;
    }

    // Chercher la signature correspondante
    for (const signature of this.MAGIC_SIGNATURES) {
      if (signature.extension === expectedExtension.toLowerCase()) {
        
        // Tester chaque signature possible pour ce type
        for (const signatureBytes of signature.signatures) {
          if (this.matchesSignature(buffer, signatureBytes)) {
            result.isValid = true;
            result.detectedType = signature.mimeType;
            
            // Vérifier cohérence avec MIME type déclaré
            if (declaredMimeType !== signature.mimeType) {
              result.warnings.push(
                `MIME type déclaré (${declaredMimeType}) ne correspond pas au type détecté (${signature.mimeType})`
              );
            }
            
            return result;
          }
        }
      }
    }

    result.errors.push(`Magic bytes non valides pour l'extension .${expectedExtension}`);
    return result;
  }

  /**
   * Vérifie si le buffer correspond à une signature
   */
  private static matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== null && buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Détecte les signatures de fichiers dangereux
   */
  private static checkDangerousSignatures(buffer: Buffer): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    for (const dangerousSignature of this.DANGEROUS_SIGNATURES) {
      if (this.matchesSignature(buffer, dangerousSignature)) {
        result.isValid = false;
        result.errors.push('Type de fichier potentiellement dangereux détecté');
        break;
      }
    }

    return result;
  }

  /**
   * Validations spécifiques par type de fichier
   */
  private static performTypeSpecificValidation(
    buffer: Buffer,
    extension: string
  ): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    switch (extension.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return this.validateJPEG(buffer);
      
      case 'png':
        return this.validatePNG(buffer);
      
      case 'gif':
        return this.validateGIF(buffer);
        
      case 'pdf':
        return this.validatePDF(buffer);
      
      default:
        result.warnings.push(`Pas de validation spécifique pour l'extension .${extension}`);
    }

    return result;
  }

  /**
   * Validation spécifique JPEG
   */
  private static validateJPEG(buffer: Buffer): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Vérifier que le fichier se termine par la fin de fichier JPEG
    const lastTwoBytes = buffer.slice(-2);
    if (lastTwoBytes[0] !== 0xFF || lastTwoBytes[1] !== 0xD9) {
      result.warnings.push('Fichier JPEG possiblement corrompu (marqueur de fin manquant)');
    }

    // Vérifier absence de code JavaScript embarqué
    const content = buffer.toString('ascii').toLowerCase();
    if (content.includes('javascript') || content.includes('<script')) {
      result.isValid = false;
      result.errors.push('Code JavaScript détecté dans l\'image JPEG');
    }

    return result;
  }

  /**
   * Validation spécifique PNG
   */
  private static validatePNG(buffer: Buffer): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Vérifier la structure basique PNG
    if (buffer.length < 12) {
      result.isValid = false;
      result.errors.push('Fichier PNG trop petit');
      return result;
    }

    // Vérifier le chunk IHDR (doit être le premier)
    const ihdrSignature = Buffer.from([0x49, 0x48, 0x44, 0x52]); // "IHDR"
    const ihdrPosition = buffer.indexOf(ihdrSignature);
    if (ihdrPosition !== 8) {
      result.isValid = false;
      result.errors.push('Structure PNG invalide (IHDR manquant ou mal placé)');
    }

    return result;
  }

  /**
   * Validation spécifique GIF
   */
  private static validateGIF(buffer: Buffer): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Vérifier la fin du fichier GIF
    const lastByte = buffer[buffer.length - 1];
    if (lastByte !== 0x3B) { // GIF trailer
      result.warnings.push('Fichier GIF possiblement corrompu (trailer manquant)');
    }

    return result;
  }

  /**
   * Validation spécifique PDF
   */
  private static validatePDF(buffer: Buffer): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const content = buffer.toString('ascii');
    
    // Vérifier absence de JavaScript
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      result.isValid = false;
      result.errors.push('JavaScript détecté dans le PDF');
    }

    // Vérifier absence de forms
    if (content.includes('/AcroForm') || content.includes('/XFA')) {
      result.warnings.push('Formulaires détectés dans le PDF');
    }

    return result;
  }

  /**
   * Extrait l'extension du nom de fichier
   */
  private static extractExtension(filename: string): string | null {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return null;
    }
    return filename.substring(lastDotIndex + 1);
  }

  /**
   * Obtient les types MIME autorisés
   */
  static getAllowedMimeTypes(): string[] {
    return this.MAGIC_SIGNATURES.map(sig => sig.mimeType);
  }

  /**
   * Obtient les extensions autorisées
   */
  static getAllowedExtensions(): string[] {
    return this.MAGIC_SIGNATURES.map(sig => sig.extension);
  }

  /**
   * Vérifie si un type MIME est autorisé
   */
  static isAllowedMimeType(mimeType: string): boolean {
    return this.MAGIC_SIGNATURES.some(sig => sig.mimeType === mimeType);
  }

  /**
   * Vérifie si une extension est autorisée
   */
  static isAllowedExtension(extension: string): boolean {
    return this.MAGIC_SIGNATURES.some(sig => sig.extension === extension.toLowerCase());
  }
}