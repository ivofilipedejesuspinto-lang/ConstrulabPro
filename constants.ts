
import { MaterialConfig, UnitSystem } from './types';

// --- CONFIGURAÇÃO ADSENSE ---
// Substitua estes valores pelos dados da sua conta Google AdSense
export const ADSENSE_CONFIG = {
  // O seu ID de publicador (encontra-se na URL do AdSense ou nas definições de conta)
  PUBLISHER_ID: 'ca-pub-XXXXXXXXXXXXXXXX', 
  
  // IDs dos blocos de anúncios criados no painel do AdSense
  SLOTS: {
    HEADER: '0000000001',  // Bloco Horizontal (Topo)
    INLINE: '0000000002',  // Bloco Horizontal (Meio do conteúdo)
    SIDEBAR: '0000000003', // Bloco Vertical/Quadrado (Barra lateral)
  }
};

export const CONVERSIONS = {
  M_TO_FT: 3.28084,
  M2_TO_FT2: 10.7639,
  M3_TO_FT3: 35.3147,
  KG_TO_LB: 2.20462,
  L_TO_GAL: 0.264172, // US Gallon
  HA_TO_M2: 10000,
  ACRE_TO_FT2: 43560,
};

export const DEFAULT_MATERIALS: MaterialConfig = {
  cementKgPerM3: 300,
  sandM3PerM3: 0.5,
  gravelM3PerM3: 0.8,
  waterLPerM3: 150,
  steelKgPerM3Min: 80,
  steelKgPerM3Max: 100,
  costConcretePerM3: 100, // Placeholder cost
  costSteelPerKg: 1.5,   // Placeholder cost
};

export const LABELS = {
  [UnitSystem.SI]: {
    length: 'm',
    area: 'm²',
    volume: 'm³',
    weight: 'kg',
    liquid: 'L',
    largeArea: 'hectares',
    cementBag: 'sacos (25kg)',
  },
  [UnitSystem.IMPERIAL]: {
    length: 'ft',
    area: 'sq ft',
    volume: 'cu ft',
    weight: 'lb',
    liquid: 'gal',
    largeArea: 'acres',
    cementBag: 'bags (55lb)', // Approx
  }
};
