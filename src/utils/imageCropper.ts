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

  let normYmin = ymin / scale;
  let normXmin = xmin / scale;
  let normYmax = ymax / scale;
  let normXmax = xmax / scale;

  // RULE 1: Paragraph & Bottom Option Protection
  // If the question takes significant height (>30%) or reaches the lower half (>60%),
  // extend normYmax to at least 0.96 (96%) so choices C, D, E at the bottom are NEVER cut off!
  const hRatio = normYmax - normYmin;
  if (hRatio > 0.28 || normYmax > 0.60) {
    normYmax = Math.max(normYmax, 0.965);
  }

  // RULE 2: Left Column / Right Side Soru Bleed Protection
  // If normXmin is on the left side (< 0.30), cap normXmax at 0.81 (81%) 
  // so adjacent right-column questions (e.g. Soru 5) do not spill in!
  if (normXmin < 0.30 && normXmax > 0.81) {
    normXmax = 0.81;
  }

  // Convert to pixel coordinates
  let absYmin = normYmin * height;
  let absXmin = normXmin * width;
  let absYmax = normYmax * height;
  let absXmax = normXmax * width;

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

  // RULE 1: Left Margin Snap (Soru Numarası Garantisi)
  // If the question starts on the left side of the page (normXmin < 0.35),
  // SNAP absXmin to 0 (0%) so question numbers sitting on the far left margin (like "8.", "3.", "7.") ARE 100% INCLUDED!
  if (normXmin < 0.35) {
    absXmin = 0;
  } else {
    absXmin = Math.max(0, absXmin - width * 0.03);
  }

  // RULE 2: Top Margin Snap (Üst Soru Başlık Garantisi)
  if (normYmin < 0.15) {
    absYmin = 0;
  } else {
    absYmin = Math.max(0, absYmin - height * 0.02);
  }

  // RULE 3: Right Edge Snap for Wide Questions
  if (normXmax > 0.65) {
    absXmax = width;
  } else {
    absXmax = Math.min(width, absXmax + width * 0.025);
  }

  // RULE 4: Option Bottom Bound (E Şıkkı Kapsama, Sonraki Soruya Taşmama)
  // Add 2.5% safety padding below ymax for Option E, but DO NOT spill into the next question
  absYmax = Math.min(height, absYmax + height * 0.025);

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

        // Clean natural crop: Do not alter colors, saturation, or contrast
        // Preserves authentic test page colors, charts, diagrams, and highlighter marks exactly as photographed
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
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
 * Batch crop all questions for a given archive using page photos with Local YOLO / Gemini Vision Precision Detection.
 * When resetAllQuestions is true, all previous questions and solutions are wiped clean, and fresh question items
 * are created solely from the newly detected and cropped question boxes on each page.
 */
export async function batchCropArchiveQuestions(
  pagePhotos: string[],
  sorular?: Array<any>,
  onProgress?: (msg: string) => void,
  options?: {
    resetAllQuestions?: boolean;
    defaultDers?: string;
  }
): Promise<Array<any>> {
  if (!pagePhotos || pagePhotos.length === 0) {
    return [];
  }

  const shouldResetAll = Boolean(options?.resetAllQuestions || !sorular || sorular.length === 0);

  // =========================================================================
  // MODE 1: RESET ALL QUESTIONS & CREATE FRESH CROPPED QUESTIONS FROM SCRATCH
  // =========================================================================
  if (shouldResetAll) {
    const freshQuestions: Array<any> = [];
    let globalQuestionNumber = 1;

    for (let pageIdx = 0; pageIdx < pagePhotos.length; pageIdx++) {
      const pageNo = pageIdx + 1;
      const pagePhoto = pagePhotos[pageIdx];
      if (!pagePhoto || pagePhoto.length < 50) continue;

      if (onProgress) {
        onProgress(`Sayfa ${pageNo} / ${pagePhotos.length}: Sorular tespit ediliyor ve ayrıştırılıyor...`);
      }

      const dewarpedPagePhoto = pagePhoto;
      let detectedBoxes: Array<{ soruNo: number; kutu: [number, number, number, number] }> = [];

      try {
        const detected = await detectQuestionBoxes(dewarpedPagePhoto, []);
        if (detected && detected.length > 0) {
          detectedBoxes = detected.filter(d => d.kutu && Array.isArray(d.kutu) && d.kutu.length === 4);
        }
      } catch (err) {
        console.warn(`Sayfa ${pageNo} tespit hatası:`, err);
      }

      // If no boxes detected, fallback to 4 standard quadrant boxes
      if (detectedBoxes.length === 0) {
        detectedBoxes = [
          { soruNo: globalQuestionNumber, kutu: [25, 20, 480, 475] },
          { soruNo: globalQuestionNumber + 1, kutu: [500, 20, 975, 475] },
          { soruNo: globalQuestionNumber + 2, kutu: [25, 500, 480, 980] },
          { soruNo: globalQuestionNumber + 3, kutu: [500, 500, 975, 980] },
        ];
      }

      // Sort boxes in reading order: Left column (xmin < 480) top-to-bottom, then Right column (xmin >= 480) top-to-bottom
      const sortedBoxes = [...detectedBoxes].sort((a, b) => {
        const aIsLeft = a.kutu[1] < 480;
        const bIsLeft = b.kutu[1] < 480;
        if (aIsLeft && !bIsLeft) return -1;
        if (!aIsLeft && bIsLeft) return 1;
        return a.kutu[0] - b.kutu[0]; // top to bottom
      });

      // Split into Left and Right columns for no-overlap generous bottom expansion
      const leftBoxes: Array<{ soruNo: number; kutu: [number, number, number, number] }> = [];
      const rightBoxes: Array<{ soruNo: number; kutu: [number, number, number, number] }> = [];

      sortedBoxes.forEach(b => {
        const clonedKutu: [number, number, number, number] = [...b.kutu];
        if (clonedKutu[1] < 480) {
          leftBoxes.push({ soruNo: b.soruNo, kutu: clonedKutu });
        } else {
          rightBoxes.push({ soruNo: b.soruNo, kutu: clonedKutu });
        }
      });

      leftBoxes.sort((a, b) => a.kutu[0] - b.kutu[0]);
      rightBoxes.sort((a, b) => a.kutu[0] - b.kutu[0]);

      // Expand left column boxes downwards generously
      for (let i = 0; i < leftBoxes.length; i++) {
        const cur = leftBoxes[i];
        const next = i < leftBoxes.length - 1 ? leftBoxes[i + 1] : null;
        const maxLimit = next ? next.kutu[0] - 10 : 985;
        cur.kutu[2] = next ? Math.min(maxLimit, cur.kutu[2] + 160) : 985;
        cur.kutu[1] = Math.max(0, cur.kutu[1] - 30);
      }

      // Expand right column boxes downwards generously
      for (let i = 0; i < rightBoxes.length; i++) {
        const cur = rightBoxes[i];
        const next = i < rightBoxes.length - 1 ? rightBoxes[i + 1] : null;
        const maxLimit = next ? next.kutu[0] - 10 : 985;
        cur.kutu[2] = next ? Math.min(maxLimit, cur.kutu[2] + 160) : 985;
        cur.kutu[1] = Math.max(450, cur.kutu[1] - 30);
        cur.kutu[3] = Math.min(1000, cur.kutu[3] + 25);
      }

      const finalPageBoxes = [...leftBoxes, ...rightBoxes];
      const totalOnPage = finalPageBoxes.length;

      for (let qIdx = 0; qIdx < finalPageBoxes.length; qIdx++) {
        const boxItem = finalPageBoxes[qIdx];
        const sNo = globalQuestionNumber++;

        try {
          const croppedImg = await cropQuestionFromPageImage(
            dewarpedPagePhoto,
            boxItem.kutu,
            qIdx,
            totalOnPage
          );

          freshQuestions.push({
            id: `q-fresh-${Date.now()}-${pageNo}-${qIdx + 1}-${Math.random().toString(36).substring(2, 6)}`,
            soruNo: sNo,
            sayfaNo: pageNo,
            sayfaIndex: pageIdx,
            ders: options?.defaultDers || 'Temel Matematik',
            konu: `Soru ${sNo}`,
            kazanim: 'Ayrıştırılmış Soru',
            soruTuru: 'coktan_secmeli',
            isaretlenenSik: 'Boş',
            ogrenciCevabi: 'Boş',
            dogruCevap: '',
            dogruMu: false,
            durum: 'bos',
            kutu: boxItem.kutu,
            soruFotografYolu: croppedImg || undefined,
            cozumMetni: '',
          });
        } catch (cropErr) {
          console.warn(`Soru ${sNo} kırpma hatası:`, cropErr);
        }
      }
    }

    return freshQuestions;
  }

  // =========================================================================
  // MODE 2: MATCH AND UPDATE EXISTING QUESTIONS (IF NOT RESETTING)
  // =========================================================================
  // Group questions by page
  const questionsByPage: Record<number, Array<{ question: any; indexInPage: number; globalIndex: number }>> = {};

  (sorular || []).forEach((q, globalIdx) => {
    const pageNo = q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1);
    if (!questionsByPage[pageNo]) {
      questionsByPage[pageNo] = [];
    }
    const indexInPage = questionsByPage[pageNo].length;
    questionsByPage[pageNo].push({ question: q, indexInPage, globalIndex: globalIdx });
  });

  // Clear existing cropped photos and bounding boxes so fresh crops completely replace old ones
  const updatedSorular = (sorular || []).map(q => ({
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

    let dewarpedPagePhoto = pagePhoto;
    let detectedBoxesMap: Record<number, [number, number, number, number]> = {};

    if (onProgress) onProgress(`Sayfa ${pageNo} için hassas soru ve şık sınırları analiz ediliyor...`);
    try {
      const detected = await detectQuestionBoxes(
        dewarpedPagePhoto,
        pageQuestions.map(p => ({
          soruNo: p.question.soruNo,
          ders: p.question.ders,
          konu: p.question.konu,
        }))
      );

      if (detected && detected.length > 0) {
        const sortedDetected = [...detected].filter(d => d.kutu).sort((a, b) => {
          const aKutu = a.kutu!;
          const bKutu = b.kutu!;
          const aIsLeft = aKutu[1] < 480;
          const bIsLeft = bKutu[1] < 480;
          if (aIsLeft && !bIsLeft) return -1;
          if (!aIsLeft && bIsLeft) return 1;
          return aKutu[0] - bKutu[0]; // top to bottom
        });

        const sortedPageQuestions = [...pageQuestions].sort((a, b) => a.question.soruNo - b.question.soruNo);

        sortedPageQuestions.forEach((p, idx) => {
          const matchingAiBox = sortedDetected[idx];
          if (matchingAiBox && matchingAiBox.kutu) {
            detectedBoxesMap[p.question.soruNo] = [...matchingAiBox.kutu] as [number, number, number, number];
          }
        });

        detected.forEach(d => {
          if (d.soruNo && d.kutu && !detectedBoxesMap[d.soruNo]) {
            detectedBoxesMap[d.soruNo] = [...d.kutu] as [number, number, number, number];
          }
        });

        const leftBoxes: Array<{ soruNo: number; kutu: [number, number, number, number] }> = [];
        const rightBoxes: Array<{ soruNo: number; kutu: [number, number, number, number] }> = [];

        Object.entries(detectedBoxesMap).forEach(([sNoStr, kutu]) => {
          const sNo = parseInt(sNoStr, 10);
          const [ymin, xmin, ymax, xmax] = kutu;
          if (xmin < 480) {
            leftBoxes.push({ soruNo: sNo, kutu: [...kutu] as [number, number, number, number] });
          } else {
            rightBoxes.push({ soruNo: sNo, kutu: [...kutu] as [number, number, number, number] });
          }
        });

        leftBoxes.sort((a, b) => a.kutu[0] - b.kutu[0]);
        rightBoxes.sort((a, b) => a.kutu[0] - b.kutu[0]);

        for (let i = 0; i < leftBoxes.length; i++) {
          const current = leftBoxes[i];
          const hasNext = i < leftBoxes.length - 1;
          const maxAllowedY = hasNext ? leftBoxes[i + 1].kutu[0] - 12 : 985;
          current.kutu[2] = hasNext ? Math.min(maxAllowedY, current.kutu[2] + 180) : 985;
          current.kutu[1] = Math.max(0, current.kutu[1] - 35);
          detectedBoxesMap[current.soruNo] = current.kutu;
        }

        for (let i = 0; i < rightBoxes.length; i++) {
          const current = rightBoxes[i];
          const hasNext = i < rightBoxes.length - 1;
          const maxAllowedY = hasNext ? rightBoxes[i + 1].kutu[0] - 12 : 985;
          current.kutu[2] = hasNext ? Math.min(maxAllowedY, current.kutu[2] + 180) : 985;
          current.kutu[1] = Math.max(450, current.kutu[1] - 35);
          current.kutu[3] = Math.min(1000, current.kutu[3] + 25);
          detectedBoxesMap[current.soruNo] = current.kutu;
        }
      }
    } catch (err) {
      console.warn('AI detectQuestionBoxes failed, using fallback layout:', err);
    }

    for (const item of pageQuestions) {
      try {
        const soruNo = item.question.soruNo;
        const aiKutu = detectedBoxesMap[soruNo] || null;

        let croppedImg = await cropQuestionFromPageImage(
          dewarpedPagePhoto,
          aiKutu,
          item.indexInPage,
          totalOnPage
        );

        if (croppedImg) {
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
