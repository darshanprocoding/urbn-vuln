// Clear Dispatch Unit & Resource Definitions for Emergency Response
// Standardized across NDRF, SDRF, Indian Air Force (IAF), Fire & Emergency Services, State Police, and NDMA.

export interface DispatchUnitType {
  id: string;
  unitType?: string;
  name: string;
  shortName: string;
  category: string;
  unit?: string;
  unitLabel: string;
  description: string;
  defaultSpeedKmH: number;
  iconType: 'ambulance' | 'fireEngine' | 'police' | 'helicopter' | 'motorBoat' | 'waterTanker' | 'foodKit' | 'pump' | 'generator' | 'tent' | 'machinery';
  color: string;
  standardBatchSize: number;
  priorityRole: string;
}

export const DISPATCH_UNIT_TYPES: Record<string, DispatchUnitType> = {
  ambulances: {
    id: 'ambulances',
    unitType: 'ambulances',
    name: 'Advanced Life Support (ALS) Ambulances',
    shortName: 'Ambulances',
    category: 'Medical & Triage',
    unit: 'Ambulance Vans',
    unitLabel: 'ALS Ambulance Vans',
    description: 'ICU-equipped trauma ambulances with portable oxygen, automated defibrillators, spine boards, and paramedic crew.',
    defaultSpeedKmH: 75,
    iconType: 'ambulance',
    color: '#ef4444',
    standardBatchSize: 5,
    priorityRole: 'Emergency Casualty Evacuation & Mobile ICU Support',
  },
  fireEngines: {
    id: 'fireEngines',
    unitType: 'fireEngines',
    name: 'Fire Engines & Heavy Rescue Tenders',
    shortName: 'Fire Engines',
    category: 'Fire & Hazmat',
    unit: 'Rescue Tenders',
    unitLabel: 'Heavy Water/Foam Tenders',
    description: 'Specialized 10,000L high-pressure crash tenders equipped with hydraulic spreaders, thermal imaging, and Hazmat neutralizers.',
    defaultSpeedKmH: 65,
    iconType: 'fireEngine',
    color: '#f97316',
    standardBatchSize: 3,
    priorityRole: 'Fire Suppression, Structural Collapse & Gas Hazard Control',
  },
  policeUnits: {
    id: 'policeUnits',
    unitType: 'policeUnits',
    name: 'Police Quick Response & PCR Patrol',
    shortName: 'Police Patrol',
    category: 'Security & Law',
    unit: 'Cruisers',
    unitLabel: 'Tactical PCR Vehicles',
    description: '4x4 Police patrol interceptors for maintaining green corridors, law and order, perimeter sealing, and siren-led convoy escort.',
    defaultSpeedKmH: 85,
    iconType: 'police',
    color: '#3b82f6',
    standardBatchSize: 4,
    priorityRole: 'Emergency Traffic Clearance, Green Corridor & Evacuation Escort',
  },
  militaryHelicopters: {
    id: 'militaryHelicopters',
    unitType: 'militaryHelicopters',
    name: 'Military Rescue Helicopters (IAF / Army Aviation)',
    shortName: 'Military Helicopters',
    category: 'Aviation & Airlift',
    unit: 'Helicopters',
    unitLabel: 'Mi-17V5 / ALH Dhruv Helicopters',
    description: 'Heavy tactical airlift rotorcraft with motorized winch hoists, slung cargo nets, rooftop extraction, and all-weather NVG capability.',
    defaultSpeedKmH: 220,
    iconType: 'helicopter',
    color: '#10b981',
    standardBatchSize: 2,
    priorityRole: 'Air Drops, Cut-Off Village Rescues & Rapid Aerial Survey',
  },
  motorBoats: {
    id: 'motorBoats',
    unitType: 'motorBoats',
    name: 'Motorized Rescue Boats & Gemini Craft',
    shortName: 'Motor Boats',
    category: 'Water Rescue',
    unit: 'Boats',
    unitLabel: 'Inflatable Gemini Craft',
    description: 'Inflatable heavy-duty Gemini motorized rescue boats with 40HP outboard motors, life jackets, dry bags, and diver kits.',
    defaultSpeedKmH: 45,
    iconType: 'motorBoat',
    color: '#06b6d4',
    standardBatchSize: 6,
    priorityRole: 'Urban Water Inundation, River Evacuation & Submerged Colony Access',
  },
  waterTankers: {
    id: 'waterTankers',
    unitType: 'waterTankers',
    name: 'Potable Drinking Water Tankers',
    shortName: 'Water Tankers',
    category: 'Essential Supplies',
    unit: 'Tankers',
    unitLabel: '10,000L Bowsers',
    description: 'Sanitized heavy tankers with multi-tap distribution manifolds and rapid chlorination treatment units.',
    defaultSpeedKmH: 55,
    iconType: 'waterTanker',
    color: '#0ea5e9',
    standardBatchSize: 10,
    priorityRole: 'Contaminated Water Prevention & Relief Camp Hydration',
  },
  rationPackets: {
    id: 'rationPackets',
    unitType: 'rationPackets',
    name: 'Dry Ration Emergency Food Kits',
    shortName: 'Food Kits',
    category: 'Essential Supplies',
    unit: 'Family Packs',
    unitLabel: 'Family Rations (Packets)',
    description: '7-day vacuum-sealed family ration boxes containing grains, energy biscuits, ORS, chlorine tabs, and ready-to-eat meals.',
    defaultSpeedKmH: 60,
    iconType: 'foodKit',
    color: '#eab308',
    standardBatchSize: 2000,
    priorityRole: 'Direct Mass Nutrition & Isolated Family Sustenance',
  },
  waterMotorPumps: {
    id: 'waterMotorPumps',
    unitType: 'waterMotorPumps',
    name: 'High-Discharge Dewatering Pumps',
    shortName: 'Dewatering Pumps',
    category: 'Infrastructure & Power',
    unit: 'Pumps',
    unitLabel: 'High-Discharge Sludge Pumps',
    description: 'Diesel-driven submersible dewatering pumps with trash impellers capable of clearing 200,000 liters/hr from submerged subways and homes.',
    defaultSpeedKmH: 60,
    iconType: 'pump',
    color: '#6366f1',
    standardBatchSize: 12,
    priorityRole: 'Critical Infrastructure Dewatering & Submerged Hospital Recovery',
  },
  emergencyGenerators: {
    id: 'emergencyGenerators',
    unitType: 'emergencyGenerators',
    name: 'Emergency Mobile DG Generators',
    shortName: 'DG Generators',
    category: 'Infrastructure & Power',
    unit: 'Generators',
    unitLabel: '125 kVA Mobile DG Sets',
    description: 'Trailer-mounted acoustic silenced diesel generators to restore power to hospitals, oxygen plants, and telecom towers.',
    defaultSpeedKmH: 50,
    iconType: 'generator',
    color: '#a855f7',
    standardBatchSize: 6,
    priorityRole: 'Critical Power Restoration to ICUs & Emergency Water Works',
  },
  tarpTentKits: {
    id: 'tarpTentKits',
    unitType: 'tarpTentKits',
    name: 'Emergency Tents & Shelter Tarpaulins',
    shortName: 'Shelter Kits',
    category: 'Essential Supplies',
    unit: 'Tarp Kits',
    unitLabel: 'Weatherproof Camp Kits',
    description: 'Heavy-duty 250 GSM waterproof tarpaulins, family dome tents, groundsheets, and hurricane tie-downs.',
    defaultSpeedKmH: 60,
    iconType: 'tent',
    color: '#14b8a6',
    standardBatchSize: 1500,
    priorityRole: 'Displaced Population Sheltering & Temporary Field Clinics',
  },
  debrisMachinery: {
    id: 'debrisMachinery',
    unitType: 'debrisMachinery',
    name: 'Heavy Earthmoving Excavators & JCBs',
    shortName: 'Heavy Machinery',
    category: 'Infrastructure & Power',
    unit: 'Excavators',
    unitLabel: 'Tracked Hydraulic Excavators',
    description: 'Caterpillar track excavators, rock breakers, and front-loaders to clear boulder landslides and collapsed concrete bridges.',
    defaultSpeedKmH: 40,
    iconType: 'machinery',
    color: '#f59e0b',
    standardBatchSize: 4,
    priorityRole: 'Landslide Clearance & Route Unblocking for Rescue Vehicles',
  },
};

export interface DispatchPayloadItem {
  typeId?: string;
  unitType?: string;
  name: string;
  shortName?: string;
  quantity: number;
  unit?: string;
  unitLabel?: string;
  iconType?: DispatchUnitType['iconType'] | string;
  icon?: string;
  color?: string;
  category?: string;
}

export interface ArrivalReport {
  arrivedAt?: string;
  reachedTimestamp?: string;
  commanderName?: string;
  incidentCommander?: string;
  contactLead?: string;
  contactRadio?: string;
  deocContact?: string;
  onGroundStatus?: string;
  statusMessage?: string;
  deliveredSummary?: string;
  immediateDeploymentZone?: string;
  immediateZone?: string;
  survivorsAssisted?: number;
  triageOperational?: boolean;
  fieldNotes?: string[];
  fieldChecklist?: string[];
}
