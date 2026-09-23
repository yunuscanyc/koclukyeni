/**
 * Image Dewarping and Page Curvature Rectification Utilities.
 * Corrects cylindrical book spine bending (yaylaşma), perspective skew,
 * and removes uneven spine shadows from photographed test book pages.
 */

export interface DewarpOptions {
  /** Curvature intensity: positive uncurls upwards/downwards bend (-50 to +50) */
  curvature?: number;
  /** Rotation angle in degrees (-15 to +15) */
  rotation?: number;
  /** Spine shadow removal & illumination flattening (0 to 100) */
  shadowRemoval?: number;
  /** Contrast & text sharpening (0 to 100) */
  contrast?: number;
  /** Auto-crop spine margin */
  cropSpineMargin?: number;
}

/**
 * Dewarp and flatten a curved page image using HTML5 Canvas pixel transformation.
 */
export async function dewarpAndEnhanceImage(
  imageSource: string | HTMLImageElement,
  options: DewarpOptions = {}
): Promise<string> {
  const {
    curvature = 0,
    rotation = 0,
    shadowRemoval = 30,
    contrast = 20,
    cropSpineMargin = 0,
  } = options;

  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      el.src = imageSource.startsWith('data:') ? imageSource : `data:image/jpeg;base64,${imageSource}`;
    });
  } else {
    img = imageSource;
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Source canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return typeof imageSource === 'string' ? imageSource : img.src;

  srcCtx.drawImage(img, 0, 0, origW, origH);

  // Destination canvas for dewarped output
  const destCanvas = document.createElement('canvas');
  destCanvas.width = origW;
  destCanvas.height = origH;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) return typeof imageSource === 'string' ? imageSource : img.src;

  // Fill destination with clean white
  destCtx.fillStyle = '#ffffff';
  destCtx.fillRect(0, 0, origW, origH);

  // Apply Rotation if specified
  if (Math.abs(rotation) > 0.05) {
    destCtx.save();
    destCtx.translate(origW / 2, origH / 2);
    destCtx.rotate((rotation * Math.PI) / 180);
    destCtx.translate(-origW / 2, -origH / 2);
  }

  // Cylindrical Arc Curvature Correction (Vertical displacement based on horizontal position)
  // When curvature != 0, we slice the image vertically into thin strips and shift/scale them
  // following the inverse curve of the spine bend.
  if (Math.abs(curvature) > 0.5) {
    const strips = 100;
    const stripW = origW / strips;
    const maxDisplacement = (curvature / 100) * (origH * 0.12);

    for (let i = 0; i < strips; i++) {
      const sx = i * stripW;
      const sw = stripW + 1; // +1 to prevent subpixel seams

      // Normalized horizontal coordinate (-1 at left, 0 at center, +1 at right)
      const nx = (i / (strips - 1)) * 2 - 1;
      
      // Parabolic / Cosine cylindrical curve offset
      // Spine is usually near one edge (e.g. left or center), curve drops off towards edges
      const curveOffset = Math.sin((i / strips) * Math.PI) * maxDisplacement;

      // Stretch / vertical scale correction near spine
      const vScale = 1.0 + (Math.abs(curveOffset) / origH) * 0.15;
      const dh = origH * vScale;
      const dy = -curveOffset - (dh - origH) / 2;

      destCtx.drawImage(
        srcCanvas,
        sx, 0, sw, origH,
        sx, dy, sw, dh
      );
    }
  } else {
    destCtx.drawImage(srcCanvas, 0, 0);
  }

  if (Math.abs(rotation) > 0.05) {
    destCtx.restore();
  }

  // Apply Shadow Removal and Contrast Enhancement (Illumination Flattening)
  if (shadowRemoval > 0 || contrast > 0) {
    try {
      const imgData = destCtx.getImageData(0, 0, origW, origH);
      const data = imgData.data;
      const len = data.length;

      // Background illumination leveling & text boost
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const shadowThreshold = 140 + (shadowRemoval * 0.7);

      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Grayscale luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // If in shadow region (darker gray paper background), whiten background while preserving dark text
        if (shadowRemoval > 0 && lum > 110) {
          const boost = Math.min(255, lum + ((255 - lum) * (shadowRemoval / 100) * 0.75));
          const ratio = boost / Math.max(1, lum);
          r = Math.min(255, r * ratio);
          g = Math.min(255, g * ratio);
          b = Math.min(255, b * ratio);
        }

        // Contrast enhancement
        if (contrast > 0) {
          r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
          g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
          b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      destCtx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Pixel enhancement error:', e);
    }
  }

  return destCanvas.toDataURL('image/jpeg', 0.94);
}
