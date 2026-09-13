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

  // Fallbacks ONLY if geospatial data is completely empty (initial cold start before map geojson load)
  if (targetDistricts.length === 0 && (!allDistricts || allDistricts.length === 0)) {
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

  // 3. Prepare, normalize, and sort ALL target districts strictly by vulnerability score descending (High to Low)
  const mappedDistricts = targetDistricts.map((d) => {
    const rawScore = typeof d.score === 'number' ? d.score : 0;
    const finalScore = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));
    const priorityLevel: 'Critical' | 'High' | 'Moderate' | 'Low' =
      finalScore >= 80 ? 'Critical' : finalScore >= 65 ? 'High' : finalScore >= 45 ? 'Moderate' : 'Low';
    const impactRadiusKm = Number(Math.max(10, Math.min(75, d.distKm || 30)).toFixed(1));

    return {
      district: d.district,
      state: d.state,
      vulnerabilityScore: finalScore,
      priorityLevel,
      impactRadiusKm,
    };
  });

  // Strict descending sort by vulnerabilityScore (from highest 100.0 down to lowest 0.0)
  mappedDistricts.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);

  // Assign 1-based sequential rank
  const rankedDistricts: ReportAreaRanking[] = mappedDistricts.map((d, index) => ({
    rank: index + 1,
    ...d,
  }));

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

  // 9. Allocated Resources Summary (All 11 Dispatchable Tactical Resources)
  const stateProfile = !isAllStates
    ? statesData.find(
        (s) =>
          s.id.toLowerCase() === selectedStateFilter.toLowerCase() ||
          s.stateName.toLowerCase() === selectedStateFilter.toLowerCase()
      )
    : null;

  let allocatedResources: AllocatedResourceItem[] = [];

  if (stateProfile) {
    // Exact State-Level Resources for all 11 dispatchable asset types
    const res = stateProfile.resources;
    const popRatio = Math.max(0.2, totalAffectedPopulation / (stateProfile.population || 100000000));

    // 1. ALS Ambulances
    const ambTotal = Math.max(120, Math.round((stateProfile.population || 50000000) / 300000));
    const ambReq = Math.min(ambTotal, Math.max(15, Math.round(ambTotal * popRatio * 1.5)));
    const ambDisp = countDispatchedUnits(filteredDispatches, ['ambulance', 'als', 'trauma', 'icu', 'medical']);
    const ambRem = Math.max(0, ambTotal - ambDisp);

    // 2. Fire Engines & Rescue Tenders
    const feTotal = Math.max(80, Math.round((stateProfile.population || 50000000) / 450000));
    const feReq = Math.min(feTotal, Math.max(8, Math.round(feTotal * popRatio * 1.3)));
    const feDisp = countDispatchedUnits(filteredDispatches, ['fireengine', 'fire', 'tender', 'hazmat']);
    const feRem = Math.max(0, feTotal - feDisp);

    // 3. Police Quick Response Patrol
    const polTotal = Math.max(150, Math.round((stateProfile.population || 50000000) / 250000));
    const polReq = Math.min(polTotal, Math.max(12, Math.round(polTotal * popRatio * 1.4)));
    const polDisp = countDispatchedUnits(filteredDispatches, ['policeunit', 'police', 'pcr', 'patrol', 'cruiser']);
    const polRem = Math.max(0, polTotal - polDisp);

    // 4. Military Rescue Helicopters (IAF / Army)
    const heliTotal = Math.max(10, Math.round(stateProfile.sdrfBattalions * 3));
    const heliReq = Math.min(heliTotal, Math.max(2, Math.round(heliTotal * popRatio * 1.2)));
    const heliDisp = countDispatchedUnits(filteredDispatches, ['militaryhelicopter', 'helicopter', 'iaf', 'airlift', 'mi-17', 'dhruv']);
    const heliRem = Math.max(0, heliTotal - heliDisp);

    // 5. Motorized Rescue Boats & Gemini Craft
    const boatTotal = res.floatingClinics?.total || 120;
    const boatReq = Math.min(boatTotal, Math.max(10, Math.round((boatTotal || 120) * popRatio * 1.6)));
    const boatDisp = countDispatchedUnits(filteredDispatches, ['motorboat', 'boat', 'gemini', 'floatingclinic']);
    const boatRem = Math.max(0, (res.floatingClinics?.inReserve || boatTotal) - boatDisp);

    // 6. Clean Drinking Water Tankers
    const wtTotal = res.waterTankers.total;
    const wtReq = Math.min(wtTotal, Math.max(25, Math.round(wtTotal * popRatio * 1.25)));
    const wtDisp = countDispatchedUnits(filteredDispatches, ['watertanker', 'tanker', 'bowser', 'water']);
    const wtRem = Math.max(0, res.waterTankers.inReserve - wtDisp);

    // 7. Dry Ration Emergency Food Kits
    const rpTotal = res.rationPackets.total;
    const rpReq = Math.min(rpTotal, Math.max(2500, Math.round(rpTotal * popRatio * 1.4)));
    const rpDisp = countDispatchedUnits(filteredDispatches, ['rationpacket', 'ration', 'food']);
    const rpRem = Math.max(0, res.rationPackets.inReserve - rpDisp);

    // 8. High-Discharge Dewatering Pumps
    const wpTotal = res.waterMotorPumps.total;
    const wpReq = Math.min(wpTotal, Math.max(20, Math.round(wpTotal * popRatio * 1.6)));
    const wpDisp = countDispatchedUnits(filteredDispatches, ['watermotorpump', 'pump', 'dewatering', 'trash']);
    const wpRem = Math.max(0, res.waterMotorPumps.inReserve - wpDisp);

    // 9. Emergency Mobile DG Generators
    const egTotal = res.emergencyGenerators.total;
    const egReq = Math.min(egTotal, Math.max(15, Math.round(egTotal * popRatio * 1.3)));
    const egDisp = countDispatchedUnits(filteredDispatches, ['emergencygenerator', 'generator', 'dg']);
    const egRem = Math.max(0, res.emergencyGenerators.inReserve - egDisp);

    // 10. Weatherproof Shelter Tents & Tarpaulins
    const ttTotal = res.tarpTentKits.total;
    const ttReq = Math.min(ttTotal, Math.max(300, Math.round(ttTotal * popRatio * 1.4)));
    const ttDisp = countDispatchedUnits(filteredDispatches, ['tarptentkit', 'tent', 'tarp', 'shelter']);
    const ttRem = Math.max(0, res.tarpTentKits.inReserve - ttDisp);

    // 11. Heavy Earthmoving Excavators & JCBs
    const dmTotal = res.debrisMachinery.total;
    const dmReq = Math.min(dmTotal, Math.max(10, Math.round(dmTotal * popRatio * 1.1)));
    const dmDisp = countDispatchedUnits(filteredDispatches, ['debrismachinery', 'machinery', 'excavator', 'jcb']);
    const dmRem = Math.max(0, res.debrisMachinery.inReserve - dmDisp);

    allocatedResources = [
      {
        resourceType: 'Advanced Life Support (ALS) Ambulances',
        required: ambReq,
        dispatched: ambDisp,
        remainingNationally: ambRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ambReq / ambTotal) * 100))),
        dispatchedBarPercent: ambReq > 0 && ambDisp > 0 ? Math.min(100, Math.round((ambDisp / ambReq) * 100)) : 0,
      },
      {
        resourceType: 'Fire Engines & Heavy Rescue Tenders',
        required: feReq,
        dispatched: feDisp,
        remainingNationally: feRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((feReq / feTotal) * 100))),
        dispatchedBarPercent: feReq > 0 && feDisp > 0 ? Math.min(100, Math.round((feDisp / feReq) * 100)) : 0,
      },
      {
        resourceType: 'Police Quick Response & PCR Patrol',
        required: polReq,
        dispatched: polDisp,
        remainingNationally: polRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((polReq / polTotal) * 100))),
        dispatchedBarPercent: polReq > 0 && polDisp > 0 ? Math.min(100, Math.round((polDisp / polReq) * 100)) : 0,
      },
      {
        resourceType: 'Military Rescue Helicopters (IAF / Army)',
        required: heliReq,
        dispatched: heliDisp,
        remainingNationally: heliRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((heliReq / heliTotal) * 100))),
        dispatchedBarPercent: heliReq > 0 && heliDisp > 0 ? Math.min(100, Math.round((heliDisp / heliReq) * 100)) : 0,
      },
      {
        resourceType: 'Motorized Rescue Boats & Gemini Craft',
        required: boatReq,
        dispatched: boatDisp,
        remainingNationally: boatRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((boatReq / boatTotal) * 100))),
        dispatchedBarPercent: boatReq > 0 && boatDisp > 0 ? Math.min(100, Math.round((boatDisp / boatReq) * 100)) : 0,
      },
      {
        resourceType: 'Potable Drinking Water Tankers',
        required: wtReq,
        dispatched: wtDisp,
        remainingNationally: wtRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wtReq / wtTotal) * 100))),
        dispatchedBarPercent: wtReq > 0 && wtDisp > 0 ? Math.min(100, Math.round((wtDisp / wtReq) * 100)) : 0,
      },
      {
        resourceType: 'Dry Ration Emergency Food Kits',
        required: rpReq,
        dispatched: rpDisp,
        remainingNationally: rpRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((rpReq / rpTotal) * 100))),
        dispatchedBarPercent: rpReq > 0 && rpDisp > 0 ? Math.min(100, Math.round((rpDisp / rpReq) * 100)) : 0,
      },
      {
        resourceType: 'High-Discharge Dewatering Pumps',
        required: wpReq,
        dispatched: wpDisp,
        remainingNationally: wpRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wpReq / wpTotal) * 100))),
        dispatchedBarPercent: wpReq > 0 && wpDisp > 0 ? Math.min(100, Math.round((wpDisp / wpReq) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Mobile DG Generators',
        required: egReq,
        dispatched: egDisp,
        remainingNationally: egRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((egReq / egTotal) * 100))),
        dispatchedBarPercent: egReq > 0 && egDisp > 0 ? Math.min(100, Math.round((egDisp / egReq) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Tents & Shelter Tarpaulins',
        required: ttReq,
        dispatched: ttDisp,
        remainingNationally: ttRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ttReq / ttTotal) * 100))),
        dispatchedBarPercent: ttReq > 0 && ttDisp > 0 ? Math.min(100, Math.round((ttDisp / ttReq) * 100)) : 0,
      },
      {
        resourceType: 'Heavy Earthmoving Excavators & JCBs',
        required: dmReq,
        dispatched: dmDisp,
        remainingNationally: dmRem,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((dmReq / dmTotal) * 100))),
        dispatchedBarPercent: dmReq > 0 && dmDisp > 0 ? Math.min(100, Math.round((dmDisp / dmReq) * 100)) : 0,
      },
    ];
  } else {
    // Dynamic Live National Resource Grid (All 11 Dispatchable Tactical Resources)
    const natSummary = getNationalResourceSummary(statesData);

    // 1. Ambulances
    const ambDispatched = countDispatchedUnits(filteredDispatches, ['ambulance', 'als', 'trauma', 'icu', 'medical']);
    const ambTotal = 15000;
    const ambRemaining = Math.max(0, ambTotal - ambDispatched);
    const ambRequired = Math.max(120, Math.round(totalAffectedPopulation / 35000));

    // 2. Fire Engines & Rescue Tenders
    const feDispatched = countDispatchedUnits(filteredDispatches, ['fireengine', 'fire', 'tender', 'hazmat']);
    const feTotal = 8500;
    const feRemaining = Math.max(0, feTotal - feDispatched);
    const feRequired = Math.max(60, Math.round(totalAffectedPopulation / 60000));

    // 3. Police Patrol
    const polDispatched = countDispatchedUnits(filteredDispatches, ['policeunit', 'police', 'pcr', 'patrol', 'cruiser']);
    const polTotal = 18000;
    const polRemaining = Math.max(0, polTotal - polDispatched);
    const polRequired = Math.max(90, Math.round(totalAffectedPopulation / 45000));

    // 4. Military Helicopters
    const heliDispatched = countDispatchedUnits(filteredDispatches, ['militaryhelicopter', 'helicopter', 'iaf', 'airlift', 'mi-17', 'dhruv']);
    const heliTotal = 450;
    const heliRemaining = Math.max(0, heliTotal - heliDispatched);
    const heliRequired = Math.max(18, Math.round(totalAffectedPopulation / 220000));

    // 5. Motorized Rescue Boats
    const boatDispatched = countDispatchedUnits(filteredDispatches, ['motorboat', 'boat', 'gemini', 'floatingclinic']);
    const boatTotal = 4200;
    const boatRemaining = Math.max(0, boatTotal - boatDispatched);
    const boatRequired = activeParams.type === 'heatwave' ? 40 : Math.max(80, Math.round(totalAffectedPopulation / 45000));

    // 6. Water Tankers
    const wtDispatched = countDispatchedUnits(filteredDispatches, ['watertanker', 'tanker', 'bowser', 'water']);
    const wtTotal = natSummary.summary.waterTankers.total || 25000;
    const wtRemaining = Math.max(0, (natSummary.summary.waterTankers.inReserve || 12000) - wtDispatched);
    const wtRequired = Math.max(250, Math.round(totalAffectedPopulation / 18000));

    // 7. Food Kits
    const rpDispatched = countDispatchedUnits(filteredDispatches, ['rationpacket', 'ration', 'food']);
    const rpTotal = natSummary.summary.rationPackets.total || 250000;
    const rpRemaining = Math.max(0, (natSummary.summary.rationPackets.inReserve || 120000) - rpDispatched);
    const rpRequired = Math.max(5000, Math.round(totalAffectedPopulation / 200));

    // 8. Dewatering Pumps
    const wpDispatched = countDispatchedUnits(filteredDispatches, ['watermotorpump', 'pump', 'dewatering', 'trash']);
    const wpTotal = natSummary.summary.waterMotorPumps.total || 18000;
    const wpRemaining = Math.max(0, (natSummary.summary.waterMotorPumps.inReserve || 9000) - wpDispatched);
    const wpRequired = Math.max(120, Math.round(totalAffectedPopulation / 32000));

    // 9. DG Generators
    const egDispatched = countDispatchedUnits(filteredDispatches, ['emergencygenerator', 'generator', 'dg']);
    const egTotal = natSummary.summary.emergencyGenerators.total || 12000;
    const egRemaining = Math.max(0, (natSummary.summary.emergencyGenerators.inReserve || 6000) - egDispatched);
    const egRequired = Math.max(80, Math.round(totalAffectedPopulation / 48000));

    // 10. Shelter Tents
    const ttDispatched = countDispatchedUnits(filteredDispatches, ['tarptentkit', 'tent', 'tarp', 'shelter']);
    const ttTotal = natSummary.summary.tarpTentKits.total || 150000;
    const ttRemaining = Math.max(0, (natSummary.summary.tarpTentKits.inReserve || 75000) - ttDispatched);
    const ttRequired = Math.max(800, Math.round(totalAffectedPopulation / 3500));

    // 11. Heavy Machinery
    const dmDispatched = countDispatchedUnits(filteredDispatches, ['debrismachinery', 'machinery', 'excavator', 'jcb']);
    const dmTotal = natSummary.summary.debrisMachinery.total || 8000;
    const dmRemaining = Math.max(0, (natSummary.summary.debrisMachinery.inReserve || 4000) - dmDispatched);
    const dmRequired = Math.max(50, Math.round(totalAffectedPopulation / 70000));

    allocatedResources = [
      {
        resourceType: 'Advanced Life Support (ALS) Ambulances',
        required: ambRequired,
        dispatched: ambDispatched,
        remainingNationally: ambRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ambRequired / 600) * 100))),
        dispatchedBarPercent: ambRequired > 0 && ambDispatched > 0 ? Math.min(100, Math.round((ambDispatched / ambRequired) * 100)) : 0,
      },
      {
        resourceType: 'Fire Engines & Heavy Rescue Tenders',
        required: feRequired,
        dispatched: feDispatched,
        remainingNationally: feRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((feRequired / 400) * 100))),
        dispatchedBarPercent: feRequired > 0 && feDispatched > 0 ? Math.min(100, Math.round((feDispatched / feRequired) * 100)) : 0,
      },
      {
        resourceType: 'Police Quick Response & PCR Patrol',
        required: polRequired,
        dispatched: polDispatched,
        remainingNationally: polRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((polRequired / 500) * 100))),
        dispatchedBarPercent: polRequired > 0 && polDispatched > 0 ? Math.min(100, Math.round((polDispatched / polRequired) * 100)) : 0,
      },
      {
        resourceType: 'Military Rescue Helicopters (IAF / Army)',
        required: heliRequired,
        dispatched: heliDispatched,
        remainingNationally: heliRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((heliRequired / 60) * 100))),
        dispatchedBarPercent: heliRequired > 0 && heliDispatched > 0 ? Math.min(100, Math.round((heliDispatched / heliRequired) * 100)) : 0,
      },
      {
        resourceType: 'Motorized Rescue Boats & Gemini Craft',
        required: boatRequired,
        dispatched: boatDispatched,
        remainingNationally: boatRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((boatRequired / 300) * 100))),
        dispatchedBarPercent: boatRequired > 0 && boatDispatched > 0 ? Math.min(100, Math.round((boatDispatched / boatRequired) * 100)) : 0,
      },
      {
        resourceType: 'Potable Drinking Water Tankers',
        required: wtRequired,
        dispatched: wtDispatched,
        remainingNationally: wtRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wtRequired / 500) * 100))),
        dispatchedBarPercent: wtRequired > 0 && wtDispatched > 0 ? Math.min(100, Math.round((wtDispatched / wtRequired) * 100)) : 0,
      },
      {
        resourceType: 'Dry Ration Emergency Food Kits',
        required: rpRequired,
        dispatched: rpDispatched,
        remainingNationally: rpRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((rpRequired / 25000) * 100))),
        dispatchedBarPercent: rpRequired > 0 && rpDispatched > 0 ? Math.min(100, Math.round((rpDispatched / rpRequired) * 100)) : 0,
      },
      {
        resourceType: 'High-Discharge Dewatering Pumps',
        required: wpRequired,
        dispatched: wpDispatched,
        remainingNationally: wpRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((wpRequired / 400) * 100))),
        dispatchedBarPercent: wpRequired > 0 && wpDispatched > 0 ? Math.min(100, Math.round((wpDispatched / wpRequired) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Mobile DG Generators',
        required: egRequired,
        dispatched: egDispatched,
        remainingNationally: egRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((egRequired / 300) * 100))),
        dispatchedBarPercent: egRequired > 0 && egDispatched > 0 ? Math.min(100, Math.round((egDispatched / egRequired) * 100)) : 0,
      },
      {
        resourceType: 'Emergency Tents & Shelter Tarpaulins',
        required: ttRequired,
        dispatched: ttDispatched,
        remainingNationally: ttRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((ttRequired / 1500) * 100))),
        dispatchedBarPercent: ttRequired > 0 && ttDispatched > 0 ? Math.min(100, Math.round((ttDispatched / ttRequired) * 100)) : 0,
      },
      {
        resourceType: 'Heavy Earthmoving Excavators & JCBs',
        required: dmRequired,
        dispatched: dmDispatched,
        remainingNationally: dmRemaining,
        requiredBarPercent: Math.min(100, Math.max(15, Math.round((dmRequired / 200) * 100))),
        dispatchedBarPercent: dmRequired > 0 && dmDispatched > 0 ? Math.min(100, Math.round((dmDispatched / dmRequired) * 100)) : 0,
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
