import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Download,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Layers,
  Truck,
  Activity,
  MapPin,
  Building2,
  Flame,
  HeartPulse,
  Wifi,
  LifeBuoy,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { useDisasterSimulation } from '../context/DisasterSimulationContext';
import { generateSimulationReport, SimulationReportData, ReportAreaRanking } from '../utils/reportGenerator';

export const ExportReportModal: React.FC = () => {
  const {
    activeParams,
    cachedDistricts,
    dispatches,
    statesData,
    isExportReportOpen,
    setIsExportReportOpen,
  } = useDisasterSimulation();

  // Statewise filtering selection
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [activePageIndex, setActivePageIndex] = useState<number | 'all'>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate dynamic live report data based on current disaster parameters, dispatches, and selected state
  const reportData: SimulationReportData = useMemo(() => {
    return generateSimulationReport(activeParams, cachedDistricts, dispatches, selectedStateFilter, statesData);
  }, [activeParams, cachedDistricts, dispatches, selectedStateFilter, statesData]);

  // Dynamic Pagination Splitting:
  // Page 1 holds Header, Information Box, Official Disclaimer, Executive Summary, and top 12 hotspots
  // Continuation pages comfortably hold up to 24 zones per page to fully use the A4 page height
  // Any remaining space on Page 1 and continuation pages is filled with tactical operational directives
  const { page1Zones, continuationZoneChunks, totalPages } = useMemo(() => {
    const all = reportData.priorityRankings;
    const FIRST_PAGE_LIMIT = 12; // Reduced from 18 to prevent bottom tactical directives from clipping
    const CONTINUATION_PAGE_LIMIT = 24; // Reduced from 26 to ensure consistent margins

    const p1 = all.slice(0, FIRST_PAGE_LIMIT);
    const rest = all.slice(FIRST_PAGE_LIMIT);

    const chunks: ReportAreaRanking[][] = [];
    for (let i = 0; i < rest.length; i += CONTINUATION_PAGE_LIMIT) {
      chunks.push(rest.slice(i, i + CONTINUATION_PAGE_LIMIT));
    }

    // 1 (Page 1) + chunks.length (Zone Continuation pages) + 1 (Resource & Dispatch page)
    const count = 1 + chunks.length + 1;
    return {
      page1Zones: p1,
      continuationZoneChunks: chunks,
      totalPages: count,
    };
  }, [reportData.priorityRankings]);

  if (!isExportReportOpen) return null;

  // High-Resolution Multi-Page PDF Download via jsPDF & html2canvas-pro
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    const prevIndex = activePageIndex;
    try {
      // Temporarily switch to 'all' so every page DOM node is mounted and rendered
      if (activePageIndex !== 'all') {
        setActivePageIndex('all');
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (!containerRef.current) {
        throw new Error('Report container is not available for capture');
      }

      // Query all rendered A4 page elements
      const pageElements = containerRef.current.querySelectorAll<HTMLElement>('.urbn-pdf-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No report pages found for PDF capture');
      }

      // Initialize A4 Portrait Document (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2, // High resolution crisp text
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      // Save PDF file with Urbn Vuln branding
      const safeState = reportData.stateFilter === 'all' ? 'NATIONAL' : reportData.stateName.replace(/\s+/g, '_').toUpperCase();
      const fileName = `URBN_VULN_${safeState}_REPORT_${reportData.simulationId}.pdf`;
      pdf.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setErrorMessage(err.message || 'Failed to generate PDF. Please try again.');
    } finally {
      if (prevIndex !== 'all') {
        setActivePageIndex(prevIndex);
      }
      setIsGeneratingPdf(false);
    }
  };

  // Reusable Urbn Vuln Header Component
  const renderUrbnHeader = (pageSubtitle: string) => (
    <div className="flex items-start justify-between border-b-2 border-[#102A43] pb-2.5">
      <div className="flex items-center gap-3">
        {/* Stylized Hexagonal Emblem */}
        <div className="w-10 h-10 rounded-xl bg-[#0F2942] flex items-center justify-center text-white shadow-md border border-[#38bdf8]/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/20 to-transparent pointer-events-none" />
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[12px] font-black tracking-tighter text-[#38bdf8] leading-none">URBN</span>
            <span className="text-[9px] font-extrabold tracking-wider text-white leading-none">VULN</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[#0F2942] leading-none">
              URBN VULN
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-[#0F2942] text-[#38bdf8] uppercase tracking-wider">
              CRISIS GRID
            </span>
          </div>
          <p className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
            Tactical Urban Vulnerability & Strategic Crisis Mobilization
          </p>
        </div>
      </div>

      <div className="text-right">
        <h2 className="text-xs sm:text-sm font-black text-[#0F2942] tracking-wide uppercase leading-tight">
          {pageSubtitle}
        </h2>
        <p className="text-[10px] font-black text-[#0284c7] font-mono mt-0.5">
          SIMULATION ID: {reportData.simulationId}
        </p>
      </div>
    </div>
  );

  // Reusable Urbn Vuln Footer Component
  const renderUrbnFooter = (pageNum: number) => (
    <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[9px] text-slate-500 font-medium shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#0F2942]">URBN VULN</span>
        <span>•</span>
        <span>NATIONAL & STATE DISASTER RESPONSE MANAGEMENT GRID • OFFICIAL STRATEGIC DIRECTIVE</span>
      </div>
      <div className="font-bold text-[#0F2942] font-mono">
        Page {pageNum} of {totalPages}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#090f1d] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:bg-white">
        
        {/* Top Header Bar with State Selector and Document Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0b1528] border-b border-blue-500/20 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  URBN VULN • Tactical Report Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {totalPages} Full A4 Pages
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {reportData.simulatedEvent} • {reportData.referenceArea}
              </p>
            </div>
          </div>

          {/* State-Wise Filter Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#081120] border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 shadow-inner">
              <Building2 size={15} className="text-blue-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Scope:</span>
              <select
                value={selectedStateFilter}
                onChange={(e) => {
                  setSelectedStateFilter(e.target.value);
                  setActivePageIndex('all');
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {reportData.availableStates.map((st) => (
                  <option key={st.id} value={st.id} className="bg-[#0b1528] text-white">
                    {st.name} ({st.count} {st.count === 1 ? 'zone' : 'zones'})
                  </option>
                ))}
              </select>
            </div>

            {/* Page View Filter */}
            <div className="hidden md:flex items-center bg-[#081120] rounded-xl p-0.5 border border-slate-700/60 text-xs">
              <button
                onClick={() => setActivePageIndex('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activePageIndex === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({totalPages})
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePageIndex(idx)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activePageIndex === idx
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  P{idx + 1}
                </button>
              ))}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Rendering {totalPages} Pages...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download PDF ({totalPages}P)</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsExportReportOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ml-1"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Sync Notice Bar */}
        <div className="px-5 py-2 bg-blue-950/40 border-b border-blue-500/15 flex items-center justify-between text-xs text-blue-300 print:hidden">
          <div className="flex items-center gap-2 truncate">
            <Activity size={14} className="text-cyan-400 shrink-0" />
            <span className="truncate">
              <strong>Dense A4 Page Utilization:</strong> Up to 24 zones/page with adaptive tactical sector analytics • Scope: <strong>{reportData.stateName}</strong> (Score: {reportData.stateVulnerabilityScore.toFixed(1)}/100 - {reportData.stateRiskTier})
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0 font-mono hidden sm:block">
            ISO 216 A4 • 100% Usable Height
          </div>
        </div>

        {/* Error message banner if any */}
        {errorMessage && (
          <div className="px-5 py-2 bg-red-950/60 border-b border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Preview Body containing all A4 Document Pages */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#040711] flex flex-col items-center gap-8 print:p-0 print:bg-white print:overflow-visible"
        >

          {/* ========================================================= */}
          {/* PAGE 1: EXECUTIVE SUMMARY & TOP PRIORITY RANKINGS         */}
          {/* ========================================================= */}
          {(activePageIndex === 'all' || activePageIndex === 0) && (
            <div
              id="pdf-page-1"
              className="urbn-pdf-page w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[14mm] flex flex-col justify-between font-sans box-border relative print:shadow-none print:p-[12mm] print:m-0 print:w-full print:min-h-0 print:break-after-page"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '100%',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            >
              {/* PAGE 1 CONTENT */}
              <div className="flex flex-col gap-2.5">
                {renderUrbnHeader('Disaster Vulnerability & Tactical Logistics Report')}

                {/* Information Box */}
                <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/70 text-[11px] text-slate-800 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-[#0F2942]">Date of Assessment: </span>
                      <span className="font-medium text-slate-700">{reportData.formattedDate}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F2942]">Simulated Event: </span>
                      <span className="font-medium text-slate-700">{reportData.simulatedEvent}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F2942]">Jurisdiction / Scope: </span>
                      <span className="font-bold text-[#0284c7]">{reportData.stateName}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-[#0F2942]">Reference Area: </span>
                      <span className="font-medium text-slate-700">{reportData.referenceArea}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F2942]">Scope Vulnerability Index: </span>
                      <span className="font-bold text-red-600 font-mono">{reportData.stateVulnerabilityScore.toFixed(1)}/100 ({reportData.stateRiskTier})</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#0F2942]">Total Impacted Zones: </span>
                      <span className="font-bold text-slate-900">{reportData.totalAffectedZonesCount} Districts Identified</span>
                    </div>
                  </div>
                </div>

                {/* Sub-banner: OFFICIAL SIMULATION RESULTS */}
                <div className="w-full py-1.5 px-3 rounded bg-[#DCE8F5] border border-[#bcd2ea] text-center">
                  <span className="text-[10.5px] font-black text-[#0F2942] tracking-wider uppercase">
                    {reportData.disclaimer}
                  </span>
                </div>

                {/* SECTION 1: EXECUTIVE SUMMARY */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full py-1 px-2.5 rounded bg-[#DCE8F5] border-l-4 border-[#0F2942]">
                    <h3 className="text-[11px] font-black text-[#0F2942] tracking-wider uppercase">
                      SECTION 1: EXECUTIVE SUMMARY ({reportData.stateName.toUpperCase()})
                    </h3>
                  </div>

                  <div className="px-1 text-[11px] text-slate-800 space-y-1">
                    <p className="font-semibold text-slate-700 italic text-[10.5px]">
                      Tactical simulation synthesis and critical impact estimates:
                    </p>
                    {reportData.executiveSummary.summaryBulletText.map((bullet, idx) => (
                      <p key={idx} className="font-medium text-slate-900 leading-snug text-[10.5px]">
                        {bullet}
                      </p>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: AFFECTED AREAS & PRIORITY RANKINGS (PAGE 1 BATCH) */}
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="w-full py-1 px-2.5 rounded bg-[#DCE8F5] border-l-4 border-[#0F2942] flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-[#0F2942] tracking-wider uppercase">
                      SECTION 2: AFFECTED AREAS & PRIORITY RANKINGS (HOTSPOTS 1 TO {page1Zones.length})
                    </h3>
                    <span className="text-[9.5px] font-bold text-[#0F2942]">
                      Total {reportData.priorityRankings.length} Zones in Assessment
                    </span>
                  </div>

                  {/* Priority Rankings Table matching exact design */}
                  <div className="overflow-hidden rounded-md border border-slate-300">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-[#0F2942] text-white">
                          <th className="py-1.5 px-2.5 font-bold text-center w-10 border-r border-slate-700">Rank</th>
                          <th className="py-1.5 px-2.5 font-bold border-r border-slate-700">Area/District</th>
                          <th className="py-1.5 px-2.5 font-bold border-r border-slate-700 w-28">State</th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-36 border-r border-slate-700">Vulnerability Score (/100)</th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-28 border-r border-slate-700">Priority Level</th>
                          <th className="py-1.5 px-2.5 font-bold text-right w-28">Impact Radius (km)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {page1Zones.map((row) => {
                          const isCritical = row.priorityLevel === 'Critical';
                          const isHigh = row.priorityLevel === 'High';

                          return (
                            <tr key={row.rank} className={row.rank % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                              <td className="py-1 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                                {row.rank}
                              </td>
                              <td className="py-1 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                                {row.district}
                              </td>
                              <td className="py-1 px-2.5 font-medium text-slate-600 border-r border-slate-200">
                                {row.state}
                              </td>
                              <td className="py-1 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200 font-mono text-[11.5px]">
                                <span className="text-slate-950 font-bold">{row.vulnerabilityScore.toFixed(1)}</span>
                                <span className="text-slate-500 font-medium text-[9.5px]">/100</span>
                              </td>
                              <td className="py-1 px-2.5 text-center border-r border-slate-200">
                                <span
                                  className={`inline-block px-2 py-0.2 rounded text-[9px] font-black uppercase text-white tracking-wide ${
                                    isCritical
                                      ? 'bg-[#DC2626]'
                                      : isHigh
                                      ? 'bg-[#EA580C]'
                                      : 'bg-[#D97706]'
                                  }`}
                                >
                                  {row.priorityLevel}
                                </span>
                              </td>
                              <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-700">
                                {row.impactRadiusKm.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Continuation Note if more zones exist */}
                  {continuationZoneChunks.length > 0 && (
                    <div className="flex items-center justify-between py-1 px-2.5 rounded bg-slate-100 border border-slate-300 text-[10px] text-[#0F2942]">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse"></span>
                        High-Priority Vulnerability Hotspots (Showing Ranks 1 to {page1Zones.length} of {reportData.priorityRankings.length})
                      </span>
                      <span className="font-semibold italic text-slate-600">
                        Continued on Page 2 with remaining {reportData.priorityRankings.length - page1Zones.length} affected zones (up to 24 per page)...
                      </span>
                    </div>
                  )}

                  {/* Comprehensive Tactical Logistics & Immediate Response Directives (Fills Page 1 completely) */}
                  <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/80 text-[10px] text-slate-800 space-y-1.5 mt-1">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-black text-[#0F2942] uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-[#0F2942] rounded-sm inline-block"></span>
                        Immediate Operational Response Directives & Sector Protocols
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">NDMA-SOP / TACTICAL STAGING</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                      <div className="space-y-1 p-2 rounded bg-white border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                          <span className="font-bold text-[#0F2942] uppercase text-[9.5px]">Arterial Ingress & Roads</span>
                        </div>
                        <p className="text-slate-600 text-[9px] leading-tight">
                          Priority clearance activated on key National & State Highway corridors. Heavy transport routes protected for non-stop convoy transit.
                        </p>
                      </div>

                      <div className="space-y-1 p-2 rounded bg-white border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                          <span className="font-bold text-[#0F2942] uppercase text-[9.5px]">Triage & Medevac Staging</span>
                        </div>
                        <p className="text-slate-600 text-[9px] leading-tight">
                          Advanced Life Support units and field triage hospitals pre-positioned at district collectorate staging grounds for rapid medical airlift.
                        </p>
                      </div>

                      <div className="space-y-1 p-2 rounded bg-white border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                          <span className="font-bold text-[#0F2942] uppercase text-[9.5px]">Relief & Power Lifeline</span>
                        </div>
                        <p className="text-slate-600 text-[9px] leading-tight">
                          Bulk potable water purification bowsers, emergency ration packets, and satellite comms relays allocated to front-line emergency shelters.
                        </p>
                      </div>
                    </div>

                    {/* Secondary Operational Protocol for Small Batch States */}
                    {page1Zones.length <= 14 && (
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-600 px-1">
                        <span className="font-semibold text-slate-700">Unified Command Protocol: Inter-agency relief coordinated via NDMA disaster logistics grid.</span>
                        <span className="font-mono text-blue-700 font-bold">AIR / GROUND / BRIDGEWAYS: 100% OPERATIONAL</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {renderUrbnFooter(1)}
            </div>
          )}

          {/* ========================================================= */}
          {/* DYNAMIC CONTINUATION PAGES FOR REMAINING AFFECTED ZONES    */}
          {/* ========================================================= */}
          {continuationZoneChunks.map((chunk, chunkIdx) => {
            const pageNum = 2 + chunkIdx;
            const startRank = chunk[0].rank;
            const endRank = chunk[chunk.length - 1].rank;
            const isLastBatch = chunkIdx === continuationZoneChunks.length - 1;

            if (activePageIndex !== 'all' && activePageIndex !== chunkIdx + 1) {
              return null;
            }

            return (
              <div
                key={`continuation-page-${chunkIdx}`}
                id={`pdf-page-${pageNum}`}
                className="urbn-pdf-page w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[14mm] flex flex-col justify-between font-sans box-border relative print:shadow-none print:p-[12mm] print:m-0 print:w-full print:min-h-0 print:break-after-page"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  maxWidth: '100%',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                }}
              >
                {/* PAGE CONTENT */}
                <div className="flex flex-col gap-2.5">
                  {renderUrbnHeader(`Affected Areas & Priority Rankings (Continuation)`)}

                  {/* Section Banner */}
                  <div className="w-full py-1 px-2.5 rounded bg-[#DCE8F5] border-l-4 border-[#0F2942] flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-[#0F2942] tracking-wider uppercase">
                      SECTION 2 (CONTINUED): AFFECTED DISTRICTS (ZONES {startRank} TO {endRank})
                    </h3>
                    <span className="text-[9.5px] font-bold text-[#0F2942]">
                      Batch {chunkIdx + 1} of {continuationZoneChunks.length} • {reportData.stateName}
                    </span>
                  </div>

                  {/* Priority Rankings Table for this page (holds up to 24 rows comfortably) */}
                  <div className="overflow-hidden rounded-md border border-slate-300">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-[#0F2942] text-white">
                          <th className="py-1.5 px-2.5 font-bold text-center w-10 border-r border-slate-700">Rank</th>
                          <th className="py-1.5 px-2.5 font-bold border-r border-slate-700">Area/District</th>
                          <th className="py-1.5 px-2.5 font-bold border-r border-slate-700 w-28">State</th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-36 border-r border-slate-700">Vulnerability Score (/100)</th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-28 border-r border-slate-700">Priority Level</th>
                          <th className="py-1.5 px-2.5 font-bold text-right w-28">Impact Radius (km)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {chunk.map((row) => {
                          const isCritical = row.priorityLevel === 'Critical';
                          const isHigh = row.priorityLevel === 'High';

                          return (
                            <tr key={row.rank} className={row.rank % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                              <td className="py-1 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                                {row.rank}
                              </td>
                              <td className="py-1 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                                {row.district}
                              </td>
                              <td className="py-1 px-2.5 font-medium text-slate-600 border-r border-slate-200">
                                {row.state}
                              </td>
                              <td className="py-1 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200 font-mono text-[11.5px]">
                                <span className="text-slate-950 font-bold">{row.vulnerabilityScore.toFixed(1)}</span>
                                <span className="text-slate-500 font-medium text-[9.5px]">/100</span>
                              </td>
                              <td className="py-1 px-2.5 text-center border-r border-slate-200">
                                <span
                                  className={`inline-block px-2 py-0.2 rounded text-[9px] font-black uppercase text-white tracking-wide ${
                                    isCritical
                                      ? 'bg-[#DC2626]'
                                      : isHigh
                                      ? 'bg-[#EA580C]'
                                      : 'bg-[#D97706]'
                                  }`}
                                >
                                  {row.priorityLevel}
                                </span>
                              </td>
                              <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-700">
                                {row.impactRadiusKm.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Standard Methodology Banner */}
                  <div className="border border-slate-200 rounded-md p-2 bg-slate-50 text-[10px] text-slate-600 flex items-center justify-between">
                    <span>
                      Vulnerability scores synthesized via Urbn Vuln multi-pillar decay model (Exposure, Sensitivity, Coping Deficit) normalized on a 0–100 scale.
                    </span>
                    <span className="font-bold text-[#0F2942] shrink-0 font-mono">
                      Showing Zones {startRank}-{endRank} ({chunk.length} items)
                    </span>
                  </div>

                  {/* USE UP THE REMAINING SPACE IF ROWS ARE FEWER THAN 20 (E.G. LAST BATCH) */}
                  {chunk.length < 20 && (
                    <div className="flex flex-col gap-2 mt-1 border-t border-slate-200 pt-2">
                      <div className="w-full py-1 px-2 rounded bg-slate-100 border-l-4 border-blue-600 flex items-center justify-between">
                        <h4 className="text-[10.5px] font-black text-[#0F2942] uppercase tracking-wide">
                          TACTICAL CRISIS IMPACT & SECTOR RISK ASSESSMENT
                        </h4>
                        <span className="text-[9px] font-bold text-slate-500 font-mono">
                          SECTOR LOGISTICS DIRECTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[9.5px]">
                        {/* Column 1: Healthcare & Medical Triage */}
                        <div className="p-2 rounded border border-red-200 bg-red-50/50 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-red-900">
                            <HeartPulse size={12} className="text-red-600 shrink-0" />
                            <span>Healthcare & Triage</span>
                          </div>
                          <p className="text-slate-700 leading-snug">
                            ALS Ambulance units prioritized for districts with score &gt; 70/100. Field hospitals alerted along highway corridors.
                          </p>
                          <div className="font-mono font-bold text-red-700 text-[9px] pt-0.5">
                            Status: Level-1 Emergency Readiness
                          </div>
                        </div>

                        {/* Column 2: Water, Food & Relief Supply */}
                        <div className="p-2 rounded border border-cyan-200 bg-cyan-50/50 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-900">
                            <LifeBuoy size={12} className="text-cyan-600 shrink-0" />
                            <span>Relief & Lifeline Grid</span>
                          </div>
                          <p className="text-slate-700 leading-snug">
                            Potable water tankers and dry rations staged at central depot nodes. Boat craft pre-deployed to riverine flood basins.
                          </p>
                          <div className="font-mono font-bold text-cyan-700 text-[9px] pt-0.5">
                            Corridor: Pre-Calculated Highway Lines
                          </div>
                        </div>

                        {/* Column 3: Communication & Power Continuity */}
                        <div className="p-2 rounded border border-indigo-200 bg-indigo-50/50 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                            <Wifi size={12} className="text-indigo-600 shrink-0" />
                            <span>Satcom & Telecom</span>
                          </div>
                          <p className="text-slate-700 leading-snug">
                            Mobile satellite terminals and emergency VHF repeaters active. Backup power generators dispatched to primary hospitals.
                          </p>
                          <div className="font-mono font-bold text-indigo-700 text-[9px] pt-0.5">
                            Telemetry: Active Geospatial GNN
                          </div>
                        </div>
                      </div>

                      {/* Additional Operational Protocol Box for deep space absorption */}
                      {chunk.length < 14 && (
                        <div className="p-2 rounded border border-slate-200 bg-slate-50 text-[9.5px] text-slate-700 space-y-1">
                          <span className="font-bold text-[#0F2942] uppercase tracking-wider text-[9px]">
                            Disaster Response Force (NDRF / SDRF) Staging Protocol:
                          </span>
                          <p className="leading-snug text-slate-600">
                            Convoys follow exact highway coordinates (NH-16, NH-22, NH-31, NH-27) to minimize transit congestion and bypass high-vulnerability river inundation zones. Staging commanders must cross-verify real-time bridge passability before vehicle release.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {renderUrbnFooter(pageNum)}
              </div>
            );
          })}

          {/* ========================================================= */}
          {/* FINAL PAGE: ALLOCATED RESOURCES & REAL ROAD DISPATCHES     */}
          {/* ========================================================= */}
          {(activePageIndex === 'all' || activePageIndex === totalPages - 1) && (
            <div
              id={`pdf-page-${totalPages}`}
              className="urbn-pdf-page w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[14mm] flex flex-col justify-between font-sans box-border relative print:shadow-none print:p-[12mm] print:m-0 print:w-full print:min-h-0"
              style={{
                width: '210mm',
                minHeight: '297mm',
                maxWidth: '100%',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            >
              {/* FINAL PAGE CONTENT */}
              <div className="flex flex-col gap-2.5">
                {renderUrbnHeader('Incident Resource Allocation & Tactical Dispatches')}

                {/* SECTION 3: ALLOCATED RESOURCES SUMMARY */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full py-1 px-2.5 rounded bg-[#DCE8F5] border-l-4 border-[#0F2942] flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-[#0F2942] tracking-wider uppercase">
                      SECTION 3: {reportData.stateFilter === 'all' ? 'NATIONAL RESOURCE GRID SUMMARY' : `STATE RESOURCE BALANCE (${reportData.stateName.toUpperCase()})`}
                    </h3>
                    <span className="text-[9.5px] font-bold text-[#0F2942]">
                      {reportData.allocatedResources.length} Strategic Asset Classes Tracked
                    </span>
                  </div>

                  {/* Allocated Resources Table with Progress Bars */}
                  <div className="overflow-hidden rounded-md border border-slate-300">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-[#0F2942] text-white">
                          <th className="py-1.5 px-2.5 font-bold w-48 border-r border-slate-700">Resource Asset Class</th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-48 border-r border-slate-700">
                            <div>Required</div>
                            <div className="flex justify-between text-[8.5px] font-normal text-slate-300 px-1 mt-0.5 font-mono">
                              <span>0</span>
                              <span>Baseline</span>
                            </div>
                          </th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-52 border-r border-slate-700">
                            <div>Dispatched</div>
                            <div className="flex justify-between text-[8.5px] font-normal text-slate-300 px-1 mt-0.5 font-mono">
                              <span>Mobilized</span>
                              <span>Target</span>
                            </div>
                          </th>
                          <th className="py-1.5 px-2.5 font-bold text-right w-36">
                            {reportData.stateFilter === 'all' ? 'National Reserves' : 'State Remaining'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.allocatedResources.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                            {/* Resource Type */}
                            <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                              {item.resourceType}
                            </td>

                            {/* Required Column with Filled Blue Bar */}
                            <td className="py-1.5 px-2.5 border-r border-slate-200 align-middle">
                              <div className="relative w-full h-4 bg-slate-200 rounded overflow-hidden flex items-center">
                                <div
                                  className="h-full bg-[#3B82F6] rounded transition-all flex items-center justify-end pr-1.5 text-white font-bold text-[9px]"
                                  style={{ width: `${Math.max(20, item.requiredBarPercent)}%` }}
                                >
                                  {item.required.toLocaleString()}
                                </div>
                              </div>
                            </td>

                            {/* Dispatched Column with Filled Cyan Bar */}
                            <td className="py-1.5 px-2.5 border-r border-slate-200 align-middle">
                              <div className="relative w-full h-4 bg-slate-200 rounded overflow-hidden flex items-center">
                                {item.dispatched > 0 ? (
                                  <div
                                    className="h-full bg-[#0284c7] rounded transition-all flex items-center justify-end pr-1.5 text-white font-bold text-[9px]"
                                    style={{ width: `${Math.max(15, item.dispatchedBarPercent)}%` }}
                                  >
                                    {item.dispatched.toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="w-full text-center text-slate-500 font-mono font-bold text-[9px]">
                                    0
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Remaining */}
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-800">
                              {item.remainingNationally.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 4: LIVE TACTICAL ROAD SUPPLY MISSIONS (AUTHENTIC HIGHWAY PATHING) */}
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="w-full py-1 px-2.5 rounded bg-[#DCE8F5] border-l-4 border-[#0F2942] flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-[#0F2942] tracking-wider uppercase">
                      SECTION 4: ACTIVE ROAD SUPPLY MISSIONS (MAP ROAD NETWORK FOLLOWING)
                    </h3>
                    <span className="text-[9.5px] font-bold text-[#0F2942]">
                      {reportData.dispatchMissions.length} Missions in Selected Scope
                    </span>
                  </div>

                  {/* Active Convoys Table */}
                  <div className="overflow-hidden rounded-md border border-slate-300">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-[#0F2942] text-white">
                          <th className="py-1 px-2.5 font-bold w-20 border-r border-slate-700">Mission</th>
                          <th className="py-1 px-2.5 font-bold border-r border-slate-700">Origin Depot</th>
                          <th className="py-1 px-2.5 font-bold border-r border-slate-700">Target District</th>
                          <th className="py-1 px-2.5 font-bold border-r border-slate-700">Highway Corridors</th>
                          <th className="py-1 px-2.5 font-bold text-center w-24 border-r border-slate-700">Road Dist.</th>
                          <th className="py-1 px-2.5 font-bold text-center w-20 border-r border-slate-700">ETA</th>
                          <th className="py-1 px-2.5 font-bold text-right w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.dispatchMissions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-3 px-3 text-center text-slate-500 italic">
                              No active dispatch convoys currently en route for {reportData.stateName}. Use the "New Dispatch" tool to deploy convoys.
                            </td>
                          </tr>
                        ) : (
                          reportData.dispatchMissions.slice(0, 6).map((mission, idx) => (
                            <tr key={mission.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                              <td className="py-1 px-2.5 font-mono font-bold text-blue-700 border-r border-slate-200">
                                {mission.id}
                              </td>
                              <td className="py-1 px-2.5 font-medium text-slate-800 border-r border-slate-200 truncate max-w-[130px]">
                                {mission.originDepot}
                              </td>
                              <td className="py-1 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                                {mission.targetDistrict}
                              </td>
                              <td className="py-1 px-2.5 font-mono text-[9.5px] text-slate-600 border-r border-slate-200 truncate max-w-[140px]">
                                {mission.highwaysTraversed?.slice(0, 2).join(', ') || 'NH-16/SH Arterial'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono text-slate-700 border-r border-slate-200">
                                {mission.roadDistanceKm ? `${Math.round(mission.roadDistanceKm)} km` : '185 km'}
                              </td>
                              <td className="py-1 px-2.5 text-center font-mono font-bold text-amber-700 border-r border-slate-200">
                                {mission.etaMinutes}m
                              </td>
                              <td className="py-1 px-2.5 text-right">
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-800">
                                  {mission.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Tactical Geospatial Map Verification Container */}
                  <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50 flex items-center justify-between text-[10.5px] text-slate-700 mt-0.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span className="font-bold text-slate-900">
                          Active Epicenter: [{activeParams.epicenter[1].toFixed(4)}°N, {activeParams.epicenter[0].toFixed(4)}°E]
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-500">
                        Vehicles follow OpenStreetMap road vectors & National Highway geometry with real forward bearings.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[9.5px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
                      <span>Radius: {activeParams.radiusKm} km</span>
                      <span>•</span>
                      <span>Decay: {activeParams.decayModel.toUpperCase()}</span>
                      <span>•</span>
                      <span>Scope: {reportData.stateFilter.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Operational Logistics Protocol Directive Box */}
                  <div className="border border-blue-200 rounded-md p-2 bg-blue-50/50 text-[9.5px] text-blue-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-blue-700 shrink-0" />
                      <span className="font-semibold">
                        <strong>NDMA Inter-Agency Command:</strong> All resource mobilization data synced with state emergency operations centers (SEOC).
                      </span>
                    </div>
                    <span className="font-mono font-bold text-blue-800 shrink-0">
                      SEC-LEVEL-A DIRECTIVE
                    </span>
                  </div>
                </div>

              </div>

              {renderUrbnFooter(totalPages)}
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 bg-[#0b1528] border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>
              URBN VULN report generated across <strong>{totalPages} page(s)</strong> with all {reportData.totalAffectedZonesCount} affected zones.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportReportOpen(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer font-bold"
            >
              Back to Simulation
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer shadow-sm"
            >
              {isGeneratingPdf ? 'Rendering PDF...' : 'Download Full PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
