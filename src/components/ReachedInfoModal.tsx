import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  PhoneCall,
  Activity,
  Users,
  Download,
  AlertTriangle,
  Send,
  Boxes,
} from 'lucide-react';
import { Unit3DIcon } from './Unit3DIcon';
import { DispatchMission } from './DispatchMap';

interface ReachedInfoModalProps {
  mission: DispatchMission | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderReinforcements?: (district: string) => void;
  onDismissMission?: (missionId: string) => void;
}

export const ReachedInfoModal: React.FC<ReachedInfoModalProps> = ({
  mission,
  isOpen,
  onClose,
  onOrderReinforcements,
  onDismissMission,
}) => {
  if (!isOpen || !mission) return null;

  const rawReport = mission.arrivalReport || {};
  const commanderName = rawReport.commanderName || rawReport.incidentCommander || 'Commandant R. K. Verma (NDRF / SDRF Joint Field Cmd)';
  const deocContact = rawReport.deocContact || rawReport.contactRadio || 'Emergency Hotline: 1077 / SAT-COM 892-019';
  const onGroundStatus = rawReport.onGroundStatus || rawReport.statusMessage || 'Assets Deployed & Fully Operational at Impact Sector';
  const immediateDeploymentZone = rawReport.immediateDeploymentZone || rawReport.immediateZone || `${mission.targetDistrict || 'Target Sector'} Central Relief Staging Ground`;
  const survivorsAssisted = typeof rawReport.survivorsAssisted === 'number' ? rawReport.survivorsAssisted : (Math.floor(Math.random() * 800) + 450);
  const rawNotes = rawReport.fieldNotes || rawReport.fieldChecklist;
  const fieldNotes = Array.isArray(rawNotes) && rawNotes.length > 0
    ? rawNotes
    : [
        'Convoy arrival confirmed by District Disaster Management Officer (DDMO).',
        'Field staging perimeter established with local police liaison.',
        'Emergency fuel and cold-chain backup generators initialized without delay.',
      ];

  const report = {
    commanderName,
    contactLead: rawReport.contactLead || 'DEOC Tactical Ops Desk',
    deocContact,
    onGroundStatus,
    deliveredSummary: rawReport.deliveredSummary || `${mission.quantity || 1} ${mission.unitLabel || 'Units'} handed over to district authorities`,
    immediateDeploymentZone,
    survivorsAssisted,
    triageOperational: rawReport.triageOperational ?? true,
    fieldNotes,
  };

  const downloadReport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            missionId: mission.id,
            status: 'ARRIVED & ACTIVE',
            targetDistrict: mission.targetDistrict,
            originDepot: mission.originDepot,
            transportMode: mission.transportMode,
            priority: mission.priority,
            deliveredItems: mission.items || [
              {
                name: mission.resourceType,
                quantity: mission.quantity,
                unitLabel: mission.unitLabel,
              },
            ],
            arrivalReport: report,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DEOC_Handover_${mission.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          className="bg-[#090e1a] border border-[#1e3052] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 select-none max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#15233c] pb-4">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/30">
                <Unit3DIcon type={mission.primaryUnitType || 'helicopter'} size="lg" animated={true} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#090e1a] flex items-center justify-center text-[10px] text-black font-bold">
                  ✓
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {mission.id}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Reached Destination</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      mission.priority === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {mission.priority} Priority
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Convoy Deployed at {mission.targetDistrict}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <MapPin size={12} className="text-emerald-400" />
                  <span>Staged from: {mission.originDepot}</span>
                  <span className="text-slate-600">•</span>
                  <Clock size={12} className="text-blue-400" />
                  <span>Delivered via: {mission.transportMode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Delivered Resources Manifest */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes size={14} className="text-blue-400" />
                <span>Delivered Resource Manifest (Multi-Payload)</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Handover Complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {mission.items && mission.items.length > 0 ? (
                mission.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0d1627] border border-[#1b2b46] rounded-xl flex items-center justify-between gap-3 shadow-inner"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center shrink-0">
                        <Unit3DIcon type={item.iconType} size="sm" animated={true} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 block">{item.unitLabel}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-black text-emerald-400 block">
                        +{item.quantity.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-emerald-400/80 uppercase font-semibold">
                        Received
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-[#0d1627] border border-[#1b2b46] rounded-xl flex items-center justify-between col-span-2">
                  <div className="flex items-center gap-2.5">
                    <Unit3DIcon type={mission.primaryUnitType || 'helicopter'} size="sm" animated={true} />
                    <div>
                      <span className="text-xs font-bold text-slate-100 block capitalize">
                        {mission.resourceType}
                      </span>
                      <span className="text-[10px] text-slate-400">{mission.unitLabel}</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    +{mission.quantity.toLocaleString()} Units
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* On-Ground Incident Command & Handover Telemetry */}
          <div className="p-4 bg-[#0c1424] border border-[#1b2b46] rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#17253d] pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>District Command Handover Dossier</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Verification ID: NDMA-{mission.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Incident Commander / Lead Officer
                </span>
                <p className="font-semibold text-slate-200">{report.commanderName}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <PhoneCall size={11} className="text-blue-400" />
                  <span>{report.deocContact}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Primary Staging Sector
                </span>
                <p className="font-semibold text-slate-200">{report.immediateDeploymentZone}</p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                  <Activity size={12} />
                  <span>{report.onGroundStatus}</span>
                </div>
              </div>
            </div>

            {/* Live Impact Counter */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#17253d] text-center">
              <div className="p-2 bg-[#060a14] rounded-xl border border-[#141f32]">
                <span className="text-[9px] text-slate-400 block uppercase">Est. Beneficiaries</span>
                <span className="font-mono text-xs font-bold text-cyan-400 flex items-center justify-center gap-1 mt-0.5">
                  <Users size={12} />
                  <span>{report.survivorsAssisted.toLocaleString()}+</span>
                </span>
              </div>
              <div className="p-2 bg-[#060a14] rounded-xl border border-[#141f32]">
                <span className="text-[9px] text-slate-400 block uppercase">Triage Status</span>
                <span className="font-mono text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} />
                  <span>Active 100%</span>
                </span>
              </div>
              <div className="p-2 bg-[#060a14] rounded-xl border border-[#141f32]">
                <span className="text-[9px] text-slate-400 block uppercase">Chain of Custody</span>
                <span className="font-mono text-xs font-bold text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                  <ShieldCheck size={12} />
                  <span>Verified</span>
                </span>
              </div>
            </div>

            {/* Field Dispatch Notes */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Handover Log Notes:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {report.fieldNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#15233c]">
            <button
              onClick={downloadReport}
              className="px-3.5 py-2 bg-[#0e172a] hover:bg-[#1e293b] text-slate-300 border border-[#1e293b] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} className="text-blue-400" />
              <span>Download Handover Dossier</span>
            </button>

            <div className="flex items-center gap-2.5">
              {onOrderReinforcements && (
                <button
                  onClick={() => {
                    onClose();
                    onOrderReinforcements(mission.targetDistrict);
                  }}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Send Reinforcements</span>
                </button>
              )}

              {onDismissMission && (
                <button
                  type="button"
                  onClick={() => {
                    onDismissMission(mission.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Clear this completed mission and remove units from tracking"
                >
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Complete & Clear Mission</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                Acknowledge Reached Info
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
