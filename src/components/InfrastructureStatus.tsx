import React, { useState, useEffect, useMemo } from 'react';
import {
  Wifi,
  Radio,
  Zap,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Layers,
  MapPin,
  Building,
  Activity,
  ShieldAlert,
  SlidersHorizontal,
  ArrowUpRight,
  TrendingDown,
  Info,
  Server,
  Flame,
  Droplets,
  Wind,
  Download,
  Check,
  X,
} from 'lucide-react';
import { useDisasterSimulation } from '../context/DisasterSimulationContext';
import { useLanguage } from '../context/LanguageContext';
import { STATE_RESOURCE_DATA, StateResourceProfile } from '../data/stateResourceData';
import {
  getDistrictBaseline,
  canonicalStateName,
  isStateMatch,
  STATE_BASELINES,
} from '../data/districtProfiles';
import {
  computeZoneVulnerability,
  computeFeatureCentroid,
  calculateHaversineDistance,
  DistrictData,
} from '../utils/vulnerabilityMath';

// Status Classification
type InfraHealthTier = 'Operational' | 'Degraded' | 'Critical Outage';

interface InfraMetric {
  value: number; // 0 to 100 percentage
  status: InfraHealthTier;
  detail: string;
}

interface CityInfraData {
  id: string;
  name: string;
  state: string;
  network: InfraMetric;
  drainage: InfraMetric;
  communication: InfraMetric;
  powerGrid: InfraMetric;
  lastUpdated: string;
  overallVulnerabilityScore: number;
  isImpacted: boolean;
  population: number;
  primaryRisk: string;
}

interface StateInfraData {
  id: string;
  stateName: string;
  stateCode: string;
  region: string;
  capital: string;
  network: InfraMetric;
  drainage: InfraMetric;
  communication: InfraMetric;
  powerGrid: InfraMetric;
  lastUpdated: string;
  overallVulnerabilityScore: number;
  isImpacted: boolean;
  totalDistricts: number;
  criticalDistrictsCount: number;
  cities: CityInfraData[];
}

const REGION_OPTIONS = ['⚡ Affected', 'All', 'North', 'East', 'West', 'South', 'North-East', 'Central'];
const STATUS_FILTER_OPTIONS = ['All', 'Critical Outages', 'Degraded', 'Fully Operational'];

export const InfrastructureStatus: React.FC = () => {
  const {
    disasterType,
    selectedSeverityId,
    epicenter,
    epicenterName,
    customRadiusKm,
    currentSeverity,
    activeParams,
  } = useDisasterSimulation();
  const { t } = useLanguage();

  // State & GeoJSON loaded districts
  const [districtList, setDistrictList] = useState<DistrictData[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState<boolean>(true);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');

  // Interactive Table State
  const [expandedStateIds, setExpandedStateIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('⚡ Affected');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedInspectNode, setSelectedInspectNode] = useState<{
    type: 'state' | 'city';
    data: StateInfraData | CityInfraData;
  } | null>(null);

  // Load geojson dataset to obtain authentic Indian districts
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
          const distId = `infra-dist-${index}`;

          flatList.push({
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
          });
        });

        setDistrictList(flatList);
        setIsLoadingGeo(false);
      })
      .catch((err) => {
        console.error('Failed to load district data in InfrastructureStatus', err);
        if (isMounted) setIsLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute infrastructure health values based on baseline and active disaster dynamics
  const computeInfrastructureState = useMemo(() => {
    const isFlood = disasterType === 'flood';
    const isHeatwave = disasterType === 'heatwave';
    const isCyclone = disasterType === 'cyclone';
    const severityMult = currentSeverity?.severityMultiplier || 1.0;

    // Helper to evaluate tier
    const getTier = (val: number): InfraHealthTier => {
      if (val >= 80) return 'Operational';
      if (val >= 50) return 'Degraded';
      return 'Critical Outage';
    };

    // Calculate for all districts
    const cityDataList: CityInfraData[] = districtList.map((d) => {
      const calc = computeZoneVulnerability(d, activeParams);
      const isImpacted = calc.isWithinImpactRadius && calc.finalScore > 0;
      const distKm = calc.distanceKm;
      const normalizedProximity = isImpacted ? Math.max(0, 1 - distKm / (customRadiusKm || 150)) : 0;

      // Base infrastructure quality (from lifeline proximity and EWS coverage)
      const baseHealth = Math.min(95, Math.max(65, Math.round(d.lifelineProximityScore * 0.7 + d.ewsCoverage * 0.3)));

      let netVal = baseHealth;
      let drainVal = baseHealth;
      let commVal = Math.min(98, Math.round(d.ewsCoverage * 0.8 + 20));
      let powerVal = baseHealth;

      let netDetail = 'Towers operational, normal LTE/5G bandwidth';
      let drainDetail = 'Standard runoff clearance, no overflow';
      let commDetail = 'Emergency VHF net and SMS warning operational';
      let powerDetail = 'Grid feeder load stable, substations online';

      if (isImpacted) {
        const impactFactor = normalizedProximity * severityMult;

        if (isFlood) {
          // Flooding severely impacts Drainage and Power (substation waterlogging)
          drainVal = Math.max(12, Math.round(baseHealth - impactFactor * 70));
          powerVal = Math.max(18, Math.round(baseHealth - impactFactor * 55));
          netVal = Math.max(25, Math.round(baseHealth - impactFactor * 45));
          commVal = Math.max(40, Math.round(commVal - impactFactor * 30));

          drainDetail = drainVal < 50 ? 'Severe inundation, sluices overwhelmed' : 'Heavy siltation, pumping active';
          powerDetail = powerVal < 50 ? 'Substations inundated, preventive shutoff' : 'Feeder line tripping, DG backup';
          netDetail = netVal < 50 ? 'BTS cell towers submerged, fiber cuts' : 'Mobile carrier degraded, backup cells';
          commDetail = commVal < 50 ? 'VHF repeater battery drained' : 'Public sirens & satellite channels up';
        } else if (isCyclone) {
          // Cyclone severely impacts Communication (antennae destroyed), Power (poles down) and Network
          powerVal = Math.max(10, Math.round(baseHealth - impactFactor * 75));
          commVal = Math.max(20, Math.round(commVal - impactFactor * 65));
          netVal = Math.max(15, Math.round(baseHealth - impactFactor * 68));
          drainVal = Math.max(30, Math.round(baseHealth - impactFactor * 50));

          powerDetail = powerVal < 50 ? 'High-tension towers snapped, blackout' : 'Partial line faults, emergency crew active';
          commDetail = commVal < 50 ? 'Microwave links misaligned, antenna damage' : 'Emergency satellite radio deployed';
          netDetail = netVal < 50 ? 'Cellular transmission offline' : 'Congested bandwidth, cell on wheels active';
          drainDetail = drainVal < 50 ? 'Storm surge seawater backflow' : 'Heavy coastal runoff active';
        } else if (isHeatwave) {
          // Heatwave severely strains Power Grid (AC load) and Water/Drainage networks
          powerVal = Math.max(28, Math.round(baseHealth - impactFactor * 60));
          drainVal = Math.max(45, Math.round(baseHealth - impactFactor * 30));
          netVal = Math.max(60, Math.round(baseHealth - impactFactor * 25));
          commVal = Math.max(75, Math.round(commVal - impactFactor * 15));

          powerDetail = powerVal < 50 ? 'Transformer overheating, rolling blackouts' : 'Peak grid load strain (>92% peak)';
          drainDetail = 'Low runoff, tanker distribution prioritization';
          netDetail = 'Switching centers cooling load high';
          commDetail = 'EWS heatwave advisory broadcast live';
        }
      }

      // Format Last Updated relative string
      const lastUpdatedStr = isImpacted ? '2 mins ago (Live Telemetry)' : '14 mins ago';

      return {
        id: d.id,
        name: d.name,
        state: d.state,
        network: { value: netVal, status: getTier(netVal), detail: netDetail },
        drainage: { value: drainVal, status: getTier(drainVal), detail: drainDetail },
        communication: { value: commVal, status: getTier(commVal), detail: commDetail },
        powerGrid: { value: powerVal, status: getTier(powerVal), detail: powerDetail },
        lastUpdated: lastUpdatedStr,
        overallVulnerabilityScore: calc.finalScore,
        isImpacted,
        population: d.population,
        primaryRisk: d.primaryRiskFactor,
      };
    });

    // Aggregate into States
    const stateList: StateInfraData[] = STATE_RESOURCE_DATA.map((st) => {
      const stateCities = cityDataList.filter((c) => isStateMatch(c.state, st.stateName));
      const impactedCities = stateCities.filter((c) => c.isImpacted);
      const isImpacted = impactedCities.length > 0;

      // Compute averages
      const citiesToAverage = isImpacted ? impactedCities : stateCities.length > 0 ? stateCities : [];

      const avgNet =
        citiesToAverage.length > 0
          ? Math.round(citiesToAverage.reduce((acc, c) => acc + c.network.value, 0) / citiesToAverage.length)
          : 85;
      const avgDrain =
        citiesToAverage.length > 0
          ? Math.round(citiesToAverage.reduce((acc, c) => acc + c.drainage.value, 0) / citiesToAverage.length)
          : 80;
      const avgComm =
        citiesToAverage.length > 0
          ? Math.round(citiesToAverage.reduce((acc, c) => acc + c.communication.value, 0) / citiesToAverage.length)
          : 90;
      const avgPower =
        citiesToAverage.length > 0
          ? Math.round(citiesToAverage.reduce((acc, c) => acc + c.powerGrid.value, 0) / citiesToAverage.length)
          : 85;

      const maxVulScore = stateCities.length > 0 ? Math.max(...stateCities.map((c) => c.overallVulnerabilityScore)) : 0;
      const avgVulScore =
        impactedCities.length > 0
          ? Math.round(impactedCities.reduce((acc, c) => acc + c.overallVulnerabilityScore, 0) / impactedCities.length)
          : Math.min(30, Math.round(maxVulScore * 0.5));

      const finalStateVulScore = isImpacted ? Math.round(0.7 * maxVulScore + 0.3 * avgVulScore) : avgVulScore;

      const criticalCount = stateCities.filter((c) => c.overallVulnerabilityScore >= 80).length;

      return {
        id: st.id,
        stateName: st.stateName,
        stateCode: st.stateCode,
        region: st.region,
        capital: st.capital,
        network: {
          value: avgNet,
          status: getTier(avgNet),
          detail: `${avgNet}% aggregate state cellular/optical uptime`,
        },
        drainage: {
          value: avgDrain,
          status: getTier(avgDrain),
          detail: `${avgDrain}% functional storm basin capacity`,
        },
        communication: {
          value: avgComm,
          status: getTier(avgComm),
          detail: `${avgComm}% early warning broadcast reach`,
        },
        powerGrid: {
          value: avgPower,
          status: getTier(avgPower),
          detail: `${avgPower}% substation transmission operational`,
        },
        lastUpdated: isImpacted ? 'Live Stream' : '15 mins ago',
        overallVulnerabilityScore: finalStateVulScore,
        isImpacted,
        totalDistricts: stateCities.length || 1,
        criticalDistrictsCount: criticalCount,
        cities: stateCities.sort((a, b) => b.overallVulnerabilityScore - a.overallVulnerabilityScore),
      };
    });

    // Sort states: Affected states first, then highest overall vulnerability score
    const sortedStates = stateList.sort((a, b) => {
      if (a.isImpacted !== b.isImpacted) {
        return a.isImpacted ? -1 : 1;
      }
      return b.overallVulnerabilityScore - a.overallVulnerabilityScore;
    });

    return {
      states: sortedStates,
      allCities: cityDataList,
    };
  }, [districtList, disasterType, currentSeverity, activeParams, customRadiusKm]);

  // Overall India Nationwide Summary KPIs
  const nationwideKPIs = useMemo(() => {
    const states = computeInfrastructureState.states;
    if (states.length === 0) {
      return {
        networkAvg: 88,
        drainageAvg: 74,
        commAvg: 94,
        powerAvg: 86,
        impactedStatesCount: 0,
        criticalDistrictsTotal: 0,
      };
    }

    const netAvg = Math.round(states.reduce((acc, s) => acc + s.network.value, 0) / states.length);
    const drainAvg = Math.round(states.reduce((acc, s) => acc + s.drainage.value, 0) / states.length);
    const commAvg = Math.round(states.reduce((acc, s) => acc + s.communication.value, 0) / states.length);
    const powerAvg = Math.round(states.reduce((acc, s) => acc + s.powerGrid.value, 0) / states.length);

    const impactedStates = states.filter((s) => s.isImpacted).length;
    const criticalDistricts = states.reduce((acc, s) => acc + s.criticalDistrictsCount, 0);

    return {
      networkAvg: netAvg,
      drainageAvg: drainAvg,
      commAvg: commAvg,
      powerAvg: powerAvg,
      impactedStatesCount: impactedStates,
      criticalDistrictsTotal: criticalDistricts,
    };
  }, [computeInfrastructureState]);

  // Filtered list of states based on region, status and search
  const filteredStateRows = useMemo(() => {
    return computeInfrastructureState.states.filter((st) => {
      // Region filter
      if (selectedRegion === '⚡ Affected' && !st.isImpacted) return false;
      if (selectedRegion !== 'All' && selectedRegion !== '⚡ Affected' && st.region !== selectedRegion) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'Critical Outages') {
        const hasOutage =
          st.network.status === 'Critical Outage' ||
          st.drainage.status === 'Critical Outage' ||
          st.communication.status === 'Critical Outage' ||
          st.powerGrid.status === 'Critical Outage';
        if (!hasOutage) return false;
      } else if (selectedStatusFilter === 'Degraded') {
        const hasDegraded =
          st.network.status === 'Degraded' ||
          st.drainage.status === 'Degraded' ||
          st.communication.status === 'Degraded' ||
          st.powerGrid.status === 'Degraded';
        if (!hasDegraded) return false;
      } else if (selectedStatusFilter === 'Fully Operational') {
        const isAllOp =
          st.network.status === 'Operational' &&
          st.drainage.status === 'Operational' &&
          st.communication.status === 'Operational' &&
          st.powerGrid.status === 'Operational';
        if (!isAllOp) return false;
      }

      // Search query filter (matches state name, code, capital, or any nested city name)
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchState =
        st.stateName.toLowerCase().includes(q) ||
        st.stateCode.toLowerCase().includes(q) ||
        st.capital.toLowerCase().includes(q);
      const matchCity = st.cities.some((c) => c.name.toLowerCase().includes(q));

      return matchState || matchCity;
    });
  }, [computeInfrastructureState.states, selectedRegion, selectedStatusFilter, searchQuery]);

  // Toggle State Expansion to view Cities / Districts
  const toggleStateExpand = (stateId: string) => {
    setExpandedStateIds((prev) => {
      const next = new Set(prev);
      if (next.has(stateId)) {
        next.delete(stateId);
      } else {
        next.add(stateId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStateIds(new Set(filteredStateRows.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedStateIds(new Set());
  };

  // Helper for Status Badge Rendering
  const renderStatusPill = (metric: InfraMetric) => {
    let badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    let dotClass = 'bg-emerald-400';
    let Icon = CheckCircle2;

    if (metric.status === 'Critical Outage') {
      badgeClass = 'bg-red-500/20 text-red-400 border-red-500/35';
      dotClass = 'bg-red-400 animate-ping';
      Icon = AlertCircle;
    } else if (metric.status === 'Degraded') {
      badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      dotClass = 'bg-amber-400';
      Icon = AlertTriangle;
    }

    return (
      <div className="flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            <span>{metric.value}%</span>
            <span className="text-[10px] font-medium opacity-90">({metric.status})</span>
          </span>
        </div>
        <div className="w-full bg-[#162238] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              metric.status === 'Critical Outage'
                ? 'bg-red-500'
                : metric.status === 'Degraded'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(5, metric.value)}%` }}
          />
        </div>
      </div>
    );
  };

  // Helper for Vulnerability Score Pill
  const renderVulnerabilityScorePill = (score: number) => {
    let bg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    let label = 'Low';

    if (score >= 80) {
      bg = 'bg-red-500/25 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10';
      label = 'Critical';
    } else if (score >= 65) {
      bg = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      label = 'Severe';
    } else if (score >= 45) {
      bg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      label = 'Elevated';
    } else if (score >= 25) {
      bg = 'bg-lime-500/15 text-lime-400 border-lime-500/30';
      label = 'Moderate';
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${bg}`}>
          {score} <span className="text-[10px] font-sans font-normal opacity-80">/ 100</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & DISASTER CONTEXT */}
      <div className="bg-[#090d16] border border-[#172338] rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Server size={14} className="text-blue-400" />
                <span>{t('infra.allIndiaTelemetry', 'NATIONWIDE INFRASTRUCTURE TELEMETRY')}</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                {disasterType === 'flood' ? <Droplets size={12} /> : disasterType === 'heatwave' ? <Flame size={12} /> : <Wind size={12} />}
                <span className="capitalize">{t(`vuln.${disasterType}`, `${disasterType} Impact Active`)}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {t('vuln.epicenter', 'Epicenter')}: <strong className="text-slate-200">{epicenterName}</strong> ({customRadiusKm} km)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide">
              {t('infra.title', 'Infrastructure Status & Grid Reliability')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t('infra.subtitle', 'Live monitoring of Cellular Networks, Stormwater Drainage Systems, Emergency Communications, and Power Grid substations across India.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={() => setLastRefreshedTime('Just now')}
              className="px-3 py-2 bg-[#0d1524] hover:bg-[#131f36] border border-[#1b2b46] rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className="text-cyan-400" />
              <span>{t('common.refresh', 'Refresh Status')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OVERALL INDIA TOP LEVEL METRICS (NETWORK, COMMUNICATION, POWER GRID, DRAINAGE SYSTEM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cellular & Optical Network */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#223553] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wifi size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold border border-blue-500/25">
              TELECOM
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('infra.network', 'Cellular & Optical Networks')}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {nationwideKPIs.networkAvg}%
              </span>
              <span className="text-xs font-bold text-emerald-400">{t('infra.healthy', 'Operational')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cell towers, LTE/5G nodes, optical backbones
            </p>
          </div>
          <div className="w-full bg-[#131d2e] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${nationwideKPIs.networkAvg}%` }} />
          </div>
        </div>

        {/* Metric 2: Stormwater Drainage System */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#223553] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Droplet size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/25">
              HYDROLOGY
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('infra.drainage', 'Stormwater Drainage Systems')}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {nationwideKPIs.drainageAvg}%
              </span>
              <span className="text-xs font-bold text-amber-400">{t('infra.compromised', 'Capacity')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Pumping stations, sluice gates, storm drainage
            </p>
          </div>
          <div className="w-full bg-[#131d2e] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${nationwideKPIs.drainageAvg}%` }} />
          </div>
        </div>

        {/* Metric 3: Emergency Communication */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#223553] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/25">
              EWS BROADCAST
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('infra.comms', 'Emergency Communications')}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {nationwideKPIs.commAvg}%
              </span>
              <span className="text-xs font-bold text-emerald-400">{t('infra.healthy', 'Uptime')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Satellite links, VHF/HF emergency net, sirens
            </p>
          </div>
          <div className="w-full bg-[#131d2e] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${nationwideKPIs.commAvg}%` }} />
          </div>
        </div>

        {/* Metric 4: High-Voltage Power Grid */}
        <div className="bg-[#090d16] border border-[#172338] p-4 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#223553] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/25">
              ENERGY GRID
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('infra.power', 'High-Voltage Power Grids')}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {nationwideKPIs.powerAvg}%
              </span>
              <span className="text-xs font-bold text-emerald-400">{t('infra.healthy', 'Online')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Substation availability & transmission load
            </p>
          </div>
          <div className="w-full bg-[#131d2e] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${nationwideKPIs.powerAvg}%` }} />
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE STATEWISE & CITY LEVEL TABLE */}
      <div className="bg-[#090d16] border border-[#172338] rounded-2xl shadow-2xl overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-[#172338] bg-[#070b14]/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building size={16} className="text-blue-400" />
                <span>{t('infra.title', 'State & City Infrastructure Health Matrix')}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({filteredStateRows.length} {t('infra.statesUts', 'States & UTs')})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('infra.clickToDrill', 'Click any state row to view district and city infrastructure breakdowns')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder={t('infra.searchPlaceholder', 'Search state, city, or status...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-1 bg-[#0d1524] p-1 rounded-xl border border-[#1b2b46]">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#15233c] transition-all cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 hover:bg-[#15233c] transition-all cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Region and Status Filter Sub-Bar */}
        <div className="px-4 py-2.5 bg-[#0a101d] border-b border-[#15233c] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Region:</span>
            {REGION_OPTIONS.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111c30]'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
            {STATUS_FILTER_OPTIONS.map((statusOpt) => (
              <button
                key={statusOpt}
                onClick={() => setSelectedStatusFilter(statusOpt)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  selectedStatusFilter === statusOpt
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {statusOpt}
              </button>
            ))}
          </div>
        </div>

        {/* The Main Table with Requested Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0b1220] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#172338]">
              <tr>
                <th className="px-4 py-3 font-bold w-12 text-center"></th>
                <th className="px-4 py-3 font-bold min-w-[180px]">{t('infra.state', 'State')}</th>
                <th className="px-4 py-3 font-bold min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Wifi size={13} className="text-blue-400" />
                    <span>{t('infra.network', 'Network')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-bold min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Droplet size={13} className="text-cyan-400" />
                    <span>{t('infra.drainage', 'Drainage System')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-bold min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Radio size={13} className="text-emerald-400" />
                    <span>{t('infra.comms', 'Communication')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-bold min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-400" />
                    <span>{t('infra.power', 'Power Grid')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-bold min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>{t('infra.lastUpdated', 'Last Updated')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 font-bold min-w-[170px]">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-red-400" />
                    <span>{t('infra.vulnScore', 'Overall Vulnerability Score')}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#15233c]/80 text-slate-200">
              {filteredStateRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto">
                      <AlertCircle size={28} className="mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-slate-400">No states found</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try clearing your search query or selecting "All" regions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStateRows.map((stateRow) => {
                  const isExpanded = expandedStateIds.has(stateRow.id);

                  return (
                    <React.Fragment key={stateRow.id}>
                      {/* STATE ROW (CLICKABLE TO EXPAND CITIES BELOW) */}
                      <tr
                        onClick={() => toggleStateExpand(stateRow.id)}
                        className={`hover:bg-[#101b2f] transition-all cursor-pointer group ${
                          isExpanded
                            ? 'bg-[#0f1a2d] border-l-4 border-l-blue-500'
                            : stateRow.isImpacted
                            ? 'bg-[#10131f]/60 hover:bg-[#151b2e]'
                            : ''
                        }`}
                      >
                        {/* Expand Icon */}
                        <td className="px-4 py-3.5 text-center text-slate-400">
                          <div className="w-6 h-6 rounded-md bg-[#16233a] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </td>

                        {/* State Name & Code */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#16233a] border border-[#223553] text-blue-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {stateRow.stateCode}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100 text-sm group-hover:text-blue-300 transition-colors">
                                  {stateRow.stateName}
                                </span>
                                {stateRow.isImpacted && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                                    Impact Zone
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">
                                HQ: {stateRow.capital} • {stateRow.cities.length} Districts/Cities
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Network */}
                        <td className="px-4 py-3.5">{renderStatusPill(stateRow.network)}</td>

                        {/* Drainage System */}
                        <td className="px-4 py-3.5">{renderStatusPill(stateRow.drainage)}</td>

                        {/* Communication */}
                        <td className="px-4 py-3.5">{renderStatusPill(stateRow.communication)}</td>

                        {/* Power Grid */}
                        <td className="px-4 py-3.5">{renderStatusPill(stateRow.powerGrid)}</td>

                        {/* Last Updated */}
                        <td className="px-4 py-3.5">
                          <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                            <Clock size={12} className="text-slate-500" />
                            <span>{stateRow.lastUpdated}</span>
                          </span>
                        </td>

                        {/* Overall Vulnerability Score */}
                        <td className="px-4 py-3.5">
                          {renderVulnerabilityScorePill(stateRow.overallVulnerabilityScore)}
                        </td>
                      </tr>

                      {/* SUB-TABLE: CITIES / DISTRICTS UNDER THIS STATE (SHOWN WHEN STATE IS CLICKED) */}
                      {isExpanded && (
                        <tr className="bg-[#070c17]/95">
                          <td colSpan={8} className="p-0">
                            <div className="pl-10 pr-4 py-3 bg-[#080d18] border-y border-[#18263d] space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-[#142033]">
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-cyan-400" />
                                  <span className="text-xs font-bold text-slate-200">
                                    Cities &amp; Districts in {stateRow.stateName} ({stateRow.cities.length})
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Individual Urban Nodes &amp; District Infrastructure Telemetry
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Same Metrics Schema
                                </span>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-[#172338]">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#0e1626] text-slate-400 uppercase text-[9px] tracking-wider border-b border-[#1b2b46]">
                                    <tr>
                                      <th className="px-4 py-2 font-bold min-w-[160px]">City / District</th>
                                      <th className="px-4 py-2 font-bold min-w-[130px]">Network</th>
                                      <th className="px-4 py-2 font-bold min-w-[130px]">Drainage System</th>
                                      <th className="px-4 py-2 font-bold min-w-[130px]">Communication</th>
                                      <th className="px-4 py-2 font-bold min-w-[130px]">Power Grid</th>
                                      <th className="px-4 py-2 font-bold min-w-[130px]">Last Updated</th>
                                      <th className="px-4 py-2 font-bold min-w-[150px]">
                                        Overall Vulnerability Score
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#142033] text-slate-300">
                                    {stateRow.cities.map((city) => (
                                      <tr
                                        key={city.id}
                                        className="hover:bg-[#121c30] transition-colors"
                                      >
                                        {/* City / District */}
                                        <td className="px-4 py-2.5">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                                            <div>
                                              <span className="font-bold text-slate-200 text-xs">
                                                {city.name}
                                              </span>
                                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                                {city.primaryRisk}
                                              </p>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Network */}
                                        <td className="px-4 py-2.5">{renderStatusPill(city.network)}</td>

                                        {/* Drainage System */}
                                        <td className="px-4 py-2.5">{renderStatusPill(city.drainage)}</td>

                                        {/* Communication */}
                                        <td className="px-4 py-2.5">{renderStatusPill(city.communication)}</td>

                                        {/* Power Grid */}
                                        <td className="px-4 py-2.5">{renderStatusPill(city.powerGrid)}</td>

                                        {/* Last Updated */}
                                        <td className="px-4 py-2.5">
                                          <span className="text-[10px] font-mono text-slate-400">
                                            {city.lastUpdated}
                                          </span>
                                        </td>

                                        {/* Overall Vulnerability Score */}
                                        <td className="px-4 py-2.5">
                                          {renderVulnerabilityScorePill(city.overallVulnerabilityScore)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
