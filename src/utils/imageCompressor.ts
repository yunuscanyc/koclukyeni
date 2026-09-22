import heic2any from 'heic2any';

/**
 * Client-side high-performance image compressor for exam & question photos.
 * Reduces 5MB-30MB camera/gallery images down to ~50-90KB JPEG while preserving
 * sharp text clarity for OCR and zooming in the UI.
 * 
 * Specifically optimized for mobile camera snaps (iOS HEIC, Android high-res),
 * with hardware-accelerated createImageBitmap, ObjectURL streaming, and infallible fallbacks.
 */

// Helper to convert blob/file to raw Base64 data URL
function readFileAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

// Convert HEIC/HEIF camera photo to standard JPEG file/blob if needed
async function prepareImageFile(file: File): Promise<Blob | File> {
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();
  const isHeic =
    fileType.includes('heic') ||
    fileType.includes('heif') ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif');

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.85,
      });
      const singleBlob = Array.isArray(converted) ? converted[0] : converted;
      return new File(
        [singleBlob],
        (file.name || 'camera_snap.jpg').replace(/\.(heic|heif)$/i, '.jpg'),
        { type: 'image/jpeg' }
      );
    } catch (err) {
      console.warn('[imageCompressor] heic2any donusum uyarisi:', err);
    }
  }
  return file;
}

export async function compressImageFile(
  rawFile: File,
  maxWidth = 1100,
  maxHeight = 1500,
  quality = 0.68
): Promise<string> {
  const file = await prepareImageFile(rawFile);

  // Method 1: Try modern createImageBitmap (fastest, supports hardware decoding, EXIF orientation)
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        bitmap = await createImageBitmap(file);
      }

      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const compressed = canvas.toDataURL('image/jpeg', quality);
        if (compressed && compressed.startsWith('data:image/jpeg')) {
          return compressed;
        }
      }
      bitmap.close();
    } catch (bitmapErr) {
      console.warn('[imageCompressor] createImageBitmap uyarisi, alternatif yontem deneniyor:', bitmapErr);
    }
  }

  // Method 2: Try URL.createObjectURL with HTMLImageElement (streaming memory, prevents huge base64 allocations)
  try {
    const objectUrl = URL.createObjectURL(file);
    const compressed = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve('');
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const result = canvas.toDataURL('image/jpeg', quality);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Görsel nesnesi yüklenemedi.'));
      };
      img.src = objectUrl;
    });

    if (compressed && compressed.startsWith('data:image')) {
      return compressed;
    }
  } catch (objUrlErr) {
    console.warn('[imageCompressor] ObjectURL sıkıştırma uyarısı:', objUrlErr);
  }

  // Method 3: Infallible Fallback - Read raw data URL so user camera photo is NEVER dropped
  try {
    const rawDataUrl = await readFileAsDataURL(file);
    if (rawDataUrl && rawDataUrl.startsWith('data:image')) {
      try {
        const scaled = await compressBase64Image(rawDataUrl, maxWidth, maxHeight, quality);
        if (scaled && scaled.startsWith('data:image')) {
          return scaled;
        }
      } catch {
        // Fallback to raw data url
      }
      return rawDataUrl;
    }
    return rawDataUrl;
  } catch (readErr) {
    console.error('[imageCompressor] Dosya okunamadı:', readErr);
    throw readErr;
  }
}

export async function compressBase64Image(
  base64Str: string,
  maxWidth = 900,
  maxHeight = 1200,
  quality = 0.60
): Promise<string> {
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str;
  }

  // If already under ~40KB (approx 55,000 chars), return as is
  if (base64Str.length < 55000) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const result = canvas.toDataURL('image/jpeg', quality);
      resolve(result);
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}
