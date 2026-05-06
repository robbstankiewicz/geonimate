import { Rgb } from "../models/rgb.model";

export const getRandomRgb = (): Rgb => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});

export const toRgba = (rgb: Rgb, opacity: number) =>
  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;

export const toHex = (rgb: Rgb) =>
  '#' +
  rgb.r.toString(16).padStart(2, '0') +
  rgb.g.toString(16).padStart(2, '0') +
  rgb.b.toString(16).padStart(2, '0');
