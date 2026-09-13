import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Package,
  Ship,
  Truck,
  Zap,
  Tent,
  Gauge,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
  RefreshCw,
  Download,
  BarChart3,
  Send,
  X,
  Info,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Radio,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';
import {
  STATE_RESOURCE_DATA,
  RESOURCE_CATEGORIES,
  StateResourceProfile,
  getNationalResourceSummary,
} from '../data/stateResourceData';
import { useDisasterSimulation, DispatchLog } from '../context/DisasterSimulationContext';
import { DispatchMission } from '../types/dispatch';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ResourceManagement: React.FC = () => {
  // Global persisted state for states inventory data & mutual-aid dispatch logs
  const {
    statesData,
    setStatesData,
    dispatchLogs,
    setDispatchLogs,
    resetInventory,
    addDispatchMission,
  } = useDisasterSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('population');
  const [activeTab, setActiveTab] = useState<'inventory' | 'table' | 'analytics' | 'dispatch'>('inventory');
  
  // Selected state for deep-dive drawer
  const [selectedState, setSelectedState] = useState<StateResourceProfile | null>(null);

  // Dispatch Simulator State
  const [dispatchSource, setDispatchSource] = useState<string>('maharashtra');
  const [dispatchTarget, setDispatchTarget] = useState<string>('bihar');
  const [dispatchResource, setDispatchResource] = useState<keyof StateResourceProfile['resources']>('waterMotorPumps');
  const [dispatchQty, setDispatchQty] = useState<number>(50);
  const [dispatchMode, setDispatchMode] = useState<string>('Green Road Corridor (SDRF Convoy)');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [dispatchErrorMsg, setDispatchErrorMsg] = useState<string | null>(null);

  // Compute live national summaries
  const nationalSummary = useMemo(() => getNationalResourceSummary(statesData), [statesData]);

  // Filtered and sorted states
  const filteredStates = useMemo(() => {
    return statesData
      .filter((st) => {
        const matchesSearch =
          st.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.primaryDepotLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.stateCode.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRegion = selectedRegion === 'All' || st.region === selectedRegion;
        const matchesRisk = selectedRisk === 'All' || st.primaryDisasterRisk === selectedRisk;

        return matchesSearch && matchesRegion && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === 'population') return b.population - a.population;
        if (sortBy === 'name') return a.stateName.localeCompare(b.stateName);
        if (sortBy === 'waterTankers') return b.resources.waterTankers.total - a.resources.waterTankers.total;
        if (sortBy === 'rationPackets') return b.resources.rationPackets.total - a.resources.rationPackets.total;
        if (sortBy === 'floatingClinics') return b.resources.floatingClinics.total - a.resources.floatingClinics.total;
        if (sortBy === 'debrisMachinery') return b.resources.debrisMachinery.total - a.resources.debrisMachinery.total;
        if (sortBy === 'emergencyGenerators') return b.resources.emergencyGenerators.total - a.resources.emergencyGenerators.total;
        if (sortBy === 'tarpTentKits') return b.resources.tarpTentKits.total - a.resources.tarpTentKits.total;
        if (sortBy === 'waterMotorPumps') return b.resources.waterMotorPumps.total - a.resources.waterMotorPumps.total;
        return 0;
      });
  }, [statesData, searchQuery, selectedRegion, selectedRisk, sortBy]);

  // Handle Resource Dispatch execution
  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchErrorMsg(null);

    if (dispatchSource === dispatchTarget) {
      setDispatchErrorMsg('Source and target states must be different for mutual-aid dispatch.');
      return;
    }

    const source = statesData.find((s) => s.id === dispatchSource);
    const target = statesData.find((s) => s.id === dispatchTarget);

    if (!source || !target) return;

    const availableReserve = source.resources[dispatchResource].inReserve;
    if (dispatchQty > availableReserve) {
      setDispatchErrorMsg(`Cannot dispatch ${dispatchQty} units. Only ${availableReserve} units available in standby reserve in ${source.stateName}.`);
      return;
    }

    // Apply live state changes to inventory
    setStatesData((prev) =>
      prev.map((s) => {
        if (s.id === dispatchSource) {
          return {
            ...s,
            resources: {
              ...s.resources,
              [dispatchResource]: {
                ...s.resources[dispatchResource],
                inReserve: Math.max(0, s.resources[dispatchResource].inReserve - dispatchQty),
                active: s.resources[dispatchResource].active + dispatchQty,
              },
            },
          };
        }
        if (s.id === dispatchTarget) {
          return {
            ...s,
            resources: {
              ...s.resources,
              [dispatchResource]: {
                ...s.resources[dispatchResource],
                total: s.resources[dispatchResource].total + dispatchQty,
                active: s.resources[dispatchResource].active + dispatchQty,
              },
            },
          };
        }
        return s;
      })
    );

    // Estimate ETA based on distance approximation
    const etaHours = Math.floor(Math.random() * 18) + 8;
    const cat = RESOURCE_CATEGORIES[dispatchResource];

    // Create synchronized Dispatch Mission for live road map & PDF report
    const newMission: DispatchMission = {
      id: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
      stateId: dispatchSource,
      targetDistrict: `${target.capital} (${target.stateName})`,
      targetCoords: [85.1376, 25.5941],
      originDepot: `${source.primaryDepotLocation} (${source.stateName})`,
      originCoords: [72.8777, 19.0760],
      items: [
        {
          typeId: dispatchResource,
          unitType: dispatchResource,
          name: cat.name,
          shortName: cat.shortName,
          quantity: dispatchQty,
          unit: cat.unit,
          unitLabel: cat.unit,
          iconType: dispatchResource === 'floatingClinics' ? 'motorBoat' : 'ambulance',
          color: '#3b82f6',
          category: 'Inter-State Mutual Aid',
        },
      ],
      resourceType: dispatchResource,
      quantity: dispatchQty,
      unitLabel: `${dispatchQty.toLocaleString()} ${cat.shortName}`,
      primaryUnitType: dispatchResource === 'floatingClinics' ? 'motorBoat' : 'ambulance',
      transportMode: 'Green Road Corridor',
      status: 'In Transit',
      progress: 8,
      etaMinutes: etaHours * 60,
      priority: 'HIGH',
      dispatchedAt: 'Just now',
    };

    // Add to dispatches list directly to ensure consistent counts
    addDispatchMission(newMission);

    const newLog: DispatchLog = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceState: source.stateName,
      targetState: target.stateName,
      resourceKey: dispatchResource,
      quantity: dispatchQty,
      transitMode: dispatchMode,
      etaHours,
      timestamp: 'Just now',
      status: 'Preparing',
    };

    setDispatchLogs((prev) => [newLog, ...prev]);
    setDispatchSuccessMsg(
      `Successfully mobilized ${dispatchQty.toLocaleString()} ${RESOURCE_CATEGORIES[dispatchResource].shortName} from ${source.stateName} to ${target.stateName} via ${dispatchMode}. (ETA: ~${etaHours} hrs)`
    );

    setTimeout(() => {
      setDispatchSuccessMsg(null);
    }, 6000);
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const headers = [
      'State Code',
      'State Name',
      'Region',
      'Capital',
      'Population',
      'Primary Hazard',
      'SDRF Battalions',
      'Water Tankers (Total)',
      'Water Tankers (Active)',
      'Ration Packets (Total)',
      'Ration Packets (Active)',
      'Floating Clinics (Total)',
      'Floating Clinics (Active)',
      'Heavy Debris Machines (Total)',
      'Heavy Debris Machines (Active)',
      'Emergency Generators (Total)',
      'Emergency Generators (Active)',
      'Tarp & Tent Kits (Total)',
      'Tarp & Tent Kits (Active)',
      'Water Motor Pumps (Total)',
      'Water Motor Pumps (Active)',
      'Primary Logistics Depot',
    ];

    const rows = statesData.map((st) => [
      st.stateCode,
      `"${st.stateName}"`,
      st.region,
      `"${st.capital}"`,
      st.population,
      `"${st.primaryDisasterRisk}"`,
      st.sdrfBattalions,
      st.resources.waterTankers.total,
      st.resources.waterTankers.active,
      st.resources.rationPackets.total,
      st.resources.rationPackets.active,
      st.resources.floatingClinics.total,
      st.resources.floatingClinics.active,
      st.resources.debrisMachinery.total,
      st.resources.debrisMachinery.active,
      st.resources.emergencyGenerators.total,
      st.resources.emergencyGenerators.active,
      st.resources.tarpTentKits.total,
      st.resources.tarpTentKits.active,
      st.resources.waterMotorPumps.total,
      st.resources.waterMotorPumps.active,
      `"${st.primaryDepotLocation}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `India_Disaster_Resource_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render icon by name
  const renderResourceIcon = (key: string, size = 16) => {
    switch (key) {
      case 'waterTankers':
        return <Droplets size={size} className="text-cyan-400" />;
      case 'rationPackets':
        return <Package size={size} className="text-amber-400" />;
      case 'floatingClinics':
        return <Ship size={size} className="text-pink-400" />;
      case 'debrisMachinery':
        return <Truck size={size} className="text-yellow-400" />;
      case 'emergencyGenerators':
        return <Zap size={size} className="text-purple-400" />;
      case 'tarpTentKits':
        return <Tent size={size} className="text-emerald-400" />;
      case 'waterMotorPumps':
        return <Gauge size={size} className="text-blue-400" />;
      default:
        return <Layers size={size} className="text-slate-400" />;
    }
  };

  // Format numbers nicely
  const formatNumber = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Chart data for floating clinics across top states
  const floatingClinicsData = useMemo(() => {
    return statesData
      .filter((s) => s.resources.floatingClinics.total > 0)
      .map((s) => ({
        name: s.stateName,
        Clinics: s.resources.floatingClinics.total,
        Active: s.resources.floatingClinics.active,
        Reserve: s.resources.floatingClinics.inReserve,
      }))
      .sort((a, b) => b.Clinics - a.Clinics);
  }, [statesData]);

  // Chart data for high-capacity equipment (Pumps & Machinery)
  const equipmentComparisonData = useMemo(() => {
    return statesData
      .slice(0, 10)
      .map((s) => ({
        name: s.stateCode,
        fullName: s.stateName,
        Pumps: s.resources.waterMotorPumps.total,
        Machinery: s.resources.debrisMachinery.total,
        Generators: s.resources.emergencyGenerators.total,
        Tankers: s.resources.waterTankers.total,
      }));
  }, [statesData]);

  // Hazard distribution pie
  const hazardPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    statesData.forEach((s) => {
      counts[s.primaryDisasterRisk] = (counts[s.primaryDisasterRisk] || 0) + 1;
    });
    return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
  }, [statesData]);

  const PIE_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header & Strategy Summary */}
      <div className="bg-[#0b101d] border border-[#172338] p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold tracking-wider uppercase font-mono flex items-center gap-1.5">
                <Radio size={12} className="animate-pulse text-blue-400" /> National Disaster Logistics Grid
              </span>
              <span className="text-xs text-slate-500 font-mono">NDMA · SDRF · State Relief Caches</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              State-Wise Disaster Relief Resource Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Standardized real-world distribution across 7 critical lifelines: <strong className="text-cyan-300">Clean Drinking Water Tankers</strong>, <strong className="text-amber-300">Dry Ration Packets</strong>, <strong className="text-pink-300">Floating Medical Clinics</strong>, <strong className="text-yellow-300">Heavy Debris Machinery</strong>, <strong className="text-purple-300">Emergency Generators</strong>, <strong className="text-emerald-300">Tarp/Tent Kits</strong>, and <strong className="text-blue-300">Water Motor Pumps</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#111927] hover:bg-[#182438] text-slate-200 border border-[#1f2e47] rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Export complete inventory to CSV"
            >
              <Download size={14} className="text-blue-400" />
              <span>Export Manifest</span>
            </button>
            <button
              onClick={() => setStatesData(STATE_RESOURCE_DATA)}
              className="flex items-center gap-2 px-3 py-2 bg-[#111927] hover:bg-[#182438] text-slate-400 hover:text-slate-200 border border-[#1f2e47] rounded-xl text-xs transition-all"
              title="Reset to default baseline inventory"
            >
              <RefreshCw size={13} />
              <span>Reset Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7 RESOURCE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {(Object.keys(RESOURCE_CATEGORIES) as (keyof StateResourceProfile['resources'])[]).map((resKey) => {
          const category = RESOURCE_CATEGORIES[resKey];
          const summary = nationalSummary.summary[resKey];
          const activePercent = Math.round((summary.active / (summary.total || 1)) * 100);

          return (
            <div
              key={resKey}
              className="bg-[#090d16] border border-[#172338] hover:border-slate-700 p-4 rounded-xl shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="p-2 rounded-lg border"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: `${category.color}30`,
                    }}
                  >
                    {renderResourceIcon(resKey, 18)}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {activePercent}% Deployed
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {category.shortName}
                </h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">{summary.total.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 truncate">{category.unit.split(' ')[0]}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.round((summary.inReserve / summary.total) * 100)}%` }}
                    title={`Standby Reserve: ${summary.inReserve.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${activePercent}%` }}
                    title={`Active in Field: ${summary.active.toLocaleString()}`}
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${Math.round((summary.inMaintenance / summary.total) * 100)}%` }}
                    title={`Maintenance: ${summary.inMaintenance.toLocaleString()}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span className="text-emerald-400">Res: {formatNumber(summary.inReserve)}</span>
                  <span className="text-blue-400">Act: {formatNumber(summary.active)}</span>
                  <span className="text-amber-400">Maint: {formatNumber(summary.inMaintenance)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW TABS & FILTER BAR */}
      <div className="bg-[#090d16] border border-[#172338] p-4 rounded-xl shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b101d] border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>State Inventory Cards</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Detailed Manifest Table</span>
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dispatch'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send size={14} />
            <span>Inter-State Dispatch</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={14} />
            <span>Allocation Analytics</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search state, capital, depot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#070a12] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter size={13} className="text-slate-500" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-[#070a12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Regions</option>
              <option value="North">North India</option>
              <option value="South">South India</option>
              <option value="East">East India</option>
              <option value="West">West India</option>
              <option value="Central">Central India</option>
              <option value="Northeast">Northeast</option>
              <option value="Islands">Islands & UTs</option>
            </select>
          </div>

          {/* Hazard Risk Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-[#070a12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Disaster Profiles</option>
            <option value="Flood & Inundation">Flood & Inundation</option>
            <option value="Cyclone & Storm Surge">Cyclone & Storm Surge</option>
            <option value="Landslide & Flash Flood">Landslide & Mountain</option>
            <option value="Drought & Heatwave">Drought & Heatwave</option>
            <option value="Multi-Hazard">Multi-Hazard</option>
          </select>

          {/* Sort Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <ArrowUpDown size={13} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#070a12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="population">Sort: Population</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="waterTankers">Sort: Water Tankers</option>
              <option value="rationPackets">Sort: Ration Packets</option>
              <option value="floatingClinics">Sort: Floating Clinics</option>
              <option value="debrisMachinery">Sort: Heavy Machinery</option>
              <option value="emergencyGenerators">Sort: Generators</option>
              <option value="tarpTentKits">Sort: Tents & Tarps</option>
              <option value="waterMotorPumps">Sort: Dewatering Pumps</option>
            </select>
          </div>

          {/* Reset Reserves Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all state stockpiles and national reserves back to initial factory baselines?')) {
                resetInventory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1726] hover:bg-[#15233c] text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700/60 transition-colors"
            title="Reset reserves back to baseline values"
          >
            <RefreshCw size={12} />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* DISPATCH SUCCESS ALERT BANNER */}
      {dispatchSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
          <button onClick={() => setDispatchSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* DISPATCH ERROR ALERT BANNER */}
      {dispatchErrorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 text-red-300 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span>{dispatchErrorMsg}</span>
          </div>
          <button onClick={() => setDispatchErrorMsg(null)} className="text-red-400 hover:text-red-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: STATE INVENTORY CARD GRID */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredStates.length}</strong> of{' '}
              <strong className="text-white">{statesData.length}</strong> State &amp; UT Inventories
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Click any state card to inspect depot hubs, battalions &amp; deploy assets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map((state) => (
              <div
                key={state.id}
                onClick={() => setSelectedState(state)}
                className="bg-[#090d16] border border-[#172338] hover:border-blue-500/40 hover:bg-[#0c1322] p-5 rounded-2xl shadow-xl cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {state.stateName}
                        </h2>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {state.stateCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={11} className="text-red-400" />
                        <span>{state.capital}</span>
                        <span className="text-slate-600">·</span>
                        <Users size={11} className="text-blue-400" />
                        <span>{formatNumber(state.population)} pop</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        state.primaryDisasterRisk === 'Flood & Inundation'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : state.primaryDisasterRisk === 'Cyclone & Storm Surge'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : state.primaryDisasterRisk === 'Landslide & Flash Flood'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : state.primaryDisasterRisk === 'Drought & Heatwave'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      {state.primaryDisasterRisk}
                    </span>
                  </div>

                  {/* Distribution Rationale Snippet */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 my-2.5 leading-relaxed bg-[#060911] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-blue-400 font-semibold font-mono text-[10px]">LOGISTICS RATIONALE: </span>
                    {state.distributionRationale}
                  </p>

                  {/* 7 Resources Quick Grid */}
                  <div className="grid grid-cols-2 gap-1.5 my-3 text-[11px]">
                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('waterTankers', 13)}
                        <span>Water Tankers</span>
                      </div>
                      <span className="font-bold text-white font-mono">{state.resources.waterTankers.total.toLocaleString()}</span>
                    </div>

                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('rationPackets', 13)}
                        <span>Ration Packets</span>
                      </div>
                      <span className="font-bold text-amber-400 font-mono">{formatNumber(state.resources.rationPackets.total)}</span>
                    </div>

                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('floatingClinics', 13)}
                        <span>Boat Clinics</span>
                      </div>
                      <span className={`font-bold font-mono ${state.resources.floatingClinics.total > 0 ? 'text-pink-400' : 'text-slate-500'}`}>
                        {state.resources.floatingClinics.total} boats
                      </span>
                    </div>

                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('debrisMachinery', 13)}
                        <span>Heavy Mach.</span>
                      </div>
                      <span className="font-bold text-yellow-400 font-mono">{state.resources.debrisMachinery.total.toLocaleString()}</span>
                    </div>

                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('emergencyGenerators', 13)}
                        <span>Generators</span>
                      </div>
                      <span className="font-bold text-purple-400 font-mono">{state.resources.emergencyGenerators.total.toLocaleString()}</span>
                    </div>

                    <div className="bg-[#0b101c] p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {renderResourceIcon('tarpTentKits', 13)}
                        <span>Tents / Tarps</span>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono">{formatNumber(state.resources.tarpTentKits.total)}</span>
                    </div>
                  </div>

                  {/* Water Motor Pumps Highlight */}
                  <div className="bg-blue-950/20 border border-blue-800/30 p-2 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                      {renderResourceIcon('waterMotorPumps', 14)}
                      <span>Water Motor Pumps (Dewatering)</span>
                    </div>
                    <span className="font-black text-blue-400 font-mono">{state.resources.waterMotorPumps.total.toLocaleString()} units</span>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>{state.sdrfBattalions} SDRF Battalions</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Hub</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED MANIFEST TABLE */}
      {activeTab === 'table' && (
        <div className="bg-[#090d16] border border-[#172338] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-blue-400" />
              <span>Full State Relief Stockpile Manifest ({filteredStates.length} Records)</span>
            </h3>
            <span className="text-xs text-slate-400">Live operational &amp; standby reserve values</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070a12] text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">State / UT</th>
                  <th className="px-3 py-3 text-center">Hazard</th>
                  <th className="px-3 py-3 text-right">Water Tankers</th>
                  <th className="px-3 py-3 text-right">Dry Rations</th>
                  <th className="px-3 py-3 text-right">Floating Clinics</th>
                  <th className="px-3 py-3 text-right">Heavy Machinery</th>
                  <th className="px-3 py-3 text-right">DG Sets</th>
                  <th className="px-3 py-3 text-right">Tents / Tarps</th>
                  <th className="px-3 py-3 text-right">Dewatering Pumps</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStates.map((st) => (
                  <tr key={st.id} className="hover:bg-[#0d1424] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{st.stateName}</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                          {st.stateCode}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                        {st.capital} ({formatNumber(st.population)})
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 whitespace-nowrap">
                        {st.primaryDisasterRisk}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-white font-bold">{st.resources.waterTankers.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {st.resources.waterTankers.active} act
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-amber-400 font-bold">{formatNumber(st.resources.rationPackets.total)}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {formatNumber(st.resources.rationPackets.active)} act
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className={`font-bold ${st.resources.floatingClinics.total > 0 ? 'text-pink-400' : 'text-slate-600'}`}>
                        {st.resources.floatingClinics.total}
                      </span>
                      {st.resources.floatingClinics.total > 0 && (
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {st.resources.floatingClinics.active} act
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-yellow-400 font-bold">{st.resources.debrisMachinery.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {st.resources.debrisMachinery.active} act
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-purple-400 font-bold">{st.resources.emergencyGenerators.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {st.resources.emergencyGenerators.active} act
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-emerald-400 font-bold">{formatNumber(st.resources.tarpTentKits.total)}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {formatNumber(st.resources.tarpTentKits.active)} act
                      </span>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">
                      <span className="text-blue-400 font-bold">{st.resources.waterMotorPumps.total.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block font-sans">
                        {st.resources.waterMotorPumps.active} act
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedState(st)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INTER-STATE DISPATCH & MUTUAL AID SIMULATOR */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Control Card */}
          <div className="lg:col-span-1 bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <Send size={18} />
                <h3 className="font-bold text-sm text-slate-100">Inter-State Mutual Aid Dispatch</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Reallocate surge emergency equipment from surplus buffer states to active disaster ground zero.
              </p>

              <form onSubmit={handleExecuteDispatch} className="space-y-3.5">
                {/* Source State */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Source State (Dispatching Reserve):
                  </label>
                  <select
                    value={dispatchSource}
                    onChange={(e) => setDispatchSource(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {statesData.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.stateName} (Res: {s.resources[dispatchResource].inReserve.toLocaleString()} {RESOURCE_CATEGORIES[dispatchResource].shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target State */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Target Disaster State (Ground Zero):
                  </label>
                  <select
                    value={dispatchTarget}
                    onChange={(e) => setDispatchTarget(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {statesData.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.stateName} ({s.primaryDisasterRisk})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resource Category */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Resource Item:</label>
                  <select
                    value={dispatchResource}
                    onChange={(e) => setDispatchResource(e.target.value as keyof StateResourceProfile['resources'])}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {(Object.keys(RESOURCE_CATEGORIES) as (keyof StateResourceProfile['resources'])[]).map((k) => (
                      <option key={k} value={k}>
                        {RESOURCE_CATEGORIES[k].name} ({RESOURCE_CATEGORIES[k].unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                    <span>Quantity to Mobilize:</span>
                    <span className="text-blue-400 font-mono font-bold">{dispatchQty.toLocaleString()} units</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Transit Route */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Transit Corridor Mode:</label>
                  <select
                    value={dispatchMode}
                    onChange={(e) => setDispatchMode(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Green Road Corridor (SDRF Convoy)">Green Road Corridor (SDRF Convoy)</option>
                    <option value="Express Freight Rail Link (Indian Railways)">Express Freight Rail Link</option>
                    <option value="IAF Heavy Airlift (C-17 / IL-76)">IAF Heavy Airlift (C-17 / IL-76)</option>
                    <option value="Inland Waterway Rail Express">Inland Waterway Rail Express</option>
                  </select>
                </div>

                {dispatchErrorMsg && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-red-400" />
                    <span>{dispatchErrorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Authorize &amp; Mobilize Convoy</span>
                </button>
              </form>
            </div>

            <div className="mt-4 p-3 bg-blue-950/20 border border-blue-800/30 rounded-xl text-[11px] text-slate-400">
              <span className="text-blue-400 font-bold block mb-0.5">NATIONAL PROTOCOL:</span>
              Mobilization triggers instantaneous inventory adjustments across regional state relief caches with GPS telemetry tracking.
            </div>
          </div>

          {/* Active Dispatches Feed & Timeline */}
          <div className="lg:col-span-2 bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-100">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="font-bold text-sm">Active Interstate Mobilization Log</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">{dispatchLogs.length} Convoys Active</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-[#070a12] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {log.id}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {log.sourceState}
                        </span>
                        <ArrowRight size={12} className="text-slate-500" />
                        <span className="text-xs font-bold text-emerald-400">
                          {log.targetState}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        {renderResourceIcon(log.resourceKey, 13)}
                        <span className="font-semibold text-white">
                          {log.quantity.toLocaleString()} {RESOURCE_CATEGORIES[log.resourceKey].shortName}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{log.transitMode}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col sm:items-end justify-between items-center text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          log.status === 'Arrived'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono mt-1">
                        ETA: ~{log.etaHours} hrs ({log.timestamp})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>National Disaster Response Force (NDRF) Air &amp; Rail Coordination Cell</span>
              <span className="text-emerald-400 font-mono font-semibold">Live Telemetry Active</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALLOCATION ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Floating Medical Clinics Distribution (Riverine & Delta States) */}
          <div className="bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Ship size={16} className="text-pink-400" />
                <span>Floating Medical Clinics Allocation (River Island &amp; Delta States)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted distribution of motorized riverboat clinics across high-vulnerability floodplains and mangrove islands.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floatingClinicsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b101d', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Active" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Reserve" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: High Capacity Equipment (Pumps vs Machinery vs Generators) */}
          <div className="bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" />
                <span>Heavy Equipment Fleet: Pumps vs Machinery vs Gensets (Top 10 States)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of high-discharge pumps, heavy debris clearers, and emergency generators.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b101d', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Pumps" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Machinery" fill="#eab308" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Generators" fill="#a855f7" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Disaster Hazard Risk Distribution */}
          <div className="bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span>Primary Disaster Risk Breakdown (States &amp; UTs)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Categorization governing state baseline resource mobilization algorithms.
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hazardPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {hazardPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b101d', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-World Logistics Insights Box */}
          <div className="bg-[#090d16] border border-[#172338] p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Sparkles size={16} />
                <h3 className="text-sm font-bold text-slate-100">Realistic Distribution Mechanics</h3>
              </div>
              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded-xl">
                  <strong className="text-pink-400 block mb-0.5">Floating Clinics Rationale:</strong>
                  Pre-positioned primarily in the Brahmaputra chars (Assam - 38 boats), Sundarbans mangrove delta (WB - 32 boats), Kosi floodplain diaras (Bihar - 26 boats), Kuttanad backwaters (Kerala - 22 boats), and Mahanadi/Chilika (Odisha - 18 boats).
                </div>
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded-xl">
                  <strong className="text-cyan-400 block mb-0.5">Water Tankers &amp; Dewatering Pumps:</strong>
                  Maharashtra, Rajasthan, and Tamil Nadu maintain the largest drinking water tanker fleets (2,400 - 3,450 units) to balance drought and storm surges. Mumbai BMC and Chennai GCC lead dewatering pump reserves (3,200 - 3,800 pumps).
                </div>
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded-xl">
                  <strong className="text-yellow-400 block mb-0.5">Heavy Debris Machinery:</strong>
                  Uttarakhand &amp; Himachal Pradesh feature the highest machinery density per capita to clear continuous Char Dham and Himalayan highway landslides.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              National Disaster Management Guidelines &amp; SDRF Reserve Regulations Compliant
            </div>
          </div>
        </div>
      )}

      {/* STATE DRILLDOWN DRAWER / MODAL */}
      {selectedState && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#090d16] border border-[#172338] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative scrollbar-thin scrollbar-thumb-slate-800">
            {/* Close Button */}
            <button
              onClick={() => setSelectedState(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xl font-mono">
                {selectedState.stateCode}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-white">{selectedState.stateName}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                    {selectedState.primaryDisasterRisk}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Capital: <strong className="text-slate-200">{selectedState.capital}</strong></span>
                  <span>·</span>
                  <span>Population: <strong className="text-slate-200">{selectedState.population.toLocaleString()}</strong></span>
                  <span>·</span>
                  <span>Region: <strong className="text-slate-200">{selectedState.region}</strong></span>
                </p>
              </div>
            </div>

            {/* State Distribution Rationale */}
            <div className="mb-6 p-4 bg-[#070a12] border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
                <Info size={14} />
                <span>Geographic &amp; Vulnerability Allocation Rationale</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedState.distributionRationale}</p>
            </div>

            {/* 7 Lifeline Resources Comprehensive Breakdown */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                7 Disaster Relief Resource Stockpiles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(RESOURCE_CATEGORIES) as (keyof StateResourceProfile['resources'])[]).map((key) => {
                  const cat = RESOURCE_CATEGORIES[key];
                  const res = selectedState.resources[key];
                  const activePercent = Math.round((res.active / (res.total || 1)) * 100);

                  return (
                    <div key={key} className="p-3.5 bg-[#070a12] border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderResourceIcon(key, 16)}
                          <span className="text-xs font-bold text-white">{cat.name}</span>
                        </div>
                        <span className="text-xs font-mono font-black text-white">{res.total.toLocaleString()}</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.round((res.inReserve / (res.total || 1)) * 100)}%` }}
                          title={`Reserve: ${res.inReserve}`}
                        />
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${activePercent}%` }}
                          title={`Active: ${res.active}`}
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${Math.round((res.inMaintenance / (res.total || 1)) * 100)}%` }}
                          title={`Maint: ${res.inMaintenance}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="text-emerald-400">Standby: {res.inReserve.toLocaleString()}</span>
                        <span className="text-blue-400">Deployed: {res.active.toLocaleString()}</span>
                        <span className="text-amber-400">Maint: {res.inMaintenance}</span>
                      </div>

                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800/60">
                        {cat.standardCapacityPerUnit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logistics Depots & SDRF Battalions */}
            <div className="mb-6 p-4 bg-[#070a12] border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Building2 size={14} className="text-purple-400" />
                  <span>Key Storage Depots &amp; SDRF Logistics Bases</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {selectedState.sdrfBattalions} SDRF Battalions
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-[#090d16] border border-slate-800/80 rounded-lg text-xs">
                  <span className="text-blue-400 font-bold block">Primary Central Depot:</span>
                  <span className="text-slate-300">{selectedState.primaryDepotLocation}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {selectedState.depots.map((dep, idx) => (
                    <div key={idx} className="p-2.5 bg-[#090d16] border border-slate-800/80 rounded-lg text-xs">
                      <p className="font-bold text-white">{dep.name}</p>
                      <p className="text-[11px] text-slate-400">District: {dep.district}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Lead: {dep.contactLead}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setDispatchSource(selectedState.id);
                  setActiveTab('dispatch');
                  setSelectedState(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                <Send size={14} />
                <span>Initiate Dispatch from {selectedState.stateName}</span>
              </button>
              <button
                onClick={() => setSelectedState(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
