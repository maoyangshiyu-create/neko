/**
 * .9.png (Android 9-Patch) Parser & Processor
 * 
 * Standard .9.png specification:
 * - 1px outer guide border:
 *   - Top border: Black pixels (#000000) indicate horizontal stretchable area.
 *   - Left border: Black pixels indicate vertical stretchable area.
 *   - Bottom border: Black pixels indicate horizontal content padding (safe text area).
 *   - Right border: Black pixels indicate vertical content padding (safe text area).
 * - The 1px guide border must be cropped away from the visible image.
 */

export interface Dot9ParseResult {
  isDot9: boolean;
  croppedImageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  stretch: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  content: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Checks if a pixel in RGBA array is a black guide mark
 */
function isBlackPixel(data: Uint8ClampedArray, index: number): boolean {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = data[index + 3];
  // Guide pixels in standard 9-patch are opaque black (#000000, alpha > 128)
  return a > 100 && r < 60 && g < 60 && b < 60;
}

/**
 * Parses a 9-patch image or regular image.
 * If 9-patch marks are detected, extracts stretch & content zones and crops out the 1px guide border.
 * Automatically locks aspect ratio and resizes to standard chat bubble scale.
 */
export async function parseDot9Image(src: string): Promise<Dot9ParseResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const fullW = img.naturalWidth;
      const fullH = img.naturalHeight;

      if (fullW < 3 || fullH < 3) {
        resolve({
          isDot9: false,
          croppedImageUrl: src,
          naturalWidth: fullW,
          naturalHeight: fullH,
          stretch: { top: 10, bottom: 10, left: 10, right: 10 },
          content: { top: 10, bottom: 10, left: 10, right: 10 },
        });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = fullW;
      canvas.height = fullH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        resolve({
          isDot9: false,
          croppedImageUrl: src,
          naturalWidth: fullW,
          naturalHeight: fullH,
          stretch: { top: 10, bottom: 10, left: 10, right: 10 },
          content: { top: 10, bottom: 10, left: 10, right: 10 },
        });
        return;
      }

      let data: Uint8ClampedArray;
      try {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, fullW, fullH);
        data = imgData.data;
      } catch (canvasErr) {
        // Cross-origin tainted canvas or memory limit fallback
        resolve({
          isDot9: false,
          croppedImageUrl: src,
          naturalWidth: fullW,
          naturalHeight: fullH,
          stretch: { top: 10, bottom: 10, left: 10, right: 10 },
          content: { top: 10, bottom: 10, left: 10, right: 10 },
        });
        return;
      }

      // Scan top border for horizontal stretch
      let topMinX = -1;
      let topMaxX = -1;
      for (let x = 1; x < fullW - 1; x++) {
        const idx = (0 * fullW + x) * 4;
        if (isBlackPixel(data, idx)) {
          if (topMinX === -1) topMinX = x;
          topMaxX = x;
        }
      }

      // Scan left border for vertical stretch
      let leftMinY = -1;
      let leftMaxY = -1;
      for (let y = 1; y < fullH - 1; y++) {
        const idx = (y * fullW + 0) * 4;
        if (isBlackPixel(data, idx)) {
          if (leftMinY === -1) leftMinY = y;
          leftMaxY = y;
        }
      }

      // Scan bottom border for horizontal content
      let bottomMinX = -1;
      let bottomMaxX = -1;
      const bottomY = fullH - 1;
      for (let x = 1; x < fullW - 1; x++) {
        const idx = (bottomY * fullW + x) * 4;
        if (isBlackPixel(data, idx)) {
          if (bottomMinX === -1) bottomMinX = x;
          bottomMaxX = x;
        }
      }

      // Scan right border for vertical content
      let rightMinY = -1;
      let rightMaxY = -1;
      const rightX = fullW - 1;
      for (let y = 1; y < fullH - 1; y++) {
        const idx = (y * fullW + rightX) * 4;
        if (isBlackPixel(data, idx)) {
          if (rightMinY === -1) rightMinY = y;
          rightMaxY = y;
        }
      }

      const hasTopStretch = topMinX !== -1 && topMaxX !== -1;
      const hasLeftStretch = leftMinY !== -1 && leftMaxY !== -1;

      // If at least one stretch guide is found, it is a valid .9.png
      if (hasTopStretch || hasLeftStretch) {
        const innerW = fullW - 2;
        const innerH = fullH - 2;

        const stretchLeft = hasTopStretch ? Math.max(1, topMinX - 1) : Math.round(innerW * 0.33);
        const stretchRight = hasTopStretch ? Math.max(1, innerW - topMaxX) : Math.round(innerW * 0.33);
        const stretchTop = hasLeftStretch ? Math.max(1, leftMinY - 1) : Math.round(innerH * 0.33);
        const stretchBottom = hasLeftStretch ? Math.max(1, innerH - leftMaxY) : Math.round(innerH * 0.33);

        const hasBottomContent = bottomMinX !== -1 && bottomMaxX !== -1;
        const hasRightContent = rightMinY !== -1 && rightMaxY !== -1;

        const contentLeft = hasBottomContent ? Math.max(0, bottomMinX - 1) : stretchLeft;
        const contentRight = hasBottomContent ? Math.max(0, innerW - bottomMaxX) : stretchRight;
        const contentTop = hasRightContent ? Math.max(0, rightMinY - 1) : stretchTop;
        const contentBottom = hasRightContent ? Math.max(0, innerH - rightMaxY) : stretchBottom;

        // Crop away the 1px guide border
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = innerW;
        cropCanvas.height = innerH;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(canvas, 1, 1, innerW, innerH, 0, 0, innerW, innerH);
        }
        const croppedImageUrl = cropCanvas.toDataURL('image/png');

        resolve({
          isDot9: true,
          croppedImageUrl,
          naturalWidth: innerW,
          naturalHeight: innerH,
          stretch: {
            top: stretchTop,
            bottom: stretchBottom,
            left: stretchLeft,
            right: stretchRight,
          },
          content: {
            top: contentTop,
            bottom: contentBottom,
            left: contentLeft,
            right: contentRight,
          },
        });
        return;
      }

      // Regular image without 9-patch border:
      const defaultStretchLeft = Math.max(1, Math.floor(fullW / 2) - 1);
      const defaultStretchRight = Math.max(1, fullW - defaultStretchLeft - 2);
      const defaultStretchTop = Math.max(1, Math.floor(fullH / 2) - 1);
      const defaultStretchBottom = Math.max(1, fullH - defaultStretchTop - 2);

      const defaultContentTop = Math.max(0, Math.round(fullH * 0.22));
      const defaultContentBottom = Math.max(0, Math.round(fullH * 0.22));
      const defaultContentLeft = Math.max(0, Math.round(fullW * 0.22));
      const defaultContentRight = Math.max(0, Math.round(fullW * 0.22));

      resolve({
        isDot9: false,
        croppedImageUrl: src,
        naturalWidth: fullW,
        naturalHeight: fullH,
        stretch: { top: defaultStretchTop, bottom: defaultStretchBottom, left: defaultStretchLeft, right: defaultStretchRight },
        content: { top: defaultContentTop, bottom: defaultContentBottom, left: defaultContentLeft, right: defaultContentRight },
      });
    };

    img.onerror = () => {
      resolve({
        isDot9: false,
        croppedImageUrl: src,
        naturalWidth: 100,
        naturalHeight: 50,
        stretch: { top: 15, bottom: 15, left: 15, right: 15 },
        content: { top: 12, bottom: 12, left: 16, right: 16 },
      });
    };

    img.src = src;
  });
}

/**
 * Smart detection for bubble images with wide decorations or complex corners.
 * Analyzes vertical columns and horizontal rows to find the purest, flattest 1px stretch seam,
 * avoiding decorations (ears, tails, mascots, stamps) even if they occupy 40%~60% of the image.
 */
export async function detectSmartStretchZone(imageUrl: string): Promise<{
  stretch: { top: number; bottom: number; left: number; right: number };
  content: { top: number; bottom: number; left: number; right: number };
  recommendedScale: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      if (w < 4 || h < 4) {
        resolve({
          stretch: { top: 1, bottom: 1, left: 1, right: 1 },
          content: { top: 2, bottom: 2, left: 2, right: 2 },
          recommendedScale: 0.85,
        });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        const sLeft = Math.max(1, Math.floor(w / 2) - 1);
        const sTop = Math.max(1, Math.floor(h / 2) - 1);
        resolve({
          stretch: {
            top: sTop,
            bottom: Math.max(1, h - sTop - 1),
            left: sLeft,
            right: Math.max(1, w - sLeft - 1),
          },
          content: {
            top: Math.max(0, Math.round(h * 0.18)),
            bottom: Math.max(0, Math.round(h * 0.18)),
            left: Math.max(0, Math.round(w * 0.18)),
            right: Math.max(0, Math.round(w * 0.18)),
          },
          recommendedScale: 0.85,
        });
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Helper to get luminance and alpha
      const getPixel = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return { r, g, b, a, lum: 0.299 * r + 0.587 * g + 0.114 * b };
      };

      // 1. Horizontal Search: scan columns x in [0.2*w, 0.8*w] to find the flattest column
      // Decor sections have high color variance and sharp alpha/color edges. Pure bubble backgrounds are smooth.
      const minScanX = Math.max(1, Math.round(w * 0.2));
      const maxScanX = Math.min(w - 2, Math.round(w * 0.8));

      let bestX = Math.floor(w / 2);
      let minXVariance = Infinity;

      for (let x = minScanX; x <= maxScanX; x++) {
        let diffSum = 0;
        let count = 0;
        const yStart = Math.max(0, Math.round(h * 0.25));
        const yEnd = Math.min(h - 1, Math.round(h * 0.75));

        for (let y = yStart; y < yEnd; y++) {
          const p1 = getPixel(x, y);
          const p2 = getPixel(x, y + 1);
          // Ignore transparent/near-empty pixels
          if (p1.a > 30 && p2.a > 30) {
            const dr = Math.abs(p1.r - p2.r);
            const dg = Math.abs(p1.g - p2.g);
            const db = Math.abs(p1.b - p2.b);
            diffSum += dr + dg + db;
            count++;
          }
        }

        if (count > 0) {
          const avgVariance = diffSum / count;
          // Prefer columns that are stable and close to center if variance is tied
          const centerPenalty = (Math.abs(x - w / 2) / w) * 0.5;
          const score = avgVariance + centerPenalty;
          if (score < minXVariance) {
            minXVariance = score;
            bestX = x;
          }
        }
      }

      // 2. Vertical Search: scan rows y in [0.25*h, 0.75*h] to find the flattest row
      const minScanY = Math.max(1, Math.round(h * 0.25));
      const maxScanY = Math.min(h - 2, Math.round(h * 0.75));

      let bestY = Math.floor(h / 2);
      let minYVariance = Infinity;

      for (let y = minScanY; y <= maxScanY; y++) {
        let diffSum = 0;
        let count = 0;
        const xStart = Math.max(0, Math.round(w * 0.25));
        const xEnd = Math.min(w - 1, Math.round(w * 0.75));

        for (let x = xStart; x < xEnd; x++) {
          const p1 = getPixel(x, y);
          const p2 = getPixel(x + 1, y);
          if (p1.a > 30 && p2.a > 30) {
            const dr = Math.abs(p1.r - p2.r);
            const dg = Math.abs(p1.g - p2.g);
            const db = Math.abs(p1.b - p2.b);
            diffSum += dr + dg + db;
            count++;
          }
        }

        if (count > 0) {
          const avgVariance = diffSum / count;
          const centerPenalty = (Math.abs(y - h / 2) / h) * 0.5;
          const score = avgVariance + centerPenalty;
          if (score < minYVariance) {
            minYVariance = score;
            bestY = y;
          }
        }
      }

      // Keep the stretch seam ultra-narrow (1px) to protect decorations
      const sLeft = Math.max(1, bestX);
      const sRight = Math.max(1, w - bestX - 1);
      const sTop = Math.max(1, bestY);
      const sBottom = Math.max(1, h - bestY - 1);

      // Safe content area: tight and responsive, leaving ~15% padding so text stays cozy without huge gap
      const cLeft = Math.max(2, Math.round(w * 0.16));
      const cRight = Math.max(2, Math.round(w * 0.16));
      const cTop = Math.max(2, Math.round(h * 0.16));
      const cBottom = Math.max(2, Math.round(h * 0.16));

      resolve({
        stretch: {
          top: sTop,
          bottom: sBottom,
          left: sLeft,
          right: sRight,
        },
        content: {
          top: cTop,
          bottom: cBottom,
          left: cLeft,
          right: cRight,
        },
        recommendedScale: 1.0,
      });
    };

    img.onerror = () => {
      resolve({
        stretch: { top: 10, bottom: 10, left: 10, right: 10 },
        content: { top: 8, bottom: 8, left: 12, right: 12 },
        recommendedScale: 1.0,
      });
    };

    img.src = imageUrl;
  });
}
