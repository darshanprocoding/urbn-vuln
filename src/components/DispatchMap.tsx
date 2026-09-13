import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ScatterplotLayer, LineLayer, PathLayer } from '@deck.gl/layers';
import { Map as MapGL } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { FlyToInterpolator, WebMercatorViewport } from '@deck.gl/core';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Truck,
  Package,
  Ship,
  Zap,
  Droplets,
  Gauge,
  Tent,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Layers,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Radio,
  Send,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Navigation,
  X,
  Crosshair,
  ArrowRight,
  HeartPulse,
  Activity,
  Maximize2,
  Minimize2,
  Info,
  Flame,
  Wind,
  Waves,
  FileCheck,
  Download,
  CheckCircle,
  Eye,
  FileText,
  Trash2,
} from 'lucide-react';

import {
  STATE_RESOURCE_DATA,
  RESOURCE_CATEGORIES,
  StateResourceProfile,
} from '../data/stateResourceData';
import { STATE_GEO_CONFIGS, getStateGeoConfig } from '../data/stateCoordinates';
import {
  WAREHOUSE_FACILITIES,
  WarehouseFacility,
  findNearestWarehouse,
  getWarehousesForState,
  calculateDistanceKm,
} from '../data/warehouseData';
import {
  computeFeatureCentroid,
  computeZoneVulnerability,
  ZoneScoreCalculation,
  DisasterType,
  DISASTER_PRESETS,
  SEVERITY_LEVELS_BY_TYPE,
} from '../utils/vulnerabilityMath';
import {
  getDistrictBaseline,
  calculateDistrictVulnerabilityProfile,
  calculateStateVulnerabilityScore,
  canonicalStateName,
  isStateMatch,
  DistrictVulnerabilityProfile,
} from '../data/districtProfiles';
import { useDisasterSimulation } from '../context/DisasterSimulationContext';
import {
  DISPATCH_UNIT_TYPES,
  DispatchPayloadItem,
  ArrivalReport,
} from '../data/dispatchUnits';
import { Unit3DIcon, UnitIconType } from './Unit3DIcon';
import { ReachedInfoModal } from './ReachedInfoModal';
import {
  computeRoadRoute,
  computeDijkstraRoadRoute,
  fetchRealMapRoadRoute,
  getCurvedPositionAndHeading,
  generateCurvedRoadPoints,
  haversineDistanceKm,
  ROAD_SEGMENTS,
  ROAD_NODES,
  RoadSegment,
  DijkstraRouteResult,
} from '../utils/dijkstraRouting';
import { DispatchMission, createInitialDispatches } from '../types/dispatch';
export type { DispatchMission };

const INITIAL_DISPATCHES: DispatchMission[] = createInitialDispatches('bihar');

const REGIONS = ['⚡ Affected', 'All', 'North', 'East', 'West', 'South', 'North-East', 'Central'];

// Helper to calculate RGB color based on vulnerability score
function getVulnerabilityColor(score: number): [number, number, number] {
  if (score >= 72) return [239, 68, 68]; // Critical - Red
  if (score >= 55) return [249, 115, 22]; // High - Orange
  if (score >= 42) return [245, 158, 11]; // Moderate - Amber
  return [16, 185, 129]; // Low - Emerald
}

export const DispatchMap: React.FC = () => {
  // State Selection & Dropdown State
  const [selectedStateId, setSelectedStateId] = useState<string>('bihar');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isDisasterDropdownOpen, setIsDisasterDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const disasterDropdownRef = useRef<HTMLDivElement>(null);

  // Shared Disaster Simulation Context (synced across Vulnerability Map & Dispatch Map)
  const {
    disasterType,
    selectedSeverityId,
    epicenter,
    epicenterName,
    customRadiusKm,
    currentSeverity,
    activeParams,
    getZoneColor,
    getZoneRGB,
    setDisasterScenario,
    setDisasterType,
    setSelectedSeverityId,
    setEpicenter,
    setEpicenterName,
    dispatches,
    setDispatches,
    statesData,
    addDispatchMission,
    removeDispatchMission,
  } = useDisasterSimulation();

  // GeoJSON dataset
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected State Profile & Config using live dynamic statesData
  const selectedStateProfile = useMemo(() => {
    return statesData.find((s) => s.id === selectedStateId) || statesData[0] || STATE_RESOURCE_DATA[0];
  }, [selectedStateId, statesData]);

  const stateGeoConfig = useMemo(() => {
    return getStateGeoConfig(selectedStateId);
  }, [selectedStateId]);

  // View State for DeckGL with smooth fly-to transition
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [viewState, setViewState] = useState({
    longitude: stateGeoConfig.center[0],
    latitude: stateGeoConfig.center[1],
    zoom: stateGeoConfig.zoom,
    pitch: is3DMode ? 28 : 0,
    bearing: 0,
  });

  // Map Container Reference & Sizing for Pixel Projection Overlay (Solid HUD & Vehicles)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        const { clientWidth, clientHeight } = mapContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(mapContainerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // WebMercatorViewport instance matching exact DeckGL camera projection
  const viewport = useMemo(() => {
    try {
      if (!containerDimensions.width || !containerDimensions.height) return null;
      return new WebMercatorViewport({
        width: containerDimensions.width,
        height: containerDimensions.height,
        longitude: viewState.longitude,
        latitude: viewState.latitude,
        zoom: viewState.zoom,
        pitch: viewState.pitch || 0,
        bearing: viewState.bearing || 0,
      });
    } catch {
      return null;
    }
  }, [containerDimensions, viewState]);

  // Project geographic [lng, lat] to pixel coordinates [x, y] on top of DeckGL canvas
  const projectLngLat = useCallback(
    (coords?: [number, number] | number[] | null): [number, number] | null => {
      if (!coords || !Array.isArray(coords) || coords.length < 2 || !viewport) return null;
      try {
        const [x, y] = viewport.project([coords[0], coords[1]]);
        if (isNaN(x) || isNaN(y)) return null;
        // Cull markers that are way outside viewport
        if (
          x < -300 ||
          x > containerDimensions.width + 300 ||
          y < -300 ||
          y > containerDimensions.height + 300
        ) {
          return null;
        }
        return [x, y];
      } catch {
        return null;
      }
    },
    [viewport, containerDimensions]
  );

  // Selected District within State
  const [selectedDistrictProps, setSelectedDistrictProps] = useState<any | null>(null);

  // Selected Warehouse Facility
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseFacility | null>(null);

  // Modal & Tab States
  const [showNewDispatchModal, setShowNewDispatchModal] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'inventory' | 'dispatches'>('inventory');

  // State Warehouses from National Dataset of 68 Relief Facilities
  const stateWarehouses = useMemo(() => {
    return getWarehousesForState(selectedStateId);
  }, [selectedStateId]);

  // Multi-Resource Payload Selection State
  const [selectedPayloadQuantities, setSelectedPayloadQuantities] = useState<Record<string, number>>({
    ambulance: 4,
    fireEngine: 2,
    police: 2,
    helicopter: 1,
    motorBoat: 4,
    waterTankers: 6,
    rationPackets: 2500,
    waterMotorPumps: 10,
    emergencyGenerators: 4,
    tarpTentKits: 800,
    debrisMachinery: 2,
  });

  const [activePayloadKeys, setActivePayloadKeys] = useState<string[]>([
    'ambulance',
    'fireEngine',
    'helicopter',
    'rationPackets',
  ]);

  // Selected mission for viewing Reached Information modal
  const [selectedArrivedMission, setSelectedArrivedMission] = useState<DispatchMission | null>(null);

  // Real-time arrival alert notification banner/toast
  const [arrivalToast, setArrivalToast] = useState<{
    mission: DispatchMission;
    message: string;
  } | null>(null);

  // New Dispatch Form State
  const [selectedOriginWarehouseId, setSelectedOriginWarehouseId] = useState<string>('');
  const [newTargetDistrict, setNewTargetDistrict] = useState<string>('');
  const [newResourceType, setNewResourceType] = useState<keyof typeof RESOURCE_CATEGORIES>('waterTankers');
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newTransportMode, setNewTransportMode] = useState<DispatchMission['transportMode']>('Green Road Corridor');
  const [newPriority, setNewPriority] = useState<DispatchMission['priority']>('CRITICAL');

  // Layer Toggles
  const [layerToggles, setLayerToggles] = useState({
    convoys: true,
    warehouses: true,
    floatingClinics: true,
    pumps: true,
    vulnerabilityTint: true,
    roadNetwork: true,
  });

  // Advance in-transit dispatches realistically and smoothly
  useEffect(() => {
    if (dispatches.length === 0) return;
    const interval = setInterval(() => {
      let newlyArrived: { mission: DispatchMission; message: string } | null = null;

      setDispatches((prev) => {
        let hasChanges = false;
        const updated = prev.map((d) => {
          if (d.status === 'In Transit') {
            const nextProgress = Math.min(100, (d.progress || 0) + 1);
            const isArrived = nextProgress >= 100;

            if (isArrived && d.status !== 'Arrived & Active') {
              hasChanges = true;
              const arrivalReport: ArrivalReport = {
                reachedTimestamp: 'Just now (Ground Confirmation)',
                incidentCommander: `Commandant ${d.originDepot.split(' ')[0] || 'NDRF'} Field Response Team`,
                contactRadio: `SDRF Tactical Net 156.450 MHz / EOC ${d.targetDistrict}`,
                statusMessage: `Assets successfully arrived at ${d.targetDistrict}. All ${d.items?.length || 1} unit types deployed and operational on ground.`,
                immediateZone: `${d.targetDistrict} Central Collectorate & Incident Command Post`,
                survivorsAssisted: Math.floor(400 + Math.random() * 800),
                fieldChecklist: [
                  `${d.items?.reduce((acc, i) => acc + i.quantity, 0) || d.quantity} total units accounted for with zero operational loss`,
                  'Tri-service communication link established with State Emergency Operations Center',
                  'Emergency medical triage stations and evacuation corridors active',
                  'Logistical supply lines secured for secondary replenishment waves',
                ],
              };

              const arrivedMission: DispatchMission = {
                ...d,
                progress: 100,
                etaMinutes: 0,
                status: 'Arrived & Active',
                arrivedAt: 'Just now',
                arrivalReport,
              };

              // Defer arrival toast until after state update
              newlyArrived = {
                mission: arrivedMission,
                message: `Convoy ${d.id} has reached destination: ${d.targetDistrict}!`,
              };

              return arrivedMission;
            }

            if (nextProgress !== d.progress) {
              hasChanges = true;
              return {
                ...d,
                progress: nextProgress,
                etaMinutes: Math.max(0, Math.round(d.etaMinutes * (1 - nextProgress / 100))),
              };
            }
          }
          return d;
        });

        return hasChanges ? updated : prev;
      });

      // Safely dispatch local toast notification outside the context updater
      if (newlyArrived) {
        setArrivalToast(newlyArrived);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [dispatches.length, setDispatches]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load GeoJSON dataset
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetch(`${import.meta.env.BASE_URL}india-districts.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const enrichedFeatures = (data.features || []).map((feature: any, index: number) => {
          const rawState = feature.properties?.NAME_1 || 'India';
          const stateName = canonicalStateName(rawState);
          const districtName = feature.properties?.NAME_2 || `District ${index + 1}`;
          const centroid = computeFeatureCentroid(feature.geometry);
          const baseline = getDistrictBaseline(districtName, stateName);
          const distId = `dist-${index}`;

          // Precompute vulnerability profile for fast lookup
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
              population: baseline.population,
              areaKm2: baseline.areaKm2,
              populationDensity: baseline.populationDensity,
              povertyIndex: baseline.povertyIndex,
              dependencyRatio: baseline.dependencyRatio,
              buildingVulnerability: baseline.buildingVulnerability,
              historicalDamageScore: baseline.historicalDamageScore,
              lifelineProximityScore: baseline.lifelineProximityScore,
              ewsCoverage: baseline.ewsCoverage,
              primaryRiskFactor: baseline.primaryRiskFactor,
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

        setGeoData({
          type: 'FeatureCollection',
          features: enrichedFeatures,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load district maps', err);
        setLoadError(err.message || 'Failed to load geospatial data');
        setLoading(false);
      });
  }, []);

  // Smoothly Fly To State when `selectedStateId` changes
  const flyToState = useCallback(
    (stateId: string, customPitch?: number) => {
      const cfg = getStateGeoConfig(stateId);
      const targetPitch = customPitch !== undefined ? customPitch : is3DMode ? 28 : 0;

      setViewState({
        longitude: cfg.center[0],
        latitude: cfg.center[1],
        zoom: cfg.zoom,
        pitch: targetPitch,
        bearing: 0,
        // @ts-ignore DeckGL smooth flight properties
        transitionDuration: 1350,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.35, curve: 1.4 }),
      });
    },
    [is3DMode]
  );

  // Switch State Handler
  const handleSelectState = (stateId: string) => {
    setSelectedStateId(stateId);
    setIsDropdownOpen(false);
    setSelectedDistrictProps(null);
    setSelectedWarehouse(null);
    flyToState(stateId);
  };

  // District Click Handler -> Teleport DeckGL camera to that entire state & select district
  const handleDistrictSelectAndTeleport = useCallback(
    (properties: any) => {
      if (!properties) return;
      setSelectedWarehouse(null);
      setSelectedDistrictProps(properties);

      // Extract raw state name and canonical state name
      const rawState = properties.state || properties.NAME_1 || '';
      const canonicalState = canonicalStateName(rawState);

      // Find matching state profile in STATE_RESOURCE_DATA
      const targetState = STATE_RESOURCE_DATA.find(
        (st) =>
          isStateMatch(canonicalState, st.stateName) ||
          isStateMatch(rawState, st.stateName) ||
          st.stateName.toLowerCase() === rawState.toLowerCase().trim() ||
          st.id.toLowerCase() === rawState.toLowerCase().trim()
      );

      if (targetState) {
        if (targetState.id !== selectedStateId) {
          setSelectedStateId(targetState.id);
        }
        // Teleport the DeckGL camera to the entire target state!
        flyToState(targetState.id);
      }
    },
    [selectedStateId, flyToState]
  );

  // Previous / Next State Navigation
  const handleCycleState = (direction: 'prev' | 'next') => {
    const currentIndex = STATE_RESOURCE_DATA.findIndex((s) => s.id === selectedStateId);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= STATE_RESOURCE_DATA.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = STATE_RESOURCE_DATA.length - 1;

    handleSelectState(STATE_RESOURCE_DATA[nextIndex].id);
  };

  // Toggle 3D / 2D perspective
  const handleToggle3D = () => {
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);
    setViewState((prev) => ({
      ...prev,
      pitch: nextMode ? 28 : 0,
      // @ts-ignore
      transitionDuration: 800,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  };

  // Dynamic District Vulnerability Calculation Map (calculates in <0.5ms whenever disaster scenario changes)
  const districtCalculationsMap = useMemo(() => {
    if (!geoData || !geoData.features) return new Map<string, ZoneScoreCalculation>();
    const map = new Map<string, ZoneScoreCalculation>();
    for (let i = 0; i < geoData.features.length; i++) {
      const f = geoData.features[i];
      const calc = computeZoneVulnerability(f.properties, activeParams);
      map.set(f.properties?.id, calc);
    }
    return map;
  }, [geoData, activeParams]);

  // Helper to compute live disaster impact for any state in India (for State Selector & Quick Filter)
  const getStateLiveMetrics = useCallback(
    (stateName: string) => {
      if (!geoData || !geoData.features) {
        return { score: 0, riskTier: 'Low', isImpacted: false, impactedCount: 0, totalCount: 0, maxScore: 0 };
      }
      const dists = geoData.features.filter((f: any) =>
        isStateMatch(f.properties?.state || f.properties?.NAME_1, stateName)
      );

      let maxScore = 0;
      let totalActive = 0;
      let countActive = 0;

      for (const f of dists) {
        const calc = districtCalculationsMap.get(f.properties?.id);
        if (calc && calc.isWithinImpactRadius && calc.finalScore > 0) {
          if (calc.finalScore > maxScore) maxScore = calc.finalScore;
          totalActive += calc.finalScore;
          countActive++;
        }
      }

      if (countActive > 0) {
        const avgActive = totalActive / countActive;
        const score = Math.min(99, Math.round(0.70 * maxScore + 0.30 * avgActive));
        const riskTier =
          score >= 80 ? 'Critical' : score >= 60 ? 'Severe' : score >= 40 ? 'Moderate' : 'Low';
        return {
          score,
          riskTier,
          isImpacted: true,
          impactedCount: countActive,
          totalCount: dists.length,
          maxScore,
        };
      }

      const baseline = calculateStateVulnerabilityScore(stateName);
      return {
        score: Math.min(35, Math.round(baseline * 0.4)),
        riskTier: 'Low' as const,
        isImpacted: false,
        impactedCount: 0,
        totalCount: dists.length || 1,
        maxScore: 0,
      };
    },
    [geoData, districtCalculationsMap]
  );

  // Filtered State List for Dropdown
  const filteredStates = useMemo(() => {
    return STATE_RESOURCE_DATA.filter((st) => {
      const isImpacted = getStateLiveMetrics(st.stateName).isImpacted;
      const matchRegion =
        selectedRegionFilter === 'All'
          ? true
          : selectedRegionFilter === '⚡ Affected'
          ? isImpacted
          : st.region === selectedRegionFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        st.stateName.toLowerCase().includes(q) ||
        st.capital.toLowerCase().includes(q) ||
        st.stateCode.toLowerCase().includes(q) ||
        st.primaryDisasterRisk.toLowerCase().includes(q);

      return matchRegion && matchQuery;
    });
  }, [searchQuery, selectedRegionFilter, getStateLiveMetrics]);

  // Active dispatches for current state
  const stateDispatches = useMemo(() => {
    return dispatches.filter((d) => d.stateId === selectedStateId);
  }, [dispatches, selectedStateId]);

  // Districts in the selected state from loaded GeoData
  const stateDistricts = useMemo(() => {
    if (!geoData || !geoData.features) return [];
    return geoData.features.filter((f: any) => {
      const fState = f.properties?.state || f.properties?.NAME_1 || '';
      return isStateMatch(fState, selectedStateProfile.stateName);
    });
  }, [geoData, selectedStateProfile]);

  // Dynamic State Metrics derived strictly from the simulation engine's vulnerability math
  const stateLiveMetrics = useMemo(() => {
    if (!stateDistricts || stateDistricts.length === 0) {
      const baseline = calculateStateVulnerabilityScore(selectedStateProfile.stateName);
      return {
        score: baseline,
        riskTier: 'Moderate' as const,
        impactedCount: 0,
        totalCount: 0,
        maxScore: baseline,
        isImpacted: false,
        summary: 'Baseline State Vulnerability (Outside Active Footprint)',
      };
    }

    let maxScore = 0;
    let totalActive = 0;
    let countActive = 0;

    for (const f of stateDistricts) {
      const calc = districtCalculationsMap.get(f.properties?.id);
      if (calc && calc.isWithinImpactRadius && calc.finalScore > 0) {
        if (calc.finalScore > maxScore) maxScore = calc.finalScore;
        totalActive += calc.finalScore;
        countActive++;
      }
    }

    if (countActive > 0) {
      const avgActive = totalActive / countActive;
      const score = Math.min(99, Math.round(0.70 * maxScore + 0.30 * avgActive));
      const riskTier =
        score >= 80 ? 'Critical' : score >= 60 ? 'Severe' : score >= 40 ? 'Moderate' : 'Low';

      return {
        score,
        riskTier,
        impactedCount: countActive,
        totalCount: stateDistricts.length,
        maxScore,
        isImpacted: true,
        summary: `${countActive}/${stateDistricts.length} Districts in ${activeParams.title} Crisis Footprint (Peak: ${maxScore}/100)`,
      };
    }

    // Unaffected by current active disaster event
    const baseline = calculateStateVulnerabilityScore(selectedStateProfile.stateName);
    const disasterLabel = (activeParams?.type || disasterType || 'disaster').toUpperCase();
    return {
      score: Math.min(35, Math.round(baseline * 0.4)),
      riskTier: 'Low' as const,
      impactedCount: 0,
      totalCount: stateDistricts.length,
      maxScore: 0,
      isImpacted: false,
      summary: `All ${stateDistricts.length} Districts Outside Active ${disasterLabel} Radius`,
    };
  }, [stateDistricts, districtCalculationsMap, activeParams, selectedStateProfile]);

  const stateVulnerabilityScore = stateLiveMetrics.score;

  // Available Target District names for the New Dispatch modal (dynamically sorted by active disaster score)
  const availableTargetDistricts = useMemo(() => {
    if (stateDistricts.length > 0) {
      return stateDistricts
        .map((f: any) => {
          const name = f.properties?.name || f.properties?.NAME_2;
          const calc = districtCalculationsMap.get(f.properties?.id);
          const vulnScore = calc ? calc.finalScore : f.properties?.vulnerabilityScore || 45;
          const isImpacted = calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false;
          const riskTier = vulnScore >= 80 ? 'Critical' : vulnScore >= 60 ? 'Severe' : vulnScore >= 40 ? 'Moderate' : 'Low';
          return {
            name,
            vulnScore,
            riskTier,
            isImpacted,
            primaryRisk: isImpacted ? `${activeParams.title} Zone` : selectedStateProfile.primaryDisasterRisk,
            distanceKm: calc?.distanceToEpicenterKm || 0,
          };
        })
        .sort((a, b) => b.vulnScore - a.vulnScore);
    }
    return stateGeoConfig.keyDistricts.map((d) => ({
      name: d,
      vulnScore: 50,
      riskTier: 'Moderate' as const,
      isImpacted: false,
      primaryRisk: selectedStateProfile.primaryDisasterRisk,
      distanceKm: 0,
    }));
  }, [stateDistricts, districtCalculationsMap, activeParams, stateGeoConfig, selectedStateProfile]);

  // Pre-fill target district if not set
  useEffect(() => {
    if (availableTargetDistricts.length > 0 && !newTargetDistrict) {
      setNewTargetDistrict(availableTargetDistricts[0].name);
    }
  }, [availableTargetDistricts, newTargetDistrict]);

  useEffect(() => {
    let bestWh = stateWarehouses[0] || WAREHOUSE_FACILITIES[0];
    
    // Auto-select nearest warehouse to the new Target District if available
    if (newTargetDistrict && stateDistricts.length > 0) {
      const targetFeat = stateDistricts.find(
        (f: any) => (f.properties?.name || f.properties?.NAME_2) === newTargetDistrict
      );
      if (targetFeat && targetFeat.properties?.centroid) {
        let minDist = Infinity;
        (stateWarehouses.length > 0 ? stateWarehouses : WAREHOUSE_FACILITIES).forEach((w) => {
          const d = haversineDistanceKm(w.coordinates, targetFeat.properties.centroid);
          if (d < minDist) {
            minDist = d;
            bestWh = w;
          }
        });
      }
    }
    
    setSelectedOriginWarehouseId(bestWh.id);
  }, [selectedStateId, stateWarehouses, newTargetDistrict, stateDistricts]);

  // Active Origin Warehouse for Dispatch
  const activeOriginWarehouse = useMemo(() => {
    if (selectedOriginWarehouseId) {
      const found = WAREHOUSE_FACILITIES.find((w) => w.id === selectedOriginWarehouseId);
      if (found) return found;
    }
    return stateWarehouses[0] || WAREHOUSE_FACILITIES[0];
  }, [selectedOriginWarehouseId, stateWarehouses]);

  // Dynamic Selected Target District Vulnerability Profile for the Dispatch Modal
  const targetDistrictVulnerability = useMemo(() => {
    if (!newTargetDistrict) return null;
    const targetFeat = stateDistricts.find(
      (f: any) => (f.properties?.name || f.properties?.NAME_2) === newTargetDistrict
    );
    const targetCoords = targetFeat?.properties?.centroid || [
      stateGeoConfig.center[0],
      stateGeoConfig.center[1],
    ];

    const calc = targetFeat ? districtCalculationsMap.get(targetFeat.properties?.id) : null;
    const score = calc ? calc.finalScore : 50;
    const riskTier = score >= 80 ? 'Critical' : score >= 60 ? 'Severe' : score >= 40 ? 'Moderate' : 'Low';
    
    // Disaster-driven smart resource recommendations
    const recommendations: Array<{ type: keyof typeof RESOURCE_CATEGORIES; label: string; reason: string }> = [];
    if (disasterType === 'flood') {
      recommendations.push(
        { type: 'floatingClinics', label: 'Inflatable Boat Clinics', reason: 'Critical for inundated flood plains' },
        { type: 'waterMotorPumps', label: 'High-Capacity Dewatering Pumps', reason: 'Submerged urban drains & basements' },
        { type: 'rationPackets', label: 'Family Ration Food Kits', reason: 'Cut-off islanded villages' }
      );
    } else if (disasterType === 'heatwave') {
      recommendations.push(
        { type: 'waterTankers', label: 'Potable Water Bowsers (10kL)', reason: 'Severe dehydration & water stress' },
        { type: 'emergencyGenerators', label: 'Emergency DG Sets', reason: 'Powering primary health center chillers' },
        { type: 'medicalFirstAidUnits', label: 'ORS & Heat-Stroke First Aid', reason: 'Cooling centers & trauma triage' }
      );
    } else {
      recommendations.push(
        { type: 'debrisMachinery', label: 'Heavy Debris Excavators', reason: 'Clearing uprooted trees & collapsed roads' },
        { type: 'tarpTentKits', label: 'Disaster Relief Tents & Tarps', reason: 'Emergency shelter for displaced families' },
        { type: 'emergencyGenerators', label: 'Mobile Floodlight Generators', reason: 'Grid blackout recovery' }
      );
    }

    return {
      districtName: newTargetDistrict,
      stateName: selectedStateProfile.stateName,
      vulnerabilityScore: score,
      riskTier,
      isImpacted: calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false,
      distanceToEpicenterKm: calc?.distanceToEpicenterKm || 0,
      hazardFactor: calc?.hazardFactor || 0,
      exposureScore: calc?.exposureScore || 50,
      sensitivityScore: calc?.sensitivityScore || 50,
      lackOfCapacityScore: calc?.lackOfCopingCapacity || 50,
      recommendedResources: recommendations,
      coordinates: targetCoords,
    };
  }, [newTargetDistrict, stateDistricts, stateGeoConfig, districtCalculationsMap, disasterType, selectedStateProfile]);

  // Calculated distance and estimated transit time following the road network & realistic highway curves
  const estimatedRouteInfo = useMemo(() => {
    const fallbackTarget: [number, number] = [stateGeoConfig.center[0], stateGeoConfig.center[1]];
    if (!newTargetDistrict || !activeOriginWarehouse) {
      const route = computeRoadRoute(
        activeOriginWarehouse?.coordinates || fallbackTarget,
        fallbackTarget,
        {
          stateId: selectedStateId,
          transportMode: newTransportMode,
          hazardEpicenter: epicenter,
          hazardRadiusKm: customRadiusKm,
        }
      );
      return {
        distanceKm: route.totalDistanceKm,
        straightDistanceKm: route.straightDistanceKm,
        curvatureRatio: route.curvatureRatio,
        etaMinutes: route.estimatedMinutes,
        targetCoords: fallbackTarget,
        roadRoute: route,
        dijkstraRoute: route,
        highwaysTraversed: route.highwaysTraversed,
      };
    }

    const targetFeat = stateDistricts.find(
      (f: any) => (f.properties?.name || f.properties?.NAME_2) === newTargetDistrict
    );
    const targetCoords: [number, number] = targetFeat?.properties?.centroid || fallbackTarget;

    const route = computeRoadRoute(
      activeOriginWarehouse.coordinates,
      targetCoords,
      {
        originName: activeOriginWarehouse.facilityName,
        targetName: newTargetDistrict,
        stateId: selectedStateId,
        transportMode: newTransportMode,
        hazardEpicenter: epicenter,
        hazardRadiusKm: customRadiusKm,
      }
    );

    return {
      distanceKm: route.totalDistanceKm,
      straightDistanceKm: route.straightDistanceKm,
      curvatureRatio: route.curvatureRatio,
      etaMinutes: route.estimatedMinutes,
      targetCoords,
      roadRoute: route,
      dijkstraRoute: route,
      highwaysTraversed: route.highwaysTraversed,
    };
  }, [
    newTargetDistrict,
    activeOriginWarehouse,
    stateDistricts,
    stateGeoConfig,
    newTransportMode,
    selectedStateId,
    epicenter,
    customRadiusKm,
  ]);

  // Asynchronously fetch real map road route for pending dispatch dialog
  const [asyncRealRoute, setAsyncRealRoute] = useState<DijkstraRouteResult | null>(null);

  useEffect(() => {
    if (!activeOriginWarehouse || !estimatedRouteInfo?.targetCoords || !newTargetDistrict) return;
    let isCancelled = false;
    fetchRealMapRoadRoute(
      activeOriginWarehouse.coordinates,
      estimatedRouteInfo.targetCoords,
      {
        originName: activeOriginWarehouse.facilityName,
        targetName: newTargetDistrict,
        stateId: selectedStateId,
        transportMode: newTransportMode,
        hazardEpicenter: epicenter,
        hazardRadiusKm: customRadiusKm,
      }
    )
      .then((res) => {
        if (!isCancelled && res && res.path && res.path.length >= 10) {
          setAsyncRealRoute(res);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [
    activeOriginWarehouse,
    estimatedRouteInfo?.targetCoords,
    newTargetDistrict,
    selectedStateId,
    newTransportMode,
    epicenter,
    customRadiusKm,
  ]);

  // Ensure all active dispatches follow authentic road lines from the real map
  const activeDispatchFingerprint = dispatches.map((d) => `${d.id}:${d.status}:${d.roadPath?.length || 0}`).join('|');
  useEffect(() => {
    let isCancelled = false;
    dispatches.forEach((disp) => {
      if (disp.status === 'In Transit' && (!disp.roadPath || disp.roadPath.length < 20)) {
        fetchRealMapRoadRoute(disp.originCoords, disp.targetCoords, {
          originName: disp.originDepot,
          targetName: disp.targetDistrict,
          stateId: disp.stateId,
          transportMode: disp.transportMode,
        })
          .then((realResult) => {
            if (isCancelled || !realResult || !realResult.path || realResult.path.length < 10) return;
            setDispatches((prev) =>
              prev.map((m) =>
                m.id === disp.id
                  ? {
                      ...m,
                      roadPath: realResult.path,
                      roadDistanceKm: realResult.totalDistanceKm,
                      straightDistanceKm: realResult.straightDistanceKm,
                      curvatureRatio: realResult.curvatureRatio,
                      highwaysTraversed: realResult.highwaysTraversed,
                    }
                  : m
              )
            );
          })
          .catch(() => {});
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeDispatchFingerprint]);

  // Handle Creating a New Dispatch Mission with Multiple Resources
  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetDistrict) return;

    const targetCoords = estimatedRouteInfo.targetCoords;

    // Assemble multi-resource items from active payload keys
    const items: DispatchPayloadItem[] = activePayloadKeys
      .map((key) => {
        const def = DISPATCH_UNIT_TYPES[key];
        if (!def) return null;
        const qty = selectedPayloadQuantities[key] || 1;
        return {
          typeId: def.id,
          unitType: def.id,
          name: def.name,
          shortName: def.shortName,
          quantity: qty,
          unit: def.unit || def.unitLabel,
          unitLabel: def.unitLabel,
          iconType: def.iconType,
          color: def.color,
          category: def.category,
        };
      })
      .filter(Boolean) as DispatchPayloadItem[];

    // Fallback if no items selected
    if (items.length === 0) {
      const def = DISPATCH_UNIT_TYPES['ambulances'] || Object.values(DISPATCH_UNIT_TYPES)[0];
      items.push({
        typeId: def.id,
        unitType: def.id,
        name: def.name,
        shortName: def.shortName,
        quantity: newQuantity || 5,
        unit: def.unit || def.unitLabel,
        unitLabel: def.unitLabel,
        iconType: def.iconType,
        color: def.color,
        category: def.category,
      });
    }

    // Determine primary icon unit type
    let primaryUnitType: UnitIconType = 'helicopter';
    if (items.some((i) => i.iconType === 'helicopter' || i.typeId === 'militaryHelicopters')) primaryUnitType = 'helicopter';
    else if (items.some((i) => i.iconType === 'motorBoat' || i.typeId === 'motorBoats')) primaryUnitType = 'motorBoat';
    else if (items.some((i) => i.iconType === 'ambulance' || i.typeId === 'ambulances')) primaryUnitType = 'ambulance';
    else if (items.some((i) => i.iconType === 'fireEngine' || i.typeId === 'fireEngines')) primaryUnitType = 'fireEngine';
    else if (items.some((i) => i.iconType === 'police' || i.typeId === 'policeUnits')) primaryUnitType = 'police';
    else if (items[0]?.iconType) primaryUnitType = items[0].iconType as UnitIconType;

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const unitLabelSummary = `${items.length} Asset Classes (${items.map((i) => `${i.quantity} ${i.shortName || i.name.split(' ')[0]}`).slice(0, 2).join(' + ')}${items.length > 2 ? '...' : ''})`;

    const route = (asyncRealRoute && asyncRealRoute.path && asyncRealRoute.path.length >= 10)
      ? asyncRealRoute
      : (estimatedRouteInfo.roadRoute || computeRoadRoute(
          activeOriginWarehouse.coordinates,
          targetCoords,
          {
            originName: activeOriginWarehouse.facilityName,
            targetName: newTargetDistrict,
            stateId: selectedStateId,
            transportMode: newTransportMode,
            hazardEpicenter: epicenter,
            hazardRadiusKm: customRadiusKm,
          }
        ));

    const newMission: DispatchMission = {
      id: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
      stateId: selectedStateId,
      targetDistrict: newTargetDistrict,
      targetCoords,
      originDepot: `${activeOriginWarehouse.facilityName} (${activeOriginWarehouse.district})`,
      originCoords: activeOriginWarehouse.coordinates,
      items,
      resourceType: items[0]?.typeId || 'ambulances',
      quantity: totalQty,
      unitLabel: unitLabelSummary,
      primaryUnitType,
      transportMode: newTransportMode,
      status: 'In Transit',
      progress: 3,
      etaMinutes: route.estimatedMinutes,
      priority: newPriority,
      dispatchedAt: 'Just now',
      route,
      roadPath: (asyncRealRoute && asyncRealRoute.path && asyncRealRoute.path.length >= 10) ? asyncRealRoute.path : [],
      roadDistanceKm: route.totalDistanceKm,
      straightDistanceKm: route.straightDistanceKm,
      curvatureRatio: route.curvatureRatio,
      highwaysTraversed: route.highwaysTraversed,
    };

    addDispatchMission(newMission);
    setShowNewDispatchModal(false);
    setActiveLeftTab('dispatches');
    setIsLeftPanelOpen(true);
  };

  // Dynamic Selected district detailed profile (when clicking a polygon on the map)
  const inspectedDistrictProfile = useMemo(() => {
    if (!selectedDistrictProps) return null;
    const distId = selectedDistrictProps.id;
    const calc = districtCalculationsMap.get(distId);
    const score = calc ? calc.finalScore : selectedDistrictProps.vulnerabilityScore || 45;
    const riskTier = score >= 80 ? 'Critical' : score >= 60 ? 'Severe' : score >= 40 ? 'Moderate' : 'Low';

    return {
      districtName: selectedDistrictProps.name || selectedDistrictProps.NAME_2 || 'District',
      stateName: selectedDistrictProps.state || selectedDistrictProps.NAME_1 || selectedStateProfile.stateName,
      vulnerabilityScore: score,
      inherentScore: calc?.inherentVulnerabilityScore || 45,
      riskTier,
      isImpacted: calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false,
      distanceToEpicenterKm: calc?.distanceToEpicenterKm || 0,
      hazardFactor: calc?.hazardFactor || 0,
      exposureScore: calc?.exposureScore || selectedDistrictProps.exposureScore || 50,
      sensitivityScore: calc?.sensitivityScore || selectedDistrictProps.sensitivityScore || 50,
      lackOfCapacityScore: calc?.lackOfCopingCapacity || selectedDistrictProps.lackOfCapacityScore || 50,
      population: selectedDistrictProps.population || 1200000,
      populationDensity: selectedDistrictProps.populationDensity || 450,
      povertyIndex: selectedDistrictProps.povertyIndex || 35,
    };
  }, [selectedDistrictProps, districtCalculationsMap, selectedStateProfile]);

  // Map Layers construction
  const layers = useMemo(() => {
    if (!geoData) return [];

    const normSelectedState = selectedStateProfile.stateName.toLowerCase().trim();
    const layerList: any[] = [];

    // 1. Dynamic District Polygons with Real-Time Disaster Vulnerability Color-Coding
    layerList.push(
      new GeoJsonLayer({
        id: 'dispatch-district-polygons',
        data: geoData,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthUnits: 'pixels',
        getLineColor: (d: any) => {
          const isSelectedDist = selectedDistrictProps && selectedDistrictProps.id === d.properties?.id;
          if (isSelectedDist) {
            return [59, 130, 246, 255]; // Vivid Cyan/Blue border for selected district
          }

          const isCurrentState = isStateMatch(
            d.properties?.state || d.properties?.NAME_1,
            selectedStateProfile.stateName
          );

          const calc = districtCalculationsMap.get(d.properties?.id);
          const score = calc ? calc.finalScore : d.properties?.vulnerabilityScore || 45;
          const isWithinImpact = calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false;

          if (isCurrentState) {
            // Prominent electric blue boundary outline for selected state (e.g. Odisha, Bihar, etc.)
            return [59, 130, 246, 255];
          }

          if (isWithinImpact) {
            const [r, g, b] = getZoneRGB(score, true);
            return [r, g, b, 230]; // Vivid alert boundary for disaster impact zone
          }

          return [255, 255, 255, 18];
        },
        getLineWidth: (d: any) => {
          const isSelectedDist = selectedDistrictProps && selectedDistrictProps.id === d.properties?.id;
          if (isSelectedDist) return 3.5;

          const isCurrentState = isStateMatch(
            d.properties?.state || d.properties?.NAME_1,
            selectedStateProfile.stateName
          );
          if (isCurrentState) return 2.4; // Bold blue outline for selected state

          const calc = districtCalculationsMap.get(d.properties?.id);
          const isWithinImpact = calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false;
          if (isWithinImpact) return 1.6;

          return 0.5;
        },
        getFillColor: (d: any) => {
          const isSelectedDist = selectedDistrictProps && selectedDistrictProps.id === d.properties?.id;
          if (isSelectedDist) {
            return [59, 130, 246, 175]; // Vivid highlight on selected district
          }

          const calc = districtCalculationsMap.get(d.properties?.id);
          const score = calc ? calc.finalScore : 0;
          const isWithinImpact = calc ? calc.isWithinImpactRadius && calc.finalScore > 0 : false;

          // 1. If within active disaster impact radius, use EXACT vulnerability RGB colors from simulation engine
          if (isWithinImpact && score > 0) {
            const [r, g, b] = getZoneRGB(score, true);
            const isCurrentState = isStateMatch(
              d.properties?.state || d.properties?.NAME_1,
              selectedStateProfile.stateName
            );
            const alpha = layerToggles.vulnerabilityTint ? (isCurrentState ? 195 : 160) : 110;
            return [r, g, b, alpha];
          }

          // 2. If in current selected state (outside active disaster footprint)
          const isCurrentState = isStateMatch(
            d.properties?.state || d.properties?.NAME_1,
            selectedStateProfile.stateName
          );
          if (isCurrentState) {
            return [30, 58, 102, layerToggles.vulnerabilityTint ? 80 : 45];
          }

          // 3. Nationwide background districts
          return [15, 23, 42, 20];
        },
        updateTriggers: {
          getFillColor: [selectedStateId, selectedDistrictProps?.id, layerToggles.vulnerabilityTint, activeParams, districtCalculationsMap],
          getLineColor: [selectedStateId, selectedDistrictProps?.id, activeParams, districtCalculationsMap],
          getLineWidth: [selectedStateId, selectedDistrictProps?.id, activeParams, districtCalculationsMap],
        },
        onClick: (info: any) => {
          if (info && info.object && info.object.properties) {
            handleDistrictSelectAndTeleport(info.object.properties);
          }
        },
        dataComparator: () => true,
      })
    );

    // 2. Disaster Epicenter & Impact Radius Ring
    if (epicenter && epicenter.length === 2) {
      const radiusMeters = (customRadiusKm || currentSeverity.defaultRadiusKm) * 1000;
      layerList.push(
        new ScatterplotLayer({
          id: 'dispatch-disaster-footprint-ring',
          data: [{ position: [epicenter[0], epicenter[1], 10] }],
          getPosition: (d: any) => d.position,
          getRadius: radiusMeters,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          getFillColor:
            disasterType === 'flood'
              ? [59, 130, 246, 25]
              : disasterType === 'heatwave'
              ? [239, 68, 68, 25]
              : [168, 85, 247, 25],
          getLineColor:
            disasterType === 'flood'
              ? [96, 165, 250, 220]
              : disasterType === 'heatwave'
              ? [248, 113, 113, 220]
              : [192, 132, 252, 220],
          pickable: false,
        })
      );

      layerList.push(
        new ScatterplotLayer({
          id: 'dispatch-disaster-epicenter-beacon',
          data: [{ position: [epicenter[0], epicenter[1], 20] }],
          getPosition: (d: any) => d.position,
          getRadius: 18000,
          radiusMinPixels: 9,
          radiusMaxPixels: 22,
          filled: true,
          stroked: true,
          getFillColor:
            disasterType === 'flood'
              ? [59, 130, 246, 240]
              : disasterType === 'heatwave'
              ? [239, 68, 68, 240]
              : [168, 85, 247, 240],
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 2.5,
          pickable: true,
        })
      );
    }

    // 2.5 National & State Highway Grid (Road Network)
    if (layerToggles.roadNetwork) {
      layerList.push(
        new PathLayer({
          id: 'highway-network-base',
          data: ROAD_SEGMENTS,
          getPath: (d: RoadSegment) => {
            const nodeFrom = ROAD_NODES[d.from];
            const nodeTo = ROAD_NODES[d.to];
            if (!nodeFrom || !nodeTo) return [];
            return generateCurvedRoadPoints(nodeFrom.coordinates, nodeTo.coordinates, d.curveWaypoints, 10);
          },
          getColor: (d: RoadSegment) =>
            d.roadType === 'expressway'
              ? [37, 99, 235, 110]
              : d.roadType === 'national_highway'
              ? [71, 85, 105, 90]
              : [51, 65, 85, 55],
          getWidth: (d: RoadSegment) => (d.roadType === 'expressway' ? 2.5 : d.roadType === 'national_highway' ? 1.6 : 1.0),
          widthUnits: 'pixels',
          widthMinPixels: 1,
          pickable: false,
        })
      );
    }

    // 3. Active Supply Lines & Convoys (Connecting Relief Warehouses to Affected Districts - Image 2 Navigation Style)
    const activeRouteData: any[] = [];

    // Include only active in-transit dispatches for current state (completed dispatches are cleared from the map path)
    if (layerToggles.convoys) {
      stateDispatches
        .filter((disp) => disp.status === 'In Transit' && (disp.progress || 0) < 100)
        .forEach((disp) => {
          const pathCoords =
            disp.roadPath && disp.roadPath.length >= 2
              ? disp.roadPath
              : [
                  Array.isArray(disp.originCoords) && disp.originCoords.length >= 2 ? disp.originCoords : [78.9629, 20.5937],
                  Array.isArray(disp.targetCoords) && disp.targetCoords.length >= 2 ? disp.targetCoords : [78.9629, 20.5937],
                ];

          activeRouteData.push({
            id: disp.id,
            path: pathCoords,
            priority: disp.priority,
            targetDistrict: disp.targetDistrict,
            originDepot: disp.originDepot,
            roadDistanceKm: disp.roadDistanceKm || 60,
            curvatureRatio: disp.curvatureRatio,
            highwaysTraversed: disp.highwaysTraversed,
            progress: disp.progress || 0,
            etaMinutes: disp.etaMinutes || 35,
            status: disp.status,
            primaryUnitType: disp.primaryUnitType,
            isPreview: false,
          });
        });

      // Also include preview route when planning a dispatch or selecting warehouse + district
      if ((showNewDispatchModal || (selectedWarehouse && selectedDistrictProps)) && estimatedRouteInfo?.targetCoords && activeOriginWarehouse) {
        const previewPathCoords =
          asyncRealRoute && asyncRealRoute.path && asyncRealRoute.path.length >= 10
            ? asyncRealRoute.path
            : estimatedRouteInfo.roadRoute?.path || estimatedRouteInfo.dijkstraRoute?.path || [
                activeOriginWarehouse.coordinates,
                estimatedRouteInfo.targetCoords,
              ];

        activeRouteData.push({
          id: 'preview-dispatch-route',
          path: previewPathCoords,
          priority: 'HIGH',
          targetDistrict: newTargetDistrict || selectedDistrictProps?.NAME_2 || selectedDistrictProps?.name || 'Target District',
          originDepot: activeOriginWarehouse.facilityName,
          roadDistanceKm: estimatedRouteInfo.distanceKm,
          curvatureRatio: estimatedRouteInfo.curvatureRatio,
          highwaysTraversed: estimatedRouteInfo.highwaysTraversed,
          progress: 0,
          etaMinutes: estimatedRouteInfo.etaMinutes,
          status: 'Route Planned',
          primaryUnitType: 'ambulance',
          isPreview: true,
        });
      }
    }

    if (activeRouteData.length > 0) {
      // 3A. Outer Glow Corridor Layer (Wide Neon Mint/Emerald Glow)
      layerList.push(
        new PathLayer({
          id: 'dispatch-supply-routes-glow',
          data: activeRouteData,
          getPath: (d: any) => d.path,
          getColor: [16, 185, 129, 85], // Emerald / mint neon glow matching Image 2
          getWidth: 13,
          widthUnits: 'pixels',
          widthMinPixels: 6,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        })
      );

      // 3B. High-Contrast Core Route Path Layer (Vibrant Mint Emerald Navigation Ribbon)
      layerList.push(
        new PathLayer({
          id: 'dispatch-supply-routes-core',
          data: activeRouteData,
          getPath: (d: any) => d.path,
          getColor: [16, 185, 129, 240], // Bright mint emerald ribbon
          getWidth: 6.5,
          widthUnits: 'pixels',
          widthMinPixels: 3.5,
          capRounded: true,
          jointRounded: true,
          pickable: true,
        })
      );

      // 3C. Inner Bright Highlight Centerline (Mint-White for authentic GPS route look like Image 2)
      layerList.push(
        new PathLayer({
          id: 'dispatch-supply-routes-highlight',
          data: activeRouteData,
          getPath: (d: any) => d.path,
          getColor: [220, 252, 231, 255], // White-mint crisp center core
          getWidth: 2.2,
          widthUnits: 'pixels',
          widthMinPixels: 1.5,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        })
      );

      // 3D. Checkpoint / Waypoint Nodes along the route (Circular white dots with emerald ring like in Image 2!)
      const checkpointNodes: any[] = [];
      activeRouteData.forEach((route) => {
        if (route.path && route.path.length >= 2) {
          const step = Math.max(5, Math.floor(route.path.length / 10));
          for (let i = step; i < route.path.length - 1; i += step) {
            checkpointNodes.push({
              id: `${route.id}-cp-${i}`,
              coordinates: route.path[i],
            });
          }
        }
      });

      if (checkpointNodes.length > 0) {
        layerList.push(
          new ScatterplotLayer({
            id: 'dispatch-route-checkpoints',
            data: checkpointNodes,
            getPosition: (d: any) => d.coordinates,
            getRadius: 4200,
            radiusMinPixels: 3.5,
            radiusMaxPixels: 5.5,
            filled: true,
            stroked: true,
            getFillColor: [255, 255, 255, 255], // Pure white core
            getLineColor: [16, 185, 129, 255],  // Emerald ring
            lineWidthMinPixels: 2,
            pickable: false,
          })
        );
      }
    }

    // 4. Official NDMA/SDMA Relief Warehouses (National Dataset)
    if (layerToggles.warehouses) {
      layerList.push(
        new ScatterplotLayer({
          id: 'dispatch-relief-warehouses',
          data: WAREHOUSE_FACILITIES,
          getPosition: (d: WarehouseFacility) => d.coordinates,
          getRadius: (d: WarehouseFacility) => {
            const isStateWH = stateWarehouses.some((sw) => sw.id === d.id);
            return isStateWH ? 8500 : 5000;
          },
          radiusMinPixels: 5,
          radiusMaxPixels: 12,
          filled: true,
          stroked: true,
          getFillColor: (d: WarehouseFacility) => {
            const isSelected = selectedWarehouse?.id === d.id;
            if (isSelected) return [250, 204, 21, 255]; // Yellow highlight
            const isStateWH = stateWarehouses.some((sw) => sw.id === d.id);
            return isStateWH ? [16, 185, 129, 240] : [100, 116, 139, 140]; // Emerald vs muted slate
          },
          getLineColor: [255, 255, 255, 220],
          lineWidthMinPixels: 1.5,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedWarehouse(info.object);
              setSelectedDistrictProps(null);
            }
          },
        })
      );
    }

    return layerList;
  }, [
    geoData,
    selectedStateProfile,
    selectedStateId,
    selectedDistrictProps,
    selectedWarehouse,
    layerToggles,
    stateDispatches,
    stateWarehouses,
    districtCalculationsMap,
    activeParams,
    getZoneRGB,
    epicenter,
    customRadiusKm,
    currentSeverity,
    disasterType,
    handleDistrictSelectAndTeleport,
    showNewDispatchModal,
    estimatedRouteInfo,
    activeOriginWarehouse,
    asyncRealRoute,
    newTargetDistrict,
  ]);

  // Handle map clicks for district selection & automatic state teleportation
  const handleMapClick = (info: any) => {
    if (info.object && (info.layer?.id === 'dispatch-district-polygons' || info.object.properties?.NAME_2 || info.object.properties?.name)) {
      handleDistrictSelectAndTeleport(info.object.properties);
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="relative w-full h-full bg-[#070a12] overflow-hidden rounded-2xl border border-[#151f32] select-none"
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070a12]/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <Radio className="animate-spin text-blue-500" size={36} />
            <p className="text-slate-200 font-semibold tracking-wide text-sm">
              Initializing State Dispatch Map & Vulnerability Telemetry...
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && !loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070a12]/90 backdrop-blur-md p-6">
          <div className="flex flex-col items-center gap-3 max-w-sm text-center bg-red-950/40 border border-red-800/50 p-6 rounded-2xl">
            <AlertTriangle className="text-red-400" size={36} />
            <h4 className="text-slate-200 font-bold text-base">Failed to Load Map Data</h4>
            <p className="text-xs text-slate-400">{loadError}</p>
          </div>
        </div>
      )}

      {/* TOP HEADER: Streamlined Navigation, Telemetry Pill & Tactical Actions */}
      <header className="absolute top-4 left-4 right-4 z-40 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: State Dropdown Selector with Quick Navigation */}
        <div className="flex items-center gap-2 pointer-events-auto" ref={dropdownRef}>
          {/* Previous State Button */}
          <button
            onClick={() => handleCycleState('prev')}
            className="h-10 w-9 flex items-center justify-center bg-[#090d16]/95 border border-[#1b2a44] hover:border-blue-500/50 hover:bg-[#121c2e] text-slate-300 hover:text-white rounded-xl backdrop-blur-xl transition-all shadow-xl cursor-pointer"
            title="Previous State"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Main State Dropdown Trigger */}
          <div className="relative z-50">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-10 min-w-[260px] sm:min-w-[300px] px-3.5 flex items-center justify-between gap-3 bg-[#090d16]/95 border border-[#1b2a44] hover:border-blue-500/60 rounded-xl backdrop-blur-xl transition-all shadow-xl text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono text-[11px] font-bold shrink-0">
                  {selectedStateProfile.stateCode}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {selectedStateProfile.stateName}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">
                      {selectedStateProfile.region}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                  isDropdownOpen ? 'rotate-180 text-blue-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Modal */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 left-0 w-[340px] sm:w-[380px] max-h-[460px] bg-[#090d16] border border-[#1e2f4d] rounded-2xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden flex flex-col"
                >
                  {/* Search and Region Tabs */}
                  <div className="p-3 border-b border-[#15233c] bg-[#070b14]/80 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search state, capital, or risk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 bg-[#0d1524] border border-[#1b2b46] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Region Filters */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {REGIONS.map((reg) => (
                        <button
                          key={reg}
                          onClick={() => setSelectedRegionFilter(reg)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                            selectedRegionFilter === reg
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111c30]'
                          }`}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>

                    {/* Scrollable State List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 max-h-[320px]">
                    {filteredStates.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No states matching "{searchQuery}"
                      </div>
                    ) : (
                      filteredStates
                        .slice()
                        .sort((a, b) => {
                          const mA = getStateLiveMetrics(a.stateName);
                          const mB = getStateLiveMetrics(b.stateName);
                          if (mA.isImpacted !== mB.isImpacted) {
                            return mA.isImpacted ? -1 : 1;
                          }
                          return mB.score - mA.score;
                        })
                        .map((st) => {
                          const isSelected = st.id === selectedStateId;
                          const activeDispCount = dispatches.filter((d) => d.stateId === st.id).length;
                          const live = getStateLiveMetrics(st.stateName);

                          return (
                            <button
                              key={st.id}
                              onClick={() => handleSelectState(st.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                                isSelected
                                  ? 'bg-blue-600/20 border border-blue-500/40 text-slate-100'
                                  : 'hover:bg-[#101a2c] text-slate-300 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                      : live.isImpacted
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-[#15233c] text-blue-400'
                                  }`}
                                >
                                  {st.stateCode}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-100 truncate">
                                      {st.stateName}
                                    </span>
                                    {live.isImpacted ? (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                                          live.score >= 72
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : live.score >= 50
                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        }`}
                                      >
                                        V: {live.score} • {live.impactedCount} affected
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-slate-400 bg-slate-800/40 border border-slate-700/30">
                                        Stable (0)
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {live.isImpacted
                                      ? `${live.impactedCount}/${live.totalCount} Districts in Active ${(activeParams?.type || disasterType || 'hazard').toUpperCase()} Zone`
                                      : `Outside Active Footprint • ${st.primaryDisasterRisk}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {activeDispCount > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1 animate-pulse">
                                    <Radio size={9} />
                                    {activeDispCount}
                                  </span>
                                )}
                                {isSelected && <CheckCircle2 size={14} className="text-blue-400" />}
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Next State Button */}
          <button
            onClick={() => handleCycleState('next')}
            className="h-10 w-9 flex items-center justify-center bg-[#090d16]/95 border border-[#1b2a44] hover:border-blue-500/50 hover:bg-[#121c2e] text-slate-300 hover:text-white rounded-xl backdrop-blur-xl transition-all shadow-xl cursor-pointer"
            title="Next State"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center: Live Disaster Impact HUD & State Risk Telemetry */}
        <div className="hidden lg:flex items-center gap-2.5 bg-[#090d16]/95 border border-[#17243c] px-3.5 py-2 rounded-xl backdrop-blur-xl pointer-events-auto shadow-xl">
          {/* Active Disaster Scenario Badge */}
          <div className="flex items-center gap-2 border-r border-[#15233c] pr-3">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${
                disasterType === 'flood'
                  ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                  : disasterType === 'heatwave'
                  ? 'bg-red-600 shadow-sm shadow-red-500/30'
                  : 'bg-purple-600 shadow-sm shadow-purple-500/30'
              }`}
            >
              {disasterType === 'flood' ? (
                <Waves size={13} />
              ) : disasterType === 'heatwave' ? (
                <Flame size={13} />
              ) : (
                <Wind size={13} />
              )}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100">{activeParams.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-slate-300">
                  {currentSeverity.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {epicenterName}
              </span>
            </div>

            {/* Focus Epicenter Button */}
            <button
              onClick={() => {
                if (epicenter && epicenter.length === 2) {
                  // Find matching state for epicenter or fly to epicenter coords
                  setViewState({
                    longitude: epicenter[0],
                    latitude: epicenter[1],
                    zoom: 6.8,
                    pitch: is3DMode ? 28 : 0,
                    bearing: 0,
                    // @ts-ignore
                    transitionDuration: 1200,
                    transitionInterpolator: new FlyToInterpolator(),
                  });
                }
              }}
              className="ml-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Focus Camera on Disaster Epicenter"
            >
              <Crosshair size={11} />
              <span>Epicenter</span>
            </button>
          </div>

          {/* State Risk Index */}
          <div className="flex items-center gap-2 border-r border-[#15233c] pr-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">State Risk:</span>
            <span
              className={`text-xs font-black font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                stateLiveMetrics.isImpacted
                  ? stateVulnerabilityScore >= 72
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : stateVulnerabilityScore >= 50
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800/40 text-slate-300 border border-slate-700/30'
              }`}
              title={stateLiveMetrics.summary}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  stateLiveMetrics.isImpacted
                    ? stateVulnerabilityScore >= 72
                      ? 'bg-red-400 animate-pulse'
                      : stateVulnerabilityScore >= 50
                      ? 'bg-orange-400'
                      : 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {stateLiveMetrics.isImpacted
                  ? `${stateVulnerabilityScore} / 100 [${stateLiveMetrics.riskTier}]`
                  : 'Stable (0/100)'}
              </span>
              {stateLiveMetrics.isImpacted && (
                <span className="text-[10px] opacity-75 font-normal">
                  ({stateLiveMetrics.impactedCount}/{stateLiveMetrics.totalCount})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-mono text-[11px]">
              {selectedStateProfile.sdrfBattalions} SDRF Battalions
            </span>
          </div>
        </div>

        {/* Right: Tactical Actions & Panel Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Real-time Live Telemetry Pill */}
          <div className="h-10 px-3.5 flex items-center gap-2 bg-[#090d16]/95 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">LIVE</span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">• Real-Time Stream</span>
          </div>

          {/* Toggle Left SDRF Drawer Button */}
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className={`h-10 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold border backdrop-blur-xl transition-all shadow-xl cursor-pointer ${
              isLeftPanelOpen
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                : 'bg-[#090d16]/95 border-[#1b2a44] text-slate-300 hover:text-white hover:bg-[#121c2e]'
            }`}
            title="Toggle Resource & Dispatches Panel"
          >
            <Layers size={14} />
            <span className="hidden sm:inline">Force & Logistics</span>
            {stateDispatches.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                {stateDispatches.length}
              </span>
            )}
          </button>

          {/* 2D / 3D Tilt Toggle */}
          <button
            onClick={handleToggle3D}
            className={`h-10 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold border backdrop-blur-xl transition-all shadow-xl cursor-pointer ${
              is3DMode
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                : 'bg-[#090d16]/95 border-[#1b2a44] text-slate-300 hover:text-white hover:bg-[#121c2e]'
            }`}
            title="Toggle 2D / 3D Oblique View"
          >
            <Compass size={13} className={is3DMode ? 'rotate-45 text-blue-400' : ''} />
            <span>{is3DMode ? '3D' : '2D'}</span>
          </button>

          {/* Reset Camera to State */}
          <button
            onClick={() => flyToState(selectedStateId)}
            className="h-10 w-10 flex items-center justify-center bg-[#090d16]/95 border border-[#1b2a44] hover:border-blue-500/50 hover:bg-[#121c2e] text-slate-300 hover:text-white rounded-xl backdrop-blur-xl transition-all shadow-xl cursor-pointer"
            title="Recenter Camera on State"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* DeckGL & Basemap Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: any) => setViewState(vs)}
        controller={true}
        layers={layers}
        onClick={handleMapClick}
        getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'default')}
      >
        <MapGL
          id="dispatch-map"
          reuseMaps
          mapLib={maplibregl}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* 100% SOLID, HIGH-CONTRAST TACTICAL HTML OVERLAY ON TOP OF DECKGL (Z-INDEX 25) */}
      {/* Prevents DeckGL vector boundary lines & district fills from overlapping or making units transparent */}
      {viewport && (
        <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
          {/* Active In-Transit Missions */}
          {dispatches
            .filter((mission) => mission.status === 'In Transit' && (mission.progress || 0) < 100)
            .map((mission) => {
              const p = mission.progress || 0;
              const pathCoords =
                mission.roadPath && mission.roadPath.length >= 2
                  ? mission.roadPath
                  : [mission.originCoords, mission.targetCoords];

              const curvedState = getCurvedPositionAndHeading(
                pathCoords,
                p,
                mission.roadDistanceKm || 60,
                mission.highwaysTraversed || []
              );

              const curLng = curvedState.coordinates[0];
              const curLat = curvedState.coordinates[1];
              const heading = curvedState.headingDegrees;

              const originPx = projectLngLat(mission.originCoords);
              const targetPx = projectLngLat(mission.targetCoords);
              const unitPx = projectLngLat([curLng, curLat]);

              return (
                <React.Fragment key={mission.id}>
                  {/* 1. Origin Relief Warehouse Node Pin */}
                  {originPx && (
                    <div
                      className="absolute pointer-events-auto select-none"
                      style={{
                        left: `${originPx[0]}px`,
                        top: `${originPx[1]}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 26,
                      }}
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#042417] border-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,0,0,0.9)] text-[9.5px] font-black text-emerald-100 whitespace-nowrap mb-1">
                        <Building2 size={11} className="text-emerald-300 shrink-0" />
                        <span className="truncate max-w-[120px]">{mission.originDepot || 'Relief Depot'}</span>
                      </div>
                    </div>
                  )}

                  {/* 2. Destination District Target Pin */}
                  {targetPx && (
                    <div
                      className="absolute pointer-events-auto select-none"
                      style={{
                        left: `${targetPx[0]}px`,
                        top: `${targetPx[1]}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 26,
                      }}
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#300707] border-2 border-red-500 shadow-[0_6px_20px_rgba(0,0,0,0.9)] text-[9.5px] font-black text-red-100 whitespace-nowrap mb-1 animate-pulse">
                        <MapPin size={11} className="text-red-300 shrink-0" />
                        <span className="truncate max-w-[120px]">{mission.targetDistrict || 'Target'}</span>
                      </div>
                    </div>
                  )}

                  {/* 3. Active Tactical Unit Vehicle Pod & Solid Floating Route Navigation HUD Card */}
                  {unitPx && (
                    <div
                      className="absolute pointer-events-auto select-none flex flex-col items-center"
                      style={{
                        left: `${unitPx[0]}px`,
                        top: `${unitPx[1]}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 32,
                      }}
                    >
                      {/* Floating Navigation HUD Tooltip Card (100% Solid Dark Navy, NO Map Bleed-Through) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLeftPanelOpen(true);
                          setActiveLeftTab('dispatches');
                        }}
                        className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 min-w-[230px] max-w-[290px] bg-[#060e1b] border-2 border-cyan-400 p-2.5 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.98)] flex flex-col gap-1.5 text-left cursor-pointer hover:border-cyan-300 transition-all after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-[#060e1b]"
                      >
                        {/* Top Row: Distance & ETA + Priority Badge */}
                        <div className="flex items-center justify-between text-[11.5px] font-black text-white">
                          <span className="tracking-tight text-white flex items-center gap-1.5">
                            <Truck size={13} className="text-cyan-400" />
                            <span>
                              {mission.roadDistanceKm || 60} km • {mission.etaMinutes || 35}m ETA
                            </span>
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              mission.priority === 'CRITICAL'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-emerald-600 text-white shadow-xs'
                            }`}
                          >
                            {mission.priority}
                          </span>
                        </div>

                        {/* Payload Units Info (100% Solid Opaque Background) */}
                        <div className="text-[10px] text-cyan-100 font-extrabold bg-[#0d2139] border border-cyan-400/80 px-2 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                          <Unit3DIcon
                            unitType={mission.primaryUnitType || 'ambulance'}
                            size={20}
                            animated={false}
                          />
                          <span className="truncate">
                            {mission.items && mission.items.length > 0
                              ? mission.items.map((it) => `${it.quantity}x ${it.shortName || it.name}`).join(' • ')
                              : `${mission.quantity || 1}x ${mission.unitLabel || mission.resourceType}`}
                          </span>
                        </div>

                        {/* Middle Row: Passability & Highway Name */}
                        <div className="text-[9.5px] text-emerald-300 font-bold flex items-center gap-1">
                          <Navigation size={10} className="text-emerald-400 shrink-0" />
                          <span className="truncate">
                            100% Highway Passable • {curvedState.currentHighwayName || 'NH Arterial'}
                          </span>
                        </div>

                        {/* Bottom Row: Progress bar & percentage badge */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-2.5 bg-[#0b1524] rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-black text-cyan-300 bg-[#030812] border border-cyan-500/40 px-1.5 py-0.2 rounded">
                            {p}%
                          </span>
                        </div>
                      </div>

                      {/* Primary Tactical Vehicle Unit Marker (100% Solid Pod + 3D Vehicle + Heading Arrow) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLeftPanelOpen(true);
                          setActiveLeftTab('dispatches');
                        }}
                        className="group relative flex flex-col items-center cursor-pointer"
                      >
                        {/* Outer Pulsing Radar Ring */}
                        <span className="animate-ping absolute -top-1 inline-flex h-14 w-14 rounded-full bg-cyan-400/50 pointer-events-none" />

                        {/* Vivid Solid Unit Pod Circle */}
                        <div className="w-12 h-12 rounded-full bg-[#08172c] border-2 border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.95)] flex items-center justify-center relative transition-transform group-hover:scale-115">
                          {/* Render 3D Animated Vehicle Graphic */}
                          <div className="scale-95 flex items-center justify-center">
                            <Unit3DIcon
                              unitType={mission.primaryUnitType || 'ambulance'}
                              size={30}
                              isMoving={true}
                            />
                          </div>

                          {/* Direction Heading Compass Pointer */}
                          <div
                            className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md transition-transform duration-300"
                            style={{ transform: `rotate(${heading}deg)` }}
                            title={`Heading: ${heading}°`}
                          >
                            <Navigation size={9} className="text-white fill-white" />
                          </div>
                        </div>

                        {/* Tactical Unit Mini Label Chip (100% Solid Dark Badge) */}
                        <div className="mt-1.5 px-2 py-0.5 rounded-md bg-[#040a14] border-2 border-cyan-400/90 shadow-[0_4px_14px_rgba(0,0,0,0.95)] text-[9.5px] font-black text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {mission.items && mission.items[0]
                              ? `${mission.items[0].quantity}x ${mission.items[0].shortName || mission.items[0].name}`
                              : mission.unitLabel || 'Relief Unit'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

          {/* Preview Route Destination & Origin Markers when planning a dispatch */}
          {(showNewDispatchModal || (selectedWarehouse && selectedDistrictProps)) &&
            estimatedRouteInfo?.targetCoords &&
            activeOriginWarehouse && (
              <>
                {(() => {
                  const pOrigin = projectLngLat(activeOriginWarehouse.coordinates);
                  const pTarget = projectLngLat(estimatedRouteInfo.targetCoords);

                  return (
                    <>
                      {pOrigin && (
                        <div
                          className="absolute pointer-events-auto select-none"
                          style={{
                            left: `${pOrigin[0]}px`,
                            top: `${pOrigin[1]}px`,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 26,
                          }}
                        >
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#042417] border-2 border-emerald-400 shadow-[0_6px_20px_rgba(0,0,0,0.9)] text-[9.5px] font-black text-emerald-100 whitespace-nowrap mb-1">
                            <Building2 size={11} className="text-emerald-300 shrink-0" />
                            <span className="truncate max-w-[120px]">{activeOriginWarehouse.facilityName}</span>
                          </div>
                        </div>
                      )}

                      {pTarget && (
                        <div
                          className="absolute pointer-events-auto select-none"
                          style={{
                            left: `${pTarget[0]}px`,
                            top: `${pTarget[1]}px`,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 26,
                          }}
                        >
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#300707] border-2 border-red-500 shadow-[0_6px_20px_rgba(0,0,0,0.9)] text-[9.5px] font-black text-red-100 whitespace-nowrap mb-1 animate-pulse">
                            <MapPin size={11} className="text-red-300 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {newTargetDistrict ||
                                selectedDistrictProps?.NAME_2 ||
                                selectedDistrictProps?.name ||
                                'Target'}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
        </div>
      )}

      {/* Real-time Arrival Alert Banner Toast */}
      <AnimatePresence>
        {arrivalToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#071320] border-2 border-emerald-500/60 rounded-2xl shadow-2xl p-3 sm:px-5 sm:py-3.5 flex items-center gap-3.5 backdrop-blur-xl text-slate-100 max-w-lg w-full"
          >
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
              <CheckCircle size={20} className="animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  Mission Accomplished
                </span>
                <span className="text-xs font-mono text-slate-400">{arrivalToast.mission.id}</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5 truncate">
                {arrivalToast.message}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedArrivedMission(arrivalToast.mission);
                  setArrivalToast(null);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <Eye size={12} />
                <span>View Info</span>
              </button>
              <button
                onClick={() => setArrivalToast(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT FLOATING PANEL: SDRF Resources & Live Dispatches Drawer */}
      <AnimatePresence>
        {isLeftPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-20 sm:top-22 left-4 z-40 w-84 sm:w-94 max-h-[calc(100vh-110px)] flex flex-col bg-[#070c18]/95 border border-[#1b2d4c] backdrop-blur-2xl rounded-2xl shadow-2xl p-4 pointer-events-auto space-y-3 overflow-hidden relative"
          >
            {/* Top Tiranga Micro Glow */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] shadow-[0_0_8px_#FF671F]" />

            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-[#14233c] pb-2.5 pt-1">
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF671F] shadow-[0_0_6px_#FF671F]"></span>
                  <span className="text-amber-400">{selectedStateProfile.stateName}</span>
                  <span className="text-slate-300">Logistics Forge</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  HQ: {selectedStateProfile.capital} • <span className="text-emerald-400 font-bold">{selectedStateProfile.sdrfBattalions} Battalions Standby</span>
                </p>
              </div>
              <button
                onClick={() => setIsLeftPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Collapse Panel"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sub-Tabs: Inventory vs Live Dispatches */}
            <div className="flex items-center gap-1 bg-[#050811] p-1 rounded-xl border border-[#14233c]">
              <button
                onClick={() => setActiveLeftTab('inventory')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeLeftTab === 'inventory'
                    ? 'bg-gradient-to-r from-[#046A38] to-[#0b8247] text-white shadow-[0_2px_10px_rgba(4,106,56,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1628]'
                }`}
              >
                <Package size={12} />
                <span>State Relief Stocks</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('dispatches')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeLeftTab === 'dispatches'
                    ? 'bg-gradient-to-r from-[#FF671F] to-[#E65100] text-white shadow-[0_2px_10px_rgba(255,103,31,0.4)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1628]'
                }`}
              >
                <Truck size={12} />
                <span>Active Dispatches</span>
                {stateDispatches.length > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-white text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                    {stateDispatches.length}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono opacity-70">(0)</span>
                )}
              </button>
            </div>

            {/* TAB 1: Force & Resource Inventory */}
            {activeLeftTab === 'inventory' && (
              <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 max-h-[420px]">
                {/* SDRF Battalion Info */}
                <div className="p-2.5 bg-gradient-to-r from-[#071322] to-[#05111d] border border-[#142744] rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#046A38] text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">SDRF Field Battalions</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedStateProfile.sdrfBattalions} Active Battalions
                  </span>
                </div>

                {/* 6 Grid Resources with Tiranga accents */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* 1. Water Bowsers */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Droplets size={13} className="text-cyan-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Water Bowsers</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-cyan-300">
                      {selectedStateProfile.resources.waterTankers.active} /{' '}
                      <span className="text-slate-400">{selectedStateProfile.resources.waterTankers.total}</span>
                    </div>
                  </div>

                  {/* 2. Heavy Earthmovers */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Truck size={13} className="text-amber-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Earthmovers</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-amber-300">
                      {selectedStateProfile.resources.debrisMachinery.active} /{' '}
                      <span className="text-slate-400">{selectedStateProfile.resources.debrisMachinery.total}</span>
                    </div>
                  </div>

                  {/* 3. Emergency Generators */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap size={13} className="text-yellow-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Generators</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-yellow-300">
                      {selectedStateProfile.resources.emergencyGenerators.active} /{' '}
                      <span className="text-slate-400">{selectedStateProfile.resources.emergencyGenerators.total}</span>
                    </div>
                  </div>

                  {/* 4. Family Rations */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Package size={13} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Rations</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-emerald-300">
                      {(selectedStateProfile.resources.rationPackets.total / 1000).toFixed(0)}k
                    </div>
                  </div>

                  {/* 5. Tents & Tarps */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tent size={13} className="text-purple-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Tents / Tarps</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-purple-300">
                      {(selectedStateProfile.resources.tarpTentKits.total / 1000).toFixed(0)}k
                    </div>
                  </div>

                  {/* 6. Dewatering Pumps */}
                  <div className="p-2.5 bg-[#091122] border border-[#172744] rounded-xl flex items-center justify-between gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Gauge size={13} className="text-blue-400 shrink-0" />
                      <span className="text-[11px] text-slate-300 font-medium truncate">Trash Pumps</span>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px] font-bold text-blue-300">
                      {selectedStateProfile.resources.waterMotorPumps.active} /{' '}
                      <span className="text-slate-400">{selectedStateProfile.resources.waterMotorPumps.total}</span>
                    </div>
                  </div>
                </div>

                {/* Authorize New Dispatch Action Button - Saffron Kesaria Glow */}
                <button
                  onClick={() => setShowNewDispatchModal(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#FF671F] via-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs rounded-xl shadow-[0_4px_20px_rgba(255,103,31,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer border border-orange-400/40"
                >
                  <Send size={14} />
                  <span>Authorize Emergency Dispatch</span>
                </button>
              </div>
            )}

            {/* TAB 2: Live Convoy Dispatches */}
            {activeLeftTab === 'dispatches' && (
              <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 max-h-[420px]">
                {/* Clear Completed Missions Quick Action Header */}
                {stateDispatches.some((d) => d.status === 'Arrived & Active' || (d.progress || 0) >= 100) && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span>
                        {stateDispatches.filter((d) => d.status === 'Arrived & Active' || (d.progress || 0) >= 100).length} Delivered Convoy(s)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        stateDispatches
                          .filter((d) => d.status === 'Arrived & Active' || (d.progress || 0) >= 100)
                          .forEach((d) => removeDispatchMission(d.id));
                      }}
                      className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-400/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={10} />
                      <span>Clear All Delivered</span>
                    </button>
                  </div>
                )}
                {stateDispatches.length === 0 ? (
                  <div className="p-5 text-center bg-gradient-to-b from-[#091124] to-[#060a16] rounded-2xl border border-[#1b2d4c] space-y-3.5 shadow-lg">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#FF671F]/20 via-[#1e3a8a]/20 to-[#046A38]/20 border border-[#274372] flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(30,58,138,0.3)]">
                      <Truck size={22} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        No Active Dispatches in {selectedStateProfile.stateName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        All NDRF, SDRF, and IAF relief convoys are currently on standby at designated state warehouses.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setShowNewDispatchModal(true)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF671F] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-xl text-xs font-extrabold shadow-[0_4px_16px_rgba(255,103,31,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
                      >
                        <Send size={13} />
                        <span>Initiate Tactical Relief Dispatch</span>
                      </button>
                      <button
                        onClick={() => {
                          const target = stateDistricts[0]?.properties?.centroid || [stateGeoConfig.center[0], stateGeoConfig.center[1]];
                          const targetName = stateDistricts[0]?.properties?.name || stateDistricts[0]?.properties?.NAME_2 || 'Affected District';
                          let wh = stateWarehouses[0] || WAREHOUSE_FACILITIES[0];
                          let minDist = Infinity;
                          (stateWarehouses.length > 0 ? stateWarehouses : WAREHOUSE_FACILITIES).forEach(w => {
                            const d = haversineDistanceKm(w.coordinates, target);
                            if (d < minDist) { minDist = d; wh = w; }
                          });
                          const demoRoute = computeRoadRoute(wh.coordinates, target, {
                            originName: wh.facilityName,
                            targetName,
                            stateId: selectedStateId,
                            transportMode: 'Green Road Corridor',
                          });
                          const demoMission: DispatchMission = {
                            id: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
                            stateId: selectedStateId,
                            targetDistrict: targetName,
                            targetCoords: target,
                            originDepot: `${wh.facilityName} (${wh.district})`,
                            originCoords: wh.coordinates,
                            items: [
                              {
                                typeId: 'ambulances',
                                unitType: 'ambulances',
                                name: 'Advanced Life Support (ALS) Ambulances',
                                shortName: 'Ambulances',
                                quantity: 4,
                                unit: 'Ambulances',
                                unitLabel: 'ALS Ambulance Vans',
                                iconType: 'ambulance',
                                color: '#ef4444',
                                category: 'Medical & Triage',
                              },
                              {
                                typeId: 'waterTankers',
                                unitType: 'waterTankers',
                                name: 'Potable Water Tankers',
                                shortName: 'Water Tankers',
                                quantity: 6,
                                unit: 'Tankers',
                                unitLabel: 'Water Bowsers',
                                iconType: 'waterTanker',
                                color: '#38bdf8',
                                category: 'Water Logistics',
                              },
                            ],
                            resourceType: 'ambulances',
                            quantity: 10,
                            unitLabel: '2 Asset Classes (4 Ambulances + 6 Tankers)',
                            primaryUnitType: 'ambulance',
                            transportMode: 'Green Road Corridor',
                            status: 'In Transit',
                            progress: 18,
                            etaMinutes: demoRoute.estimatedMinutes,
                            priority: 'CRITICAL',
                            dispatchedAt: 'Just now',
                            route: demoRoute,
                            roadPath: [], // Force fetchRealMapRoadRoute in useEffect for authentic OSRM GPS road curving
                            roadDistanceKm: demoRoute.totalDistanceKm,
                            straightDistanceKm: demoRoute.straightDistanceKm,
                            curvatureRatio: demoRoute.curvatureRatio,
                            highwaysTraversed: demoRoute.highwaysTraversed,
                          };
                          addDispatchMission(demoMission);
                        }}
                        className="w-full py-2 px-3 bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 rounded-xl text-xs font-bold border border-blue-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Navigation size={12} className="text-cyan-400" />
                        <span>⚡ Deploy Highway Convoy</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  stateDispatches.map((disp) => {
                    const isArrived = disp.status === 'Arrived & Active';
                    return (
                      <div
                        key={disp.id}
                        className={`p-3 bg-[#0a1120] border rounded-xl space-y-2 transition-all text-left ${
                          isArrived
                            ? 'border-emerald-500/40 bg-gradient-to-b from-[#0a1622] to-[#07111c]'
                            : 'border-[#15233c] hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Unit3DIcon
                              unitType={disp.primaryUnitType || 'helicopter'}
                              size={22}
                              isMoving={!isArrived}
                            />
                            <span className="font-mono text-[10px] font-bold text-blue-400">{disp.id}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                isArrived
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : disp.priority === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isArrived ? 'DELIVERED' : disp.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} />
                              {isArrived ? 'At Destination' : `ETA: ${disp.etaMinutes}m`}
                            </span>
                            <button
                              onClick={() => removeDispatchMission(disp.id)}
                              className="text-slate-500 hover:text-red-400 p-0.5 cursor-pointer"
                              title="Cancel Mission"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Route Destination */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-[11px] text-slate-400">To:</span>
                            <span className="font-bold text-white">{disp.targetDistrict}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {disp.quantity.toLocaleString()} total units
                          </span>
                        </div>

                        {/* Road Routing Telemetry Pill */}
                        <div className="p-2 bg-[#070e1c] border border-[#14233c] rounded-lg text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                              <Navigation size={10} className="text-blue-400" />
                              <span>Live Road Path</span>
                            </span>
                            <span className="font-mono font-bold text-slate-200">
                              {disp.roadDistanceKm || 65} km
                              {disp.curvatureRatio && (
                                <span className="text-amber-400 text-[9px] font-normal ml-1">
                                  ({Math.round((disp.curvatureRatio - 1) * 100)}% curve)
                                </span>
                              )}
                            </span>
                          </div>
                          {disp.highwaysTraversed && disp.highwaysTraversed.length > 0 && (
                            <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                              <span className="text-slate-500">Corridor:</span>
                              <span className="text-slate-300 font-medium">{disp.highwaysTraversed.join(' → ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Multi-Resource Payload Items */}
                        {disp.items && disp.items.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {disp.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 bg-[#0e1a2f] border border-[#1d2d47] rounded-md text-slate-200 flex items-center gap-1"
                              >
                                <span className="font-mono font-bold text-cyan-300">
                                  {item.quantity.toLocaleString()}
                                </span>
                                <span className="text-slate-400 text-[9px]">{item.name.split(' ')[0]}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isArrived
                                  ? 'bg-emerald-500'
                                  : disp.priority === 'CRITICAL'
                                  ? 'bg-red-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${disp.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>{disp.transportMode}</span>
                            <span>{isArrived ? '100% Deployed' : `${disp.progress}% en route`}</span>
                          </div>
                        </div>

                        {/* Reached Information Action / Live En Route */}
                        {isArrived ? (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedArrivedMission(disp)}
                              className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <FileCheck size={13} className="text-emerald-400" />
                              <span>View Handover Info</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDispatchMission(disp.id)}
                              className="py-1.5 px-2 bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700/60 hover:border-red-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              title="Dismiss / Clear Mission"
                            >
                              <Trash2 size={11} />
                              <span>Clear</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                              </span>
                              <span>Live En Route</span>
                            </span>
                            <span className="font-mono text-slate-300">ETA ~{disp.etaMinutes} mins</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {stateDispatches.length > 0 && (
                  <button
                    onClick={() => setShowNewDispatchModal(true)}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Add Another Dispatch</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT FLOATING PANEL: District Inspection OR Warehouse Inspection */}
      <AnimatePresence>
        {selectedWarehouse ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-18 right-4 z-30 w-80 sm:w-92 bg-[#090d16]/95 border border-emerald-500/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3"
          >
            <div className="flex items-start justify-between border-b border-[#141f32] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-emerald-300">
                    {selectedWarehouse.facilityName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedWarehouse.district}, {selectedWarehouse.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Warehouse Details */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#0a1420] border border-[#142d3c] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Facility Type:</span>
                  <span className="font-bold text-emerald-400">{selectedWarehouse.facilityType}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-mono text-slate-300">
                    [{selectedWarehouse.coordinates[0].toFixed(3)}°E, {selectedWarehouse.coordinates[1].toFixed(3)}°N]
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOriginWarehouseId(selectedWarehouse.id);
                  setShowNewDispatchModal(true);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send size={14} />
                <span>Dispatch From This Warehouse</span>
              </button>
            </div>
          </motion.div>
        ) : inspectedDistrictProfile ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-18 right-4 z-30 w-80 sm:w-92 bg-[#090d16]/95 border border-blue-500/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3"
          >
            <div className="flex items-start justify-between border-b border-[#141f32] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    {inspectedDistrictProfile.districtName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inspectedDistrictProfile.stateName}
                </p>
              </div>
              <button
                onClick={() => setSelectedDistrictProps(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Vulnerability Score Card */}
            <div className="p-3 bg-[#0a1120] border border-[#15233c] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity size={13} className="text-blue-400" />
                  Vulnerability Score
                </span>
                <span
                  className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                    inspectedDistrictProfile.vulnerabilityScore >= 72
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : inspectedDistrictProfile.vulnerabilityScore >= 55
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {inspectedDistrictProfile.vulnerabilityScore} / 100 [{inspectedDistrictProfile.riskTier}]
                </span>
              </div>

              {/* 3-Pillar Progress Mini-Bars */}
              <div className="space-y-1.5 pt-1 text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>1. Exposure (Hazard & Density)</span>
                    <span className="font-mono text-cyan-400 font-bold">{inspectedDistrictProfile.exposureScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${inspectedDistrictProfile.exposureScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>2. Sensitivity (Poverty & Weak Housing)</span>
                    <span className="font-mono text-amber-400 font-bold">{inspectedDistrictProfile.sensitivityScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${inspectedDistrictProfile.sensitivityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>3. Adaptive Deficit (Lack of Hospitals & EWS)</span>
                    <span className="font-mono text-emerald-400 font-bold">{inspectedDistrictProfile.lackOfCapacityScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${inspectedDistrictProfile.lackOfCapacityScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Nearest Relief Warehouse Info */}
            <div className="p-2.5 bg-[#060a14] rounded-xl border border-[#141f32] space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Nearest Relief Staging Base
              </span>
              {(() => {
                const centroid = selectedDistrictProps.centroid || [
                  stateGeoConfig.center[0],
                  stateGeoConfig.center[1],
                ];
                const { warehouse: nearest, distanceKm } = findNearestWarehouse(centroid, selectedStateId);
                return (
                  <div className="flex items-center justify-between pt-1">
                    <div className="truncate pr-2">
                      <p className="font-bold text-emerald-300 truncate">{nearest.facilityName}</p>
                      <p className="text-[10px] text-slate-400">{nearest.district}</p>
                    </div>
                    <span className="font-mono font-bold text-cyan-300 shrink-0 text-xs">
                      {Math.round(distanceKm)} km
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Direct Dispatch to District CTA */}
            <button
              onClick={() => {
                setNewTargetDistrict(inspectedDistrictProfile.districtName);
                setShowNewDispatchModal(true);
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send size={14} />
              <span>Direct Dispatch to {inspectedDistrictProfile.districtName}</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* BOTTOM DOCK: Layer Toggles & Vulnerability Scale Indicator */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 bg-[#090d16]/95 border border-[#172338] px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 pr-2.5 border-r border-[#15233c]">
          <Layers size={13} className="text-blue-400" />
          <span>Layers</span>
        </div>

        {/* Toggle Supply Routes */}
        <button
          onClick={() => setLayerToggles((p) => ({ ...p, convoys: !p.convoys }))}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            layerToggles.convoys
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck size={12} />
          <span>Curved Convoys</span>
        </button>

        {/* Toggle Highway Road Network Grid */}
        <button
          onClick={() => setLayerToggles((p) => ({ ...p, roadNetwork: !p.roadNetwork }))}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            layerToggles.roadNetwork
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation size={12} />
          <span>Highway Grid</span>
        </button>

        {/* Toggle 68 Warehouses */}
        <button
          onClick={() => setLayerToggles((p) => ({ ...p, warehouses: !p.warehouses }))}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            layerToggles.warehouses
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={12} />
          <span>68 Warehouses</span>
        </button>

        {/* Toggle Vulnerability Choropleth Tint */}
        <button
          onClick={() => setLayerToggles((p) => ({ ...p, vulnerabilityTint: !p.vulnerabilityTint }))}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            layerToggles.vulnerabilityTint
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={12} />
          <span>Risk Color-Coding</span>
        </button>

        {/* Compact Vulnerability Gradient Scale */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#15233c] text-[10px] text-slate-400 font-mono">
          <span>0 (Low)</span>
          <div className="w-16 h-2 rounded-full bg-gradient-to-r from-[#10b981] via-[#f59e0b] via-[#f97316] to-[#ef4444]" />
          <span>100 (Crit)</span>
        </div>
      </footer>

      {/* MODAL: Authorize New Rapid Dispatch with Integrated Vulnerability Telemetry */}
      <AnimatePresence>
        {showNewDispatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a12]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090d16] border border-[#1e2f4d] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 select-none max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
            >
              <div className="flex items-start justify-between border-b border-[#15233c] pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Authorize Emergency Dispatch</h3>
                    <p className="text-xs text-slate-400">
                      Dispatched from official NDMA / SDMA Warehouse Staging Facilities
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewDispatchModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDispatch} className="space-y-4">
                {/* 1. Origin Warehouse Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Origin Relief Warehouse</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {stateWarehouses.length} in {selectedStateProfile.stateName}
                    </span>
                  </label>
                  <select
                    value={selectedOriginWarehouseId}
                    onChange={(e) => setSelectedOriginWarehouseId(e.target.value)}
                    className="w-full p-2.5 bg-[#0d1524] border border-[#1b2b46] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <optgroup label={`${selectedStateProfile.stateName} Facilities`}>
                      {stateWarehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.facilityName} ({wh.district} - {wh.facilityType})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other National Warehouses">
                      {WAREHOUSE_FACILITIES.filter((w) => !stateWarehouses.some((sw) => sw.id === w.id)).map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.facilityName} ({wh.state} - {wh.district})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Target District Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>2. Target Impact District</span>
                    <span className="text-[10px] text-blue-400">Sorted by Vulnerability Score</span>
                  </label>
                  <select
                    value={newTargetDistrict}
                    onChange={(e) => setNewTargetDistrict(e.target.value)}
                    className="w-full p-2.5 bg-[#0d1524] border border-[#1b2b46] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {availableTargetDistricts.map((dist) => (
                      <option key={dist.name} value={dist.name}>
                        {dist.name} (Vuln: {dist.vulnScore} • {dist.riskTier} Risk)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. TARGET DISTRICT VULNERABILITY & DECISION SUPPORT CARD */}
                {targetDistrictVulnerability && (
                  <div className="p-3 bg-[#0a1324] border border-blue-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-blue-400" />
                        <span className="text-xs font-bold text-slate-200">
                          {targetDistrictVulnerability.districtName} Vulnerability Assessment
                        </span>
                      </div>
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                          targetDistrictVulnerability.vulnerabilityScore >= 72
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : targetDistrictVulnerability.vulnerabilityScore >= 55
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        Score: {targetDistrictVulnerability.vulnerabilityScore} / 100 [{targetDistrictVulnerability.riskTier}]
                      </span>
                    </div>

                    {/* 3-Pillar Metrics Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 bg-[#060c18] rounded-lg border border-[#13233c]">
                        <span className="text-slate-400 block">1. Exposure</span>
                        <span className="font-mono font-bold text-cyan-400">{targetDistrictVulnerability.exposureScore}%</span>
                      </div>
                      <div className="p-2 bg-[#060c18] rounded-lg border border-[#13233c]">
                        <span className="text-slate-400 block">2. Sensitivity</span>
                        <span className="font-mono font-bold text-amber-400">{targetDistrictVulnerability.sensitivityScore}%</span>
                      </div>
                      <div className="p-2 bg-[#060c18] rounded-lg border border-[#13233c]">
                        <span className="text-slate-400 block">3. Adaptive Deficit</span>
                        <span className="font-mono font-bold text-emerald-400">{targetDistrictVulnerability.lackOfCapacityScore}%</span>
                      </div>
                    </div>

                    {/* Smart Decision Recommendations */}
                    {targetDistrictVulnerability.recommendedResources.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Suggested Resources Based on Vulnerability Drivers:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {targetDistrictVulnerability.recommendedResources.map((rec, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewResourceType(rec.type as any);
                                if (rec.type === 'waterMotorPumps') setNewQuantity(25);
                                if (rec.type === 'tarpTentKits') setNewQuantity(5000);
                                if (rec.type === 'rationPackets') setNewQuantity(10000);
                                if (rec.type === 'floatingClinics') setNewQuantity(4);
                              }}
                              className="text-[10px] px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                              title={rec.reason}
                            >
                              <Sparkles size={10} className="text-blue-400" />
                              <span>Select {rec.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Highway Road Routing & Curvature Telemetry */}
                <div className="p-3 bg-[#08101e] border border-blue-500/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold">
                      <Navigation size={13} className="text-cyan-400" />
                      <span>Highway Road Routing:</span>
                      <span className="font-mono text-white text-sm">{estimatedRouteInfo.distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                      <Clock size={13} />
                      <span>ETA ~{estimatedRouteInfo.etaMinutes} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <span>Corridor:</span>
                      <span className="text-cyan-300 font-medium">
                        {estimatedRouteInfo.highwaysTraversed && estimatedRouteInfo.highwaysTraversed.length > 0
                          ? estimatedRouteInfo.highwaysTraversed.join(' → ')
                          : 'State Road Network'}
                      </span>
                    </span>
                    {estimatedRouteInfo.curvatureRatio && estimatedRouteInfo.curvatureRatio > 1.05 && (
                      <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Realistic curves (+{Math.round((estimatedRouteInfo.curvatureRatio - 1) * 100)}% path distance)
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. MULTI-RESOURCE PAYLOAD CONFIGURATOR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-blue-400" />
                      <span>Multi-Resource Dispatch Manifest</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">
                      {activePayloadKeys.length} Categories Configured
                    </span>
                  </div>

                  {/* Quick Tactical Preset Packages */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Rapid Strike Bundles:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePayloadKeys(['ambulance', 'fireEngine', 'police', 'helicopter', 'rationPackets']);
                          setSelectedPayloadQuantities((p) => ({
                            ...p,
                            ambulance: 6,
                            fireEngine: 3,
                            police: 2,
                            helicopter: 2,
                            rationPackets: 4000,
                          }));
                          setNewTransportMode('Green Road Corridor');
                        }}
                        className="p-1.5 text-left bg-[#0c1527] hover:bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={12} className="text-amber-400 shrink-0" />
                        <span className="truncate">Multi-Agency Strike Team</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePayloadKeys(['motorBoat', 'waterMotorPumps', 'waterTankers', 'rationPackets']);
                          setSelectedPayloadQuantities((p) => ({
                            ...p,
                            motorBoat: 8,
                            waterMotorPumps: 20,
                            waterTankers: 12,
                            rationPackets: 6000,
                          }));
                          setNewTransportMode('Waterway Fleet / Boat');
                        }}
                        className="p-1.5 text-left bg-[#0c1527] hover:bg-cyan-900/30 border border-cyan-500/30 rounded-lg text-cyan-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Waves size={12} className="text-cyan-400 shrink-0" />
                        <span className="truncate">Riverine Flood Flotilla</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePayloadKeys(['helicopter', 'ambulance', 'tarpTentKits', 'rationPackets']);
                          setSelectedPayloadQuantities((p) => ({
                            ...p,
                            helicopter: 4,
                            ambulance: 4,
                            tarpTentKits: 1200,
                            rationPackets: 8000,
                          }));
                          setNewTransportMode('IAF Airlift');
                        }}
                        className="p-1.5 text-left bg-[#0c1527] hover:bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wind size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">IAF Mountain Air-Drop</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivePayloadKeys(['ambulance', 'police', 'emergencyGenerators', 'waterTankers']);
                          setSelectedPayloadQuantities((p) => ({
                            ...p,
                            ambulance: 12,
                            police: 4,
                            emergencyGenerators: 8,
                            waterTankers: 15,
                          }));
                          setNewTransportMode('Ambulance Emergency Corridor');
                        }}
                        className="p-1.5 text-left bg-[#0c1527] hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <HeartPulse size={12} className="text-red-400 shrink-0" />
                        <span className="truncate">Mass Trauma & ICU Corridor</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-Resource Item Grid with 3D Icons & Steppers */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {Object.values(DISPATCH_UNIT_TYPES).map((unit) => {
                      const unitKey = unit.id;
                      const isSelected = activePayloadKeys.includes(unitKey);
                      const currentQty = selectedPayloadQuantities[unitKey] || 1;

                      return (
                        <div
                          key={unitKey}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#0d1b33] border-blue-500/60 shadow-sm shadow-blue-500/10'
                              : 'bg-[#0a1222] border-[#16233c] opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* Toggle Checkbox & 3D Unit Icon */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setActivePayloadKeys((prev) => [...prev, unitKey]);
                                } else {
                                  setActivePayloadKeys((prev) =>
                                    prev.filter((k) => k !== unitKey)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 bg-[#060a14] border-slate-700 focus:ring-0 cursor-pointer"
                            />

                            <Unit3DIcon unitType={unit.iconType} size={22} isMoving={isSelected} />

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-100 truncate">
                                {unit.name}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Unit: {unit.unit || unit.unitLabel}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          {isSelected ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPayloadQuantities((p) => ({
                                    ...p,
                                    [unitKey]: Math.max(
                                      1,
                                      (p[unitKey] || 1) - (unitKey === 'rationPackets' ? 500 : unitKey === 'tarpTentKits' ? 100 : 1)
                                    ),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-[#14233c] hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={100000}
                                value={currentQty}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setSelectedPayloadQuantities((p) => ({
                                    ...p,
                                    [unitKey]: val,
                                  }));
                                }}
                                className="w-16 p-1 text-center bg-[#070e1c] border border-blue-500/40 rounded-lg text-xs font-mono font-bold text-cyan-300 focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPayloadQuantities((p) => ({
                                    ...p,
                                    [unitKey]:
                                      (p[unitKey] || 1) + (unitKey === 'rationPackets' ? 500 : unitKey === 'tarpTentKits' ? 100 : 1),
                                  }))
                                }
                                className="w-6 h-6 rounded-lg bg-[#14233c] hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePayloadKeys((prev) => [...prev, unitKey]);
                              }}
                              className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
                            >
                              + Add to Convoy
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Transport Mode & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Transport Corridor
                    </label>
                    <select
                      value={newTransportMode}
                      onChange={(e) => setNewTransportMode(e.target.value as any)}
                      className="w-full p-2.5 bg-[#0d1524] border border-[#1b2b46] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Green Road Corridor">Green Road Corridor (Multi-Axle Supply)</option>
                      <option value="Ambulance Emergency Corridor">Ambulance Emergency Corridor (Green Light)</option>
                      <option value="Police Escort Convoy">Police Escort Convoy (Siren-Led Transit)</option>
                      <option value="Waterway Fleet / Boat">Waterway Fleet / Motor Boat Flotilla</option>
                      <option value="IAF Airlift">IAF Airlift (Mi-17 / ALH Dhruv / C-130J)</option>
                      <option value="High-Mobility 4x4">High-Mobility 4x4 Disaster Convoys</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Priority Level
                    </label>
                    <div className="flex items-center gap-1.5">
                      {(['CRITICAL', 'HIGH', 'ROUTINE'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            newPriority === p
                              ? p === 'CRITICAL'
                                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/25'
                                : p === 'HIGH'
                                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/25'
                                : 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                              : 'bg-[#0d1524] border-[#1b2b46] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-3 border-t border-[#15233c]">
                  <div className="text-[11px] text-slate-400">
                    Total payload: <span className="font-bold text-emerald-400">
                      {activePayloadKeys.reduce((sum, k) => sum + (selectedPayloadQuantities[k] || 0), 0).toLocaleString()} units
                    </span> across <span className="font-bold text-cyan-400">{activePayloadKeys.length} categories</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewDispatchModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={activePayloadKeys.length === 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Send size={14} />
                      <span>Authorize & Track Multi-Unit Convoy</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Reached Information & Handover Verification Dossier */}
      <ReachedInfoModal
        mission={selectedArrivedMission}
        isOpen={Boolean(selectedArrivedMission)}
        onClose={() => setSelectedArrivedMission(null)}
        onDismissMission={(missionId) => {
          removeDispatchMission(missionId);
          setSelectedArrivedMission(null);
        }}
        onOrderReinforcements={(district) => {
          setSelectedArrivedMission(null);
          setNewTargetDistrict(district);
          setShowNewDispatchModal(true);
        }}
      />
    </div>
  );
};
