import { DispatchPayloadItem, ArrivalReport } from '../data/dispatchUnits';
import { UnitIconType } from '../components/Unit3DIcon';
import { DijkstraRouteResult, RoadRouteResult, computeRoadRoute } from '../utils/dijkstraRouting';

export interface DispatchMission {
  id: string;
  stateId: string;
  targetDistrict: string;
  targetCoords: [number, number];
  originDepot: string;
  originCoords: [number, number];
  // Multi-resource items in this single dispatch
  items: DispatchPayloadItem[];
  // Primary / backward-compatibility fields
  resourceType: string;
  quantity: number;
  unitLabel: string;
  primaryUnitType: UnitIconType;
  transportMode: 'Green Road Corridor' | 'Waterway Fleet / Boat' | 'High-Mobility 4x4' | 'IAF Airlift' | 'Ambulance Emergency Corridor' | 'Police Escort Convoy';
  status: 'In Transit' | 'Staged' | 'Arrived & Active';
  progress: number; // 0 to 100
  etaMinutes: number;
  priority: 'CRITICAL' | 'HIGH' | 'ROUTINE';
  dispatchedAt: string;
  arrivedAt?: string;
  arrivalReport?: ArrivalReport;
  // Realistic Road Highway Network telemetry & curved polyline path
  route?: RoadRouteResult | DijkstraRouteResult;
  roadPath?: [number, number][];
  roadDistanceKm?: number;
  straightDistanceKm?: number;
  curvatureRatio?: number;
  highwaysTraversed?: string[];
  currentHighway?: string;
  currentHeading?: number;
}

// Dispatches start empty by default so only user-initiated dispatches are tracked
export function createInitialDispatches(_stateId: string = 'bihar'): DispatchMission[] {
  return [];
}
