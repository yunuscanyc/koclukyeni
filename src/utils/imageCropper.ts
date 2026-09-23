import { detectQuestionBoxes } from '../lib/apiService';
import { dewarpAndEnhanceImage } from './imageDewarper';

/**
 * Normalizes bounding box coordinates across various scales (0-1000, 0-100, 0-1.0)
 * with safety padding to prevent edge text clipping.
 */
export function normalizeBoundingBox(
  kutu: [number, number, number, number],
  width: number,
  height: number
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  let [ymin, xmin, ymax, xmax] = kutu;

  // Determine scale
  const maxVal = Math.max(ymin, xmin, ymax, xmax);
  let scale = 100;
  if (maxVal > 100) {
    scale = 1000;
  } else if (maxVal <= 1.0) {
    scale = 1.0;
  }

  // Auto Option Protection: If height is less than 20% of page, extend ymax by ~6-8% to ensure choices C, D, E are fully included
  const hRatio = (ymax - ymin) / scale;
  if (hRatio < 0.20 && (ymax / scale) < 0.92) {
    ymax = Math.min(scale * 0.98, ymax + scale * 0.07);
  }

  // Convert to pixel coordinates
  let absYmin = (ymin / scale) * height;
  let absXmin = (xmin / scale) * width;
  let absYmax = (ymax / scale) * height;
  let absXmax = (xmax / scale) * width;

  // Check if box is inverted
  if (absYmin > absYmax) {
    const tmp = absYmin;
    absYmin = absYmax;
    absYmax = tmp;
  }
  if (absXmin > absXmax) {
    const tmp = absXmin;
    absXmin = absXmax;
    absXmax = tmp;
  }

  // Keep boundaries crisp without spilling into adjacent questions or columns
  const padX = width * 0.002;
  const padY = height * 0.002;

  absXmin = Math.max(0, absXmin - padX);
  absYmin = Math.max(0, absYmin - padY);
  absXmax = Math.min(width, absXmax + padX);
  absYmax = Math.min(height, absYmax + padY);

  const cropX = Math.floor(absXmin);
  const cropY = Math.floor(absYmin);
  const cropW = Math.max(50, Math.min(width - cropX, Math.ceil(absXmax - absXmin)));
  const cropH = Math.max(50, Math.min(height - cropY, Math.ceil(absYmax - absYmin)));

  return { cropX, cropY, cropW, cropH };
}

/**
 * Canvas utility to crop individual questions from full page images.
 */
export async function cropQuestionFromPageImage(
  pageBase64: string,
  kutu?: [number, number, number, number] | null,
  questionIndexOnPage: number = 0,
  totalQuestionsOnPage: number = 4
): Promise<string | null> {
  if (!pageBase64 || pageBase64.length < 50) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        let cropX = 0;
        let cropY = 0;
        let cropW = width;
        let cropH = height;

        if (kutu && Array.isArray(kutu) && kutu.length === 4) {
          const norm = normalizeBoundingBox(kutu, width, height);
          cropX = norm.cropX;
          cropY = norm.cropY;
          cropW = norm.cropW;
          cropH = norm.cropH;
        } else {
          // Column-aware heuristic fallback
          const isLandscapeOrWide = width > height * 1.05;
          const isMultiColumn = isLandscapeOrWide || totalQuestionsOnPage >= 3;

          if (isMultiColumn && totalQuestionsOnPage >= 2) {
            const isRightColumn = questionIndexOnPage % 2 === 1;
            const rowIndex = Math.floor(questionIndexOnPage / 2);
            const totalRows = Math.ceil(totalQuestionsOnPage / 2);
            const rowH = height / Math.max(1, totalRows);

            cropX = isRightColumn ? Math.floor(width * 0.49) : Math.floor(width * 0.02);
            cropW = Math.floor(width * 0.49);
            cropY = Math.max(0, Math.floor(rowIndex * rowH));
            cropH = Math.min(height - cropY, Math.ceil(rowH));
          } else {
            const safeTotal = Math.max(1, totalQuestionsOnPage);
            const rawH = height / safeTotal;
            cropY = Math.max(0, Math.floor(questionIndexOnPage * rawH));
            cropH = Math.min(height - cropY, Math.ceil(rawH));
            cropX = Math.floor(width * 0.02);
            cropW = Math.floor(width * 0.96);
          }
        }

        cropW = Math.max(50, Math.min(width - cropX, cropW));
        cropH = Math.max(50, Math.min(height - cropY, cropH));

        canvas.width = cropW;
        canvas.height = cropH;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cropW, cropH);

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );

        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
        resolve(croppedBase64);
      } catch (err) {
        console.warn('Canvas crop error:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = pageBase64.startsWith('data:') ? pageBase64 : `data:image/jpeg;base64,${pageBase64}`;
  });
}

/**
 * Batch crop all questions for a given archive using page photos with Gemini Vision Precision Detection
 */
export async function batchCropArchiveQuestions(
  pagePhotos: string[],
  sorular: Array<any>,
  onProgress?: (msg: string) => void
): Promise<Array<any>> {
  if (!pagePhotos || pagePhotos.length === 0 || !sorular || sorular.length === 0) {
    return sorular;
  }

  // Group questions by page
  const questionsByPage: Record<number, Array<{ question: any; indexInPage: number; globalIndex: number }>> = {};

  sorular.forEach((q, globalIdx) => {
    const pageNo = q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1);
    if (!questionsByPage[pageNo]) {
      questionsByPage[pageNo] = [];
    }
    const indexInPage = questionsByPage[pageNo].length;
    questionsByPage[pageNo].push({ question: q, indexInPage, globalIndex: globalIdx });
  });

  // Clear existing cropped photos and bounding boxes so fresh crops completely replace old ones
  const updatedSorular = sorular.map(q => ({
    ...q,
    soruFotografYolu: undefined,
    kutu: undefined,
  }));

  for (const pageNoStr of Object.keys(questionsByPage)) {
    const pageNo = parseInt(pageNoStr, 10);
    const pagePhoto = pagePhotos[pageNo - 1] || pagePhotos[0];
    if (!pagePhoto || pagePhoto.length < 50) continue;

    const pageQuestions = questionsByPage[pageNo];
    const totalOnPage = pageQuestions.length;

    let detectedBoxesMap: Record<number, [number, number, number, number]> = {};

    if (onProgress) onProgress(`Sayfa ${pageNo} için hassas soru sınırları analiz ediliyor...`);
    try {
      const detected = await detectQuestionBoxes(
        pagePhoto,
        pageQuestions.map(p => ({
          soruNo: p.question.soruNo,
          ders: p.question.ders,
          konu: p.question.konu,
        }))
      );

      if (detected && detected.length > 0) {
        detected.forEach(d => {
          if (d.soruNo && d.kutu) {
            detectedBoxesMap[d.soruNo] = d.kutu;
          }
        });
      }
    } catch (err) {
      console.warn('AI detectQuestionBoxes failed, using fallback layout:', err);
    }

    // Now crop each question on this page
    for (const item of pageQuestions) {
      try {
        const soruNo = item.question.soruNo;
        const aiKutu = detectedBoxesMap[soruNo] || null;

        let croppedImg = await cropQuestionFromPageImage(
          pagePhoto,
          aiKutu,
          item.indexInPage,
          totalOnPage
        );

        if (croppedImg) {
          try {
            // Apply mild automatic shadow removal and contrast boost
            croppedImg = await dewarpAndEnhanceImage(croppedImg, {
              shadowRemoval: 20,
              contrast: 15,
            });
          } catch {
            // keep raw cropped
          }

          updatedSorular[item.globalIndex] = {
            ...updatedSorular[item.globalIndex],
            kutu: aiKutu || undefined,
            soruFotografYolu: croppedImg,
          };
        }
      } catch (e) {
        console.warn('Batch crop single question error:', e);
      }
    }
  }

  return updatedSorular;
}
