import { Point, UnitSystem } from '../types';
import { CONVERSIONS } from '../constants';

/**
 * Calculates the distance between two points (pixels)
 */
export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculates polygon area using the Shoelace formula (Surveyor's formula)
 * Returns area in square pixels.
 */
export const calculatePolygonAreaPx = (points: Point[]): number => {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
};

/**
 * Format a number to 2 decimal places usually, or more if very small
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

/**
 * Central conversion utility
 */
export const convertValue = (val: number, type: 'length' | 'area' | 'volume' | 'weight', toSystem: UnitSystem): number => {
  if (toSystem === UnitSystem.SI) return val; // Assuming input is always SI (internal storage)

  switch (type) {
    case 'length': return val * CONVERSIONS.M_TO_FT;
    case 'area': return val * CONVERSIONS.M2_TO_FT2;
    case 'volume': return val * CONVERSIONS.M3_TO_FT3;
    case 'weight': return val * CONVERSIONS.KG_TO_LB;
    default: return val;
  }
};