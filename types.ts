
export enum UnitSystem {
  SI = 'SI', // Metric
  IMPERIAL = 'IMPERIAL'
}

export type UserRole = 'free' | 'pro' | 'admin' | 'banned';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionStatus: 'active' | 'inactive' | 'past_due' | 'banned' | 'trial';
  subscriptionExpiry?: string; // ISO Date
  createdAt: string;
  // White-label fields
  companyName?: string;
  companyLogoUrl?: string;
}

export interface Point {
  x: number;
  y: number;
  id: number;
}

export interface ProjectData {
  points: Point[];
  scale: number;
  isClosed: boolean;
  unitSystem: UnitSystem;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  data: ProjectData;
  created_at: string;
  updated_at?: string;
}

export interface MaterialConfig {
  cementKgPerM3: number;
  sandM3PerM3: number;
  gravelM3PerM3: number;
  waterLPerM3: number;
  steelKgPerM3Min: number;
  steelKgPerM3Max: number;
  costConcretePerM3: number;
  costSteelPerKg: number;
}

export interface CalculationResult {
  volume: number; // always in m3 internally
  area?: number; // always in m2 internally
  system: UnitSystem;
}