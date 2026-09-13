import {
  DistrictData,
  computeFeatureCentroid,
} from './vulnerabilityMath';
import {
  canonicalStateName,
  getDistrictBaseline,
  calculateDistrictVulnerabilityProfile,
} from '../data/districtProfiles';
import { STATE_GEO_CONFIGS } from '../data/stateCoordinates';

export interface EnrichedGeoDataset {
  geoData: {
    type: 'FeatureCollection';
    features: any[];
  };
  flatList: DistrictData[];
}

// Global In-Memory Singleton Cache
let cachedDataset: EnrichedGeoDataset | null = null;
let inFlightPromise: Promise<EnrichedGeoDataset> | null = null;

/**
 * Generates an instant synthetic polygon approximate boundary around a centroid
 */
function createApproximateDistrictPolygon(
  center: [number, number],
  radiusDegrees = 0.22
): number[][][] {
  const [lng, lat] = center;
  const points: number[][] = [];
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const r = radiusDegrees * (0.85 + Math.sin(i * 3 + lng) * 0.15);
    const pLng = Number((lng + r * Math.cos(angle)).toFixed(4));
    const pLat = Number((lat + (r * 0.9) * Math.sin(angle)).toFixed(4));
    points.push([pLng, pLat]);
  }
  points.push([...points[0]]); // Close polygon
  return [points];
}

/**
 * Generates a full synthetic fallback GeoJSON dataset if network is blocked
 */
export function generateFallbackGeoDataset(): EnrichedGeoDataset {
  const flatList: DistrictData[] = [];
  const features: any[] = [];

  let distIndex = 0;
  Object.values(STATE_GEO_CONFIGS).forEach((state) => {
    state.keyDistricts.forEach((districtName) => {
      const stateName = canonicalStateName(state.name);
      const baseline = getDistrictBaseline(districtName, stateName);
      const distId = `dist-${distIndex++}`;

      // Jitter around state center if exact coords not in baseline
      const centerLng = state.center[0] + (Math.sin(distIndex * 1.7) * 0.9);
      const centerLat = state.center[1] + (Math.cos(distIndex * 1.3) * 0.7);
      const centroid: [number, number] = [Number(centerLng.toFixed(4)), Number(centerLat.toFixed(4))];

      const distData: DistrictData = {
        id: distId,
        name: districtName,
        state: stateName,
        coordinates: centroid,
        population: baseline.population,
        areaKm2: baseline.areaKm2,
        populationDensity: baseline.populationDensity,
        historicalDamageScore: baseline.historicalDamageScore,
        dependencyRatio: baseline.dependencyRatio,
        povertyIndex: baseline.povertyIndex,
        buildingVulnerability: baseline.buildingVulnerability,
        lifelineProximityScore: baseline.lifelineProximityScore,
        ewsCoverage: baseline.ewsCoverage,
        historicalEvent: baseline.historicalEvent,
        primaryRiskFactor: baseline.primaryRiskFactor,
      };

      const vProfile = calculateDistrictVulnerabilityProfile(stateName, districtName, centroid);

      flatList.push(distData);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: createApproximateDistrictPolygon(centroid),
        },
        properties: {
          NAME_1: stateName,
          NAME_2: districtName,
          id: distId,
          name: districtName,
          state: stateName,
          centroid,
          coordinates: centroid,
          ...distData,
          floodBase: baseline.floodBase,
          heatwaveBase: baseline.heatwaveBase,
          cycloneBase: baseline.cycloneBase,
          vulnerabilityScore: vProfile.vulnerabilityScore,
          riskTier: vProfile.riskTier,
          exposureScore: vProfile.exposureScore,
          sensitivityScore: vProfile.sensitivityScore,
          adaptiveCapacityScore: vProfile.adaptiveCapacityScore,
          lackOfCapacityScore: vProfile.lackOfCapacityScore,
        },
      });
    });
  });

  return {
    geoData: {
      type: 'FeatureCollection',
      features,
    },
    flatList,
  };
}

/**
 * Fetches JSON with automatic retry and exponential backoff on HTTP 429
 */
async function fetchWithRetry(url: string, retries = 3, baseDelayMs = 600): Promise<any> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429 && attempt < retries) {
        attempt++;
        const waitTime = baseDelayMs * Math.pow(1.8, attempt) + Math.random() * 300;
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      throw new Error(`HTTP error ${res.status}`);
    } catch (err: any) {
      if (attempt < retries) {
        attempt++;
        const waitTime = baseDelayMs * Math.pow(1.8, attempt) + Math.random() * 300;
        await new Promise((r) => setTimeout(r, waitTime));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Singleton loader for Indian District GeoJSON dataset.
 * Prevents multiple simultaneous fetches, handles 429 retries, and falls back gracefully.
 */
export async function getIndianDistrictsGeoData(): Promise<EnrichedGeoDataset> {
  if (cachedDataset) {
    return cachedDataset;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const targetUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}india-districts.json`;
      
      const rawData = await fetchWithRetry(targetUrl, 3, 500);

      const flatList: DistrictData[] = [];
      const enrichedFeatures = (rawData.features || []).map((feature: any, index: number) => {
        const rawState = feature.properties?.NAME_1 || 'India';
        const stateName = canonicalStateName(rawState);
        const districtName = feature.properties?.NAME_2 || `District ${index + 1}`;
        const centroid = computeFeatureCentroid(feature.geometry);
        const baseline = getDistrictBaseline(districtName, stateName);
        const distId = `dist-${index}`;

        const distData: DistrictData = {
          id: distId,
          name: districtName,
          state: stateName,
          coordinates: centroid,
          population: baseline.population,
          areaKm2: baseline.areaKm2,
          populationDensity: baseline.populationDensity,
          historicalDamageScore: baseline.historicalDamageScore,
          dependencyRatio: baseline.dependencyRatio,
          povertyIndex: baseline.povertyIndex,
          buildingVulnerability: baseline.buildingVulnerability,
          lifelineProximityScore: baseline.lifelineProximityScore,
          ewsCoverage: baseline.ewsCoverage,
          historicalEvent: baseline.historicalEvent,
          primaryRiskFactor: baseline.primaryRiskFactor,
        };
        flatList.push(distData);

        const vProfile = calculateDistrictVulnerabilityProfile(stateName, districtName, centroid);

        return {
          ...feature,
          properties: {
            ...feature.properties,
            id: distId,
            name: districtName,
            state: stateName,
            centroid,
            coordinates: centroid,
            ...distData,
            floodBase: baseline.floodBase,
            heatwaveBase: baseline.heatwaveBase,
            cycloneBase: baseline.cycloneBase,
            vulnerabilityScore: vProfile.vulnerabilityScore,
            riskTier: vProfile.riskTier,
            exposureScore: vProfile.exposureScore,
            sensitivityScore: vProfile.sensitivityScore,
            adaptiveCapacityScore: vProfile.adaptiveCapacityScore,
            lackOfCapacityScore: vProfile.lackOfCapacityScore,
          },
        };
      });

      const result: EnrichedGeoDataset = {
        geoData: {
          type: 'FeatureCollection',
          features: enrichedFeatures,
        },
        flatList,
      };

      cachedDataset = result;
      return result;
    } catch (err) {
      console.warn('Network GeoJSON unavailable or rate limited (429). Using built-in tactical geospatial database fallback:', err);
      const fallback = generateFallbackGeoDataset();
      cachedDataset = fallback;
      return fallback;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}
