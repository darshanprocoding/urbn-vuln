import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  DisasterType,
  DisasterSeverityOption,
  DisasterParameters,
  DistrictData,
  ZoneScoreCalculation,
  DISASTER_PRESETS,
  SEVERITY_LEVELS_BY_TYPE,
  computeZoneVulnerability,
  computeFeatureCentroid,
} from '../utils/vulnerabilityMath';
import { getDistrictBaseline, canonicalStateName } from '../data/districtProfiles';
import { DispatchMission } from '../types/dispatch';
import { STATE_RESOURCE_DATA, StateResourceProfile } from '../data/stateResourceData';

export interface DispatchLog {
  id: string;
  sourceState: string;
  targetState: string;
  resourceKey: keyof StateResourceProfile['resources'];
  quantity: number;
  transitMode: string;
  etaHours: number;
  timestamp: string;
  status: 'In Transit' | 'Arrived' | 'Preparing' | 'Staged' | 'Delivered';
}

const DISPATCHES_STORAGE_KEY = 'ndma_tactical_dispatches_v2';
const INVENTORY_STORAGE_KEY = 'ndma_states_inventory_v2';
const LOGS_STORAGE_KEY = 'ndma_dispatch_logs_v2';

function mapToStateResourceKey(typeId: string): keyof StateResourceProfile['resources'] | null {
  const norm = (typeId || '').toLowerCase();
  if (norm.includes('watertanker') || norm.includes('tanker') || norm.includes('bowser') || norm.includes('water')) return 'waterTankers';
  if (norm.includes('ration') || norm.includes('food') || norm.includes('dryration')) return 'rationPackets';
  if (norm.includes('boat') || norm.includes('clinic') || norm.includes('gemini') || norm.includes('marine')) return 'floatingClinics';
  if (norm.includes('machinery') || norm.includes('excavator') || norm.includes('debris') || norm.includes('jcb')) return 'debrisMachinery';
  if (norm.includes('generator') || norm.includes('power') || norm.includes('dg')) return 'emergencyGenerators';
  if (norm.includes('tent') || norm.includes('tarp') || norm.includes('shelter')) return 'tarpTentKits';
  if (norm.includes('pump') || norm.includes('dewater') || norm.includes('motorpump')) return 'waterMotorPumps';
  return null;
}

export interface DisasterSimulationContextType {
  // Active Disaster State
  disasterType: DisasterType;
  selectedSeverityId: string;
  epicenter: [number, number];
  epicenterName: string;
  customRadiusKm: number;
  customDecayModel: 'exponential' | 'linear' | 'gaussian';

  // Pillar Weights
  customPillarExposure: number;
  customPillarSensitivity: number;
  customPillarAdaptive: number;

  // Sub-variable Weights
  customExpDist: number;
  customExpDensity: number;
  customExpHist: number;
  customSensDep: number;
  customSensPov: number;
  customSensBldg: number;
  customAdpLife: number;
  customAdpEws: number;

  // Computed / Derived
  currentSeverity: DisasterSeverityOption;
  activeParams: DisasterParameters;

  // Dynamic Dispatches & Report Export State
  dispatches: DispatchMission[];
  setDispatches: React.Dispatch<React.SetStateAction<DispatchMission[]>>;
  addDispatchMission: (newMission: DispatchMission) => void;
  removeDispatchMission: (missionId: string) => void;

  // Live State Resources & National Inventory
  statesData: StateResourceProfile[];
  setStatesData: React.Dispatch<React.SetStateAction<StateResourceProfile[]>>;
  dispatchLogs: DispatchLog[];
  setDispatchLogs: React.Dispatch<React.SetStateAction<DispatchLog[]>>;
  resetInventory: () => void;

  isExportReportOpen: boolean;
  setIsExportReportOpen: (open: boolean) => void;
  cachedDistricts: DistrictData[];
  setCachedDistricts: React.Dispatch<React.SetStateAction<DistrictData[]>>;

  // Mutators & Presets
  setDisasterType: (type: DisasterType) => void;
  setSelectedSeverityId: (id: string) => void;
  setEpicenter: (coords: [number, number]) => void;
  setEpicenterName: (name: string) => void;
  setCustomRadiusKm: (radius: number) => void;
  setCustomDecayModel: (model: 'exponential' | 'linear' | 'gaussian') => void;
  handlePillarWeightChange: (changed: 'exposure' | 'sensitivity' | 'adaptive', rawVal: number) => void;
  setCustomExpDist: (v: number) => void;
  setCustomExpDensity: (v: number) => void;
  setCustomExpHist: (v: number) => void;
  setCustomSensDep: (v: number) => void;
  setCustomSensPov: (v: number) => void;
  setCustomSensBldg: (v: number) => void;
  setCustomAdpLife: (v: number) => void;
  setCustomAdpEws: (v: number) => void;
  setDisasterScenario: (type: DisasterType, epicenter: [number, number], epicenterName: string, severityId?: string) => void;

  // Color & Calculation Helpers
  getZoneColor: (score: number, isAffected?: boolean) => [number, number, number, number];
  getZoneRGB: (score: number, isAffected?: boolean) => [number, number, number];
  getZoneVulnerability: (district: DistrictData) => ZoneScoreCalculation;
}

const DisasterSimulationContext = createContext<DisasterSimulationContextType | undefined>(undefined);

export const DisasterSimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core Disaster Parameters
  const [disasterType, setDisasterTypeState] = useState<DisasterType>('flood');
  const [selectedSeverityId, setSelectedSeverityId] = useState<string>('flood-lvl-3');
  const [epicenter, setEpicenter] = useState<[number, number]>([86.98, 25.54]); // Default Kosi River Basin
  const [epicenterName, setEpicenterName] = useState<string>('Kosi River Basin (Bihar)');

  const [customRadiusKm, setCustomRadiusKm] = useState<number>(420);
  const [customDecayModel, setCustomDecayModel] = useState<'exponential' | 'linear' | 'gaussian'>('exponential');

  // Pillar Macro-Weights (W_AC + W_S + W_E = 1.0)
  const [customPillarExposure, setCustomPillarExposure] = useState<number>(0.20);
  const [customPillarSensitivity, setCustomPillarSensitivity] = useState<number>(0.30);
  const [customPillarAdaptive, setCustomPillarAdaptive] = useState<number>(0.50);

  // Sub-variable weights
  const [customExpDist, setCustomExpDist] = useState<number>(0.45);
  const [customExpDensity, setCustomExpDensity] = useState<number>(0.30);
  const [customExpHist, setCustomExpHist] = useState<number>(0.25);

  const [customSensDep, setCustomSensDep] = useState<number>(0.35);
  const [customSensPov, setCustomSensPov] = useState<number>(0.35);
  const [customSensBldg, setCustomSensBldg] = useState<number>(0.30);

  const [customAdpLife, setCustomAdpLife] = useState<number>(0.55);
  const [customAdpEws, setCustomAdpEws] = useState<number>(0.45);

  // Live Dispatches state with localStorage persistence - starts with 0 dispatches unless user dispatched
  const [dispatches, setDispatches] = useState<DispatchMission[]>(() => {
    try {
      const raw = localStorage.getItem(DISPATCHES_STORAGE_KEY);
      if (raw) {
        const parsed: DispatchMission[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (m) => !['DSP-4812', 'DSP-6194', 'DSP-8401', 'DSP-9215'].includes(m.id)
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Live State Resources & National Inventory with localStorage persistence
  const [statesData, setStatesData] = useState<StateResourceProfile[]>(() => {
    try {
      const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return STATE_RESOURCE_DATA;
  });

  // Live Mutual Aid Inter-State Dispatch Logs with persistence
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(() => {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DISPATCHES_STORAGE_KEY, JSON.stringify(dispatches));
    } catch (err) {
      console.warn('Failed to save dispatches to storage', err);
    }
  }, [dispatches]);

  useEffect(() => {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(statesData));
    } catch (err) {
      console.warn('Failed to save states inventory to storage', err);
    }
  }, [statesData]);

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(dispatchLogs));
    } catch (err) {
      console.warn('Failed to save dispatch logs to storage', err);
    }
  }, [dispatchLogs]);

  // Dispatch launch helper: adds mission & decreases origin state reserve dynamically
  const addDispatchMission = useCallback((newMission: DispatchMission) => {
    setDispatches((prev) => [newMission, ...prev]);

    const originStateId = newMission.stateId?.toLowerCase();
    if (originStateId) {
      setStatesData((prevStates) =>
        prevStates.map((s) => {
          if (s.id.toLowerCase() !== originStateId) return s;
          const nextRes = { ...s.resources };
          const items = newMission.items && newMission.items.length > 0
            ? newMission.items
            : [{ typeId: newMission.resourceType, quantity: newMission.quantity }];

          for (const item of items) {
            const rawKey = (item as any).unitType || item.typeId || '';
            const rKey = mapToStateResourceKey(rawKey);
            if (rKey && nextRes[rKey]) {
              const current = nextRes[rKey];
              const deduct = Math.min(current.inReserve, item.quantity || 0);
              nextRes[rKey] = {
                ...current,
                inReserve: Math.max(0, current.inReserve - deduct),
                active: current.active + deduct,
              };
            }
          }
          return { ...s, resources: nextRes };
        })
      );
    }
  }, []);

  // Remove dispatch mission helper: restores reserves
  const removeDispatchMission = useCallback((missionId: string) => {
    setDispatches((prev) => {
      const target = prev.find((m) => m.id === missionId);
      if (target && target.stateId) {
        const originStateId = target.stateId.toLowerCase();
        setStatesData((prevStates) =>
          prevStates.map((s) => {
            if (s.id.toLowerCase() !== originStateId) return s;
            const nextRes = { ...s.resources };
            const items = target.items && target.items.length > 0
              ? target.items
              : [{ typeId: target.resourceType, quantity: target.quantity }];

            for (const item of items) {
              const rKey = mapToStateResourceKey(item.typeId || item.unitType || '');
              if (rKey && nextRes[rKey]) {
                const current = nextRes[rKey];
                const restore = item.quantity || 0;
                nextRes[rKey] = {
                  ...current,
                  inReserve: current.inReserve + restore,
                  active: Math.max(0, current.active - restore),
                };
              }
            }
            return { ...s, resources: nextRes };
          })
        );
      }
      return prev.filter((m) => m.id !== missionId);
    });
  }, []);

  // Reset inventory & dispatches to fresh pristine state
  const resetInventory = useCallback(() => {
    setStatesData(STATE_RESOURCE_DATA);
    setDispatches([]);
    setDispatchLogs([]);
    try {
      localStorage.removeItem(DISPATCHES_STORAGE_KEY);
      localStorage.removeItem(INVENTORY_STORAGE_KEY);
      localStorage.removeItem(LOGS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Export PDF Report Preview Modal Visibility State
  const [isExportReportOpen, setIsExportReportOpen] = useState<boolean>(false);

  // Cached district list loaded once and shared for instant report metrics
  const [cachedDistricts, setCachedDistricts] = useState<DistrictData[]>([]);

  // Automatically preload districts so report generation is instantly available even before map visits
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}india-districts.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data || !data.features) return;
        const flatList: DistrictData[] = (data.features || []).map((feature: any, index: number) => {
          const rawState = feature.properties?.NAME_1 || 'India';
          const stateName = canonicalStateName(rawState);
          const districtName = feature.properties?.NAME_2 || `District ${index + 1}`;
          const centroid = computeFeatureCentroid(feature.geometry);
          const baseline = getDistrictBaseline(districtName, stateName);
          return {
            id: `dist-${index}`,
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
        });
        setCachedDistricts((prev) => (prev.length === 0 ? flatList : prev));
      })
      .catch((err) => {
        console.warn('DisasterSimulationContext: preloading base districts skipped', err);
      });
  }, []);

  // Switch disaster type and sync its presets
  const setDisasterType = useCallback((type: DisasterType) => {
    setDisasterTypeState(type);
    const preset = DISASTER_PRESETS[type] || DISASTER_PRESETS.flood;
    const severityOptions = SEVERITY_LEVELS_BY_TYPE[type] || [];
    const defaultSeverity = severityOptions[Math.floor(severityOptions.length / 2)] || severityOptions[0];

    setSelectedSeverityId(defaultSeverity ? defaultSeverity.id : `${type}-lvl-2`);
    setCustomRadiusKm(defaultSeverity ? defaultSeverity.defaultRadiusKm : preset.radiusKm);
    setCustomDecayModel(preset.decayModel);

    // Sync pillar weights
    setCustomPillarExposure(preset.pillarWeights.exposure);
    setCustomPillarSensitivity(preset.pillarWeights.sensitivity);
    setCustomPillarAdaptive(preset.pillarWeights.adaptiveCapacity);

    // Sync sub-variable weights
    setCustomExpDist(preset.exposureWeights.distance);
    setCustomExpDensity(preset.exposureWeights.populationDensity);
    setCustomExpHist(preset.exposureWeights.historical);

    setCustomSensDep(preset.sensitivityWeights.dependencyRatio);
    setCustomSensPov(preset.sensitivityWeights.povertyIndex);
    setCustomSensBldg(preset.sensitivityWeights.buildingVulnerability);

    setCustomAdpLife(preset.adaptiveWeights.lifelineProximity);
    setCustomAdpEws(preset.adaptiveWeights.ewsCoverage);
  }, []);

  // Quick helper to configure a complete disaster scenario
  const setDisasterScenario = useCallback(
    (type: DisasterType, newEpicenter: [number, number], newEpicenterName: string, severityId?: string) => {
      setDisasterType(type);
      setEpicenter(newEpicenter);
      setEpicenterName(newEpicenterName);
      if (severityId) {
        setSelectedSeverityId(severityId);
      }
    },
    [setDisasterType]
  );

  // Pillar weight balancing handler
  const handlePillarWeightChange = useCallback(
    (changed: 'exposure' | 'sensitivity' | 'adaptive', rawVal: number) => {
      const clampedVal = Math.min(0.80, Math.max(0.05, rawVal));
      const remainder = 1.0 - clampedVal;

      if (changed === 'exposure') {
        const otherTotal = customPillarSensitivity + customPillarAdaptive || 1;
        const newSens = Number((remainder * (customPillarSensitivity / otherTotal)).toFixed(2));
        const newAdp = Number((remainder - newSens).toFixed(2));
        setCustomPillarExposure(clampedVal);
        setCustomPillarSensitivity(newSens);
        setCustomPillarAdaptive(newAdp);
      } else if (changed === 'sensitivity') {
        const otherTotal = customPillarExposure + customPillarAdaptive || 1;
        const newExp = Number((remainder * (customPillarExposure / otherTotal)).toFixed(2));
        const newAdp = Number((remainder - newExp).toFixed(2));
        setCustomPillarSensitivity(clampedVal);
        setCustomPillarExposure(newExp);
        setCustomPillarAdaptive(newAdp);
      } else {
        const otherTotal = customPillarExposure + customPillarSensitivity || 1;
        const newExp = Number((remainder * (customPillarExposure / otherTotal)).toFixed(2));
        const newSens = Number((remainder - newExp).toFixed(2));
        setCustomPillarAdaptive(clampedVal);
        setCustomPillarExposure(newExp);
        setCustomPillarSensitivity(newSens);
      }
    },
    [customPillarAdaptive, customPillarExposure, customPillarSensitivity]
  );

  // Active severity level
  const currentSeverity: DisasterSeverityOption = useMemo(() => {
    const options = SEVERITY_LEVELS_BY_TYPE[disasterType] || [];
    return (
      options.find((o) => o.id === selectedSeverityId) ||
      options[0] || {
        id: 'default',
        name: 'Standard Scenario',
        shortLabel: 'Standard',
        badge: 'Standard',
        subtitle: '',
        description: '',
        defaultRadiusKm: 350,
        severityMultiplier: 1.0,
        themeColor: 'blue',
      }
    );
  }, [disasterType, selectedSeverityId]);

  // Active disaster parameters memo
  const activeParams: DisasterParameters = useMemo(() => {
    const totalPillar = customPillarExposure + customPillarSensitivity + customPillarAdaptive || 1;
    return {
      type: disasterType,
      title: DISASTER_PRESETS[disasterType]?.title || 'Disaster Scenario',
      severityId: currentSeverity.id,
      severityMultiplier: currentSeverity.severityMultiplier,
      epicenter,
      epicenterName,
      radiusKm: customRadiusKm,
      decayModel: customDecayModel,
      decayFactor: disasterType === 'heatwave' ? 1.5 : disasterType === 'cyclone' ? 2.5 : 2.2,
      pillarWeights: {
        exposure: customPillarExposure / totalPillar,
        sensitivity: customPillarSensitivity / totalPillar,
        adaptiveCapacity: customPillarAdaptive / totalPillar,
      },
      exposureWeights: {
        distance: customExpDist,
        populationDensity: customExpDensity,
        historical: customExpHist,
      },
      sensitivityWeights: {
        dependencyRatio: customSensDep,
        povertyIndex: customSensPov,
        buildingVulnerability: customSensBldg,
      },
      adaptiveWeights: {
        lifelineProximity: customAdpLife,
        ewsCoverage: customAdpEws,
      },
      description: currentSeverity.description || DISASTER_PRESETS[disasterType]?.description || '',
    };
  }, [
    disasterType,
    currentSeverity,
    epicenter,
    epicenterName,
    customRadiusKm,
    customDecayModel,
    customPillarExposure,
    customPillarSensitivity,
    customPillarAdaptive,
    customExpDist,
    customExpDensity,
    customExpHist,
    customSensDep,
    customSensPov,
    customSensBldg,
    customAdpLife,
    customAdpEws,
  ]);

  // Dynamic Color Gradient Mapping Function [R, G, B, A]
  const getZoneColor = useCallback(
    (score: number, isAffected: boolean = true): [number, number, number, number] => {
      if (!isAffected || score <= 0) return [20, 30, 48, 35]; // Unaffected - Dark Subdued Slate

      if (score >= 80) {
        // 80 to 100: Orange [249, 115, 22] -> Deep Crimson Red [239, 68, 68]
        const t = Math.min(1, (score - 80) / 20);
        return [
          Math.round(249 + (239 - 249) * t),
          Math.round(115 + (68 - 115) * t),
          Math.round(22 + (68 - 22) * t),
          Math.round(230 + 20 * t),
        ];
      }
      if (score >= 60) {
        // 60 to 80: Amber/Yellow [234, 179, 8] -> Orange [249, 115, 22]
        const t = (score - 60) / 20;
        return [
          Math.round(234 + (249 - 234) * t),
          Math.round(179 + (115 - 179) * t),
          Math.round(8 + (22 - 8) * t),
          Math.round(210 + 20 * t),
        ];
      }
      if (score >= 40) {
        // 40 to 60: Lime Green [132, 204, 22] -> Amber/Yellow [234, 179, 8]
        const t = (score - 40) / 20;
        return [
          Math.round(132 + (234 - 132) * t),
          Math.round(204 + (179 - 204) * t),
          Math.round(22 + (8 - 22) * t),
          Math.round(185 + 25 * t),
        ];
      }
      if (score >= 20) {
        // 20 to 40: Emerald Green [34, 197, 94] -> Lime Green [132, 204, 22]
        const t = (score - 20) / 20;
        return [
          Math.round(34 + (132 - 34) * t),
          Math.round(197 + (204 - 197) * t),
          Math.round(94 + (22 - 94) * t),
          Math.round(165 + 20 * t),
        ];
      }
      // 1 to 20: Emerald Green
      return [34, 197, 94, 160];
    },
    []
  );

  // RGB only version for solid borders / badges
  const getZoneRGB = useCallback(
    (score: number, isAffected: boolean = true): [number, number, number] => {
      const [r, g, b] = getZoneColor(score, isAffected);
      return [r, g, b];
    },
    [getZoneColor]
  );

  // Calculation function for single district
  const getZoneVulnerability = useCallback(
    (district: DistrictData) => {
      return computeZoneVulnerability(district, activeParams);
    },
    [activeParams]
  );

  return (
    <DisasterSimulationContext.Provider
      value={{
        disasterType,
        selectedSeverityId,
        epicenter,
        epicenterName,
        customRadiusKm,
        customDecayModel,
        customPillarExposure,
        customPillarSensitivity,
        customPillarAdaptive,
        customExpDist,
        customExpDensity,
        customExpHist,
        customSensDep,
        customSensPov,
        customSensBldg,
        customAdpLife,
        customAdpEws,
        currentSeverity,
        activeParams,
        dispatches,
        setDispatches,
        addDispatchMission,
        removeDispatchMission,
        statesData,
        setStatesData,
        dispatchLogs,
        setDispatchLogs,
        resetInventory,
        isExportReportOpen,
        setIsExportReportOpen,
        cachedDistricts,
        setCachedDistricts,
        setDisasterType,
        setSelectedSeverityId,
        setEpicenter,
        setEpicenterName,
        setCustomRadiusKm,
        setCustomDecayModel,
        handlePillarWeightChange,
        setCustomExpDist,
        setCustomExpDensity,
        setCustomExpHist,
        setCustomSensDep,
        setCustomSensPov,
        setCustomSensBldg,
        setCustomAdpLife,
        setCustomAdpEws,
        setDisasterScenario,
        getZoneColor,
        getZoneRGB,
        getZoneVulnerability,
      }}
    >
      {children}
    </DisasterSimulationContext.Provider>
  );
};

export const useDisasterSimulation = () => {
  const context = useContext(DisasterSimulationContext);
  if (!context) {
    throw new Error('useDisasterSimulation must be used within a DisasterSimulationProvider');
  }
  return context;
};
