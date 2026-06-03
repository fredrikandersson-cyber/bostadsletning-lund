// High-quality images of Lund from Unsplash (free to use)
// Representing the city's iconic spots mentioned on visitlund.se
export const LUND_HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85',
    alt: 'Lund Cathedral – Domkyrkan',
    credit: 'Unsplash',
  },
  {
    url: 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1600&q=85',
    alt: 'Charming Swedish street',
    credit: 'Unsplash',
  },
];

// Fallback apartment images when no listing image is available
// Simple, clean apartment photos (not luxury)
export const APARTMENT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', // Modern apartment interior
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',   // Minimalist living room
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',   // Cozy studio apartment
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80', // Bright apartment window
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80', // Modern kitchen
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', // Warm interior
  'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=600&q=80',   // Bedroom
  'https://images.unsplash.com/photo-1572859511353-39a2dd76a47d?w=600&q=80', // Scandinavian apartment
];

// Get a deterministic fallback image based on listing ID
export function getFallbackImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % APARTMENT_FALLBACK_IMAGES.length;
  return APARTMENT_FALLBACK_IMAGES[idx];
}
