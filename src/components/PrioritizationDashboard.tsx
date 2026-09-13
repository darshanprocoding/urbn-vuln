import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  MapPin,
  Search,
  Filter,
  Layers,
  ShieldAlert,
  HeartPulse,
  Radio,
  SlidersHorizontal,
  X,
  Droplets,
  Flame,
  Wind,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Info,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  Check,
  FileText,
} from 'lucide-react';
import { useDisasterSimulation } from '../context/DisasterSimulationContext';
import { useLanguage } from '../context/LanguageContext';
import { STATE_RESOURCE_DATA, StateResourceProfile } from '../data/stateResourceData';
import {
  getDistrictBaseline,
  canonicalStateName,
  isStateMatch,
} from '../data/districtProfiles';
import {
  computeZoneVulnerability,
  computeFeatureCentroid,
  calculateHaversineDistance,
  DistrictData,
  ZoneScoreCalculation,
} from '../utils/vulnerabilityMath';

export const PrioritizationDashboard: React.FC = () => {
  const {
    disasterType,
    selectedSeverityId,
    epicenter,
    epicenterName,
    customRadiusKm,
    customDecayModel,
    customPillarExposure,
    customPillarSensitivity,
    customPillarAdaptive,
    currentSeverity,
    activeParams,
    setIsExportReportOpen,
    setCachedDistricts,
  } = useDisasterSimulation();
  const { t } = useLanguage();

  // GeoJSON & enriched flat district list
  const [districtList, setDistrictList] = useState<DistrictData[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(true);

  // Geographic Scope Selection ('ALL' for Nationwide all zones, or state.id)
  const [selectedScope, setSelectedScope] = useState<string>('ALL'); // 'ALL' or stateId like 'bihar'

  // Table Filters & Search
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | 'CRITICAL' | 'SEVERE' | 'ELEVATED' | 'MODERATE'>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'population' | 'distance' | 'lackCapacity'>('score');

  // Load GeoJSON dataset once and extract all 700+ Indian districts
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGeo(true);
    fetch(`${import.meta.env.BASE_URL}india-districts.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const flatList: DistrictData[] = [];
        (data.features || []).forEach((feature: any, index: number) => {
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
        });

        setDistrictList(flatList);
        setCachedDistricts(flatList);
        setIsLoadingGeo(false);
      })
      .catch((err) => {
        console.error('Failed to load district data in dashboard', err);
        if (isMounted) setIsLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live vulnerability for every district in India dynamically based on active disaster
  const allCalculations = useMemo(() => {
    return districtList.map((d) => {
      const calc = computeZoneVulnerability(d, activeParams);
      return {
        ...d,
        score: calc.finalScore,
        calculation: calc,
        isImpacted: calc.isWithinImpactRadius && calc.finalScore > 0,
      };
    });
  }, [districtList, activeParams]);

  // Aggregate metrics per Indian State / UT
  const stateMetricsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        stateName: string;
        stateId: string;
        stateProfile?: StateResourceProfile;
        totalDistricts: number;
        impactedDistricts: number;
        criticalDistricts: number;
        severeDistricts: number;
        avgScore: number;
        maxScore: number;
        totalPopulationAtRisk: number;
        isImpacted: boolean;
      }
    >();

    STATE_RESOURCE_DATA.forEach((st) => {
      const stateDists = allCalculations.filter((d) => isStateMatch(d.state, st.stateName));
      const impacted = stateDists.filter((d) => d.isImpacted);
      const critical = stateDists.filter((d) => d.score >= 80);
      const severe = stateDists.filter((d) => d.score >= 65 && d.score < 80);

      const sumScore = impacted.reduce((acc, d) => acc + d.score, 0);
      const avgScore = impacted.length > 0 ? Math.round((sumScore / impacted.length) * 10) / 10 : 0;
      const maxScore = stateDists.length > 0 ? Math.max(...stateDists.map((d) => d.score)) : 0;
      const totalPop = impacted.reduce((acc, d) => acc + (d.population || 0), 0);

      map.set(st.id, {
        stateName: st.stateName,
        stateId: st.id,
        stateProfile: st,
        totalDistricts: stateDists.length || 1,
        impactedDistricts: impacted.length,
        criticalDistricts: critical.length,
        severeDistricts: severe.length,
        avgScore,
        maxScore,
        totalPopulationAtRisk: totalPop,
        isImpacted: impacted.length > 0,
      });
    });

    return map;
  }, [allCalculations]);

  // Sorted list of states for Geographic Scope menu: AFFECTED STATES AT THE FRONT
  const sortedStatesForMenu = useMemo(() => {
    return STATE_RESOURCE_DATA.slice().sort((a, b) => {
      const mA = stateMetricsMap.get(a.id);
      const mB = stateMetricsMap.get(b.id);
      const isImpA = mA?.isImpacted ? 1 : 0;
      const isImpB = mB?.isImpacted ? 1 : 0;

      // Affected states come first
      if (isImpA !== isImpB) {
        return isImpB - isImpA;
      }
      // Then highest max score
      if ((mB?.maxScore || 0) !== (mA?.maxScore || 0)) {
        return (mB?.maxScore || 0) - (mA?.maxScore || 0);
      }
      // Then highest impacted count
      return (mB?.impactedDistricts || 0) - (mA?.impactedDistricts || 0);
    });
  }, [stateMetricsMap]);

  // List of affected states for top quick-access chips
  const affectedStatesList = useMemo(() => {
    return sortedStatesForMenu.filter((st) => stateMetricsMap.get(st.id)?.isImpacted);
  }, [sortedStatesForMenu, stateMetricsMap]);

  // Active Selected Scope Profile
  const activeScopeProfile = useMemo(() => {
    if (selectedScope === 'ALL') return null;
    return STATE_RESOURCE_DATA.find((s) => s.id === selectedScope) || null;
  }, [selectedScope]);

  // Districts within the currently selected Geographic Scope (All or specific State)
  const scopedDistricts = useMemo(() => {
    if (selectedScope === 'ALL') {
      // Return all districts that have an active score > 0 or within radius
      const impactedOnly = allCalculations.filter((d) => d.isImpacted);
      return impactedOnly.length > 0
        ? impactedOnly.sort((a, b) => b.score - a.score)
        : allCalculations.slice().sort((a, b) => b.score - a.score);
    }

    if (!activeScopeProfile) return [];
    return allCalculations
      .filter((d) => isStateMatch(d.state, activeScopeProfile.stateName))
      .sort((a, b) => b.score - a.score);
  }, [selectedScope, allCalculations, activeScopeProfile]);

  // Scope-level Summary KPIs
  const kpis = useMemo(() => {
    const totalDistricts = scopedDistricts.length;
    const criticalZones = scopedDistricts.filter((d) => d.score >= 80).length;
    const severeZones = scopedDistricts.filter((d) => d.score >= 65 && d.score < 80).length;
    const elevatedZones = scopedDistricts.filter((d) => d.score >= 45 && d.score < 65).length;

    const impactedDistricts = scopedDistricts.filter((d) => d.isImpacted);
    const sumScore = impactedDistricts.reduce((s, d) => s + d.score, 0);
    const avgScore = impactedDistricts.length > 0 ? (sumScore / impactedDistricts.length).toFixed(1) : '0.0';

    const totalPop = impactedDistricts.reduce((s, d) => s + (d.population || 0), 0);
    const affectedStatesCount = affectedStatesList.length;

    // Resource / Lifeline Strain: average lack of coping capacity weighted by score
    const avgLCC =
      impactedDistricts.length > 0
        ? Math.round(
            impactedDistricts.reduce((s, d) => s + d.calculation.lackOfCopingCapacity, 0) /
              impactedDistricts.length
          )
        : 50;

    return {
      totalDistricts,
      criticalZones,
      severeZones,
      elevatedZones,
      avgScore,
      totalPop,
      affectedStatesCount,
      avgLCC,
    };
  }, [scopedDistricts, affectedStatesList]);

  // Top Ranked Districts for the Main Bar Chart (Top 12)
  const topChartData = useMemo(() => {
    return scopedDistricts.slice(0, 12).map((d) => ({
      name: d.name,
      state: d.state,
      score: d.score,
      exposure: d.calculation.exposureScore,
      sensitivity: d.calculation.sensitivityScore,
      adaptiveCapacity: d.calculation.adaptiveCapacityScore,
      lackOfCapacity: d.calculation.lackOfCopingCapacity,
      population: d.population,
      distanceKm: d.calculation.distanceKm,
    }));
  }, [scopedDistricts]);

  // Dynamic 3-Pillar Radar Chart Data (Comparing top prioritized districts)
  const radarChartData = useMemo(() => {
    const top3 = scopedDistricts.slice(0, 3);
    if (top3.length === 0) return [];

    return [
      {
        pillar: 'Exposure (E)',
        fullMark: 100,
        d1: top3[0]?.calculation.exposureScore || 0,
        d2: top3[1]?.calculation.exposureScore || 0,
        d3: top3[2]?.calculation.exposureScore || 0,
      },
      {
        pillar: 'Sensitivity (S)',
        fullMark: 100,
        d1: top3[0]?.calculation.sensitivityScore || 0,
        d2: top3[1]?.calculation.sensitivityScore || 0,
        d3: top3[2]?.calculation.sensitivityScore || 0,
      },
      {
        pillar: 'Capacity Deficit (100-AC)',
        fullMark: 100,
        d1: top3[0]?.calculation.lackOfCopingCapacity || 0,
        d2: top3[1]?.calculation.lackOfCopingCapacity || 0,
        d3: top3[2]?.calculation.lackOfCopingCapacity || 0,
      },
      {
        pillar: 'Pop Density Factor',
        fullMark: 100,
        d1: top3[0]?.calculation.normPopDensity || 0,
        d2: top3[1]?.calculation.normPopDensity || 0,
        d3: top3[2]?.calculation.normPopDensity || 0,
      },
      {
        pillar: 'Structural Kutcha %',
        fullMark: 100,
        d1: top3[0]?.calculation.normBuildingVulnerability || 0,
        d2: top3[1]?.calculation.normBuildingVulnerability || 0,
        d3: top3[2]?.calculation.normBuildingVulnerability || 0,
      },
      {
        pillar: 'Lifeline Deficit',
        fullMark: 100,
        d1: 100 - (top3[0]?.calculation.normLifelineProximity || 0),
        d2: 100 - (top3[1]?.calculation.normLifelineProximity || 0),
        d3: 100 - (top3[2]?.calculation.normLifelineProximity || 0),
      },
    ];
  }, [scopedDistricts]);

  // Time-Series Hazard Propagation Trend (24-Hour Projected Escalation)
  const historicalTrendData = useMemo(() => {
    const base = parseFloat(kpis.avgScore) || 65;
    const mult = currentSeverity?.severityMultiplier || 1.0;
    const isFlood = disasterType === 'flood';
    const isHeat = disasterType === 'heatwave';

    if (isFlood) {
      return [
        { time: 'T-06h', avgScore: Math.round(base * 0.72) },
        { time: 'T-03h', avgScore: Math.round(base * 0.84) },
        { time: 'Now (Peak)', avgScore: Math.round(base) },
        { time: 'T+03h', avgScore: Math.round(Math.min(100, base * 1.06)) },
        { time: 'T+06h', avgScore: Math.round(Math.min(100, base * 1.12)) },
        { time: 'T+12h', avgScore: Math.round(base * 0.94) },
        { time: 'T+24h', avgScore: Math.round(base * 0.81) },
      ];
    } else if (isHeat) {
      return [
        { time: '08:00', avgScore: Math.round(base * 0.65) },
        { time: '10:00', avgScore: Math.round(base * 0.78) },
        { time: '12:00', avgScore: Math.round(base * 0.92) },
        { time: '14:00 (Peak)', avgScore: Math.round(Math.min(100, base * 1.15)) },
        { time: '16:00', avgScore: Math.round(Math.min(100, base * 1.08)) },
        { time: '18:00', avgScore: Math.round(base * 0.85) },
        { time: '20:00', avgScore: Math.round(base * 0.68) },
      ];
    } else {
      // Cyclone
      return [
        { time: 'T-12h', avgScore: Math.round(base * 0.60) },
        { time: 'T-06h', avgScore: Math.round(base * 0.82) },
        { time: 'Landfall (Now)', avgScore: Math.round(base) },
        { time: 'T+06h', avgScore: Math.round(Math.min(100, base * 1.14)) },
        { time: 'T+12h', avgScore: Math.round(base * 0.90) },
        { time: 'T+24h', avgScore: Math.round(base * 0.68) },
        { time: 'T+48h', avgScore: Math.round(base * 0.45) },
      ];
    }
  }, [kpis.avgScore, currentSeverity, disasterType]);

  // Filtered & Sorted Table Rows
  const tableRows = useMemo(() => {
    return scopedDistricts
      .filter((d) => {
        // Tier filter
        if (selectedTierFilter === 'CRITICAL' && d.score < 80) return false;
        if (selectedTierFilter === 'SEVERE' && (d.score < 65 || d.score >= 80)) return false;
        if (selectedTierFilter === 'ELEVATED' && (d.score < 45 || d.score >= 65)) return false;
        if (selectedTierFilter === 'MODERATE' && d.score >= 45) return false;

        // Search filter
        const q = tableSearchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          d.name.toLowerCase().includes(q) ||
          d.state.toLowerCase().includes(q) ||
          d.primaryRiskFactor.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'population') return (b.population || 0) - (a.population || 0);
        if (sortBy === 'distance') return a.calculation.distanceKm - b.calculation.distanceKm;
        if (sortBy === 'lackCapacity')
          return b.calculation.lackOfCopingCapacity - a.calculation.lackOfCopingCapacity;
        return b.score - a.score;
      });
  }, [scopedDistricts, selectedTierFilter, tableSearchQuery, sortBy]);

  // AI Strategic Recommendation Generator based on active hazard and district characteristics
  const getStrategicAction = (district: DistrictData, score: number, calc: ZoneScoreCalculation) => {
    if (disasterType === 'flood') {
      if (score >= 80) {
        return 'Deploy SDRF High-Capacity Inflatable Motor Boats, Dewatering Pumps & Air-Dropped Dry Rations';
      } else if (score >= 65) {
        return 'Pre-position 4x4 Rescue Vans, Potable Water Tankers & Mobilize Secondary Embankment Triage';
      } else if (score >= 45) {
        return 'Alert Civil Defense Units, Issue River Gauge Warnings & Distribute Tarp/Tent Kits';
      }
      return 'Monitor River Tributaries & Maintain Reserve Communication Net';
    } else if (disasterType === 'heatwave') {
      if (score >= 80) {
        return 'Dispatch Emergency Water Tankers to Slum Belts, Activate AC Triage Centers & Shift Working Hours';
      } else if (score >= 65) {
        return 'Distribute ORS / Hydration Kits, Restrict Outdoor Labor & Establish Cool Roof Shelters';
      } else if (score >= 45) {
        return 'Issue Red Heat Index Warnings & Monitor Peak Power Grid Load for Medical Hubs';
      }
      return 'Standard Advisory & Community Hydration Points';
    } else {
      // Cyclone
      if (score >= 80) {
        return 'Immediate Mandatory Coastal Evacuation to Multi-Purpose Shelters & Deploy Heavy JCB Debris Clearers';
      } else if (score >= 65) {
        return 'Secure Power Substations, Pre-position Emergency Generators & Stock 7-Day Food Relief Kits';
      } else if (score >= 45) {
        return 'Broadcast Coastal Siren Warnings, Restrict Marine Activity & Mobilize SDRF Reserves';
      }
      return 'Monitor Storm Trajectory & Maintain Radar Watch';
    }
  };

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'flood':
        return <Droplets size={16} className="text-blue-400" />;
      case 'heatwave':
        return <Flame size={16} className="text-orange-400" />;
      case 'cyclone':
        return <Wind size={16} className="text-emerald-400" />;
      default:
        return <AlertTriangle size={16} className="text-amber-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 65) return '#f97316'; // Orange
    if (score >= 45) return '#f59e0b'; // Amber
    if (score >= 25) return '#84cc16'; // Lime
    return '#10b981'; // Emerald
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & DISASTER CONTEXT BANNER */}
      <div className="bg-[#090d16] border border-[#172338] rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                {getDisasterIcon(disasterType)}
                <span className="uppercase">{disasterType} Simulation Active</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30">
                {currentSeverity?.name || 'Severe Event'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Radius: <strong className="text-slate-200">{customRadiusKm} km</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide flex items-center gap-2.5">
              <span>{t('vuln.prioritizationEngine', 'Prioritization & Vulnerability Dashboard')}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{t('vuln.epicenter', 'Epicenter')}:</span>
              <strong className="text-slate-200 flex items-center gap-1">
                <MapPin size={12} className="text-red-400" /> {epicenterName}
              </strong>
              <span className="text-slate-500">•</span>
              <span>{t('vuln.model', 'Model')}:</span>
              <strong className="text-slate-300 capitalize font-mono">
                {customDecayModel} Decay (W_AC: {(customPillarAdaptive * 100).toFixed(0)}%, W_S: {(customPillarSensitivity * 100).toFixed(0)}%, W_E: {(customPillarExposure * 100).toFixed(0)}%)
              </strong>
            </p>
          </div>

          {/* Model Status Badge & Export Report Action */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            <button
              onClick={() => setIsExportReportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 border border-blue-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Preview & Export Disaster Vulnerability & Resource Dispatch Report"
            >
              <FileText size={14} className="text-blue-200" />
              <span>Export PDF Report</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d1524] border border-[#1b2b46] shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase leading-none">Spatial GNN Engine</p>
                <p className="text-xs font-bold text-emerald-400 leading-tight">Live Real-Time Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GEOGRAPHIC SCOPE MENU: BRINGING AFFECTED STATES TO THE FRONT */}
        <div className="mt-4 pt-4 border-t border-[#15233c] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass size={14} className="text-cyan-400" />
              <span>{t('nav.geographicScope', 'Geographic Scope')}:</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* All Zones Button */}
            <button
              onClick={() => setSelectedScope('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedScope === 'ALL'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                  : 'bg-[#0d1524] hover:bg-[#131e33] text-slate-300 border border-[#1e2f4d]'
              }`}
            >
              <Layers size={13} />
              <span>{t('nav.allZones', 'All Zones (Nationwide)')}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {allCalculations.filter((d) => d.isImpacted).length}
              </span>
            </button>

            {/* Quick Pills for Top Affected States */}
            {affectedStatesList.slice(0, 4).map((st) => {
              const isSelected = selectedScope === st.id;
              const m = stateMetricsMap.get(st.id);

              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedScope(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600/90 text-white shadow-lg shadow-red-500/25 border border-red-400'
                      : 'bg-red-950/30 hover:bg-red-900/40 text-red-200 border border-red-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                  <span>{st.stateName}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 font-mono text-red-300">
                    {m?.impactedDistricts} impacted
                  </span>
                </button>
              );
            })}

            {/* Complete State / Scope Dropdown Selector Removed per user request */}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC SUMMARY KPI CARDS (FOR CURRENTLY SELECTED SCOPE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Critical Zones */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Critical Priority Zones (80+)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-red-400 font-mono">{kpis.criticalZones}</span>
              <span className="text-[11px] text-slate-400">
                / {kpis.totalDistricts} in scope
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Vulnerability Score */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Activity size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Avg Disaster Risk Score</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-orange-400 font-mono">{kpis.avgScore}</span>
              <span className="text-[11px] text-slate-400">/ 100 max</span>
            </div>
          </div>
        </div>

        {/* Card 3: Population at Risk */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">Exposed Population</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {(kpis.totalPop / 1000000).toFixed(1)}M
              </span>
              <span className="text-[11px] text-slate-400">citizens</span>
            </div>
          </div>
        </div>

        {/* Card 4: Affected States or Lifeline Strain */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 truncate">
              {selectedScope === 'ALL' ? 'Impacted States & UTs' : 'Lifeline Strain Index'}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {selectedScope === 'ALL' ? kpis.affectedStatesCount : `${kpis.avgLCC}%`}
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedScope === 'ALL' ? 'States in Hazard Zone' : 'Capacity Deficit'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL INSIGHTS: CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Bar Chart: Top Districts in Scope (7 Columns) */}
        <div className="lg:col-span-7 bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-blue-400" />
                <span>
                  {selectedScope === 'ALL'
                    ? 'Nationwide Top Prioritized Districts'
                    : `${activeScopeProfile?.stateName} District Vulnerability Rankings`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Composite 3-Pillar Score (Adaptive Deficit, Sensitivity &amp; Exposure)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
              Top {topChartData.length} Zones
            </span>
          </div>

          <div className="h-72 w-full flex-1">
            {topChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No districts currently affected in this scope
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#172338" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b1220] border border-[#1e2f4d] p-3 rounded-xl shadow-2xl text-xs text-slate-200 min-w-[200px]">
                          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-1.5">
                            <span className="font-bold text-white text-sm">{data.name}</span>
                            <span className="text-[10px] font-mono text-cyan-400">{data.state}</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Disaster Vulnerability:</span>
                              <span className="font-bold font-mono text-red-400">{data.score} / 100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Exposure Score (E):</span>
                              <span className="font-mono text-cyan-300">{data.exposure}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Sensitivity Score (S):</span>
                              <span className="font-mono text-amber-300">{data.sensitivity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Capacity Deficit (100-AC):</span>
                              <span className="font-mono text-emerald-300">{data.lackOfCapacity}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                              <span>Distance from Epicenter:</span>
                              <span className="font-mono text-slate-200">{data.distanceKm} km</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Vulnerability Score">
                    {topChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamic Multi-Pillar Breakdown or Propagation Trend (5 Columns) */}
        <div className="lg:col-span-5 bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-400" />
                <span>Hazard Progression &amp; Peak Horizon</span>
              </h3>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                24h Model Projection
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Projected risk intensity curve based on {disasterType.toUpperCase()} decay rate &amp; weather front
            </p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvgScoreDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#172338" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#1e293b' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e2f4d',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAvgScoreDash)"
                  name="Projected Risk"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight Pill */}
          <div className="p-3 bg-[#0d1524] border border-[#1b2b46] rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">GNN Insight: </span>
              <span>
                {disasterType === 'flood'
                  ? 'Riverine surge compounds across transboundary lowlands. Prioritization prioritizes districts lacking elevated shelters and shallow-draft motorized boats.'
                  : disasterType === 'heatwave'
                  ? 'Urban heat island effect and lack of hospital cooling units amplify elderly demographic sensitivity.'
                  : 'Coastal landfall demands mandatory evacuation within 60km corridor due to weak kutcha housing structural fragility.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ACTIONABLE PRIORITY RESOURCE ALLOCATION & DISTRICTS TABLE */}
      <div className="bg-[#090d16] border border-[#172338] rounded-2xl shadow-2xl overflow-hidden">
        {/* Table Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#172338] bg-[#070b14]/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-blue-400" />
              <span>
                {selectedScope === 'ALL'
                  ? 'National Multi-Criteria Priority Allocation Matrix'
                  : `${activeScopeProfile?.stateName} Priority Allocation Table`}
              </span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({tableRows.length} Districts)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time actionable prioritization, risk drivers, and automated SDRF/NDRF dispatch suggestions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search district, state, risk..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0d1524] border border-[#1b2b46] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {tableSearchQuery && (
                <button
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Risk Tier Chips */}
            <div className="flex items-center gap-1 bg-[#0d1524] p-1 rounded-xl border border-[#1b2b46]">
              {(['ALL', 'CRITICAL', 'SEVERE', 'ELEVATED'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTierFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedTierFilter === tier
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier === 'ALL'
                    ? 'All'
                    : tier === 'CRITICAL'
                    ? 'Critical 80+'
                    : tier === 'SEVERE'
                    ? 'Severe 65+'
                    : 'Elevated 45+'}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0d1524] text-slate-300 text-xs font-semibold border border-[#1b2b46] rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="score">Sort by: Vulnerability Score</option>
              <option value="population">Sort by: Population at Risk</option>
              <option value="distance">Sort by: Distance to Epicenter</option>
              <option value="lackCapacity">Sort by: Capacity Deficit (100-AC)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101d] text-slate-400 uppercase font-mono text-[10px] sticky top-0 z-10 border-b border-[#172338]">
              <tr>
                <th className="px-4 py-3 font-semibold">Rank &amp; District</th>
                <th className="px-4 py-3 font-semibold">State / Scope</th>
                <th className="px-4 py-3 font-semibold">Vulnerability Score</th>
                <th className="px-4 py-3 font-semibold">3-Pillars (E | S | AC)</th>
                <th className="px-4 py-3 font-semibold">Population at Risk</th>
                <th className="px-4 py-3 font-semibold">Epicenter Dist</th>
                <th className="px-4 py-3 font-semibold">Primary Risk Factor</th>
                <th className="px-4 py-3 font-semibold">AI Recommended Action</th>
                <th className="px-4 py-3 font-semibold">Readiness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#172338]">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-xs text-slate-500">
                    No districts found matching your criteria.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, idx) => {
                  const strategicAction = getStrategicAction(row, row.score, row.calculation);

                  return (
                    <tr key={row.id} className="hover:bg-[#0c1424] transition-colors group">
                      {/* Rank & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              row.score >= 80
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-black'
                                : row.score >= 65
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      {/* State */}
                      <td className="px-4 py-3 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-[#131e33] text-slate-300 font-medium">
                          {row.state}
                        </span>
                      </td>

                      {/* Vulnerability Score Meter */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800/80 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(5, row.score))}%`,
                                backgroundColor: getScoreColor(row.score),
                              }}
                            />
                          </div>
                          <span
                            className="font-mono font-black text-xs"
                            style={{ color: getScoreColor(row.score) }}
                          >
                            {row.score}
                          </span>
                        </div>
                      </td>

                      {/* 3-Pillar Breakdown Chips */}
                      <td className="px-4 py-3 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/30"
                            title="Exposure Pillar (E)"
                          >
                            E: {row.calculation.exposureScore}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/30"
                            title="Sensitivity Pillar (S)"
                          >
                            S: {row.calculation.sensitivityScore}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/30"
                            title="Adaptive Capacity Pillar (AC)"
                          >
                            AC: {row.calculation.adaptiveCapacityScore}
                          </span>
                        </div>
                      </td>

                      {/* Population at Risk */}
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {(row.population || 0).toLocaleString()}
                      </td>

                      {/* Distance from Epicenter */}
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {row.calculation.distanceKm} km
                      </td>

                      {/* Primary Risk Driver */}
                      <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate" title={row.primaryRiskFactor}>
                        {row.primaryRiskFactor}
                      </td>

                      {/* AI Action */}
                      <td className="px-4 py-3 text-slate-200 max-w-[280px]">
                        <div className="line-clamp-2 text-[11px] leading-snug text-slate-300">
                          {strategicAction}
                        </div>
                      </td>

                      {/* Readiness Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-[9px] uppercase tracking-wider font-black rounded-lg border inline-flex items-center gap-1 ${
                            row.score >= 80
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : row.score >= 65
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                              : row.score >= 45
                              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {row.score >= 80
                            ? 'Critical Dispatch'
                            : row.score >= 65
                            ? 'High Alert'
                            : row.score >= 45
                            ? 'Elevated Standby'
                            : 'Monitoring'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
