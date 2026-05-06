import { Point } from './shapes.js';

function getSignedArea(ring: Point[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % ring.length];
    sum += (p2[0] - p1[0]) * (p2[1] + p1[1]);
  }
  return sum;
}

function ensureSameOrientation(poly1: Point[], poly2: Point[]): Point[] {
  const area1 = getSignedArea(poly1);
  const area2 = getSignedArea(poly2);

  if ((area1 > 0 && area2 < 0) || (area1 < 0 && area2 > 0)) {
    return [...poly2].reverse();
  }
  return poly2;
}

function addPoints(ring: Point[], targetCount: number): Point[] {
  const currentCount = ring.length;
  if (currentCount >= targetCount) return ring;

  const needed = targetCount - currentCount;
  const newRing = [...ring];

  for (let k = 0; k < needed; k++) {
    let maxLen = -1;
    let maxIdx = -1;

    for (let i = 0; i < newRing.length; i++) {
      const p1 = newRing[i];
      const p2 = newRing[(i + 1) % newRing.length];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (len > maxLen) {
        maxLen = len;
        maxIdx = i;
      }
    }

    const p1 = newRing[maxIdx];
    const p2 = newRing[(maxIdx + 1) % newRing.length];
    const mid: Point = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

    newRing.splice(maxIdx + 1, 0, mid);
  }

  return newRing;
}

function alignPolygons(poly1: Point[], poly2: Point[]): Point[] {
  let minD = Infinity;
  let bestOffset = 0;

  for (let offset = 0; offset < poly2.length; offset++) {
    let d = 0;
    for (let i = 0; i < poly1.length; i++) {
      const p1 = poly1[i];
      const p2 = poly2[(i + offset) % poly2.length];
      d += Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
    }
    if (d < minD) {
      minD = d;
      bestOffset = offset;
    }
  }

  if (bestOffset === 0) return poly2;

  const aligned: Point[] = [];
  for (let i = 0; i < poly2.length; i++) {
    aligned.push(poly2[(i + bestOffset) % poly2.length]);
  }
  return aligned;
}

export function poly2poly(poly1: Point[], poly2: Point[], t: number): Point[] {
  if (!poly1 || poly1.length === 0) return poly2 || [];
  if (!poly2 || poly2.length === 0) return poly1 || [];

  const targetCount = Math.max(poly1.length, poly2.length);
  const p1 = addPoints(poly1, targetCount);
  let p2 = addPoints(poly2, targetCount);

  p2 = ensureSameOrientation(p1, p2);

  p2 = alignPolygons(p1, p2);

  const result: Point[] = [];
  for (let i = 0; i < targetCount; i++) {
    const x = p1[i][0] + (p2[i][0] - p1[i][0]) * t;
    const y = p1[i][1] + (p2[i][1] - p1[i][1]) * t;
    result.push([x, y]);
  }

  return result;
}
