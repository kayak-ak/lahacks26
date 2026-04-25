import { Cloudinary } from '@cloudinary/url-gen';

// Get environment variables - Vite requires VITE_ prefix
export const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
export const isUsingFallbackCloud = !import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Create and export Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
});

// Export upload preset for convenience
export const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
