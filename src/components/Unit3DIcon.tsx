import React from 'react';

export type UnitIconType =
  | 'helicopter'
  | 'ambulance'
  | 'fireEngine'
  | 'police'
  | 'motorBoat'
  | 'cargoTruck'
  | 'waterTanker'
  | 'foodKit'
  | 'pump'
  | 'generator'
  | 'tent'
  | 'machinery';

export interface Unit3DIconProps {
  type?: UnitIconType | string;
  unitType?: UnitIconType | string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  isMoving?: boolean;
  className?: string;
}

const SIZE_MAP: Record<string, { w: number; h: number; scale: number }> = {
  xs: { w: 24, h: 24, scale: 0.5 },
  sm: { w: 32, h: 32, scale: 0.65 },
  md: { w: 46, h: 46, scale: 0.9 },
  lg: { w: 64, h: 64, scale: 1.25 },
  xl: { w: 96, h: 96, scale: 1.8 },
};

export const Unit3DIcon: React.FC<Unit3DIconProps> = ({
  type,
  unitType,
  size = 'md',
  animated = true,
  isMoving,
  className = '',
}) => {
  const rawType = (type || unitType || 'helicopter').toString();
  let resolvedType: UnitIconType = 'helicopter';

  if (rawType === 'militaryHelicopter' || rawType === 'helicopter') {
    resolvedType = 'helicopter';
  } else if (rawType === 'ambulance') {
    resolvedType = 'ambulance';
  } else if (rawType === 'fireEngine' || rawType === 'fireTruck') {
    resolvedType = 'fireEngine';
  } else if (rawType === 'police' || rawType === 'policeUnit') {
    resolvedType = 'police';
  } else if (rawType === 'motorBoat' || rawType === 'boat') {
    resolvedType = 'motorBoat';
  } else if (rawType === 'cargoTruck' || rawType === 'truck') {
    resolvedType = 'cargoTruck';
  } else if (rawType === 'waterTanker' || rawType === 'waterTankers') {
    resolvedType = 'waterTanker';
  } else if (rawType === 'foodKit' || rawType === 'rationPackets') {
    resolvedType = 'foodKit';
  } else if (rawType === 'pump' || rawType === 'waterMotorPumps') {
    resolvedType = 'pump';
  } else if (rawType === 'generator' || rawType === 'emergencyGenerators') {
    resolvedType = 'generator';
  } else if (rawType === 'tent' || rawType === 'tarpTentKits') {
    resolvedType = 'tent';
  } else if (rawType === 'machinery' || rawType === 'debrisMachinery') {
    resolvedType = 'machinery';
  }

  const isAnimated = isMoving !== undefined ? isMoving : animated;

  let s: { w: number; h: number; scale: number };
  if (typeof size === 'number') {
    s = { w: size, h: size, scale: size / 50 };
  } else {
    s = SIZE_MAP[size] || SIZE_MAP.md;
  }

  // Render 3D SVG based on unit type
  switch (resolvedType) {
    case 'helicopter':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Military Rescue Helicopter (IAF / Army Air)"
        >
          {/* Subtle Ground Shadow */}
          <div
            className="absolute bottom-1 w-3/4 h-2 bg-black/40 rounded-full blur-[2px]"
            style={{ transform: 'rotateX(60deg)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible drop-shadow-md"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              {/* Cockpit Glass Gradient */}
              <linearGradient id="heliCockpitGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
              </linearGradient>

              {/* Military Camo Body Gradient */}
              <linearGradient id="heliBodyGrad" x1="0" y1="0" x2="1" y2="0.8">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="40%" stopColor="#166534" />
                <stop offset="80%" stopColor="#14532d" />
                <stop offset="100%" stopColor="#052e16" />
              </linearGradient>

              {/* Metal Skids Gradient */}
              <linearGradient id="heliMetalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Rotor Blade Blur Gradient */}
              <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#64748b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Landing Skids */}
            <g transform="translate(0, 10)">
              {/* Left Skid */}
              <rect x="24" y="72" width="46" height="3.5" rx="1.5" fill="url(#heliMetalGrad)" />
              {/* Skid Struts */}
              <line x1="34" y1="62" x2="32" y2="72" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
              <line x1="56" y1="62" x2="58" y2="72" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Tail Boom & Stabilizer */}
            <path
              d="M55,48 L88,38 L88,32 L54,42 Z"
              fill="#14532d"
              stroke="#0f172a"
              strokeWidth="0.8"
            />
            {/* Tail Fin */}
            <path d="M86,39 L92,20 L86,22 Z" fill="#15803d" stroke="#052e16" strokeWidth="0.8" />
            <path d="M86,39 L90,48 L86,45 Z" fill="#0f172a" />

            {/* Spinning Tail Rotor */}
            <g
              transform="translate(90, 24)"
              className={animated ? 'animate-[spin_0.3s_linear_infinite]' : ''}
              style={{ transformOrigin: '0px 0px' }}
            >
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="0" cy="0" r="1.5" fill="#f59e0b" />
            </g>

            {/* Main Helicopter Fuselage */}
            <ellipse cx="45" cy="50" rx="22" ry="14" fill="url(#heliBodyGrad)" stroke="#052e16" strokeWidth="1" />

            {/* 3D Highlight Curve */}
            <path
              d="M28,45 Q44,38 62,45"
              fill="none"
              stroke="#4ade80"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Indian Air Force Fin Flash / Rondel Badge */}
            <g transform="translate(48, 49) scale(0.7)">
              <circle cx="0" cy="0" r="5" fill="#f97316" />
              <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
              <circle cx="0" cy="0" r="1.6" fill="#16a34a" />
            </g>

            {/* Cockpit Windshield */}
            <path
              d="M26,46 Q24,54 32,58 L40,56 Q36,44 26,46 Z"
              fill="url(#heliCockpitGrad)"
              stroke="#0369a1"
              strokeWidth="0.8"
            />
            {/* Cockpit Reflection */}
            <path
              d="M27,47 Q30,52 34,53"
              stroke="#e0f2fe"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />

            {/* Rotor Mast & Hub */}
            <rect x="42" y="30" width="6" height="8" rx="1.5" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
            <circle cx="45" cy="30" r="3" fill="#f59e0b" />

            {/* Spinning Main Rotor Blades (3D Perspective Blur) */}
            <g
              transform="translate(45, 30)"
              className={animated ? 'animate-[spin_0.22s_linear_infinite]' : ''}
              style={{ transformOrigin: '0px 0px' }}
            >
              {/* Blade 1 & 2 */}
              <line
                x1="-44"
                y1="0"
                x2="44"
                y2="0"
                stroke="url(#bladeGrad)"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              {/* Blade 3 & 4 (Cross) */}
              <line
                x1="0"
                y1="-44"
                x2="0"
                y2="44"
                stroke="url(#bladeGrad)"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              {/* Rotor Tip Warning Marks */}
              <circle cx="-42" cy="0" r="1.8" fill="#ef4444" />
              <circle cx="42" cy="0" r="1.8" fill="#ef4444" />
              <circle cx="0" cy="-42" r="1.8" fill="#ef4444" />
              <circle cx="0" cy="42" r="1.8" fill="#ef4444" />
            </g>
          </svg>
        </div>
      );

    case 'ambulance':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Advanced Life Support (ALS) Ambulance"
        >
          {/* Ground Shadow */}
          <div
            className="absolute bottom-1 w-4/5 h-2 bg-black/40 rounded-full blur-[2px]"
            style={{ transform: 'rotateX(60deg)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              {/* Body White Gradient */}
              <linearGradient id="ambBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>

              {/* Window Glass */}
              <linearGradient id="ambGlassGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* Wheels */}
            <g transform="translate(0, 5)">
              <circle cx="30" cy="70" r="9" fill="#1e293b" />
              <circle cx="30" cy="70" r="5" fill="#94a3b8" />
              <circle cx="72" cy="70" r="9" fill="#1e293b" />
              <circle cx="72" cy="70" r="5" fill="#94a3b8" />
            </g>

            {/* 3D Main Van Chassis */}
            <path
              d="M18,36 L66,36 L84,52 L84,68 L18,68 Z"
              fill="url(#ambBodyGrad)"
              stroke="#94a3b8"
              strokeWidth="1.2"
              rx="4"
            />

            {/* Red Hi-Vis Ambulance Stripe */}
            <rect x="18" y="52" width="66" height="5" fill="#ef4444" />
            <rect x="18" y="57" width="66" height="1.8" fill="#facc15" />

            {/* Red Medical Cross */}
            <g transform="translate(38, 40)">
              <rect x="3.5" y="0" width="3" height="10" fill="#dc2626" rx="0.5" />
              <rect x="0" y="3.5" width="10" height="3" fill="#dc2626" rx="0.5" />
            </g>

            {/* Cabin Windshield & Windows */}
            <path
              d="M66,40 L78,50 L66,50 Z"
              fill="url(#ambGlassGrad)"
              stroke="#0284c7"
              strokeWidth="0.8"
            />
            <rect x="54" y="40" width="9" height="9" rx="1.5" fill="url(#ambGlassGrad)" />
            <rect x="22" y="40" width="12" height="8" rx="1" fill="#cbd5e1" />

            {/* Headlights */}
            <path d="M84,58 L86,59 L84,62 Z" fill="#fef08a" />

            {/* 3D Flashing Lightbar on Roof */}
            <g transform="translate(48, 30)">
              <rect x="0" y="2" width="18" height="4" rx="2" fill="#334155" />
              {/* Flashing Red Beacon */}
              <circle
                cx="4"
                cy="3"
                r="3.5"
                fill="#ef4444"
                className={animated ? 'animate-[ping_0.8s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}
              />
              <circle cx="4" cy="3" r="2.5" fill="#fca5a5" />

              {/* Flashing Blue Beacon */}
              <circle
                cx="14"
                cy="3"
                r="3.5"
                fill="#3b82f6"
                className={animated ? 'animate-[ping_0.8s_cubic-bezier(0,0,0.2,1)_infinite_0.4s]' : ''}
              />
              <circle cx="14" cy="3" r="2.5" fill="#93c5fd" />
            </g>
          </svg>
        </div>
      );

    case 'fireEngine':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Fire Engine & Heavy Rescue Tender"
        >
          {/* Ground Shadow */}
          <div
            className="absolute bottom-1 w-4/5 h-2 bg-black/40 rounded-full blur-[2px]"
            style={{ transform: 'rotateX(60deg)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <linearGradient id="fireTruckGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="30%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Heavy Dual Wheels */}
            <g transform="translate(0, 5)">
              <circle cx="26" cy="70" r="9" fill="#18181b" />
              <circle cx="26" cy="70" r="4.5" fill="#a1a1aa" />
              <circle cx="62" cy="70" r="9" fill="#18181b" />
              <circle cx="62" cy="70" r="4.5" fill="#a1a1aa" />
              <circle cx="78" cy="70" r="9" fill="#18181b" />
              <circle cx="78" cy="70" r="4.5" fill="#a1a1aa" />
            </g>

            {/* Truck Chassis */}
            <path
              d="M14,38 L68,38 L86,48 L86,68 L14,68 Z"
              fill="url(#fireTruckGrad)"
              stroke="#7f1d1d"
              strokeWidth="1.2"
              rx="3"
            />

            {/* Equipment Roller Shutters */}
            <rect x="18" y="44" width="16" height="20" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" rx="1" />
            <line x1="18" y1="49" x2="34" y2="49" stroke="#64748b" strokeWidth="1" />
            <line x1="18" y1="54" x2="34" y2="54" stroke="#64748b" strokeWidth="1" />
            <line x1="18" y1="59" x2="34" y2="59" stroke="#64748b" strokeWidth="1" />

            <rect x="38" y="44" width="16" height="20" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" rx="1" />
            <line x1="38" y1="49" x2="54" y2="49" stroke="#64748b" strokeWidth="1" />
            <line x1="38" y1="54" x2="54" y2="54" stroke="#64748b" strokeWidth="1" />
            <line x1="38" y1="59" x2="54" y2="59" stroke="#64748b" strokeWidth="1" />

            {/* Cab Windows */}
            <path d="M68,42 L80,48 L68,48 Z" fill="#38bdf8" />
            <rect x="58" y="42" width="8" height="8" rx="1" fill="#38bdf8" />

            {/* 3D Roof Fire Ladder */}
            <g transform="translate(14, 28)">
              <line x1="0" y1="4" x2="52" y2="4" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="9" x2="52" y2="9" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
              {/* Rungs */}
              {[6, 14, 22, 30, 38, 46].map((x) => (
                <line key={x} x1={x} y1="3" x2={x} y2="10" stroke="#94a3b8" strokeWidth="1.5" />
              ))}
            </g>

            {/* Water Monitor Cannon */}
            <circle cx="66" cy="35" r="3" fill="#64748b" />
            <line x1="66" y1="35" x2="72" y2="30" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Flashing Amber/Red Beacons on Cab */}
            <g transform="translate(70, 33)">
              <circle
                cx="3"
                cy="3"
                r="4"
                fill="#f59e0b"
                className={animated ? 'animate-[ping_0.7s_infinite]' : ''}
              />
              <circle cx="3" cy="3" r="2.5" fill="#fef08a" />
              <circle
                cx="10"
                cy="3"
                r="4"
                fill="#ef4444"
                className={animated ? 'animate-[ping_0.7s_infinite_0.35s]' : ''}
              />
              <circle cx="10" cy="3" r="2.5" fill="#fca5a5" />
            </g>
          </svg>
        </div>
      );

    case 'police':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Police Quick Response & PCR Patrol"
        >
          {/* Ground Shadow */}
          <div
            className="absolute bottom-1 w-4/5 h-2 bg-black/40 rounded-full blur-[2px]"
            style={{ transform: 'rotateX(60deg)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <linearGradient id="policeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#172554" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* High-Performance Wheels */}
            <g transform="translate(0, 5)">
              <circle cx="28" cy="70" r="9" fill="#0f172a" />
              <circle cx="28" cy="70" r="5" fill="#cbd5e1" />
              <circle cx="72" cy="70" r="9" fill="#0f172a" />
              <circle cx="72" cy="70" r="5" fill="#cbd5e1" />
            </g>

            {/* Interceptor Sedan Body */}
            <path
              d="M14,56 L24,44 L64,44 L78,54 L88,58 L88,68 L14,68 Z"
              fill="url(#policeGrad)"
              stroke="#3b82f6"
              strokeWidth="1"
            />

            {/* White Police Side Decal */}
            <polygon points="34,50 60,50 56,66 30,66" fill="#f8fafc" />
            <text x="35" y="61" fontSize="7" fontWeight="bold" fill="#1e3a8a">
              POLICE
            </text>

            {/* Windshield & Windows */}
            <polygon points="38,46 58,46 56,51 35,51" fill="#38bdf8" opacity="0.85" />
            <polygon points="60,46 72,53 60,53" fill="#0284c7" opacity="0.85" />

            {/* Front Push Bull-Bar */}
            <path d="M88,56 L93,58 L93,68 L88,68 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />

            {/* Flashing Police Red-Blue Strobe Lightbar */}
            <g transform="translate(42, 38)">
              <rect x="0" y="2" width="20" height="4" rx="2" fill="#0f172a" />
              {/* Red Flasher */}
              <circle
                cx="5"
                cy="3.5"
                r="4"
                fill="#ef4444"
                className={animated ? 'animate-[ping_0.5s_infinite]' : ''}
              />
              <circle cx="5" cy="3.5" r="2.5" fill="#fca5a5" />

              {/* Blue Flasher */}
              <circle
                cx="15"
                cy="3.5"
                r="4"
                fill="#3b82f6"
                className={animated ? 'animate-[ping_0.5s_infinite_0.25s]' : ''}
              />
              <circle cx="15" cy="3.5" r="2.5" fill="#93c5fd" />
            </g>
          </svg>
        </div>
      );

    case 'motorBoat':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Motorized Rescue Boat (NDRF / Navy Gemini)"
        >
          {/* Animated Water Spray & Ripple */}
          {animated && (
            <div className="absolute bottom-0 w-full flex justify-center items-center pointer-events-none">
              <span className="w-12 h-2.5 bg-cyan-400/20 rounded-full animate-ping blur-[1px]" />
            </div>
          )}

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <linearGradient id="boatHullGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>

              <linearGradient id="pontoonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* Water Waves */}
            <path
              d="M10,75 Q25,72 40,75 T70,75 T95,75"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M15,80 Q30,77 50,80 T85,80"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              opacity="0.6"
            />

            {/* Outboard Motor at Stern */}
            <rect x="14" y="44" width="7" height="22" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
            <path d="M12,64 L20,64 L16,74 Z" fill="#0f172a" />
            {/* Propeller Spray */}
            {animated && (
              <circle cx="10" cy="70" r="3" fill="#e0f2fe" className="animate-ping opacity-60" />
            )}

            {/* Inflatable Pontoon Collar (Gemini / Zodiac) */}
            <path
              d="M18,52 C22,46 70,44 86,56 C90,62 82,68 76,68 L22,68 C16,68 14,58 18,52 Z"
              fill="url(#pontoonGrad)"
              stroke="#0369a1"
              strokeWidth="1.5"
            />

            {/* Inner Boat Deck */}
            <path d="M26,56 L72,56 L68,64 L26,64 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />

            {/* Steering Console & Windshield */}
            <rect x="50" y="44" width="8" height="12" rx="1.5" fill="#475569" />
            <path d="M50,44 L58,44 L58,40 L52,40 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.5" />

            {/* Lifebuoy Ring on Bow */}
            <g transform="translate(68, 52) scale(0.7)">
              <circle cx="0" cy="0" r="7" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="3.5" fill="#0369a1" />
            </g>

            {/* Safety Grab Ropes along Pontoon */}
            <path
              d="M26,52 Q38,55 50,52 Q62,55 76,54"
              fill="none"
              stroke="#facc15"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
          </svg>
        </div>
      );

    case 'cargoTruck':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="NDMA Heavy Disaster Relief Logistics Carrier (10-Ton)"
        >
          {/* Ground Shadow */}
          <div
            className="absolute bottom-1 w-4/5 h-2 bg-black/40 rounded-full blur-[2px]"
            style={{ transform: 'rotateX(60deg)' }}
          />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <linearGradient id="cargoBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="cargoTarpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#172554" />
              </linearGradient>
            </defs>

            {/* Heavy Tri-Axle Wheels */}
            <g transform="translate(0, 5)">
              <circle cx="22" cy="70" r="9" fill="#18181b" />
              <circle cx="22" cy="70" r="4.5" fill="#a1a1aa" />
              <circle cx="36" cy="70" r="9" fill="#18181b" />
              <circle cx="36" cy="70" r="4.5" fill="#a1a1aa" />
              <circle cx="76" cy="70" r="9" fill="#18181b" />
              <circle cx="76" cy="70" r="4.5" fill="#a1a1aa" />
            </g>

            {/* Heavy Cargo Container / Covered Bed */}
            <path
              d="M12,34 L58,34 L58,68 L12,68 Z"
              fill="url(#cargoTarpGrad)"
              stroke="#0f172a"
              strokeWidth="1.2"
              rx="3"
            />
            {/* Tarp Straps & NDMA Logo */}
            <line x1="24" y1="34" x2="24" y2="68" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="36" y1="34" x2="36" y2="68" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="48" y1="34" x2="48" y2="68" stroke="#3b82f6" strokeWidth="1.5" />
            <rect x="26" y="44" width="18" height="12" rx="2" fill="#ffffff" opacity="0.9" />
            <text x="28" y="53" fontSize="6" fontWeight="bold" fill="#1e3a8a">NDMA</text>

            {/* Forward Driver Cabin */}
            <path
              d="M58,40 L76,40 L88,52 L88,68 L58,68 Z"
              fill="url(#cargoBodyGrad)"
              stroke="#78350f"
              strokeWidth="1.2"
              rx="3"
            />
            {/* Windshield & Windows */}
            <path d="M72,43 L84,52 L72,52 Z" fill="#38bdf8" />
            <rect x="62" y="43" width="8" height="9" rx="1" fill="#38bdf8" />

            {/* Front Headlights */}
            <path d="M88,60 L91,62 L88,64 Z" fill="#fef08a" />

            {/* Roof Warning Beacon */}
            <circle cx="74" cy="38" r="3" fill="#f59e0b" className={animated ? 'animate-ping' : ''} />
            <circle cx="74" cy="38" r="2" fill="#fef08a" />
          </svg>
        </div>
      );

    case 'waterTanker':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Potable Water Supply Tanker"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Wheels */}
            <circle cx="26" cy="70" r="8" fill="#1e293b" />
            <circle cx="42" cy="70" r="8" fill="#1e293b" />
            <circle cx="76" cy="70" r="8" fill="#1e293b" />

            {/* Cylindrical Water Tank */}
            <rect x="16" y="38" width="46" height="24" rx="12" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
            {/* Tank Straps & Water Icon */}
            <line x1="28" y1="38" x2="28" y2="62" stroke="#bae6fd" strokeWidth="1.5" />
            <line x1="50" y1="38" x2="50" y2="62" stroke="#bae6fd" strokeWidth="1.5" />
            <circle cx="39" cy="50" r="5" fill="#38bdf8" />

            {/* Driver Cab */}
            <path d="M62,44 L78,44 L86,54 L86,66 L62,66 Z" fill="#0369a1" stroke="#075985" strokeWidth="1" />
            <polygon points="66,48 76,48 80,54 66,54" fill="#e0f2fe" />
          </svg>
        </div>
      );

    case 'foodKit':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Dry Ration Food Relief Box"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Isometric 3D Cardboard Box */}
            <polygon points="50,22 80,36 50,50 20,36" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <polygon points="20,36 50,50 50,80 20,66" fill="#d97706" stroke="#b45309" strokeWidth="1" />
            <polygon points="50,50 80,36 80,66 50,80" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            {/* Box Tape & Fragile/Food Stamp */}
            <line x1="35" y1="29" x2="65" y2="43" stroke="#fde68a" strokeWidth="3" />
            <circle cx="35" cy="58" r="4" fill="#ffffff" opacity="0.8" />
          </svg>
        </div>
      );

    case 'pump':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="High-Discharge Dewatering Pump"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Tubular Cage */}
            <rect x="22" y="32" width="56" height="42" rx="6" fill="none" stroke="#6366f1" strokeWidth="4" />
            {/* Diesel Engine & Impeller Body */}
            <circle cx="50" cy="53" r="15" fill="#4338ca" stroke="#312e81" strokeWidth="1.5" />
            {/* Spinning Impeller Blades */}
            <g
              transform="translate(50, 53)"
              className={animated ? 'animate-[spin_0.8s_linear_infinite]' : ''}
              style={{ transformOrigin: '0px 0px' }}
            >
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#a5b4fc" strokeWidth="2.5" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#a5b4fc" strokeWidth="2.5" />
            </g>
            {/* Water Hose Coupling */}
            <rect x="65" y="47" width="16" height="8" rx="2" fill="#94a3b8" />
          </svg>
        </div>
      );

    case 'generator':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Emergency Mobile DG Generator"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Trailer Wheels */}
            <circle cx="35" cy="74" r="8" fill="#1e293b" />
            <circle cx="65" cy="74" r="8" fill="#1e293b" />
            {/* Acoustic Silenced Canopy */}
            <rect x="20" y="34" width="60" height="34" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
            {/* Louver Cooling Vents */}
            <line x1="28" y1="42" x2="44" y2="42" stroke="#3b0764" strokeWidth="1.5" />
            <line x1="28" y1="48" x2="44" y2="48" stroke="#3b0764" strokeWidth="1.5" />
            <line x1="28" y1="54" x2="44" y2="54" stroke="#3b0764" strokeWidth="1.5" />
            {/* High Voltage Lightning Icon */}
            <polygon points="62,40 54,52 60,52 56,62 68,48 62,48" fill="#facc15" />
          </svg>
        </div>
      );

    case 'tent':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Emergency Disaster Shelter Tent"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* 3D Ridge Tent */}
            <polygon points="50,26 82,68 18,68" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <polygon points="50,26 50,68 18,68" fill="#059669" />
            {/* Entrance Flap */}
            <polygon points="50,42 62,68 38,68" fill="#064e3b" />
            {/* Guy Ropes */}
            <line x1="50" y1="26" x2="10" y2="72" stroke="#a7f3d0" strokeWidth="1.2" />
            <line x1="50" y1="26" x2="90" y2="72" stroke="#a7f3d0" strokeWidth="1.2" />
          </svg>
        </div>
      );

    case 'machinery':
      return (
        <div
          className={`relative inline-flex items-center justify-center select-none ${className}`}
          style={{ width: s.w, height: s.h }}
          title="Heavy Excavator / Earthmover"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Heavy Caterpillar Track Base */}
            <rect x="22" y="66" width="56" height="12" rx="6" fill="#1f2937" stroke="#111827" strokeWidth="1" />
            <circle cx="30" cy="72" r="4" fill="#9ca3af" />
            <circle cx="50" cy="72" r="4" fill="#9ca3af" />
            <circle cx="70" cy="72" r="4" fill="#9ca3af" />
            {/* Rotating Cab Body */}
            <rect x="26" y="44" width="32" height="22" rx="3" fill="#eab308" stroke="#a16207" strokeWidth="1.2" />
            <rect x="42" y="48" width="12" height="10" rx="1" fill="#38bdf8" />
            {/* Hydraulic Excavator Arm & Bucket */}
            <line x1="50" y1="50" x2="72" y2="34" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" />
            <line x1="72" y1="34" x2="84" y2="52" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
            <path d="M84,52 L92,58 L82,64 Z" fill="#475569" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`inline-flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-lg ${className}`}
          style={{ width: s.w, height: s.h }}
        >
          <span className="font-bold text-xs">RES</span>
        </div>
      );
  }
};
