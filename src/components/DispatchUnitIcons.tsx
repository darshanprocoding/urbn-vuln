import React from 'react';

export type DispatchUnitType =
  | 'militaryHelicopter'
  | 'motorBoat'
  | 'ambulance'
  | 'fireEngine'
  | 'policeUnit'
  | 'cargoTruck'
  | 'reconDrone';

export interface DispatchUnitInfo {
  id: DispatchUnitType;
  name: string;
  shortName: string;
  category: 'Air' | 'Water' | 'Medical' | 'Rescue' | 'Security' | 'Logistics' | 'Aerial Recon';
  serviceBranch: string;
  speedKmH: number;
  payloadCapacity: string;
  description: string;
  primaryRole: string;
  badgeColor: string;
}

export const DISPATCH_UNITS: Record<DispatchUnitType, DispatchUnitInfo> = {
  militaryHelicopter: {
    id: 'militaryHelicopter',
    name: 'IAF Mi-17V5 / ALH Dhruv Military Helicopter',
    shortName: 'Military Helicopter',
    category: 'Air',
    serviceBranch: 'Indian Air Force / Army Aviation Corps',
    speedKmH: 260,
    payloadCapacity: '4,000 kg or 24 Evacuees',
    description: 'Twin-engine high-altitude medium-lift tactical helicopter for rooftop winching, remote valley drops, and air ambulance triage.',
    primaryRole: 'Rapid Inaccessible Terrain Extraction & Airdrops',
    badgeColor: '#38bdf8',
  },
  motorBoat: {
    id: 'motorBoat',
    name: 'NDRF Gemini Inflatable Motor Boat',
    shortName: 'Motor Rescue Boat',
    category: 'Water',
    serviceBranch: 'NDRF / SDRF Water Rescue Unit',
    speedKmH: 28,
    payloadCapacity: '1,200 kg or 12 Evacuees',
    description: 'Heavy-duty puncture-resistant Hypalon inflatable boat with 40 HP OBM engine for flooded village lanes, char islands, and swift currents.',
    primaryRole: 'Submerged Zone & Riverine Char Evacuation',
    badgeColor: '#06b6d4',
  },
  ambulance: {
    id: 'ambulance',
    name: 'Advanced Life Support (ALS) Emergency Ambulance',
    shortName: 'ALS Trauma Ambulance',
    category: 'Medical',
    serviceBranch: 'State Emergency Medical Services (108 / DDMA)',
    speedKmH: 70,
    payloadCapacity: '4 Critical Patients + Trauma Suite',
    description: 'High-roof ICU on wheels with multi-para patient monitor, defibrillator, ventilator, oxygen manifold, and suction units.',
    primaryRole: 'Critical Patient Stabilization & Hospital Transfer',
    badgeColor: '#ec4899',
  },
  fireEngine: {
    id: 'fireEngine',
    name: 'Heavy Fire Tender & Hydraulic Boom Rescue Engine',
    shortName: 'Fire Engine & Water Tender',
    category: 'Rescue',
    serviceBranch: 'State Fire & Emergency Services',
    speedKmH: 60,
    payloadCapacity: '10,000L Water Foam + Hydraulic Cutters',
    description: 'Multi-stage centrifugal water cannon, foam proportioner, hydraulic spreaders, thermal imaging, and high-pressure deluge guns.',
    primaryRole: 'Fire Suppression, Structural Collapse & Hazmat',
    badgeColor: '#ef4444',
  },
  policeUnit: {
    id: 'policeUnit',
    name: 'Police PCR Van & Quick Response Tactical Unit (QRT)',
    shortName: 'Police QRT / PCR Unit',
    category: 'Security',
    serviceBranch: 'State Police Quick Response Team',
    speedKmH: 80,
    payloadCapacity: '6 Tactical Officers + VHF Repeater Hub',
    description: 'Heavy-duty 4x4 interceptor with encrypted wireless comms, PA public address megaphone, crowd cordoning gear, and night floodlights.',
    primaryRole: 'Perimeter Security, Evacuation Cordon & Law & Order',
    badgeColor: '#3b82f6',
  },
  cargoTruck: {
    id: 'cargoTruck',
    name: 'NDMA 10-Ton Heavy Logistics Relief Carrier',
    shortName: 'Heavy Logistics Truck',
    category: 'Logistics',
    serviceBranch: 'National Disaster Logistics Corridor',
    speedKmH: 50,
    payloadCapacity: '10,000 kg Bulk Rations / Tents / Pumps',
    description: 'Multi-axle all-weather freight truck with hydraulic tail lift for bulk movement of dry ration kits, dewatering pumps, and tarpaulins.',
    primaryRole: 'Bulk Emergency Supply Cache Replenishment',
    badgeColor: '#f59e0b',
  },
  reconDrone: {
    id: 'reconDrone',
    name: 'Heavy-Lift Aerial Recon & Emergency Dropper Drone',
    shortName: 'Aerial Recon Drone',
    category: 'Aerial Recon',
    serviceBranch: 'Civil Defence & Drone Corps',
    speedKmH: 95,
    payloadCapacity: '25 kg Emergency Medicines / Satphones',
    description: 'Hexacopter with 30x optical thermal zoom, LiDAR mapping, 4G/satellite live video link, and precision payload drop mechanism.',
    primaryRole: 'Thermal Survivor Detection & Precision Medicine Drop',
    badgeColor: '#a855f7',
  },
};

// 3D Isometric Animated SVG Icons
interface UnitIcon3DProps {
  unitType: DispatchUnitType | string;
  size?: number; // width & height in px
  animated?: boolean;
  className?: string;
  showGlow?: boolean;
}

export const UnitIcon3D: React.FC<UnitIcon3DProps> = ({
  unitType,
  size = 48,
  animated = true,
  className = '',
  showGlow = true,
}) => {
  // Normalize unit type
  let type: DispatchUnitType = 'cargoTruck';
  if (unitType in DISPATCH_UNITS) {
    type = unitType as DispatchUnitType;
  } else if (typeof unitType === 'string') {
    const lower = unitType.toLowerCase();
    if (lower.includes('helico') || lower.includes('iaf') || lower.includes('airlift') || lower.includes('chopper')) {
      type = 'militaryHelicopter';
    } else if (lower.includes('boat') || lower.includes('water') || lower.includes('marine') || lower.includes('gemini')) {
      type = 'motorBoat';
    } else if (lower.includes('ambu') || lower.includes('medic') || lower.includes('icu') || lower.includes('trauma')) {
      type = 'ambulance';
    } else if (lower.includes('fire') || lower.includes('tender') || lower.includes('ladder')) {
      type = 'fireEngine';
    } else if (lower.includes('police') || lower.includes('qrt') || lower.includes('pcr') || lower.includes('security')) {
      type = 'policeUnit';
    } else if (lower.includes('drone') || lower.includes('recon') || lower.includes('uav')) {
      type = 'reconDrone';
    }
  }

  // Render individual 3D SVG icon based on unit type
  switch (type) {
    case 'militaryHelicopter':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-cyan-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="heliBody" x1="20" y1="30" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284c7" />
                <stop offset="0.6" stopColor="#0369a1" />
                <stop offset="1" stopColor="#082f49" />
              </linearGradient>
              <linearGradient id="heliCanopy" x1="55" y1="35" x2="85" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#67e8f9" stopOpacity="0.9" />
                <stop offset="0.7" stopColor="#06b6d4" stopOpacity="0.7" />
                <stop offset="1" stopColor="#0e7490" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="heliSkid" x1="20" y1="80" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#94a3b8" />
                <stop offset="1" stopColor="#475569" />
              </linearGradient>
            </defs>

            {/* Helicopter Skids & Struts (3D bottom) */}
            <path d="M22 80 L74 80 M28 80 L34 68 M64 80 L58 68" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 84 L78 84" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />

            {/* Tail Boom & Tail Rotor */}
            <path d="M35 52 L10 44 L10 38 L32 46 Z" fill="#0369a1" stroke="#0284c7" strokeWidth="1" />
            <path d="M10 40 L6 30 L14 34 Z" fill="#0284c7" />
            {/* Tail blade spin */}
            <g className={animated ? 'origin-[10px_35px] animate-spin' : ''} style={{ animationDuration: '0.25s' }}>
              <line x1="10" y1="23" x2="10" y2="47" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Main Fuselage (3D sculpted curves) */}
            <path
              d="M30 48 C30 38 42 34 58 34 C74 34 86 44 86 56 C86 66 74 70 54 70 C36 70 30 60 30 48 Z"
              fill="url(#heliBody)"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />

            {/* IAF Tri-color roundel & insignia */}
            <circle cx="45" cy="56" r="6" fill="#f97316" />
            <circle cx="45" cy="56" r="4" fill="#ffffff" />
            <circle cx="45" cy="56" r="2" fill="#16a34a" />

            {/* Cockpit Canopy Glass */}
            <path
              d="M60 36 C72 36 84 44 84 54 C84 62 76 66 68 66 L60 52 Z"
              fill="url(#heliCanopy)"
              stroke="#bae6fd"
              strokeWidth="1"
            />
            <path d="M64 40 L78 48" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

            {/* Rotor Mast & Hub */}
            <rect x="49" y="24" width="6" height="10" rx="1.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
            <ellipse cx="52" cy="24" rx="6" ry="2.5" fill="#64748b" />

            {/* Spinning Main Rotor Blades with high-speed blur */}
            <g
              className={animated ? 'origin-[52px_24px] animate-spin' : ''}
              style={{ animationDuration: '0.15s' }}
            >
              <ellipse cx="52" cy="24" rx="46" ry="6" fill="#38bdf8" fillOpacity="0.2" />
              <line x1="6" y1="24" x2="98" y2="24" stroke="#f0f9ff" strokeWidth="3" strokeLinecap="round" />
              <line x1="52" y1="2" x2="52" y2="46" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              <circle cx="52" cy="24" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
            </g>

            {/* Searchlight Beam */}
            <circle cx="82" cy="62" r="3" fill="#fef08a" />
          </svg>
        </div>
      );

    case 'motorBoat':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-cyan-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="boatHull" x1="15" y1="35" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f97316" />
                <stop offset="0.6" stopColor="#ea580c" />
                <stop offset="1" stopColor="#9a3412" />
              </linearGradient>
              <linearGradient id="boatSponson" x1="20" y1="50" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#334155" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Animated Water Wake & Ripples */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '1.2s' }}>
              <path d="M8 78 Q28 72 48 78 T88 78" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M18 84 Q40 80 62 84 T94 84" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <circle cx="14" cy="74" r="2.5" fill="#e0f2fe" opacity="0.8" />
              <circle cx="20" cy="77" r="1.5" fill="#e0f2fe" opacity="0.7" />
            </g>

            {/* Outboard Motor (OBM 40HP Engine) */}
            <rect x="12" y="44" width="10" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <rect x="10" y="42" width="14" height="8" rx="2" fill="#0f172a" />
            {/* Propeller Hub */}
            <path d="M10 66 L6 74 L14 74 Z" fill="#64748b" />

            {/* Dual Sponson Inflatable Hull (3D Gemini Style) */}
            <path
              d="M18 56 C20 42 35 38 60 40 C78 41 90 48 92 60 C90 70 75 74 54 74 C30 74 18 68 18 56 Z"
              fill="url(#boatHull)"
              stroke="#fb923c"
              strokeWidth="2"
            />

            {/* Inflatable Tube Chamber Lines & Lifeline Ropes */}
            <path d="M24 54 C35 46 65 46 84 56" stroke="#451a03" strokeWidth="1.5" strokeDasharray="3 2" />
            <rect x="34" y="48" width="36" height="18" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />

            {/* NDRF Rescue Personnel Helmets & Gear */}
            <circle cx="44" cy="53" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="58" cy="53" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

            {/* Lifebuoy Ring on Bow */}
            <circle cx="78" cy="57" r="5" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5" />
            <circle cx="78" cy="57" r="2.5" fill="#ea580c" />
          </svg>
        </div>
      );

    case 'ambulance':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-pink-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ambBody" x1="15" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.7" stopColor="#f1f5f9" />
                <stop offset="1" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="ambStripe" x1="15" y1="52" x2="85" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Wheels & Hubcaps with 3D shadow */}
            <ellipse cx="32" cy="74" rx="8" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="32" cy="74" r="3.5" fill="#94a3b8" />
            <ellipse cx="72" cy="74" rx="8" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="72" cy="74" r="3.5" fill="#94a3b8" />

            {/* Van Body (High-Roof Emergency Ambulance) */}
            <path
              d="M16 40 C16 34 20 32 26 32 L62 32 C68 32 74 38 78 45 L86 52 C88 54 88 58 88 64 L88 70 L16 70 Z"
              fill="url(#ambBody)"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* High-Roof Medical Capsule Raised Profile */}
            <path d="M22 32 L22 28 C22 26 24 25 28 25 L58 25 C62 25 64 26 64 28 L64 32 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Fluorescent Red Emergency Speed Stripe */}
            <path d="M16 52 L87 52 L87 59 L16 59 Z" fill="url(#ambStripe)" />

            {/* Red Cross Medical Emblem */}
            <g transform="translate(36, 38)">
              <rect x="4" y="0" width="4" height="12" fill="#ef4444" rx="1" />
              <rect x="0" y="4" width="12" height="4" fill="#ef4444" rx="1" />
            </g>

            {/* Windshield & Cabin Windows */}
            <path d="M64 35 L76 46 L64 46 Z" fill="#0284c7" fillOpacity="0.75" stroke="#38bdf8" strokeWidth="1" />
            <rect x="22" y="36" width="10" height="9" rx="1" fill="#0284c7" fillOpacity="0.6" />

            {/* Flashing Dual Red/Blue Emergency Roof Beacon */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '0.4s' }}>
              <rect x="40" y="21" width="6" height="4" rx="1" fill="#ef4444" />
              <rect x="46" y="21" width="6" height="4" rx="1" fill="#3b82f6" />
              <ellipse cx="46" cy="20" rx="10" ry="2" fill="#60a5fa" fillOpacity="0.6" />
            </g>
          </svg>
        </div>
      );

    case 'fireEngine':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-red-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="fireBody" x1="15" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" />
                <stop offset="0.6" stopColor="#dc2626" />
                <stop offset="1" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Heavy Wheels */}
            <ellipse cx="28" cy="74" rx="8" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="28" cy="74" r="3.5" fill="#facc15" />
            <ellipse cx="44" cy="74" rx="8" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="44" cy="74" r="3.5" fill="#facc15" />
            <ellipse cx="76" cy="74" rx="8" ry="8" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <circle cx="76" cy="74" r="3.5" fill="#facc15" />

            {/* Main Fire Tender Chassis */}
            <path
              d="M14 36 C14 33 17 30 20 30 L64 30 L74 38 L88 44 C90 46 90 50 90 56 L90 70 L14 70 Z"
              fill="url(#fireBody)"
              stroke="#fca5a5"
              strokeWidth="1.5"
            />

            {/* Silver Equipment Lockers & Water Cannon Hose */}
            <rect x="18" y="44" width="14" height="22" rx="2" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="34" y="44" width="14" height="22" rx="2" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="50" y="44" width="12" height="22" rx="2" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />

            {/* Extendable Rescue Ladder on Roof */}
            <path d="M16 26 L62 26" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <path d="M16 22 L62 22" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="20" x2="24" y2="28" stroke="#94a3b8" strokeWidth="2" />
            <line x1="34" y1="20" x2="34" y2="28" stroke="#94a3b8" strokeWidth="2" />
            <line x1="44" y1="20" x2="44" y2="28" stroke="#94a3b8" strokeWidth="2" />
            <line x1="54" y1="20" x2="54" y2="28" stroke="#94a3b8" strokeWidth="2" />

            {/* Cabin Windshield */}
            <path d="M66 34 L76 42 L66 42 Z" fill="#0284c7" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1" />

            {/* High-Intensity Flashing Beacon */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '0.35s' }}>
              <rect x="70" y="27" width="8" height="5" rx="1.5" fill="#38bdf8" />
              <circle cx="74" cy="27" r="7" fill="#60a5fa" fillOpacity="0.4" />
            </g>
          </svg>
        </div>
      );

    case 'policeUnit':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-blue-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pcrBody" x1="15" y1="30" x2="85" y2="75" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e3a8a" />
                <stop offset="0.6" stopColor="#172554" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Rugged 4x4 Tires */}
            <ellipse cx="30" cy="74" rx="8.5" ry="8.5" fill="#090d16" stroke="#475569" strokeWidth="2" />
            <circle cx="30" cy="74" r="4" fill="#94a3b8" />
            <ellipse cx="72" cy="74" rx="8.5" ry="8.5" fill="#090d16" stroke="#475569" strokeWidth="2" />
            <circle cx="72" cy="74" r="4" fill="#94a3b8" />

            {/* Tactical SUV Frame */}
            <path
              d="M16 46 C16 40 22 36 30 36 L58 36 C64 36 70 40 76 46 L88 52 C90 54 90 58 90 64 L90 70 L16 70 Z"
              fill="url(#pcrBody)"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />

            {/* Police High-Contrast White Doors & Reflective Decal */}
            <rect x="34" y="44" width="22" height="18" rx="2" fill="#f8fafc" />
            <text x="36" y="56" fill="#1e3a8a" fontSize="7" fontWeight="bold" fontFamily="monospace">POLICE</text>

            {/* Windshield & Armored Windows */}
            <path d="M60 38 L72 47 L60 47 Z" fill="#0284c7" fillOpacity="0.7" />
            <rect x="22" y="40" width="10" height="8" rx="1" fill="#0284c7" fillOpacity="0.6" />

            {/* Heavy Bullbar on Front */}
            <path d="M88 56 L94 62 L94 68 L88 68" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

            {/* Dual Red/Blue Police Strobe Bar */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '0.3s' }}>
              <rect x="42" y="31" width="7" height="4" rx="1" fill="#ef4444" />
              <rect x="49" y="31" width="7" height="4" rx="1" fill="#3b82f6" />
              <circle cx="49" cy="30" r="8" fill="#38bdf8" fillOpacity="0.4" />
            </g>
          </svg>
        </div>
      );

    case 'cargoTruck':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-amber-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cargoBox" x1="12" y1="20" x2="62" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d97706" />
                <stop offset="0.7" stopColor="#b45309" />
                <stop offset="1" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Multi-Axle Heavy Wheels */}
            <ellipse cx="24" cy="75" rx="7.5" ry="7.5" fill="#090d16" stroke="#475569" strokeWidth="2" />
            <circle cx="24" cy="75" r="3" fill="#cbd5e1" />
            <ellipse cx="38" cy="75" rx="7.5" ry="7.5" fill="#090d16" stroke="#475569" strokeWidth="2" />
            <circle cx="38" cy="75" r="3" fill="#cbd5e1" />
            <ellipse cx="76" cy="75" rx="7.5" ry="7.5" fill="#090d16" stroke="#475569" strokeWidth="2" />
            <circle cx="76" cy="75" r="3" fill="#cbd5e1" />

            {/* Logistics Container Box */}
            <rect x="12" y="26" width="50" height="42" rx="3" fill="url(#cargoBox)" stroke="#fcd34d" strokeWidth="1.5" />
            {/* Ribbed Container Lines */}
            <line x1="22" y1="26" x2="22" y2="68" stroke="#78350f" strokeWidth="1.5" />
            <line x1="32" y1="26" x2="32" y2="68" stroke="#78350f" strokeWidth="1.5" />
            <line x1="42" y1="26" x2="42" y2="68" stroke="#78350f" strokeWidth="1.5" />
            <line x1="52" y1="26" x2="52" y2="68" stroke="#78350f" strokeWidth="1.5" />

            {/* NDMA Relief Logo on Container */}
            <rect x="25" y="36" width="24" height="12" rx="1.5" fill="#ffffff" fillOpacity="0.9" />
            <text x="27" y="45" fill="#b45309" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">NDMA</text>

            {/* Truck Cabin */}
            <path
              d="M62 38 L76 38 L84 46 L88 54 L88 70 L62 70 Z"
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Cabin Glass */}
            <path d="M66 42 L76 42 L82 48 L66 48 Z" fill="#e0f2fe" fillOpacity="0.8" />

            {/* Reflective Hazard Chevrons on Rear */}
            <path d="M12 56 L16 62 M12 62 L16 68" stroke="#facc15" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'reconDrone':
      return (
        <div
          className={`relative flex items-center justify-center shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          {showGlow && (
            <div className="absolute inset-1 rounded-full bg-purple-500/20 blur-md pointer-events-none" />
          )}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="droneCore" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9333ea" />
                <stop offset="1" stopColor="#581c87" />
              </linearGradient>
            </defs>

            {/* Drone Carbon Arms (X-Frame) */}
            <line x1="20" y1="20" x2="80" y2="80" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />

            {/* 4 Spinning Rotors with Animated Spin */}
            {[
              { cx: 20, cy: 20, col: '#38bdf8' },
              { cx: 80, cy: 20, col: '#38bdf8' },
              { cx: 20, cy: 80, col: '#a855f7' },
              { cx: 80, cy: 80, col: '#a855f7' },
            ].map((pos, i) => (
              <g key={i}>
                <circle cx={pos.cx} cy={pos.cy} r="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                <g
                  className={animated ? 'animate-spin' : ''}
                  style={{ transformOrigin: `${pos.cx}px ${pos.cy}px`, animationDuration: '0.18s' }}
                >
                  <ellipse cx={pos.cx} cy={pos.cy} rx="16" ry="3.5" fill={pos.col} fillOpacity="0.35" />
                  <line x1={pos.cx - 15} y1={pos.cy} x2={pos.cx + 15} y2={pos.cy} stroke="#ffffff" strokeWidth="2" />
                </g>
              </g>
            ))}

            {/* Center Avionics Body & 4K Thermal Gimbal */}
            <circle cx="50" cy="50" r="16" fill="url(#droneCore)" stroke="#c084fc" strokeWidth="2" />
            <circle cx="50" cy="50" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="4" fill="#06b6d4" />

            {/* Precision Payload Drop Hook */}
            <path d="M48 66 L50 72 L54 70" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />

            {/* Flashing Navigation Strobes */}
            <g className={animated ? 'animate-pulse' : ''} style={{ animationDuration: '0.5s' }}>
              <circle cx="50" cy="36" r="2.5" fill="#22c55e" />
              <circle cx="50" cy="64" r="2.5" fill="#ef4444" />
            </g>
          </svg>
        </div>
      );

    default:
      return null;
  }
};
