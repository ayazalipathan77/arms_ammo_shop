import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// Helper to stream file to Cloudinary
const streamToCloudinary = (buffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'muraqqa-artworks',
            },
            (error: any, result: any) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'No image file provided' });
            return;
        }

        // Check if Cloudinary is configured
        if (!cloudinary.config().cloud_name) {
            console.error('Cloudinary not configured');
            res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                message: 'Image upload service unavailable (configuration missing)'
            });
            return;
        }

        const result = await streamToCloudinary(req.file.buffer);

        res.status(StatusCodes.OK).json({
            message: 'Image uploaded successfully',
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Image upload failed',
            error: error.message,
        });
    }
};
