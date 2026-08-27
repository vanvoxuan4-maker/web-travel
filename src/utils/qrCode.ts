/**
 * Pure TypeScript QR Code Generator (Zero Dependencies)
 * Generates standard QR Code matrices with Reed-Solomon Error Correction
 * and renders high-precision SVG / Canvas elements for E-Tickets.
 */

// QR Code Error Correction Levels
export type QRECLevel = 'L' | 'M' | 'Q' | 'H';

// Galois Field GF(256) tables for Reed-Solomon
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function glog(n: number): number {
  if (n < 1) throw new Error(`glog(${n})`);
  return LOG_TABLE[n];
}

function gexp(n: number): number {
  return EXP_TABLE[n % 255];
}

function rsMultiply(p: number[], q: number[]): number[] {
  const r = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      if (p[i] !== 0 && q[j] !== 0) {
        r[i + j] ^= gexp(glog(p[i]) + glog(q[j]));
      }
    }
  }
  return r;
}

function rsGeneratorPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = rsMultiply(g, [1, gexp(i)]);
  }
  return g;
}

function rsCalculateEC(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const info = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = info[i];
    if (coef !== 0) {
      const logCoef = glog(coef);
      for (let j = 0; j < gen.length; j++) {
        if (gen[j] !== 0) {
          info[i + j] ^= gexp(glog(gen[j]) + logCoef);
        }
      }
    }
  }
  return info.slice(data.length);
}

// Version definitions (Capacity & EC specifications for Version 1 to 6)
interface QRVersionSpec {
  version: number;
  totalBytes: number;
  dataBytes: { L: number; M: number; Q: number; H: number };
  ecBytes: { L: number; M: number; Q: number; H: number };
  alignments: number[];
}

const VERSION_SPECS: QRVersionSpec[] = [
  { version: 1, totalBytes: 26, dataBytes: { L: 19, M: 16, Q: 13, H: 9 }, ecBytes: { L: 7, M: 10, Q: 13, H: 17 }, alignments: [] },
  { version: 2, totalBytes: 44, dataBytes: { L: 34, M: 28, Q: 22, H: 16 }, ecBytes: { L: 10, M: 16, Q: 22, H: 28 }, alignments: [6, 18] },
  { version: 3, totalBytes: 70, dataBytes: { L: 55, M: 44, Q: 34, H: 26 }, ecBytes: { L: 15, M: 26, Q: 36, H: 44 }, alignments: [6, 22] },
  { version: 4, totalBytes: 100, dataBytes: { L: 80, M: 64, Q: 48, H: 36 }, ecBytes: { L: 20, M: 36, Q: 52, H: 64 }, alignments: [6, 26] },
  { version: 5, totalBytes: 134, dataBytes: { L: 108, M: 86, Q: 62, H: 46 }, ecBytes: { L: 26, M: 48, Q: 72, H: 88 }, alignments: [6, 30] },
  { version: 6, totalBytes: 172, dataBytes: { L: 136, M: 108, Q: 76, H: 60 }, ecBytes: { L: 36, M: 64, Q: 96, H: 112 }, alignments: [6, 34] }
];

export class SimpleQRCode {
  private matrix: boolean[][];
  private size: number;

  constructor(public text: string, public ecLevel: QRECLevel = 'M') {
    const utf8Bytes = new TextEncoder().encode(text);
    // Determine suitable version
    let matchedSpec = VERSION_SPECS[0];
    for (const spec of VERSION_SPECS) {
      if (utf8Bytes.length + 2 <= spec.dataBytes[ecLevel]) {
        matchedSpec = spec;
        break;
      }
      matchedSpec = spec;
    }

    this.size = matchedSpec.version * 4 + 17;
    this.matrix = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    const isReserved = Array.from({ length: this.size }, () => new Array(this.size).fill(false));

    this.buildMatrix(utf8Bytes, matchedSpec, isReserved);
  }

  private buildMatrix(bytes: Uint8Array, spec: QRVersionSpec, isReserved: boolean[][]) {
    const size = this.size;

    // 1. Finder Patterns
    const placeFinder = (r: number, c: number) => {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const row = r + i;
          const col = c + j;
          if (row >= 0 && row < size && col >= 0 && col < size) {
            isReserved[row][col] = true;
            if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
              this.matrix[row][col] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
            } else {
              this.matrix[row][col] = false;
            }
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // 2. Alignment Patterns for version >= 2
    if (spec.alignments.length > 0) {
      for (const ar of spec.alignments) {
        for (const ac of spec.alignments) {
          if (isReserved[ar][ac]) continue;
          for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
              const row = ar + i;
              const col = ac + j;
              isReserved[row][col] = true;
              this.matrix[row][col] = Math.max(Math.abs(i), Math.abs(j)) !== 1;
            }
          }
        }
      }
    }

    // 3. Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      if (!isReserved[6][i]) {
        this.matrix[6][i] = i % 2 === 0;
        isReserved[6][i] = true;
      }
      if (!isReserved[i][6]) {
        this.matrix[i][6] = i % 2 === 0;
        isReserved[i][6] = true;
      }
    }

    // Dark Module
    this.matrix[4 * spec.version + 9][8] = true;
    isReserved[4 * spec.version + 9][8] = true;

    // Reserve Format Info Area
    for (let i = 0; i < 9; i++) {
      if (i < size) {
        isReserved[8][i] = true;
        isReserved[i][8] = true;
        isReserved[8][size - 1 - i] = true;
        isReserved[size - 1 - i][8] = true;
      }
    }

    // 4. Encode Data & Error Correction Codewords
    const bitBuffer: number[] = [];
    const pushBits = (val: number, len: number) => {
      for (let i = len - 1; i >= 0; i--) {
        bitBuffer.push((val >> i) & 1);
      }
    };

    // Mode: Byte (0100)
    pushBits(0b0100, 4);
    // Count (8 bits for v1-9)
    pushBits(bytes.length, 8);
    // Data
    for (let i = 0; i < bytes.length; i++) {
      pushBits(bytes[i], 8);
    }

    const dataCapBits = spec.dataBytes[this.ecLevel] * 8;
    // Terminator
    const termLen = Math.min(4, dataCapBits - bitBuffer.length);
    pushBits(0, termLen);
    // Align to byte boundary
    while (bitBuffer.length % 8 !== 0) {
      bitBuffer.push(0);
    }
    // Pad bytes
    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (bitBuffer.length < dataCapBits) {
      pushBits(padBytes[padIdx % 2], 8);
      padIdx++;
    }

    const dataBytesArray: number[] = [];
    for (let i = 0; i < bitBuffer.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bitBuffer[i + j];
      }
      dataBytesArray.push(b);
    }

    const ecBytesArray = rsCalculateEC(dataBytesArray, spec.ecBytes[this.ecLevel]);
    const finalCodewords = [...dataBytesArray, ...ecBytesArray];

    const finalBits: number[] = [];
    for (const byte of finalCodewords) {
      for (let i = 7; i >= 0; i--) {
        finalBits.push((byte >> i) & 1);
      }
    }

    // 5. Interleaved placement in matrix with Mask Pattern 0 ( (row + col) % 2 == 0 )
    let bitIdx = 0;
    let upward = true;
    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right--; // Skip vertical timing column
      const cols = [right, right - 1];

      const rows = [];
      if (upward) {
        for (let r = size - 1; r >= 0; r--) rows.push(r);
      } else {
        for (let r = 0; r < size; r++) rows.push(r);
      }

      for (const r of rows) {
        for (const c of cols) {
          if (!isReserved[r][c]) {
            let bit = bitIdx < finalBits.length ? finalBits[bitIdx] : 0;
            bitIdx++;
            // Apply mask 0: (r + c) % 2 === 0
            if ((r + c) % 2 === 0) {
              bit ^= 1;
            }
            this.matrix[r][c] = bit === 1;
          }
        }
      }
      upward = !upward;
    }

    // 6. Format Information (Mask 0 + EC Level M => standard format string 0x5412)
    const formatInfo = 0x5412; // Standard format bits for EC Level M & Mask 0
    for (let i = 0; i < 15; i++) {
      const bit = ((formatInfo >> i) & 1) === 1;
      if (i < 6) {
        this.matrix[8][i] = bit;
      } else if (i < 8) {
        this.matrix[8][i + 1] = bit;
      } else {
        this.matrix[14 - i][8] = bit;
      }

      if (i < 8) {
        this.matrix[size - 1 - i][8] = bit;
      } else {
        this.matrix[8][size - 15 + i] = bit;
      }
    }
  }

  getMatrix(): boolean[][] {
    return this.matrix;
  }

  toSVGDataUrl(sizePx: number = 200, fgColor: string = '#047857', bgColor: string = '#ffffff'): string {
    const svgString = this.toSVG(sizePx, fgColor, bgColor);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }

  toSVG(sizePx: number = 200, fgColor: string = '#047857', bgColor: string = '#ffffff'): string {
    const matrix = this.matrix;
    const n = matrix.length;
    const quietZone = 2;
    const totalCells = n + quietZone * 2;
    const cellSize = sizePx / totalCells;

    let path = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) {
          const x = (c + quietZone) * cellSize;
          const y = (r + quietZone) * cellSize;
          path += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}">
      <rect width="100%" height="100%" fill="${bgColor}" rx="12"/>
      <path d="${path}" fill="${fgColor}"/>
    </svg>`;
  }
}
