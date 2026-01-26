import sharp from 'sharp';

/**
 * Image Optimization Utility Functions
 * Provides image processing capabilities for thumbnail optimization
 */

// Responsive size configurations
export const RESPONSIVE_SIZES = {
  small: { width: 400, height: 225 },
  medium: { width: 800, height: 450 },
  large: { width: 1920, height: 1080 },
} as const;

export type ResponsiveSizeName = keyof typeof RESPONSIVE_SIZES;

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface CompressOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface OptimizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ResponsiveImageSet {
  small: OptimizedImage;
  medium: OptimizedImage;
  large: OptimizedImage;
}

/**
 * Resize image to fit within maximum dimensions while maintaining aspect ratio
 * @param buffer - Input image buffer
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Resized image buffer with metadata
 */
export async function resizeImage(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number,
  options: Partial<ResizeOptions> = {}
): Promise<OptimizedImage> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize with aspect ratio preservation
    const resized = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: options.fit || 'inside',
      withoutEnlargement: options.withoutEnlargement !== false,
    });

    const outputBuffer = await resized.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: outputMetadata.width || maxWidth,
      height: outputMetadata.height || maxHeight,
      format: outputMetadata.format || 'jpeg',
      size: outputBuffer.length,
    };
  } catch (error) {
    console.error('Image resize error:', error);
    throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compress image with specified quality
 * @param buffer - Input image buffer
 * @param quality - Compression quality (1-100)
 * @returns Compressed image buffer with metadata
 */
export async function compressImage(
  buffer: Buffer,
  quality: number = 85,
  options: Partial<CompressOptions> = {}
): Promise<OptimizedImage> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Determine format
    const format = options.format || (metadata.format as 'jpeg' | 'png' | 'webp') || 'jpeg';

    // Apply compression based on format
    let compressed = image;
    
    if (format === 'jpeg') {
      compressed = image.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      compressed = image.png({ 
        quality, 
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
    } else if (format === 'webp') {
      compressed = image.webp({ quality });
    }

    const outputBuffer = await compressed.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      format: outputMetadata.format || format,
      size: outputBuffer.length,
    };
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple responsive sizes from a single image
 * @param buffer - Input image buffer
 * @returns Object containing small, medium, and large versions
 */
export async function generateResponsiveSizes(
  buffer: Buffer,
  quality: number = 85
): Promise<ResponsiveImageSet> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const format = (metadata.format as 'jpeg' | 'png' | 'webp') || 'jpeg';

    // Generate all three sizes in parallel
    const [small, medium, large] = await Promise.all([
      resizeAndCompress(buffer, RESPONSIVE_SIZES.small.width, RESPONSIVE_SIZES.small.height, quality, format),
      resizeAndCompress(buffer, RESPONSIVE_SIZES.medium.width, RESPONSIVE_SIZES.medium.height, quality, format),
      resizeAndCompress(buffer, RESPONSIVE_SIZES.large.width, RESPONSIVE_SIZES.large.height, quality, format),
    ]);

    return { small, medium, large };
  } catch (error) {
    console.error('Generate responsive sizes error:', error);
    throw new Error(`Failed to generate responsive sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to resize and compress in one operation
 */
async function resizeAndCompress(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  format: 'jpeg' | 'png' | 'webp'
): Promise<OptimizedImage> {
  const image = sharp(buffer);
  
  let processed = image.resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Apply format-specific compression
  if (format === 'jpeg') {
    processed = processed.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    processed = processed.png({ quality, compressionLevel: 9 });
  } else if (format === 'webp') {
    processed = processed.webp({ quality });
  }

  const outputBuffer = await processed.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width || maxWidth,
    height: metadata.height || maxHeight,
    format: metadata.format || format,
    size: outputBuffer.length,
  };
}

/**
 * Convert image to WebP format
 * @param buffer - Input image buffer
 * @param quality - WebP quality (1-100)
 * @returns WebP image buffer with metadata
 */
export async function convertToWebP(
  buffer: Buffer,
  quality: number = 85
): Promise<OptimizedImage> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const webpBuffer = await image
      .webp({ quality, effort: 6 })
      .toBuffer();

    const webpMetadata = await sharp(webpBuffer).metadata();

    return {
      buffer: webpBuffer,
      width: webpMetadata.width || metadata.width || 0,
      height: webpMetadata.height || metadata.height || 0,
      format: 'webp',
      size: webpBuffer.length,
    };
  } catch (error) {
    console.error('WebP conversion error:', error);
    throw new Error(`Failed to convert to WebP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate WebP versions for all responsive sizes
 * @param buffer - Input image buffer
 * @param quality - WebP quality (1-100)
 * @returns Object containing WebP versions of small, medium, and large sizes
 */
export async function generateResponsiveWebP(
  buffer: Buffer,
  quality: number = 85
): Promise<ResponsiveImageSet> {
  try {
    // Generate all three WebP sizes in parallel
    const [small, medium, large] = await Promise.all([
      resizeAndConvertToWebP(buffer, RESPONSIVE_SIZES.small.width, RESPONSIVE_SIZES.small.height, quality),
      resizeAndConvertToWebP(buffer, RESPONSIVE_SIZES.medium.width, RESPONSIVE_SIZES.medium.height, quality),
      resizeAndConvertToWebP(buffer, RESPONSIVE_SIZES.large.width, RESPONSIVE_SIZES.large.height, quality),
    ]);

    return { small, medium, large };
  } catch (error) {
    console.error('Generate responsive WebP error:', error);
    throw new Error(`Failed to generate responsive WebP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to resize and convert to WebP in one operation
 */
async function resizeAndConvertToWebP(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<OptimizedImage> {
  const outputBuffer = await sharp(buffer)
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 6 })
    .toBuffer();

  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width || maxWidth,
    height: metadata.height || maxHeight,
    format: 'webp',
    size: outputBuffer.length,
  };
}

/**
 * Get image metadata without processing
 * @param buffer - Input image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('Get image metadata error:', error);
    throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if buffer is a valid image
 * @param buffer - Input buffer
 * @returns True if valid image, false otherwise
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}
