import type { ImageUploadResult } from '@sdm/shared';

// ─── Image Storage Interface ─────────────────────────────
// All image operations go through this abstraction.
// Swap the provider implementation without changing application code.

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale';
}

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

export interface ImageStorageProvider {
  upload(fileBuffer: Buffer, options?: UploadOptions): Promise<ImageUploadResult>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string, options?: TransformOptions): string;
}

// ─── Cloudinary Provider (connect when credentials available) ─

export class CloudinaryProvider implements ImageStorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(_fileBuffer: Buffer, _options?: UploadOptions): Promise<ImageUploadResult> {
    // TODO: Implement with cloudinary SDK when credentials are configured.
    // import { v2 as cloudinary } from 'cloudinary';
    // cloudinary.config({ cloud_name, api_key, api_secret });
    // const result = await cloudinary.uploader.upload_stream(...)
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }

  async delete(_publicId: string): Promise<void> {
    throw new Error('Cloudinary is not configured.');
  }

  getUrl(publicId: string, _options?: TransformOptions): string {
    // Return the publicId as-is; when Cloudinary is configured this will
    // generate a full transformation URL.
    return publicId;
  }
}

// ─── Placeholder Provider (for development without Cloudinary) ─

export class PlaceholderImageProvider implements ImageStorageProvider {
  async upload(_fileBuffer: Buffer, options?: UploadOptions): Promise<ImageUploadResult> {
    const publicId = options?.publicId || `placeholder_${Date.now()}`;
    return {
      url: `https://placehold.co/600x400/f97316/white?text=Menu+Image`,
      publicId,
      width: 600,
      height: 400,
    };
  }

  async delete(_publicId: string): Promise<void> {
    // No-op for placeholder
  }

  getUrl(publicId: string, _options?: TransformOptions): string {
    return publicId.startsWith('http')
      ? publicId
      : `https://placehold.co/600x400/f97316/white?text=Image`;
  }
}

// ─── Factory ─────────────────────────────────────────────

export function createImageProvider(): ImageStorageProvider {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return new CloudinaryProvider();
  }

  console.warn('[ImageStorage] Cloudinary not configured — using placeholder provider');
  return new PlaceholderImageProvider();
}

/** Singleton image provider instance */
export const imageProvider = createImageProvider();
