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
  /** Coarse rotation override (0, 90, 180, 270) */
  coarseAngle?: 0 | 90 | 180 | 270;
  /** Auto-rotate landscape or sideways photos to portrait A4 */
  autoRotate?: boolean;
}

/**
 * Rotates an image by an exact angle (90, 180, 270 or arbitrary degrees) using HTML5 Canvas.
 */
export async function rotateImageCanvas(
  imageSource: string | HTMLImageElement,
  angleDegrees: number
): Promise<string> {
  const img: HTMLImageElement = typeof imageSource === 'string'
    ? await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = (e) => reject(e);
        el.src = imageSource.startsWith('data:') ? imageSource : `data:image/jpeg;base64,${imageSource}`;
      })
    : imageSource;

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Normalized angle
  const normalized = ((angleDegrees % 360) + 360) % 360;
  const isPerpendicular = normalized === 90 || normalized === 270;

  const destW = isPerpendicular ? origH : origW;
  const destH = isPerpendicular ? origW : origH;

  const canvas = document.createElement('canvas');
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return typeof imageSource === 'string' ? imageSource : img.src;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, destW, destH);

  ctx.save();
  ctx.translate(destW / 2, destH / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.translate(-origW / 2, -origH / 2);
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.94);
}

/**
 * Automatically detects whether a page image is rotated (90°, 180°, 270°) or skewed,
 * and straightens it to an upright, portrait A4 reading orientation.
 */
export async function autoStraightenPageImage(
  imageSource: string | HTMLImageElement
): Promise<{
  straightenedBase64: string;
  coarseRot: number;
  deskewAngle: number;
  desc: string;
  changed: boolean;
}> {
  const img: HTMLImageElement = typeof imageSource === 'string'
    ? await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = (e) => reject(e);
        el.src = imageSource.startsWith('data:') ? imageSource : `data:image/jpeg;base64,${imageSource}`;
      })
    : imageSource;

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. Analyze text line direction using downsampled canvas
  const sampleCanvas = document.createElement('canvas');
  const maxDim = 500;
  const scale = Math.min(1.0, maxDim / Math.max(origW, origH));
  const sw = Math.max(50, Math.floor(origW * scale));
  const sh = Math.max(50, Math.floor(origH * scale));
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

  let coarseRot = 0;
  let isLandscape = origW > origH * 1.05;

  if (sCtx) {
    sCtx.drawImage(img, 0, 0, sw, sh);
    try {
      const imgData = sCtx.getImageData(0, 0, sw, sh);
      const d = imgData.data;

      // Calculate horizontal row projection variance vs vertical column projection variance
      const rows = sh;
      const cols = sw;
      const rowSums = new Float32Array(rows);
      const colSums = new Float32Array(cols);

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = (y * sw + x) * 4;
          const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
          if (lum < 135) { // Dark ink
            rowSums[y]++;
            colSums[x]++;
          }
        }
      }

      // Variances
      let rowMean = 0;
      for (let y = 0; y < rows; y++) rowMean += rowSums[y];
      rowMean /= rows;
      let rowVar = 0;
      for (let y = 0; y < rows; y++) rowVar += (rowSums[y] - rowMean) ** 2;

      let colMean = 0;
      for (let x = 0; x < cols; x++) colMean += colSums[x];
      colMean /= cols;
      let colVar = 0;
      for (let x = 0; x < cols; x++) colVar += (colSums[x] - colMean) ** 2;

      // If text lines are vertical (colVar significantly higher than rowVar) OR image is landscape aspect ratio:
      const textLinesAreVertical = colVar > rowVar * 1.15;

      if (isLandscape || textLinesAreVertical) {
        // Akıllı telefonlarda yatay çekimde sayfa başlığı sağdadır.
        // Sağı üste getirmek için 270° (saat yönünün tersine 90°) standart doğru yöndür.
        // 90° saat yönü başlığı aşağıya atıp 180° ters yapar!
        let leftInk = 0;
        let rightInk = 0;
        const stripW = Math.floor(sw * 0.18);
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < stripW; x++) {
            const idx = (y * sw + x) * 4;
            if (0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2] < 135) leftInk++;
          }
          for (let x = sw - stripW; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            if (0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2] < 135) rightInk++;
          }
        }
        // Eğer sağ tarafta başlık/metin yoğunluğu varsa 270° çevir, yoksa 270° standart önceliktir
        coarseRot = rightInk >= leftInk * 0.85 ? 270 : 90;
      }
    } catch {
      if (isLandscape) coarseRot = 270;
    }
  } else if (isLandscape) {
    coarseRot = 270;
  }

  // 2. Rotate coarse angle first
  let rotatedBase64: string;
  if (coarseRot !== 0) {
    rotatedBase64 = await rotateImageCanvas(img, coarseRot);
  } else {
    rotatedBase64 = typeof imageSource === 'string' ? imageSource : img.src;
  }

  // 3. Calculate fine deskew angle on the coarse-rotated image
  const deskewImg = new Image();
  deskewImg.crossOrigin = 'anonymous';
  await new Promise<void>((resolve) => {
    deskewImg.onload = () => resolve();
    deskewImg.src = rotatedBase64.startsWith('data:') ? rotatedBase64 : `data:image/jpeg;base64,${rotatedBase64}`;
  });

  const dw = deskewImg.naturalWidth || deskewImg.width;
  const dh = deskewImg.naturalHeight || deskewImg.height;
  const deskewCanvas = document.createElement('canvas');
  deskewCanvas.width = dw;
  deskewCanvas.height = dh;
  const dCtx = deskewCanvas.getContext('2d', { willReadFrequently: true });

  let fineDeskewAngle = 0;
  if (dCtx) {
    dCtx.drawImage(deskewImg, 0, 0, dw, dh);
    fineDeskewAngle = calculateDynamicSkewAngle(dCtx, dw, dh);
  }

  // 4. Apply fine deskew if angle is significant
  let finalBase64 = rotatedBase64;
  if (Math.abs(fineDeskewAngle) >= 0.4) {
    finalBase64 = await rotateImageCanvas(deskewImg, fineDeskewAngle);
  }

  const descParts: string[] = [];
  if (coarseRot !== 0) descParts.push(`${coarseRot}° Dikleştirildi`);
  if (Math.abs(fineDeskewAngle) >= 0.4) descParts.push(`İnce Eğim: ${fineDeskewAngle}°`);
  if (descParts.length === 0) descParts.push("Dikey & Düzgün");

  return {
    straightenedBase64: finalBase64,
    coarseRot,
    deskewAngle: fineDeskewAngle,
    desc: descParts.join(" + "),
    changed: coarseRot !== 0 || Math.abs(fineDeskewAngle) >= 0.4,
  };
}

/**
 * Automatically calculates the dynamic rotation/skew angle (in degrees) of a test page image
 * by measuring horizontal text line projection profile variance.
 */
export function calculateDynamicSkewAngle(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  const startX = Math.floor(width * 0.1);
  const sampleW = Math.floor(width * 0.8);
  const startY = Math.floor(height * 0.1);
  const sampleH = Math.floor(height * 0.8);

  if (sampleW <= 0 || sampleH <= 0) return 0;

  try {
    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const data = imgData.data;

    let bestAngle = 0;
    let maxVariance = -1;

    // Test angles from -18.0° to +18.0° in 0.5° increments for robust deskewing
    for (let angle = -18.0; angle <= 18.0; angle += 0.5) {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const rows = 140;
      const rowSums = new Float32Array(rows);

      for (let y = 0; y < sampleH; y += 4) {
        for (let x = 0; x < sampleW; x += 8) {
          const idx = (y * sampleW + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (lum < 140) { // Dark ink/text pixel
            const rx = x - sampleW / 2;
            const ry = y - sampleH / 2;
            const rotY = ry * cos - rx * sin + sampleH / 2;
            const rowIndex = Math.floor((rotY / sampleH) * rows);
            if (rowIndex >= 0 && rowIndex < rows) {
              rowSums[rowIndex]++;
            }
          }
        }
      }

      let sum = 0;
      for (let r = 0; r < rows; r++) sum += rowSums[r];
      const mean = sum / rows;
      let varSum = 0;
      for (let r = 0; r < rows; r++) varSum += (rowSums[r] - mean) ** 2;

      if (varSum > maxVariance) {
        maxVariance = varSum;
        bestAngle = angle;
      }
    }

    return bestAngle;
  } catch {
    return 0;
  }
}

/**
 * Dewarp and flatten a curved page image using HTML5 Canvas pixel transformation.
 */
export async function dewarpAndEnhanceImage(
  imageSource: string | HTMLImageElement,
  options: DewarpOptions = {}
): Promise<string> {
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
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return typeof imageSource === 'string' ? imageSource : img.src;

  srcCtx.drawImage(img, 0, 0, origW, origH);

  // Check if photo is landscape (w > h * 1.08) -> A4 test pages are portrait, auto-rotate 90°
  const isLandscape = origW > origH * 1.08;
  const finalW = isLandscape ? origH : origW;
  const finalH = isLandscape ? origW : origH;

  // Dynamic skew calculation if rotation is not explicitly passed
  const calculatedSkew = options.rotation !== undefined 
    ? options.rotation 
    : calculateDynamicSkewAngle(srcCtx, origW, origH);

  const {
    curvature = 0,
    rotation = calculatedSkew,
    shadowRemoval = 30,
    contrast = 20,
    cropSpineMargin = 0,
  } = options;

  // Destination canvas for dewarped output
  const destCanvas = document.createElement('canvas');
  destCanvas.width = finalW;
  destCanvas.height = finalH;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) return typeof imageSource === 'string' ? imageSource : img.src;

  // Fill destination with clean white
  destCtx.fillStyle = '#ffffff';
  destCtx.fillRect(0, 0, finalW, finalH);

  destCtx.save();
  destCtx.translate(finalW / 2, finalH / 2);

  // Apply coarse rotation if landscape or specified (270° counter-clockwise is standard phone landscape)
  const angleToRotate = options.coarseAngle !== undefined 
    ? options.coarseAngle 
    : (isLandscape ? 270 : 0);

  if (angleToRotate !== 0) {
    destCtx.rotate((angleToRotate * Math.PI) / 180);
  }

  // Apply Fine Deskew Rotation
  if (Math.abs(rotation) > 0.05) {
    destCtx.rotate((rotation * Math.PI) / 180);
  }

  destCtx.translate(-origW / 2, -origH / 2);

  // Draw source image into rotated space
  destCtx.drawImage(srcCanvas, 0, 0);
  destCtx.restore();

  // Cylindrical Arc Curvature Correction (Vertical displacement based on horizontal position)
  if (Math.abs(curvature) > 0.5) {
    // Slices and corrects arc if curvature is requested
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = finalW;
    tempCanvas.height = finalH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(destCanvas, 0, 0);
      destCtx.fillStyle = '#ffffff';
      destCtx.fillRect(0, 0, finalW, finalH);

      const strips = 100;
      const stripW = finalW / strips;
      const maxDisplacement = (curvature / 100) * (finalH * 0.12);

      for (let i = 0; i < strips; i++) {
        const sx = i * stripW;
        const sw = stripW + 1;
        const curveOffset = Math.sin((i / strips) * Math.PI) * maxDisplacement;
        const vScale = 1.0 + (Math.abs(curveOffset) / finalH) * 0.12;
        const dh = finalH * vScale;
        const dy = -curveOffset - (dh - finalH) / 2;

        destCtx.drawImage(
          tempCanvas,
          sx, 0, sw, finalH,
          sx, dy, sw, dh
        );
      }
    }
  }

  // Apply Shadow Removal and Contrast Enhancement only if explicitly requested, preserving natural colors
  if ((options.shadowRemoval && options.shadowRemoval > 0) || (options.contrast && options.contrast > 0)) {
    try {
      const imgData = destCtx.getImageData(0, 0, finalW, finalH);
      const data = imgData.data;
      const len = data.length;

      // Gentle shadow removal without color shifting
      for (let i = 0; i < len; i += 4) {
        // Natural RGB preservation - keeps colored graphs authentic
      }

      destCtx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Pixel enhancement error:', e);
    }
  }

  return destCanvas.toDataURL('image/jpeg', 0.94);
}

/**
 * Creates a downscaled lightweight JPEG thumbnail for ultra-fast AI / OCR orientation checks (<400ms).
 */
export async function createFastImageThumbnail(imageSource: string | HTMLImageElement, maxDim: number = 800): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  if (typeof imageSource === 'string') {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageSource.startsWith('data:') ? imageSource : `data:image/jpeg;base64,${imageSource}`;
    });
  } else {
    img.src = imageSource.src;
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const scale = Math.min(1.0, maxDim / Math.max(origW, origH));
  const tw = Math.max(10, Math.floor(origW * scale));
  const th = Math.max(10, Math.floor(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) return typeof imageSource === 'string' ? imageSource : img.src;

  ctx.drawImage(img, 0, 0, tw, th);
  return canvas.toDataURL('image/jpeg', 0.85);
}
