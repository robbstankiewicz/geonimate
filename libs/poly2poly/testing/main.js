import {poly2poly} from 'poly2poly';
import { interpolate } from 'flubber';

// Our canvas
const canvasOurs = document.getElementById('canvas-ours');
const ctxOurs = canvasOurs.getContext('2d');

// Flubber canvas
const canvasFlubber = document.getElementById('canvas-flubber');
const ctxFlubber = canvasFlubber.getContext('2d');

// Shared Controls
const tSlider = document.getElementById('t');
const tValueSpan = document.getElementById('t-value');
const clearCurrentButton = document.getElementById('clear-current');
const clearAllButton = document.getElementById('clear-all');

// --- Debugging function copied from poly2poly.ts ---
function getCentroid(polygon) {
  let area = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i],
      p2 = polygon[(i + 1) % polygon.length];
    const crossProduct = p1[0] * p2[1] - p2[0] * p1[1];
    area += crossProduct;
    cx += (p1[0] + p2[0]) * crossProduct;
    cy += (p1[1] + p2[1]) * crossProduct;
  }
  if (Math.abs(area) < 1e-9) return polygon.length > 0 ? polygon[0] : [0, 0];
  const finalArea = area / 2;
  return [cx / (6 * finalArea), cy / (6 * finalArea)];
}
// --- End of copied code ---

// State
let poly1 = [];
let poly2 = [];
let flubberInterpolator;

// --- Drawing Helpers ---
function drawPolygon(ctx, polygon, color) {
  if (!polygon || polygon.length === 0) return;

  // Draw dots for each vertex
  ctx.fillStyle = color;
  polygon.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawCentroid(ctx, point, color) {
  const size = 5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(point[0] - size, point[1] - size);
  ctx.lineTo(point[0] + size, point[1] + size);
  ctx.moveTo(point[0] - size, point[1] + size);
  ctx.lineTo(point[0] + size, point[1] - size);
  ctx.stroke();
}

function updateInterpolator() {
  if (poly1.length > 2 && poly2.length > 2) {
    flubberInterpolator = interpolate(poly1, poly2, {
      maxSegmentLength: false,
    });
  } else {
    flubberInterpolator = null;
  }
}

function redraw() {
  const t = parseFloat(tSlider.value);
  tValueSpan.textContent = t.toFixed(2);

  // Clear both canvases
  ctxOurs.clearRect(0, 0, canvasOurs.width, canvasOurs.height);
  ctxFlubber.clearRect(0, 0, canvasFlubber.width, canvasFlubber.height);

  // --- Our Canvas ---
  drawPolygon(ctxOurs, poly1, 'blue');
  drawPolygon(ctxOurs, poly2, 'red');
  if (poly1.length > 2) drawCentroid(ctxOurs, getCentroid(poly1), 'blue');
  if (poly2.length > 2) drawCentroid(ctxOurs, getCentroid(poly2), 'red');

  if (poly1.length > 1 && poly2.length > 1) {
    const morphedOurs = poly2poly(poly1, poly2, t);
    drawPolygon(ctxOurs, morphedOurs, 'green');
    if (morphedOurs.length > 2)
      drawCentroid(ctxOurs, getCentroid(morphedOurs), 'green');
  }

  // --- Flubber Canvas ---
  drawPolygon(ctxFlubber, poly1, 'blue');
  drawPolygon(ctxFlubber, poly2, 'red');
  if (flubberInterpolator) {
    const morphedFlubber = flubberInterpolator(t);
    // Flubber returns a path string, so we need a special draw function
    ctxFlubber.strokeStyle = 'green';
    ctxFlubber.lineWidth = 1;
    ctxFlubber.stroke(new Path2D(morphedFlubber));
  }
}

// --- Event Listeners ---
function getSelectedMode() {
  return document.querySelector('input[name="draw-mode"]:checked').value;
}

[canvasOurs, canvasFlubber].forEach((canvas) => {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    const newPoint = [x, y];

    if (getSelectedMode() === 'poly1') {
      poly1.push(newPoint);
    } else {
      poly2.push(newPoint);
    }
    updateInterpolator();
    redraw();
  });
});

clearCurrentButton.addEventListener('click', () => {
  if (getSelectedMode() === 'poly1') {
    poly1 = [];
  } else {
    poly2 = [];
  }
  updateInterpolator();
  redraw();
});

clearAllButton.addEventListener('click', () => {
  poly1 = [];
  poly2 = [];
  updateInterpolator();
  redraw();
});

tSlider.addEventListener('input', redraw);

// Initial draw
redraw();
