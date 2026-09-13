import { DisasterParameters, DistrictData, ZoneScoreCalculation, computeZoneVulnerability } from './vulnerabilityMath';
import { DispatchMission } from '../types/dispatch';
import { STATE_RESOURCE_DATA, StateResourceProfile, getNationalResourceSummary } from '../data/stateResourceData';
import { getDistrictBaseline, canonicalStateName } from '../data/districtProfiles';

/**
 * Counts user-dispatched quantities strictly matching specified resource keywords/types.
 * If user hasn't dispatched anything, returns 0.
 */
function countDispatchedUnits(missions: DispatchMission[], aliases: string[]): number {
  if (!missions || missions.length === 0) return 0;
  let sum = 0;
  for (const mission of missions) {
    if (mission.items && mission.items.length > 0) {
      for (const item of mission.items) {
        const key = `${item.typeId || ''} ${item.unitType || ''} ${item.name || ''} ${item.shortName || ''}`.toLowerCase();
        if (aliases.some((a) => key.includes(a.toLowerCase()))) {
          sum += Number(item.quantity) || 0;
        }
      }
    } else if (mission.resourceType) {
      const key = `${mission.resourceType || ''} ${mission.unitLabel || ''}`.toLowerCase();
      if (aliases.some((a) => key.includes(a.toLowerCase()))) {
        sum += Number(mission.quantity) || 0;
      }
    }
  }
  return sum;
}

export interface ReportAreaRanking {
  rank: number;
  district: string;
  state: string;
  vulnerabilityScore: number; // 0.0 to 10.0 (or 0-100 divided by 10)
  priorityLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  impactRadiusKm: number;
}

export interface AllocatedResourceItem {
  resourceType: string;
  required: number;
  dispatched: number;
  remainingNationally: number;
  requiredBarPercent: number; // 0 to 100 for visual bar
  dispatchedBarPercent: number; // 0 to 100 for visual bar
}

export interface SimulationReportData {
  simulationId: string;
  formattedDate: string;
  simulatedEvent: string;
  referenceArea: string;
  disclaimer: string;
  stateFilter: string;
  stateName: string;
  stateVulnerabilityScore: number;
  stateRiskTier: string;
  totalAffectedZonesCount: number;
  availableStates: Array<{ id: string; name: string; count: number }>;
  executiveSummary: {
    affectedPopulation: number;
    affectedPopulationFormatted: string;
    totalDamageUSD: string;
    totalDamageINR: string;
    peakPriorityCount: number;
    summaryBulletText: string[];
    compositeVulnerabilityScore?: number;
    riskTier?: string;
  };
  priorityRankings: ReportAreaRanking[];
  allocatedResources: AllocatedResourceItem[];
  dispatchMissions: DispatchMission[];
  generationTimestamp: string;
}

// Fallback top districts if geojson is still loading or for Odisha / Bihar presets
const ODISHA_PRESET_DISTRICTS: ReportAreaRanking[] = [
  { rank: 1, district: 'Jagatsinghpur', state: 'Odisha', vulnerabilityScore: 87.0, priorityLevel: 'Critical', impactRadiusKm: 30.0 },
  { rank: 2, district: 'Kendrapara', state: 'Odisha', vulnerabilityScore: 84.0, priorityLevel: 'Critical', impactRadiusKm: 30.0 },
  { rank: 3, district: 'Puri', state: 'Odisha', vulnerabilityScore: 81.0, priorityLevel: 'High', impactRadiusKm: 20.0 },
  { rank: 4, district: 'Bhadrak', state: 'Odisha', vulnerabilityScore: 70.0, priorityLevel: 'Critical', impactRadiusKm: 20.0 },
  { rank: 5, district: 'Balasore', state: 'Odisha', vulnerabilityScore: 76.0, priorityLevel: 'Critical', impactRadiusKm: 19.0 },
  { rank: 6, district: 'Jajpur', state: 'Odisha', vulnerabilityScore: 68.0, priorityLevel: 'High', impactRadiusKm: 24.0 },
  { rank: 7, district: 'Cuttack', state: 'Odisha', vulnerabilityScore: 65.0, priorityLevel: 'High', impactRadiusKm: 28.0 },
  { rank: 8, district: 'Khordha', state: 'Odisha', vulnerabilityScore: 61.0, priorityLevel: 'Moderate', impactRadiusKm: 35.0 },
  { rank: 9, district: 'Ganjam', state: 'Odisha', vulnerabilityScore: 58.0, priorityLevel: 'Moderate', impactRadiusKm: 42.0 },
  { rank: 10, district: 'Mayurbhanj', state: 'Odisha', vulnerabilityScore: 52.0, priorityLevel: 'Moderate', impactRadiusKm: 50.0 },
];

const BIHAR_PRESET_DISTRICTS: ReportAreaRanking[] = [
  { rank: 1, district: 'Supaul', state: 'Bihar', vulnerabilityScore: 89.0, priorityLevel: 'Critical', impactRadiusKm: 28.5 },
  { rank: 2, district: 'Saharsa', state: 'Bihar', vulnerabilityScore: 85.0, priorityLevel: 'Critical', impactRadiusKm: 32.0 },
  { rank: 3, district: 'Madhepura', state: 'Bihar', vulnerabilityScore: 82.0, priorityLevel: 'High', impactRadiusKm: 25.0 },
  { rank: 4, district: 'Khagaria', state: 'Bihar', vulnerabilityScore: 78.0, priorityLevel: 'Critical', impactRadiusKm: 35.0 },
  { rank: 5, district: 'Darbhanga', state: 'Bihar', vulnerabilityScore: 74.0, priorityLevel: 'High', impactRadiusKm: 42.0 },
  { rank: 6, district: 'Muzaffarpur', state: 'Bihar', vulnerabilityScore: 71.0, priorityLevel: 'High', impactRadiusKm: 38.0 },
  { rank: 7, district: 'Samastipur', state: 'Bihar', vulnerabilityScore: 68.0, priorityLevel: 'High', impactRadiusKm: 45.0 },
  { rank: 8, district: 'Begusarai', state: 'Bihar', vulnerabilityScore: 64.0, priorityLevel: 'Moderate', impactRadiusKm: 48.0 },
  { rank: 9, district: 'Bhagalpur', state: 'Bihar', vulnerabilityScore: 61.0, priorityLevel: 'Moderate', impactRadiusKm: 52.0 },
  { rank: 10, district: 'Katihar', state: 'Bihar', vulnerabilityScore: 59.0, priorityLevel: 'Moderate', impactRadiusKm: 55.0 },
  { rank: 11, district: 'Purnia', state: 'Bihar', vulnerabilityScore: 56.0, priorityLevel: 'Moderate', impactRadiusKm: 58.0 },
  { rank: 12, district: 'Sitamarhi', state: 'Bihar', vulnerabilityScore: 54.0, priorityLevel: 'Moderate', impactRadiusKm: 60.0 },
];

/**
 * Dynamically computes all metrics, table rows, and resource balances for the PDF Report
 * Supports statewise report data filtering or full national overview
 * Includes ALL affected zones dynamically without hard limits
 */
export function generateSimulationReport(
  activeParams: DisasterParameters,
  allDistricts: DistrictData[] = [],
  dispatches: DispatchMission[] = [],
  selectedStateFilter: string = 'all',
  statesData: StateResourceProfile[] = STATE_RESOURCE_DATA
): SimulationReportData {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // 1. Simulated Event Name
  let simulatedEvent = activeParams.title;
  if (activeParams.type === 'cyclone') {
    simulatedEvent = 'Major Cyclone (Category 4 Storm Surge)';
  } else if (activeParams.type === 'flood') {
    simulatedEvent = 'Catastrophic Riverine Inundation (Level 3)';
  } else if (activeParams.type === 'heatwave') {
    simulatedEvent = 'Severe Thermal Heatwave (Tier 3 Peak)';
  } else if (activeParams.type === 'earthquake') {
    simulatedEvent = 'High-Intensity Seismic Shock (Magnitude 7.2)';
  } else if (activeParams.type === 'landslide') {
    simulatedEvent = 'High-Slope Debris Torrent & Landslide';
  }

  // 2. Score ALL districts and compute impacted list across all states
  const allImpactedDistricts: Array<{
    district: string;
    state: string;
    score: number;
    distKm: number;
    population: number;
  }> = [];

  const stateImpactCounts = new Map<string, { id: string; name: string; count: number }>();

  if (allDistricts && allDistricts.length > 0) {
    for (const dist of allDistricts) {
      const calc = computeZoneVulnerability(dist, activeParams);
      if (calc.isWithinImpactRadius && calc.finalScore > 0) {
        allImpactedDistricts.push({
          district: dist.name,
          state: dist.state,
          score: calc.finalScore,
          distKm: calc.distanceKm,
          population: dist.population || 1800000,
        });

        // Group by state
        const stateKey = dist.state.toLowerCase();
        const existing = stateImpactCounts.get(stateKey) || {
          id: stateKey,
          name: dist.state,
          count: 0,
        };
        existing.count += 1;
        stateImpactCounts.set(stateKey, existing);
      }
    }
  }

  // Build available states list for dropdown
  const availableStates: Array<{ id: string; name: string; count: number }> = [
    {
      id: 'all',
      name: 'All States (National Grid)',
      count: allImpactedDistricts.length || 10,
    },
    ...Array.from(stateImpactCounts.values()).sort((a, b) => b.count - a.count),
  ];

  // If no states found in live calculation, ensure presets exist
  if (availableStates.length <= 1) {
    availableStates.push(
      { id: 'bihar', name: 'Bihar', count: 12 },
      { id: 'odisha', name: 'Odisha', count: 10 },
      { id: 'assam', name: 'Assam', count: 8 },
      { id: 'maharashtra', name: 'Maharashtra', count: 7 }
    );
  }

  // 3. Filter impacted districts and dispatches based on selectedStateFilter
  const isAllStates = !selectedStateFilter || selectedStateFilter === 'all';
  let targetDistricts = isAllStates
    ? allImpactedDistricts
    : allImpactedDistricts.filter(
        (d) =>
          d.state.toLowerCase() === selectedStateFilter.toLowerCase() ||
          d.state.toLowerCase().includes(selectedStateFilter.toLowerCase())
      );

  // Fallbacks if data is still loading or specific state requested
  if (targetDistricts.length === 0) {
    if (selectedStateFilter.toLowerCase().includes('odisha') || activeParams.type === 'cyclone') {
      targetDistricts = ODISHA_PRESET_DISTRICTS.map((d) => ({
        district: d.district,
        state: d.state,
        score: d.vulnerabilityScore,
        distKm: d.impactRadiusKm,
        population: 1850000,
      }));
    } else {
      targetDistricts = BIHAR_PRESET_DISTRICTS.map((d) => ({
        district: d.district,
        state: d.state,
        score: d.vulnerabilityScore,
        distKm: d.impactRadiusKm,
        population: 2100000,
      }));
    }
  }

  // Sort ALL target districts by vulnerability score descending (NO SLICING!)
  targetDistricts.sort((a, b) => b.score - a.score);

  const rankedDistricts: ReportAreaRanking[] = targetDistricts.map((d, index) => {
    const normalizedScore = Number((d.score > 10 ? d.score : d.score * 10).toFixed(1));
    const priorityLevel: 'Critical' | 'High' | 'Moderate' | 'Low' =
      normalizedScore >= 78 ? 'Critical' : normalizedScore >= 65 ? 'High' : normalizedScore >= 45 ? 'Moderate' : 'Low';
    const impactRadiusKm = Number(Math.max(10, Math.min(75, d.distKm)).toFixed(1));

    return {
      rank: index + 1,
      district: d.district,
      state: d.state,
      vulnerabilityScore: normalizedScore,
      priorityLevel,
      impactRadiusKm,
    };
  });

  const totalAffectedPopulation = targetDistricts.reduce((acc, d) => acc + d.population, 0) || 4537000;

  // 4. State Name and Reference Area
  let stateName = 'All States (National Grid)';
  if (!isAllStates) {
    const foundState = availableStates.find((s) => s.id === selectedStateFilter);
    stateName = foundState ? foundState.name : canonicalStateName(selectedStateFilter);
  }

  let referenceArea = isAllStates
    ? `${activeParams.epicenterName} (Multi-State Strategic Corridor)`
    : `State of ${stateName} • Tactical Crisis Operations`;

  // 5. State Composite Vulnerability Score (out of 100)
  const peakScore = rankedDistricts.length > 0 ? rankedDistricts[0].vulnerabilityScore : 85.0;
  const avgScore = rankedDistricts.length > 0
    ? Number((rankedDistricts.reduce((sum, d) => sum + d.vulnerabilityScore, 0) / rankedDistricts.length).toFixed(1))
    : 72.0;

  const stateRiskTier = peakScore >= 82 ? 'Critical' : peakScore >= 68 ? 'Severe' : peakScore >= 50 ? 'High' : 'Moderate';

  // 6. Dynamic Simulation ID (Urbn Vuln Rebrand)
  const stateCode = isAllStates ? 'IND' : selectedStateFilter.slice(0, 3).toUpperCase();
  const simulationId = `URBN-VULN-${stateCode}-${year}-${month}-${day}-42`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedDate = `${monthNames[now.getMonth()]} ${now.getDate()}, ${year}`;

  // 7. Dynamic Total Simulated Damage Value (Scaled to state vs national)
  const baseDamageMultiplier = activeParams.type === 'cyclone' ? 15850 : activeParams.type === 'flood' ? 12400 : 8900;
  const rawDamageUSD = (totalAffectedPopulation * baseDamageMultiplier * (activeParams.severityMultiplier || 1.25)) / 1e9;
  const totalDamageUSD = `$${rawDamageUSD.toFixed(4)}Bn`;
  const totalDamageINR = `₹${Math.round(rawDamageUSD * 83.5).toLocaleString('en-IN')} Cr`;

  // Peak priority count in this scope
  const peakPriorityCount = rankedDistricts.filter(
    (d) => d.priorityLevel === 'Critical' || d.priorityLevel === 'High'
  ).length;

  // 8. Filtered Dispatches
  const filteredDispatches = isAllStates
    ? dispatches
    : dispatches.filter(
        (d) =>
          d.stateId?.toLowerCase() === selectedStateFilter.toLowerCase() ||
          d.originDepot.toLowerCase().includes(selectedStateFilter.toLowerCase()) ||
          rankedDistricts.some((rd) => rd.district.toLowerCase() === d.targetDistrict.toLowerCase())
      );

  // 9. Allocated Resources Summary (State-specific or National)
  const stateProfile = !isAllStates
    ? statesData.find(
        (s) =>
          s.id.toLowerCase() === selectedStateFilter.toLowerCase() ||
          s.stateName.toLowerCase() === selectedStateFilter.toLowerCase()
      )
    : null;

  let allocatedResources: AllocatedResourceItem[] = [];

  if (stateProfile) {
    // Exact State-Level Resources
    const res = stateProfile.resources;
    const popRatio = Math.max(0.2, totalAffectedPopulation / (stateProfile.population || 100000000));

    // Water Tankers: count ONLY user dispatches
    const wtTotal = res.waterTankers.total;
    const wtReq = Math.min(wtTotal, Math.max(25, Math.round(wtTotal * popRatio * 1.25)));
    const wtDisp = countDispatchedUnits(filteredDispatches, ['watertanker', 'tanker', 'bowser', 'water']);
    const wtRem = Math.max(0, res.waterTankers.inReserve - wtDisp);

    // Ration Packets
    const rpTotal = res.rationPackets.total;
    const rpReq = Math.min(rpTotal, Math.max(2500, Math.round(rpTotal * popRatio * 1.4)));
    const rpDisp = countDispatchedUnits(filteredDispatches, ['rationpacket', 'ration', 'food']);
    const rpRem = Math.max(0, res.rationPackets.inReserve - rpDisp);

    // Floating Clinics / Boats
    const fcTotal = res.floatingClinics.total;
    const fcReq = Math.min(fcTotal, Math.max(5, Math.round((fcTotal || 25) * popRatio * 1.5)));
    const fcDisp = countDispatchedUnits(filteredDispatches, ['floatingclinic', 'motorboat', 'boat', 'gemini']);
    const fcRem = Math.max(0, res.floatingClinics.inReserve - fcDisp);

    // Heavy Machinery
    const dmTotal = res.debrisMachinery.total;
    const dmReq = Math.min(dmTotal, Math.max(10, Math.round(dmTotal * popRatio * 1.1)));
    const dmDisp = countDispatchedUnits(filteredDispatches, ['debrismachinery', 'machinery', 'excavator', 'jcb']);
    const dmRem = Math.max(0, res.debrisMachinery.inReserve - dmDisp);

    // Emergency Generators
    const egTotal = res.emergencyGenerators.total;
    const egReq = Math.min(egTotal, Math.max(15, Math.round(egTotal * popRatio * 1.3)));
    const egDisp = countDispatchedUnits(filteredDispatches, ['emergencygenerator', 'generator', 'dg']);
    const egRem = Math.max(0, res.emergencyGenerators.inReserve - egDisp);

    // Weatherproof Shelter Tents
    const ttTotal = res.tarpTentKits.total;
    const ttReq = Math.min(ttTotal, Math.max(300, Math.round(ttTotal * popRatio * 1.4)));
    const ttDisp = countDispatchedUnits(filteredDispatches, ['tarptentkit', 'tent', 'tarp', 'shelter']);
    const ttRem = Math.max(0, res.tarpTentKits.inReserve - ttDisp);

    // High Capacity Trash Pumps
    const wpTotal = res.waterMotorPumps.total;
    const wpReq = Math.min(wpTotal, Math.max(20, Math.round(wpTotal * popRatio * 1.6)));
    const wpDisp = countDispatchedUnits(filteredDispatches, ['watermotorpump', 'pump', 'dewatering']);
    const wpRem = Math.max(0, res.waterMotorPumps.inReserve - wpDisp);

    allocatedResources = [
      {
        resourceType: 'Clean Drinking Water Tankers',
        required: wtReq,
        dispatched: wtDisp,
        remainingNationally: wtRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wtReq / wtTotal) * 100))),
        dispatchedBarPercent: wtReq > 0 && wtDisp > 0 ? Math.min(100, Math.round((wtDisp / wtReq) * 100)) : 0,
      },
      {
        resourceType: 'Dry Ration Food Packets',
        required: rpReq,
        dispatched: rpDisp,
        remainingNationally: rpRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((rpReq / rpTotal) * 100))),
        dispatchedBarPercent: rpReq > 0 && rpDisp > 0 ? Math.min(100, Math.round((rpDisp / rpReq) * 100)) : 0,
      },
      {
        resourceType: 'Floating Clinics & Rescue Boats',
        required: fcReq,
        dispatched: fcDisp,
        remainingNationally: fcRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((fcReq / fcTotal) * 100))),
        dispatchedBarPercent: fcReq > 0 && fcDisp > 0 ? Math.min(100, Math.round((fcDisp / fcReq) * 100)) : 0,
      },
      {
        resourceType: 'Heavy Debris Clearing Equipment',
        required: dmReq,
        dispatched: dmDisp,
        remainingNationally: dmRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((dmReq / dmTotal) * 100))),
        dispatchedBarPercent: dmReq > 0 && dmDisp > 0 ? Math.min(100, Math.round((dmDisp / dmReq) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Backup Generators',
        required: egReq,
        dispatched: egDisp,
        remainingNationally: egRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((egReq / egTotal) * 100))),
        dispatchedBarPercent: egReq > 0 && egDisp > 0 ? Math.min(100, Math.round((egDisp / egReq) * 100)) : 0,
      },
      {
        resourceType: 'High-Strength Weatherproof Tents',
        required: ttReq,
        dispatched: ttDisp,
        remainingNationally: ttRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ttReq / ttTotal) * 100))),
        dispatchedBarPercent: ttReq > 0 && ttDisp > 0 ? Math.min(100, Math.round((ttDisp / ttReq) * 100)) : 0,
      },
      {
        resourceType: 'High-Capacity Dewatering Pumps',
        required: wpReq,
        dispatched: wpDisp,
        remainingNationally: wpRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wpReq / wpTotal) * 100))),
        dispatchedBarPercent: wpReq > 0 && wpDisp > 0 ? Math.min(100, Math.round((wpDisp / wpReq) * 100)) : 0,
      },
    ];
  } else {
    // Dynamic Live National Resource Grid
    const natSummary = getNationalResourceSummary(statesData);

    // Strictly count user-dispatched assets
    const medicalDispatched = countDispatchedUnits(filteredDispatches, ['ambulance', 'als', 'medical', 'trauma']);
    const waterBowsersDispatched = countDispatchedUnits(filteredDispatches, ['watertanker', 'tanker', 'bowser', 'water']);
    const boatsDispatched = countDispatchedUnits(filteredDispatches, ['motorboat', 'boat', 'gemini', 'floatingclinic']);
    const sheltersDispatched = countDispatchedUnits(filteredDispatches, ['tarptentkit', 'tent', 'tarp', 'shelter']);
    const ndrfDispatched = countDispatchedUnits(filteredDispatches, ['fireengine', 'policeunit', 'militaryhelicopter', 'fire', 'police', 'helicopter', 'ndrf', 'sdrf']);

    // Dynamic Live National Reserves: decrease in real time as user dispatches
    const medicalTotal = 50000;
    const medicalRemaining = Math.max(0, medicalTotal - medicalDispatched);

    const waterBowsersTotal = natSummary.summary.waterTankers.total || 25000;
    const waterBowsersRemaining = Math.max(0, (natSummary.summary.waterTankers.inReserve || 12000) - waterBowsersDispatched);

    const boatsTotal = 1500;
    const boatsRemaining = Math.max(0, boatsTotal - boatsDispatched);

    const sheltersTotal = natSummary.summary.tarpTentKits.total || 150000;
    const sheltersRemaining = Math.max(0, (natSummary.summary.tarpTentKits.inReserve || 75000) - sheltersDispatched);

    const ndrfTotal = natSummary.totalSDRFBattalions || 150;
    const ndrfRemaining = Math.max(0, ndrfTotal - ndrfDispatched);

    // Requirement estimation based on simulated disaster
    const baseMedicalRequired = Math.round((totalAffectedPopulation / 907) / 100) * 100;
    const medicalRequired = Math.max(3500, baseMedicalRequired || 5000);
    const boatsRequired = activeParams.type === 'heatwave' ? 30 : 220;
    const sheltersRequired = Math.max(800, Math.round(totalAffectedPopulation / 4000));
    const ndrfRequired = 28;
    const waterBowsersRequired = Math.max(250, Math.round(totalAffectedPopulation / 18000));

    allocatedResources = [
      {
        resourceType: 'Advanced Life Support & Trauma Kits',
        required: medicalRequired,
        dispatched: medicalDispatched,
        remainingNationally: medicalRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((medicalRequired / 6000) * 100))),
        dispatchedBarPercent: medicalRequired > 0 && medicalDispatched > 0 ? Math.min(100, Math.round((medicalDispatched / medicalRequired) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Potable Water Bowsers',
        required: waterBowsersRequired,
        dispatched: waterBowsersDispatched,
        remainingNationally: waterBowsersRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((waterBowsersRequired / 500) * 100))),
        dispatchedBarPercent: waterBowsersRequired > 0 && waterBowsersDispatched > 0 ? Math.min(100, Math.round((waterBowsersDispatched / waterBowsersRequired) * 100)) : 0,
      },
      {
        resourceType: 'Inflatable Gemini Rescue Boats',
        required: boatsRequired,
        dispatched: boatsDispatched,
        remainingNationally: boatsRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((boatsRequired / 300) * 100))),
        dispatchedBarPercent: boatsRequired > 0 && boatsDispatched > 0 ? Math.min(100, Math.round((boatsDispatched / boatsRequired) * 100)) : 0,
      },
      {
        resourceType: 'Weatherproof Relief Shelters',
        required: sheltersRequired,
        dispatched: sheltersDispatched,
        remainingNationally: sheltersRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((sheltersRequired / 1500) * 100))),
        dispatchedBarPercent: sheltersRequired > 0 && sheltersDispatched > 0 ? Math.min(100, Math.round((sheltersDispatched / sheltersRequired) * 100)) : 0,
      },
      {
        resourceType: 'NDRF & SDRF Tactical Battalions',
        required: ndrfRequired,
        dispatched: ndrfDispatched,
        remainingNationally: ndrfRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ndrfRequired / 35) * 100))),
        dispatchedBarPercent: ndrfRequired > 0 && ndrfDispatched > 0 ? Math.min(100, Math.round((ndrfDispatched / ndrfRequired) * 100)) : 0,
      },
    ];
  }

  // 10. Summary Bullet Points
  const summaryBulletText = isAllStates
    ? [
        `1. National Affected Population Estimation: ${totalAffectedPopulation.toLocaleString('en-US')} citizens across ${rankedDistricts.length} impacted districts in ${availableStates.length - 1} states`,
        `2. Cumulative Simulated Damage Value: ${totalDamageINR} (${totalDamageUSD}) aggregate economic & infrastructure loss`,
        `3. Tactical Priority Hotspots: ${peakPriorityCount} critical/high priority zones requiring urgent road & air logistics`,
      ]
    : [
        `1. State of ${stateName} Affected Population: ${totalAffectedPopulation.toLocaleString('en-US')} residents across ${rankedDistricts.length} impacted districts`,
        `2. State Simulated Damage Assessment: ${totalDamageINR} (${totalDamageUSD}) structural & agricultural loss`,
        `3. State Tactical Crisis Status: ${peakPriorityCount} critical/high priority zones • Vulnerability Index: ${peakScore}/100 (${stateRiskTier})`,
      ];

  return {
    simulationId,
    formattedDate,
    simulatedEvent,
    referenceArea,
    disclaimer: 'URBN VULN • OFFICIAL DISASTER RESPONSE & TACTICAL LOGISTICS SIMULATION DIRECTIVE — FOR STRATEGIC & OPERATIONAL USE ONLY',
    stateFilter: selectedStateFilter,
    stateName,
    stateVulnerabilityScore: peakScore,
    stateRiskTier,
    totalAffectedZonesCount: rankedDistricts.length,
    availableStates,
    executiveSummary: {
      affectedPopulation: totalAffectedPopulation,
      affectedPopulationFormatted: totalAffectedPopulation.toLocaleString('en-US'),
      totalDamageUSD,
      totalDamageINR,
      peakPriorityCount,
      summaryBulletText,
      compositeVulnerabilityScore: peakScore,
      riskTier: stateRiskTier,
    },
    priorityRankings: rankedDistricts,
    allocatedResources,
    dispatchMissions: filteredDispatches,
    generationTimestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
