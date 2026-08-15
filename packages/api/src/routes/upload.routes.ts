import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { requireTenant, TenantRequest } from '../middleware/tenantContext';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/apiResponse';
import { ImageService } from '../services/image.service';

const router = Router({ mergeParams: true });

// Use memory storage for multer since we pass the buffer directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400));
    }
  },
});

// All upload routes require auth and OWNER/MANAGER roles
router.use(authenticate, requireTenant('OWNER', 'MANAGER'));

/**
 * POST /restaurants/:restaurantId/upload
 * Expects form-data with a 'file' field containing the image
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req as TenantRequest;

      if (!req.file) {
        throw AppError.badRequest('No image file provided');
      }

      // Generate a dynamic folder name based on the restaurant ID for organization
      const folderName = `sdm/restaurants/${restaurantId}`;

      const imageUrl = await ImageService.uploadImage(req.file.buffer, folderName);

      sendSuccess(res, { imageUrl }, 201);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
