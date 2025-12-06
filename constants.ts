import { MaterialConfig, UnitSystem } from './types';

// --- CONFIGURAÇÃO ADSENSE ---
export const ADSENSE_CONFIG = {
  // O seu ID de publicador (Já configurado corretamente)
  PUBLISHER_ID: 'ca-pub-5107633859541150', 
  
  // --- PASSO FINAL ---
  // Para os anúncios específicos (Topo, Lateral, Meio) aparecerem:
  // 1. Vá a AdSense > Anúncios > Por bloco de anúncios
  // 2. Crie 3 blocos de "Display" (Visualização)
  // 3. Substitua os zeros abaixo pelos IDs que o AdSense lhe der (ex: "1234567890")
  SLOTS: {
    HEADER: '0000000001',  // Crie um bloco 'Horizontal' para o topo
    INLINE: '0000000002',  // Crie um bloco 'Horizontal' para meio do conteúdo
    SIDEBAR: '0000000003', // Crie um bloco 'Quadrado' ou 'Vertical' para a barra lateral
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