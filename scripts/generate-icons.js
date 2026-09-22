import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);

  const crcBody = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcBody);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function generatePngBuffer(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with scanline filter (filter byte 0 per line)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * (isMaskable ? 0.48 : 0.44);
  const capScale = width / 512;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background (Indigo #4f46e5 to Violet #7c3aed)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(79 + gradRatio * (124 - 79));
      let g = Math.round(70 + gradRatio * (58 - 70));
      let b = Math.round(229 + gradRatio * (237 - 229));
      let a = 255;

      // Outer squircle or circle bounds for non-maskable icons
      if (!isMaskable) {
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        const cornerRadius = width * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
        const qDist = Math.sqrt(qx * qx + qy * qy);

        if (qDist > cornerRadius) {
          a = 0; // Transparent outside rounded corner
        }
      }

      if (a > 0) {
        // Subtle concentric rings
        const ring1Dist = Math.abs(dist - width * 0.36);
        const ring2Dist = Math.abs(dist - width * 0.26);
        if (ring1Dist < 1.5 * capScale || ring2Dist < 1.5 * capScale) {
          r = Math.min(255, r + 40);
          g = Math.min(255, g + 40);
          b = Math.min(255, b + 50);
        }

        // Draw Graduation Cap Motif
        // Cap Top Diamond (normalized to center)
        const capY = dy / capScale + 30;
        const capX = Math.abs(dx / capScale);
        
        // Diamond formula: capX/134 + |capY|/65 <= 1
        if (capY >= -65 && capY <= 15 && (capX / 134 + Math.abs(capY + 25) / 40 <= 1)) {
          // White diamond top
          r = 255;
          g = 255;
          b = 255;
        } else if (capY > 15 && capY <= 70 && capX <= 90 && (dx*dx + (dy/capScale-20)*(dy/capScale-20) < 6500)) {
          // Cap Base Neck (soft lavender)
          r = 224;
          g = 231;
          b = 255;
        }

        // Gold Star / Badge below
        const starY = dy / capScale - 110;
        const starX = dx / capScale;
        const starDist = Math.sqrt(starX * starX + starY * starY);
        if (starDist <= 22) {
          r = 245;
          g = 158;
          b = 11;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA Icon variants
const icon192 = generatePngBuffer(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = generatePngBuffer(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable512 = generatePngBuffer(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable512);

const appleTouchIcon = generatePngBuffer(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Favicon 32x32 PNG
const favicon = generatePngBuffer(32, 32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

console.log('Successfully generated all PWA icons in /public:');
console.log('- pwa-192x192.png');
console.log('- pwa-512x512.png');
console.log('- pwa-maskable-512x512.png');
console.log('- apple-touch-icon.png');
console.log('- favicon.ico');
