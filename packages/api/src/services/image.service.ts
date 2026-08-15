import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class ImageService {
  /**
   * Uploads a buffer to Cloudinary
   * @param fileBuffer The file buffer (from multer memory storage)
   * @param folder Optional folder name in Cloudinary
   * @returns The secure URL of the uploaded image
   */
  static async uploadImage(fileBuffer: Buffer, folder = 'sdm-products'): Promise<string> {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw AppError.internal('Cloudinary is not configured on the server');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp', // Auto-convert to webp for better optimization
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Prevent absurdly huge images
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(AppError.internal('Failed to upload image'));
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(AppError.internal('Unknown upload error'));
          }
        },
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Optional: Helper to delete an image by public ID if needed later
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }
}
