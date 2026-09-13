// Demographic, socioeconomic, building structure, and lifeline data mapping for Indian districts
// Aligned with 3-Pillar Vulnerability Architecture: Exposure, Sensitivity, Adaptive Capacity

export interface StateBaseline {
  avgPopulation: number;
  avgAreaKm2: number;
  floodBase: number;
  heatwaveBase: number;
  cycloneBase: number;
  dependencyRatioBase: number; // % (<5 and >65 age group)
  povertyIndexBase: number; // % Multidimensional Poverty
  buildingVulnerabilityBase: number; // % Kutcha/temporary weak housing
  lifelineProximityBase: number; // 0-100 score
  ewsCoverageBase: number; // % Early warning broadcast reach
  primaryRiskFactor: string;
  historicalDisasters: string[];
}

export const STATE_BASELINES: Record<string, StateBaseline> = {
  "Maharashtra": {
    avgPopulation: 3200000,
    avgAreaKm2: 8500,
    floodBase: 70,
    heatwaveBase: 65,
    cycloneBase: 55,
    dependencyRatioBase: 44,
    povertyIndexBase: 24,
    buildingVulnerabilityBase: 28,
    lifelineProximityBase: 72,
    ewsCoverageBase: 84,
    primaryRiskFactor: 'Urban Inundation & Western Ghats Flash Floods',
    historicalDisasters: ['2005 Mumbai Cloudburst', '2019 Kolhapur/Sangli Inundation', '2021 Mahad Landslides']
  },
  "Tamil Nadu": {
    avgPopulation: 2400000,
    avgAreaKm2: 4000,
    floodBase: 75,
    heatwaveBase: 55,
    cycloneBase: 80,
    dependencyRatioBase: 42,
    povertyIndexBase: 18,
    buildingVulnerabilityBase: 22,
    lifelineProximityBase: 78,
    ewsCoverageBase: 88,
    primaryRiskFactor: 'Northeast Monsoon Storm Surges & Basin Overflow',
    historicalDisasters: ['2015 Chennai Mega-Floods', 'Cyclone Vardah (2016)', 'Cyclone Michaung (2023)']
  },
  "Kerala": {
    avgPopulation: 2500000,
    avgAreaKm2: 2700,
    floodBase: 80,
    heatwaveBase: 45,
    cycloneBase: 60,
    dependencyRatioBase: 46,
    povertyIndexBase: 8,
    buildingVulnerabilityBase: 16,
    lifelineProximityBase: 85,
    ewsCoverageBase: 90,
    primaryRiskFactor: 'Dam Release Overflows & High-Slope Debris Flows',
    historicalDisasters: ['2018 Kerala Great Floods', '2019 Wayanad Landslides', '2024 Meppadi Debris Disaster']
  },
  "Bihar": {
    avgPopulation: 3100000,
    avgAreaKm2: 2500,
    floodBase: 85,
    heatwaveBase: 75,
    cycloneBase: 20,
    dependencyRatioBase: 62,
    povertyIndexBase: 48,
    buildingVulnerabilityBase: 58,
    lifelineProximityBase: 42,
    ewsCoverageBase: 55,
    primaryRiskFactor: 'Transboundary Kosi & Gandak Riverine Floods',
    historicalDisasters: ['2008 Kosi River Avulsion', '2019 Bihar Heatwave & Floods', '2021 North Bihar Inundation']
  },
  "Assam": {
    avgPopulation: 1100000,
    avgAreaKm2: 2400,
    floodBase: 90,
    heatwaveBase: 40,
    cycloneBase: 30,
    dependencyRatioBase: 52,
    povertyIndexBase: 38,
    buildingVulnerabilityBase: 54,
    lifelineProximityBase: 48,
    ewsCoverageBase: 60,
    primaryRiskFactor: 'Brahmaputra & Barak River Basin Breach',
    historicalDisasters: ['2020 Kaziranga Annual Inundation', '2022 Silchar Urban Floods']
  },
  "Odisha": {
    avgPopulation: 1400000,
    avgAreaKm2: 5200,
    floodBase: 65,
    heatwaveBase: 70,
    cycloneBase: 92,
    dependencyRatioBase: 49,
    povertyIndexBase: 36,
    buildingVulnerabilityBase: 46,
    lifelineProximityBase: 64,
    ewsCoverageBase: 92,
    primaryRiskFactor: 'Bay of Bengal Super-Cyclones & Coastal Erosion',
    historicalDisasters: ['1999 Odisha Super Cyclone', 'Cyclone Phailin (2013)', 'Cyclone Fani (2019)']
  },
  "West Bengal": {
    avgPopulation: 3900000,
    avgAreaKm2: 4200,
    floodBase: 70,
    heatwaveBase: 60,
    cycloneBase: 85,
    dependencyRatioBase: 45,
    povertyIndexBase: 32,
    buildingVulnerabilityBase: 42,
    lifelineProximityBase: 68,
    ewsCoverageBase: 80,
    primaryRiskFactor: 'Sundarbans Storm Surges & Bhagirathi Overflows',
    historicalDisasters: ['Cyclone Amphan (2020)', '2021 Cyclone Yaas', '2009 Cyclone Aila']
  },
  "Delhi": {
    avgPopulation: 1900000, // per district
    avgAreaKm2: 135,
    floodBase: 50,
    heatwaveBase: 95,
    cycloneBase: 10,
    dependencyRatioBase: 38,
    povertyIndexBase: 12,
    buildingVulnerabilityBase: 24,
    lifelineProximityBase: 92,
    ewsCoverageBase: 95,
    primaryRiskFactor: 'Severe Urban Heat Island (UHI) & Yamuna Floodplain Swell',
    historicalDisasters: ['2024 Record 49.9°C Heatwave', '2023 Yamuna Peak Overflow', 'Annual Severe Thermal Inversion']
  },
  "Gujarat": {
    avgPopulation: 2100000,
    avgAreaKm2: 6000,
    floodBase: 55,
    heatwaveBase: 80,
    cycloneBase: 75,
    dependencyRatioBase: 43,
    povertyIndexBase: 22,
    buildingVulnerabilityBase: 28,
    lifelineProximityBase: 76,
    ewsCoverageBase: 86,
    primaryRiskFactor: 'Arabian Sea Cyclonic Surges & Flash Floods',
    historicalDisasters: ['2017 Banaskantha Floods', 'Cyclone Tauktae (2021)', 'Cyclone Biparjoy (2023)']
  },
  "Telangana": {
    avgPopulation: 1300000,
    avgAreaKm2: 3400,
    floodBase: 60,
    heatwaveBase: 88,
    cycloneBase: 35,
    dependencyRatioBase: 41,
    povertyIndexBase: 20,
    buildingVulnerabilityBase: 26,
    lifelineProximityBase: 74,
    ewsCoverageBase: 82,
    primaryRiskFactor: 'Severe Summer Thermal Wave & Musi River Waterlogging',
    historicalDisasters: ['2015 Telangana Severe Heatwave', '2020 Hyderabad Cloudburst Flooding']
  },
  "Andhra Pradesh": {
    avgPopulation: 2000000,
    avgAreaKm2: 6200,
    floodBase: 65,
    heatwaveBase: 85,
    cycloneBase: 88,
    dependencyRatioBase: 44,
    povertyIndexBase: 26,
    buildingVulnerabilityBase: 34,
    lifelineProximityBase: 70,
    ewsCoverageBase: 89,
    primaryRiskFactor: 'Godavari-Krishna River Surge & Cyclonic Landfall',
    historicalDisasters: ['Cyclone Hudhud (2014)', '2020 Krishna Delta Floods', 'Cyclone Gulab (2021)']
  },
  "Uttar Pradesh": {
    avgPopulation: 2800000,
    avgAreaKm2: 3200,
    floodBase: 65,
    heatwaveBase: 85,
    cycloneBase: 15,
    dependencyRatioBase: 58,
    povertyIndexBase: 44,
    buildingVulnerabilityBase: 52,
    lifelineProximityBase: 50,
    ewsCoverageBase: 62,
    primaryRiskFactor: 'Gangetic Plain Heat Stress & Terai Monsoon Flooding',
    historicalDisasters: ['2023 Bundelkhand Heatwave', '2021 Terai Flash Floods', '2019 Varanasi Flood Swell']
  },
  "Rajasthan": {
    avgPopulation: 2100000,
    avgAreaKm2: 10400,
    floodBase: 35,
    heatwaveBase: 95,
    cycloneBase: 25,
    dependencyRatioBase: 50,
    povertyIndexBase: 34,
    buildingVulnerabilityBase: 40,
    lifelineProximityBase: 56,
    ewsCoverageBase: 70,
    primaryRiskFactor: 'Extreme Thar Heat Wave & Desert Flash Floods',
    historicalDisasters: ['2016 Phalodi 51.0°C Heatwave', '2021 Jodhpur Flash Floods']
  },
  "Uttarakhand": {
    avgPopulation: 850000,
    avgAreaKm2: 4100,
    floodBase: 85,
    heatwaveBase: 30,
    cycloneBase: 10,
    dependencyRatioBase: 48,
    povertyIndexBase: 22,
    buildingVulnerabilityBase: 36,
    lifelineProximityBase: 52,
    ewsCoverageBase: 68,
    primaryRiskFactor: 'Himalayan Cloudbursts, Flash Floods & Landslides',
    historicalDisasters: ['2013 Kedarnath North India Disaster', '2021 Chamoli Glacial Outburst']
  },
  "Himachal Pradesh": {
    avgPopulation: 600000,
    avgAreaKm2: 4600,
    floodBase: 80,
    heatwaveBase: 30,
    cycloneBase: 10,
    dependencyRatioBase: 44,
    povertyIndexBase: 14,
    buildingVulnerabilityBase: 28,
    lifelineProximityBase: 58,
    ewsCoverageBase: 72,
    primaryRiskFactor: 'Beas/Sutlej River Swells & Hill Slope Inundation',
    historicalDisasters: ['2023 Monsoon Himachal Cloudburst Floods', '2021 Kangra Flash Floods']
  },
  "Karnataka": {
    avgPopulation: 2100000,
    avgAreaKm2: 6300,
    floodBase: 60,
    heatwaveBase: 65,
    cycloneBase: 45,
    dependencyRatioBase: 43,
    povertyIndexBase: 21,
    buildingVulnerabilityBase: 26,
    lifelineProximityBase: 74,
    ewsCoverageBase: 81,
    primaryRiskFactor: 'Krishna Basin Inundation & Urban Bangalore Waterlogging',
    historicalDisasters: ['2019 North Karnataka Floods', '2022 Bangalore Tech Corridor Urban Floods']
  },
  "Punjab": {
    avgPopulation: 1300000,
    avgAreaKm2: 2300,
    floodBase: 55,
    heatwaveBase: 80,
    cycloneBase: 10,
    dependencyRatioBase: 42,
    povertyIndexBase: 15,
    buildingVulnerabilityBase: 20,
    lifelineProximityBase: 76,
    ewsCoverageBase: 84,
    primaryRiskFactor: 'Sutlej-Ghaggar River Overflow & Summer Heat Spikes',
    historicalDisasters: ['2023 Punjab River Overflows', '2022 Northern Heat Anomaly']
  },
  "Madhya Pradesh": {
    avgPopulation: 1600000,
    avgAreaKm2: 6000,
    floodBase: 55,
    heatwaveBase: 82,
    cycloneBase: 15,
    dependencyRatioBase: 54,
    povertyIndexBase: 42,
    buildingVulnerabilityBase: 48,
    lifelineProximityBase: 52,
    ewsCoverageBase: 64,
    primaryRiskFactor: 'Narmada Basin Flooding & Malwa Heat Stress',
    historicalDisasters: ['2020 Narmada Overflow', '2022 Hoshangabad Inundation']
  },
  "Jharkhand": {
    avgPopulation: 1400000,
    avgAreaKm2: 3300,
    floodBase: 50,
    heatwaveBase: 78,
    cycloneBase: 25,
    dependencyRatioBase: 52,
    povertyIndexBase: 46,
    buildingVulnerabilityBase: 50,
    lifelineProximityBase: 52,
    ewsCoverageBase: 62,
    primaryRiskFactor: 'Mining Flash Floods & Chota Nagpur Heat Stress',
    historicalDisasters: ['2017 Damodar Basin Floods', '2022 Jharkhand Drought/Heatwave']
  },
  "Chhattisgarh": {
    avgPopulation: 1100000,
    avgAreaKm2: 5000,
    floodBase: 55,
    heatwaveBase: 80,
    cycloneBase: 20,
    dependencyRatioBase: 50,
    povertyIndexBase: 44,
    buildingVulnerabilityBase: 46,
    lifelineProximityBase: 54,
    ewsCoverageBase: 65,
    primaryRiskFactor: 'Mahanadi Basin Inundation & Forest Fire Heat Spikes',
    historicalDisasters: ['2020 Mahanadi Floods', '2023 Central India Heatwave']
  },
  "Haryana": {
    avgPopulation: 1300000,
    avgAreaKm2: 2000,
    floodBase: 50,
    heatwaveBase: 88,
    cycloneBase: 10,
    dependencyRatioBase: 42,
    povertyIndexBase: 14,
    buildingVulnerabilityBase: 22,
    lifelineProximityBase: 80,
    ewsCoverageBase: 86,
    primaryRiskFactor: 'Yamuna Inundation & Northern Extreme Heat Waves',
    historicalDisasters: ['2023 Yamuna Overflows in Ambala/Yamunanagar', '2022 Heat Anomaly']
  },
  "Jammu and Kashmir": {
    avgPopulation: 650000,
    avgAreaKm2: 2100,
    floodBase: 80,
    heatwaveBase: 20,
    cycloneBase: 5,
    dependencyRatioBase: 46,
    povertyIndexBase: 16,
    buildingVulnerabilityBase: 34,
    lifelineProximityBase: 54,
    ewsCoverageBase: 68,
    primaryRiskFactor: 'Jhelum River Swells, Avalanche & Hill Debris Inundation',
    historicalDisasters: ['2014 Kashmir Mega Floods', '2022 Amarnath Flash Floods']
  },
  "Ladakh": {
    avgPopulation: 150000,
    avgAreaKm2: 29000,
    floodBase: 65,
    heatwaveBase: 15,
    cycloneBase: 5,
    dependencyRatioBase: 44,
    povertyIndexBase: 15,
    buildingVulnerabilityBase: 36,
    lifelineProximityBase: 45,
    ewsCoverageBase: 60,
    primaryRiskFactor: 'Glacial Lake Outburst Floods (GLOF) & Cloudbursts',
    historicalDisasters: ['2010 Leh Cloudburst Disaster']
  },
  "Sikkim": {
    avgPopulation: 170000,
    avgAreaKm2: 1770,
    floodBase: 85,
    heatwaveBase: 15,
    cycloneBase: 10,
    dependencyRatioBase: 40,
    povertyIndexBase: 12,
    buildingVulnerabilityBase: 30,
    lifelineProximityBase: 56,
    ewsCoverageBase: 70,
    primaryRiskFactor: 'Teesta Glacial Outburst (GLOF) & High-Gradient Flash Floods',
    historicalDisasters: ['2023 South Lhonak GLOF / Teesta Disaster']
  },
  "Arunachal Pradesh": {
    avgPopulation: 80000,
    avgAreaKm2: 3300,
    floodBase: 80,
    heatwaveBase: 20,
    cycloneBase: 10,
    dependencyRatioBase: 46,
    povertyIndexBase: 32,
    buildingVulnerabilityBase: 44,
    lifelineProximityBase: 42,
    ewsCoverageBase: 54,
    primaryRiskFactor: 'Siang River Flash Floods & High-Seismic Landslides',
    historicalDisasters: ['2020 Siang River Flash Floods', '2022 Subansiri Landslides']
  },
  "Meghalaya": {
    avgPopulation: 280000,
    avgAreaKm2: 1900,
    floodBase: 85,
    heatwaveBase: 25,
    cycloneBase: 20,
    dependencyRatioBase: 48,
    povertyIndexBase: 34,
    buildingVulnerabilityBase: 42,
    lifelineProximityBase: 50,
    ewsCoverageBase: 62,
    primaryRiskFactor: 'Extreme Orographic Cloudbursts & Mawsynram River Swells',
    historicalDisasters: ['2022 Garo Hills Severe Flash Inundations']
  },
  "Tripura": {
    avgPopulation: 450000,
    avgAreaKm2: 1300,
    floodBase: 80,
    heatwaveBase: 45,
    cycloneBase: 40,
    dependencyRatioBase: 44,
    povertyIndexBase: 26,
    buildingVulnerabilityBase: 40,
    lifelineProximityBase: 60,
    ewsCoverageBase: 72,
    primaryRiskFactor: 'Howrah & Gomati River Spills & Transboundary Inundation',
    historicalDisasters: ['2024 Tripura Severe River Flooding', '2018 Agartala Inundations']
  },
  "Manipur": {
    avgPopulation: 200000,
    avgAreaKm2: 1400,
    floodBase: 78,
    heatwaveBase: 30,
    cycloneBase: 25,
    dependencyRatioBase: 45,
    povertyIndexBase: 28,
    buildingVulnerabilityBase: 40,
    lifelineProximityBase: 52,
    ewsCoverageBase: 64,
    primaryRiskFactor: 'Imphal River Overflow & Landslide-induced Waterlogging',
    historicalDisasters: ['2024 Cyclone Remal Floods', '2015 Manipur Floods']
  },
  "Nagaland": {
    avgPopulation: 180000,
    avgAreaKm2: 1400,
    floodBase: 70,
    heatwaveBase: 25,
    cycloneBase: 15,
    dependencyRatioBase: 44,
    povertyIndexBase: 25,
    buildingVulnerabilityBase: 38,
    lifelineProximityBase: 48,
    ewsCoverageBase: 60,
    primaryRiskFactor: 'Dhansiri River Swell & Slope Flash Inundations',
    historicalDisasters: ['2018 Nagaland Monsoon Emergency']
  },
  "Mizoram": {
    avgPopulation: 140000,
    avgAreaKm2: 1900,
    floodBase: 75,
    heatwaveBase: 25,
    cycloneBase: 35,
    dependencyRatioBase: 42,
    povertyIndexBase: 18,
    buildingVulnerabilityBase: 32,
    lifelineProximityBase: 52,
    ewsCoverageBase: 66,
    primaryRiskFactor: 'Cyclone Tail-End Precipitation & Riverine Floods',
    historicalDisasters: ['2024 Cyclone Remal Inundation', '2017 Tlawng Floods']
  },
  "Goa": {
    avgPopulation: 750000,
    avgAreaKm2: 1850,
    floodBase: 65,
    heatwaveBase: 45,
    cycloneBase: 60,
    dependencyRatioBase: 40,
    povertyIndexBase: 8,
    buildingVulnerabilityBase: 14,
    lifelineProximityBase: 84,
    ewsCoverageBase: 88,
    primaryRiskFactor: 'Mandovi-Zuari Estuary Surge & Heavy Monsoon Inundation',
    historicalDisasters: ['2021 Goa Monsoon Floods']
  },
  "Puducherry": {
    avgPopulation: 320000,
    avgAreaKm2: 120,
    floodBase: 70,
    heatwaveBase: 65,
    cycloneBase: 80,
    dependencyRatioBase: 41,
    povertyIndexBase: 10,
    buildingVulnerabilityBase: 20,
    lifelineProximityBase: 82,
    ewsCoverageBase: 90,
    primaryRiskFactor: 'Bay of Bengal Cyclonic Storm Surges',
    historicalDisasters: ['Cyclone Thane (2011)', '2015 Floods']
  },
  "Andaman and Nicobar Islands": {
    avgPopulation: 130000,
    avgAreaKm2: 2700,
    floodBase: 65,
    heatwaveBase: 35,
    cycloneBase: 85,
    dependencyRatioBase: 38,
    povertyIndexBase: 12,
    buildingVulnerabilityBase: 25,
    lifelineProximityBase: 60,
    ewsCoverageBase: 80,
    primaryRiskFactor: 'Island Tsunami, High Seas & Tropical Depressions',
    historicalDisasters: ['2004 Indian Ocean Tsunami', 'Cyclone Vardah origin (2016)']
  },
  "Chandigarh": {
    avgPopulation: 1200000,
    avgAreaKm2: 114,
    floodBase: 45,
    heatwaveBase: 88,
    cycloneBase: 10,
    dependencyRatioBase: 36,
    povertyIndexBase: 8,
    buildingVulnerabilityBase: 12,
    lifelineProximityBase: 94,
    ewsCoverageBase: 96,
    primaryRiskFactor: 'Urban Heat Island & Sukhna Choe Flash Spill',
    historicalDisasters: ['2023 Sukhna Lake Spillway Overflow', '2022 Northern Heatwave']
  },
  "National Default": {
    avgPopulation: 1500000,
    avgAreaKm2: 4500,
    floodBase: 50,
    heatwaveBase: 50,
    cycloneBase: 30,
    dependencyRatioBase: 45,
    povertyIndexBase: 25,
    buildingVulnerabilityBase: 30,
    lifelineProximityBase: 65,
    ewsCoverageBase: 75,
    primaryRiskFactor: 'Standard Regional Hydro-meteorological Stress',
    historicalDisasters: ['Baseline Historical Climate Records']
  },
};

// Known mega-district overrides
export const SPECIAL_DISTRICTS: Record<string, { population: number; areaKm2: number; density?: number }> = {
  "Mumbai": { population: 9800000, areaKm2: 157, density: 62420 },
  "Mumbai Suburban": { population: 9300000, areaKm2: 446, density: 20850 },
  "Thane": { population: 11000000, areaKm2: 4214, density: 2610 },
  "Pune": { population: 9400000, areaKm2: 15643, density: 601 },
  "Bengaluru Urban": { population: 9600000, areaKm2: 2196, density: 4371 },
  "Chennai": { population: 7100000, areaKm2: 426, density: 16666 },
  "Kolkata": { population: 4500000, areaKm2: 185, density: 24324 },
  "Hyderabad": { population: 4000000, areaKm2: 217, density: 18433 },
  "Ahmedabad": { population: 7200000, areaKm2: 8086, density: 890 },
  "Surat": { population: 6100000, areaKm2: 4418, density: 1380 },
  "North 24 Parganas": { population: 10000000, areaKm2: 4094, density: 2442 },
  "South 24 Parganas": { population: 8200000, areaKm2: 9960, density: 823 },
  "Jaipur": { population: 6600000, areaKm2: 11152, density: 591 },
  "Lucknow": { population: 4600000, areaKm2: 2528, density: 1819 },
  "Patna": { population: 5800000, areaKm2: 3202, density: 1811 },
  "Central Delhi": { population: 2200000, areaKm2: 25, density: 88000 },
  "South Delhi": { population: 2700000, areaKm2: 247, density: 10931 },
  "North Delhi": { population: 2500000, areaKm2: 61, density: 40983 },
  "East Delhi": { population: 2100000, areaKm2: 64, density: 32812 },
  "Kanpur Nagar": { population: 4600000, areaKm2: 3155, density: 1458 },
  "Nagpur": { population: 4700000, areaKm2: 9892, density: 475 },
  "Ernakulam": { population: 3400000, areaKm2: 3068, density: 1108 },
};

/**
 * Derives realistic deterministic 3-pillar metrics for any district
 */
export function getDistrictBaseline(districtName: string, stateName: string) {
  const normState = normalizeStateName(stateName);
  const stateData = STATE_BASELINES[normState] || STATE_BASELINES["National Default"] || {
    avgPopulation: 1500000,
    avgAreaKm2: 4500,
    floodBase: 50,
    heatwaveBase: 50,
    cycloneBase: 30,
    dependencyRatioBase: 45,
    povertyIndexBase: 25,
    buildingVulnerabilityBase: 30,
    lifelineProximityBase: 65,
    ewsCoverageBase: 75,
    primaryRiskFactor: 'Standard Regional Hydro-meteorological Stress',
    historicalDisasters: ['Baseline Historical Climate Records']
  };

  // Seeded hash for deterministic variance
  let hash = 0;
  for (let i = 0; i < districtName.length; i++) {
    hash = (hash << 5) - hash + districtName.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  // 1. Determine Population & Geographic Area
  let population: number;
  let areaKm2: number;
  let populationDensity: number;

  const special = SPECIAL_DISTRICTS[districtName];
  if (special) {
    population = special.population;
    areaKm2 = special.areaKm2;
    populationDensity = special.density || Math.round(population / areaKm2);
  } else {
    const popVariance = 0.4 + (posHash % 120) / 100; // 0.4x to 1.6x average
    const areaVariance = 0.5 + ((posHash >> 2) % 100) / 100; // 0.5x to 1.5x average
    population = Math.round(stateData.avgPopulation * popVariance);
    areaKm2 = Math.round(stateData.avgAreaKm2 * areaVariance);
    populationDensity = Math.round(population / Math.max(50, areaKm2));
  }

  // 2. Determine Baseline Historical Damage Score (0-100)
  const baseDamage = stateData.floodBase * 0.4 + stateData.heatwaveBase * 0.4 + (posHash % 25);
  const historicalDamageScore = Math.min(98, Math.max(12, Math.round(baseDamage)));

  // 3. Sensitivity Variables
  // Demographic dependency ratio: under 5 and over 65 (%)
  const depVariance = ((posHash % 15) - 7);
  const dependencyRatio = Math.min(72, Math.max(28, Math.round(stateData.dependencyRatioBase + depVariance)));

  // Socioeconomic Poverty Index (%)
  const povVariance = (((posHash >> 3) % 16) - 8);
  const povertyIndex = Math.min(65, Math.max(6, Math.round(stateData.povertyIndexBase + povVariance)));

  // Building Structural Vulnerability (ratio of temporary/weak structures %)
  const bldgVariance = (((posHash >> 5) % 16) - 8);
  const buildingVulnerability = Math.min(75, Math.max(10, Math.round(stateData.buildingVulnerabilityBase + bldgVariance)));

  // 4. Adaptive Capacity Variables
  // Proximity to critical lifelines (hospitals, shelters, transit routes) (0-100)
  const lifeVariance = (((posHash >> 4) % 20) - 10);
  const lifelineProximityScore = Math.min(96, Math.max(25, Math.round(stateData.lifelineProximityBase + lifeVariance)));

  // Early Warning System Coverage & alert reach (%)
  const ewsVariance = (((posHash >> 6) % 18) - 9);
  const ewsCoverage = Math.min(98, Math.max(30, Math.round(stateData.ewsCoverageBase + ewsVariance)));

  const eventIndex = posHash % stateData.historicalDisasters.length;
  const historicalEvent = stateData.historicalDisasters[eventIndex];

  return {
    population,
    areaKm2,
    populationDensity,
    historicalDamageScore,
    dependencyRatio,
    povertyIndex,
    buildingVulnerability,
    lifelineProximityScore,
    ewsCoverage,
    floodBase: stateData.floodBase,
    heatwaveBase: stateData.heatwaveBase,
    cycloneBase: stateData.cycloneBase,
    primaryRiskFactor: stateData.primaryRiskFactor,
    historicalEvent,
  };
}

export interface DistrictVulnerabilityProfile {
  districtName: string;
  stateName: string;
  vulnerabilityScore: number; // 0 - 100
  riskTier: 'Critical' | 'High' | 'Moderate' | 'Low';
  exposureScore: number;
  sensitivityScore: number;
  adaptiveCapacityScore: number;
  lackOfCapacityScore: number;
  dependencyRatio: number;
  povertyIndex: number;
  buildingVulnerability: number;
  lifelineProximity: number;
  ewsCoverage: number;
  primaryRiskFactor: string;
  historicalEvent: string;
  recommendedResources: { type: string; label: string; reason: string }[];
}

const STATE_SYNONYMS: Record<string, string> = {
  'orissa': 'Odisha',
  'odisha': 'Odisha',
  'uttaranchal': 'Uttarakhand',
  'uttarakhand': 'Uttarakhand',
  'delhi': 'Delhi',
  'nct of delhi': 'Delhi',
  'delhi nct': 'Delhi',
  'delhi (nct)': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman nicobar': 'Andaman and Nicobar Islands',
  'andaman & nicobar': 'Andaman and Nicobar Islands',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'jammu and kashmir': 'Jammu and Kashmir',
  'jammu kashmir': 'Jammu and Kashmir',
  'jammu & kashmir': 'Jammu and Kashmir',
  'pondicherry': 'Puducherry',
  'puducherry': 'Puducherry',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'chhatisgarh': 'Chhattisgarh',
  'chhattisgarh': 'Chhattisgarh',
  'telangana': 'Telangana',
  'andhra pradesh': 'Andhra Pradesh',
};

export function canonicalStateName(stateName: string): string {
  if (!stateName) return 'India';
  const clean = stateName.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  if (STATE_SYNONYMS[clean]) return STATE_SYNONYMS[clean];

  // Try direct match in STATE_BASELINES
  const keys = Object.keys(STATE_BASELINES);
  for (const k of keys) {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (kClean === clean) return k;
  }
  for (const k of keys) {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (kClean.includes(clean) || clean.includes(kClean)) return k;
  }
  return stateName.trim();
}

export function isStateMatch(stateA?: string, stateB?: string): boolean {
  if (!stateA || !stateB) return false;
  const cA = canonicalStateName(stateA).toLowerCase();
  const cB = canonicalStateName(stateB).toLowerCase();
  if (cA === cB) return true;
  if (cA.includes(cB) || cB.includes(cA)) return true;
  return false;
}

export function normalizeStateName(stateName: string): string {
  if (!stateName) return 'National Default';
  const canonical = canonicalStateName(stateName);
  if (STATE_BASELINES[canonical]) return canonical;
  const clean = stateName.trim();
  const keys = Object.keys(STATE_BASELINES);
  const found = keys.find((k) => k.toLowerCase() === clean.toLowerCase());
  if (found) return found;
  const partial = keys.find((k) => k.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(k.toLowerCase()));
  return partial || 'National Default';
}

export function calculateDistrictVulnerabilityProfile(
  stateName: string,
  districtName: string,
  _centroid?: [number, number]
): DistrictVulnerabilityProfile {
  const base = getDistrictBaseline(districtName, stateName);

  // 1. Adaptive Capacity & Coping Deficit
  const adaptiveCapacityScore = Math.min(
    100,
    Math.max(0, Math.round(0.55 * base.lifelineProximityScore + 0.45 * base.ewsCoverage))
  );
  const lackOfCapacityScore = 100 - adaptiveCapacityScore;

  // 2. Sensitivity
  const normDep = Math.min(100, Math.max(0, ((base.dependencyRatio - 25) / 50) * 100));
  const sensitivityScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.40 * base.buildingVulnerability + 0.35 * base.povertyIndex + 0.25 * normDep
      )
    )
  );

  // 3. Exposure
  const exposureScore = Math.min(100, Math.max(0, base.historicalDamageScore));

  // 4. Inherent Baseline Vulnerability
  const vulnerabilityScore = Math.min(
    98,
    Math.max(
      15,
      Math.round((0.45 * lackOfCapacityScore + 0.35 * sensitivityScore + 0.20 * exposureScore) * 10) / 10
    )
  );

  let riskTier: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Moderate';
  if (vulnerabilityScore >= 72) riskTier = 'Critical';
  else if (vulnerabilityScore >= 55) riskTier = 'High';
  else if (vulnerabilityScore >= 40) riskTier = 'Moderate';
  else riskTier = 'Low';

  // Recommendations based on vulnerability drivers
  const recommendedResources: { type: string; label: string; reason: string }[] = [];
  if (base.buildingVulnerability > 35) {
    recommendedResources.push({
      type: 'tarpTentKits',
      label: 'Shelter & Tarp Kits',
      reason: `${base.buildingVulnerability}% non-engineered weak structures susceptible to collapse`,
    });
  }
  if (base.primaryRiskFactor.toLowerCase().includes('flood') || base.floodBase > 65) {
    recommendedResources.push({
      type: 'waterMotorPumps',
      label: 'Dewatering Trash Pumps',
      reason: 'Critical waterlogging and basin inundation threat',
    });
    recommendedResources.push({
      type: 'floatingClinics',
      label: 'Boat / Floating Clinics',
      reason: 'Submerged road access requiring waterborne triage',
    });
  }
  if (base.povertyIndex > 25 || lackOfCapacityScore > 40) {
    recommendedResources.push({
      type: 'rationPackets',
      label: 'Dry Ration Food Kits',
      reason: `High socioeconomic vulnerability (${base.povertyIndex}% poverty index)`,
    });
  }
  if (recommendedResources.length === 0) {
    recommendedResources.push({
      type: 'waterTankers',
      label: 'Potable Water Tankers',
      reason: 'Essential community lifeline backup',
    });
  }

  return {
    districtName,
    stateName,
    vulnerabilityScore,
    riskTier,
    exposureScore,
    sensitivityScore,
    adaptiveCapacityScore,
    lackOfCapacityScore,
    dependencyRatio: base.dependencyRatio,
    povertyIndex: base.povertyIndex,
    buildingVulnerability: base.buildingVulnerability,
    lifelineProximity: base.lifelineProximityScore,
    ewsCoverage: base.ewsCoverage,
    primaryRiskFactor: base.primaryRiskFactor,
    historicalEvent: base.historicalEvent,
    recommendedResources,
  };
}

export function calculateStateVulnerabilityScore(stateName: string): number {
  const normState = normalizeStateName(stateName);
  const baseline = STATE_BASELINES[normState] || STATE_BASELINES["National Default"] || {
    lifelineProximityBase: 65,
    ewsCoverageBase: 75,
    dependencyRatioBase: 45,
    buildingVulnerabilityBase: 30,
    povertyIndexBase: 25,
    floodBase: 50,
    heatwaveBase: 50,
    cycloneBase: 30,
  };

  const ac = 0.55 * (baseline.lifelineProximityBase ?? 65) + 0.45 * (baseline.ewsCoverageBase ?? 75);
  const lcc = 100 - ac;
  const normDep = Math.min(100, Math.max(0, (((baseline.dependencyRatioBase ?? 45) - 25) / 50) * 100));
  const sens = 0.40 * (baseline.buildingVulnerabilityBase ?? 30) + 0.35 * (baseline.povertyIndexBase ?? 25) + 0.25 * normDep;
  const exp = ((baseline.floodBase ?? 50) * 0.4 + (baseline.heatwaveBase ?? 50) * 0.3 + (baseline.cycloneBase ?? 30) * 0.3);

  return Math.min(96, Math.max(20, Math.round(0.45 * lcc + 0.35 * sens + 0.20 * exp)));
}

