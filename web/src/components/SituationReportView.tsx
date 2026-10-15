
import React, { useState } from 'react';
import {
  Printer,
  Languages,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  ComputedMetrics,
  PipelineMetadata,
  ReportTemplates
} from '../types';
import { populateReportTemplate } from '../utils/metrics';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface SituationReportViewProps {
  reportTemplate: ReportTemplates;
  metrics: ComputedMetrics;
  metadata: PipelineMetadata;
}

export const SituationReportView: React.FC<SituationReportViewProps> = ({
  reportTemplate,
  metrics,
  metadata
}) => {
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const [displayedLang, setDisplayedLang] = useState<'en' | 'ne'>('en');
  const [isCrossfading, setIsCrossfading] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const handleLanguageChange = (newLang: 'en' | 'ne') => {
    if (newLang === lang) return;

    if (prefersReduced) {
      setLang(newLang);
      setDisplayedLang(newLang);
      return;
    }

    setLang(newLang);
    setIsCrossfading(true);

    setTimeout(() => {
      setDisplayedLang(newLang);
      setIsCrossfading(false);
    }, 150);
  };

  const activeTemplate =
    displayedLang === 'en' ? reportTemplate.en : reportTemplate.ne;

  const populated = populateReportTemplate(
    activeTemplate,
    metrics,
    metadata
  );

  // Metadata values describe spatial indicators, not verified impacts.
  const analysisMetadata = metadata as PipelineMetadata & {
    road_lines_intersecting_candidates?: number;
    settlements_within_500m_of_candidates?: number;
    settlement_points_assessed?: number;
  };

  const roadLinesIntersecting =
    analysisMetadata.road_lines_intersecting_candidates ??
    metrics.affectedRoads;

  const settlementsWithin500m =
    analysisMetadata.settlements_within_500m_of_candidates ??
    metrics.settlementsCutOff;

  const settlementPointsAssessed =
    analysisMetadata.settlement_points_assessed ??
    metrics.totalSettlements;

  const buildingsIntersectingCandidates = metrics.buildingsInFlood;

  // The supplied analysis does not confirm any isolated settlements.
  const isolatedSettlementsConfirmed = 0;

  const prioritiesText =
    lang === 'en'
      ? `• Verify access conditions for the ${settlementsWithin500m} settlement points located within 500 m of candidate areas.
• Field-check the ${roadLinesIntersecting} road-line intersections to determine whether any routes are blocked or unsafe.
• Review the ${buildingsIntersectingCandidates} building footprints intersecting candidate polygons using independent imagery and field observations.
• Prioritize follow-up assessment where satellite change indicators and access information suggest potential risk.`
      : `• सम्भावित क्षेत्रको ५०० मिटरभित्र रहेका ${settlementsWithin500m} बस्ती बिन्दुको पहुँच अवस्था पुष्टि गर्नुहोस्।
• ${roadLinesIntersecting} सडक-रेखा मिलानको स्थलगत जाँच गरी कुनै मार्ग अवरुद्ध वा असुरक्षित छ कि छैन निर्धारण गर्नुहोस्।
• सम्भावित बहुभुजसँग मिल्ने ${buildingsIntersectingCandidates} भवन क्षेत्रलाई छुट्टै चित्र र स्थलगत अवलोकनबाट समीक्षा गर्नुहोस्।
• उपग्रह परिवर्तन संकेत र पहुँचसम्बन्धी जानकारीले सम्भावित जोखिम देखाएका स्थानमा थप मूल्याङ्कनलाई प्राथमिकता दिनुहोस्।`;

  const findingsText =
    lang === 'en'
      ? `The analysis identified ${metrics.floodPolygonsCount} candidate flood-change polygons. ${buildingsIntersectingCandidates} building footprints intersect candidate areas; this indicates potential exposure, not confirmed building damage or inundation. ${roadLinesIntersecting} road-line features intersect candidate polygons; this does not confirm blockage or impassability. ${settlementsWithin500m} settlement points are within 500 m of candidate areas. Proximity alone does not establish isolation or loss of access. Independent imagery review and field verification are required.`
      : `विश्लेषणले ${metrics.floodPolygonsCount} सम्भावित बाढी-परिवर्तन बहुभुज पहिचान गरेको छ। ${buildingsIntersectingCandidates} भवन क्षेत्र सम्भावित क्षेत्रसँग मिल्छन्; यसले सम्भावित जोखिम मात्र जनाउँछ, पुष्टि भएको क्षति वा डुबान होइन। ${roadLinesIntersecting} सडक-रेखा सम्भावित बहुभुजसँग मिल्छन्; यसले सडक अवरोध पुष्टि गर्दैन। ${settlementsWithin500m} बस्ती बिन्दु सम्भावित क्षेत्रको ५०० मिटरभित्र छन्। दूरी मात्रले बस्ती सम्पर्कविच्छेद वा पहुँच गुमेको प्रमाणित गर्दैन। छुट्टै चित्र समीक्षा र स्थलगत प्रमाणीकरण आवश्यक छ।`;

  const limitationsText =
    lang === 'en'
      ? `These are preliminary spatial-analysis results. ${buildingsIntersectingCandidates} building footprints intersect candidate flood-change areas; this does not confirm flooding or damage. ${roadLinesIntersecting} road-line features intersect candidate polygons; this does not confirm blockage or impassability. ${settlementsWithin500m} settlement points are within 500 m of candidate areas; proximity does not establish isolation or loss of access. ${settlementPointsAssessed} is the number of settlement points assessed in the loaded dataset, not the number confirmed safe. No isolated settlements are confirmed by these figures (confirmed isolation: ${isolatedSettlementsConfirmed}). Independent imagery review and field verification are required before operational decisions. FloodScope is an educational decision-support prototype, not an official warning or evacuation order.`
      : `यी प्रारम्भिक स्थानिक विश्लेषणका नतिजा हुन्। ${buildingsIntersectingCandidates} भवन क्षेत्र सम्भावित बाढी-परिवर्तन क्षेत्रसँग मिल्छन्; यसले डुबान वा क्षति पुष्टि गर्दैन। ${roadLinesIntersecting} सडक-रेखा सम्भावित बहुभुजसँग मिल्छन्; यसले सडक अवरोध वा आवागमन गर्न नसकिने पुष्टि गर्दैन। ${settlementsWithin500m} बस्ती बिन्दु सम्भावित क्षेत्रको ५०० मिटरभित्र छन्; नजिक हुनु मात्रले सम्पर्कविच्छेद वा पहुँच गुमेको प्रमाणित गर्दैन। ${settlementPointsAssessed} लोड गरिएको तथ्याङ्कमा मूल्याङ्कन गरिएका बस्ती बिन्दुको संख्या हो, सुरक्षित पुष्टि भएका बस्तीको संख्या होइन। यी तथ्याङ्कबाट कुनै बस्ती सम्पर्कविच्छेद भएको पुष्टि हुँदैन (पुष्टि भएका सम्पर्कविच्छेद बस्ती: ${isolatedSettlementsConfirmed})। सञ्चालनसम्बन्धी निर्णयअघि छुट्टै चित्र समीक्षा र स्थलगत प्रमाणीकरण आवश्यक छ। FloodScope शैक्षिक निर्णय-सहायता नमुना हो, आधिकारिक चेतावनी वा उद्धार आदेश होइन।`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-4 shadow-2xl sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold tracking-tight text-white">
              One-Page Situation Report (SITREP)
            </h2>
            <p className="text-xs text-white/50">
              Preliminary spatial assessment from SAR pipeline data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/[0.08] bg-black/60 p-1">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>English (EN)</span>
            </button>

            <button
              onClick={() => handleLanguageChange('ne')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                lang === 'ne'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>नेपाली (NE)</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black shadow-lg transition-all hover:bg-neutral-200 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable SITREP */}
      <div
        id="printable-sitrep"
        className={`sitrep-print-container mx-auto max-w-4xl rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-6 text-white shadow-2xl transition-all duration-150 ease-in-out md:p-8 print:m-0 print:max-w-none print:border-none print:bg-white print:p-6 print:text-black print:shadow-none ${
          isCrossfading
            ? 'translate-y-1 opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
        style={{
          transitionDuration: prefersReduced ? '0ms' : '150ms'
        }}
      >
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-5 print:border-black">
          <div className="flex flex-col justify-between gap-2 font-mono text-xs text-white/50 sm:flex-row sm:items-center print:text-gray-600">
            <div>
              <span>REPORT REF: </span>
              <strong className="text-white print:text-black">
                {metadata.pipeline_version || 'FS-SAR-2026'}-SITREP-01
              </strong>
            </div>

            <div>
              <span>CLASSIFICATION: </span>
              <span className="font-bold uppercase text-[#ffb224] print:text-black">
                {lang === 'en'
                  ? 'PRELIMINARY FLOOD-CHANGE ASSESSMENT'
                  : 'प्रारम्भिक बाढी-परिवर्तन मूल्याङ्कन'}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-black uppercase tracking-tight text-white md:text-2xl print:text-black">
              {populated.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-white/70 print:text-gray-700">
              {populated.subtitle}
            </p>
          </div>

          {/* Metadata strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-[14px] border border-white/[0.06] bg-black/60 p-3 text-xs text-white/70 sm:grid-cols-4 print:border-none print:bg-gray-100 print:text-black">
            <div>
              <span className="text-[10px] font-medium uppercase text-white/45 print:text-gray-500">
                Event Date
              </span>
              <div className="font-bold text-white print:text-black">
                {metadata.event_date || 'not available'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-white/45 print:text-gray-500">
                SAR Snapshot
              </span>
              <div className="font-bold text-white print:text-black">
                {metadata.snapshot_date || 'not available'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-white/45 print:text-gray-500">
                SAR Platform / Orbits
              </span>
              <div className="font-bold text-white print:text-black">
                {metadata.sar_orbit_numbers
                  ? `Orbits ${String(metadata.sar_orbit_numbers)}`
                  : 'not available'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-white/45 print:text-gray-500">
                Status
              </span>
              <div className="font-bold text-[#3ddc97] print:text-black">
                {metadata.is_sample_data
                  ? 'EDUCATIONAL DEMO'
                  : 'PRELIMINARY ANALYSIS'}
              </div>
            </div>
          </div>
        </div>

        {/* Preliminary figures */}
        <div className="mt-6">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/45 print:text-gray-600">
            {lang === 'en'
              ? 'Preliminary Analysis Figures'
              : 'प्रारम्भिक विश्लेषणका तथ्याङ्क'}
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center sm:grid-cols-5">
            <div className="rounded-[14px] border border-white/[0.08] bg-black/50 p-2.5 print:border-gray-400 print:bg-gray-50">
              <div className="text-[10px] font-medium uppercase text-white/45 print:text-gray-600">
                {lang === 'en' ? 'Candidate Polygons' : 'सम्भावित क्षेत्रहरू'}
              </div>
              <div className="text-2xl font-black text-[#4da3ff] print:text-black">
                {metrics.floodPolygonsCount}
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.08] bg-black/50 p-2.5 print:border-gray-400 print:bg-gray-50">
              <div className="text-[10px] font-medium uppercase text-white/45 print:text-gray-600">
                {lang === 'en'
                  ? 'Potentially Exposed Buildings'
                  : 'सम्भावित जोखिममा भवन'}
              </div>
              <div className="text-2xl font-black text-[#ff8a3d] print:text-black">
                {buildingsIntersectingCandidates}
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.08] bg-black/50 p-2.5 print:border-gray-400 print:bg-gray-50">
              <div className="text-[10px] font-medium uppercase text-white/45 print:text-gray-600">
                {lang === 'en'
                  ? 'Road Lines Intersecting Candidates'
                  : 'सम्भावित क्षेत्रमा पर्ने सडक रेखा'}
              </div>
              <div className="text-2xl font-black text-[#ff4d5e] print:text-black">
                {roadLinesIntersecting}
              </div>
            </div>

            <div className="rounded-[14px] border border-white/[0.08] bg-black/50 p-2.5 print:border-gray-400 print:bg-gray-50">
              <div className="text-[10px] font-medium uppercase text-white/45 print:text-gray-600">
                {lang === 'en'
                  ? 'Settlements Within 500 m'
                  : '५०० मिटरभित्रका बस्ती बिन्दु'}
              </div>
              <div className="text-2xl font-black text-[#ff4d5e] print:text-black">
                {settlementsWithin500m}
              </div>
            </div>

            <div className="col-span-3 rounded-[14px] border border-white/[0.08] bg-black/50 p-2.5 print:border-gray-400 print:bg-gray-50 sm:col-span-1">
              <div className="text-[10px] font-medium uppercase text-white/45 print:text-gray-600">
                {lang === 'en'
                  ? 'Settlement Points Assessed'
                  : 'मूल्याङ्कन गरिएका बस्ती बिन्दु'}
              </div>
              <div className="text-2xl font-black text-[#8a8a93] print:text-black">
                {settlementPointsAssessed}
              </div>
            </div>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-white/45 print:text-gray-600">
            {lang === 'en'
              ? 'Counts describe candidate intersections and proximity only; they are not confirmed damage, road blockage, or settlement isolation.'
              : 'यी संख्या सम्भावित क्षेत्रसँगको मिलान र दूरी मात्र जनाउँछन्; पुष्टि भएको क्षति, सडक अवरोध वा बस्ती सम्पर्कविच्छेद होइनन्।'}
          </p>
        </div>

        {/* Section 1: Acquisition and parameters */}
        <div className="mt-6 space-y-2 border-t border-white/[0.08] pt-4 print:border-gray-300">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white print:text-black">
            {populated.section_metadata}
          </h3>
          <p className="text-xs leading-relaxed text-white/70 sm:text-sm print:text-gray-800">
            {populated.metadata_text}
          </p>
        </div>

        {/* Section 2: Findings */}
        <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 print:border-gray-300">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white print:text-black">
            {lang === 'en'
              ? '2. Preliminary Spatial Findings'
              : '२. प्रारम्भिक स्थानिक विश्लेषणका निष्कर्ष'}
          </h3>
          <p className="whitespace-pre-line text-xs leading-relaxed text-white/70 sm:text-sm print:text-gray-800">
            {findingsText}
          </p>
        </div>

        {/* Section 3: Response priorities */}
        <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 print:border-gray-300">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white print:text-black">
            {lang === 'en'
              ? '3. Tactical Response Priorities'
              : '३. रणनीतिक प्रतिकार्य प्राथमिकताहरू'}
          </h3>
          <div className="whitespace-pre-line rounded-[16px] border border-[#ff8a3d]/25 bg-[#ff8a3d]/10 p-4 text-xs leading-relaxed text-white/90 sm:text-sm print:border-gray-400 print:bg-gray-50 print:text-black">
            {prioritiesText}
          </div>
        </div>

        {/* Section 4: Interpretation and limitations */}
        <div className="mt-5 rounded-[16px] border border-[#ffb224]/30 bg-[#ffb224]/10 p-4 print:border-gray-400 print:bg-white print:text-black">
          <div className="mb-2 flex items-center gap-2 text-[#ffb224] print:text-black">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {lang === 'en'
                ? '4. Interpretation & Data Limitations'
                : '४. व्याख्या र तथ्याङ्कका सीमाहरू'}
            </h4>
          </div>

          <p className="text-xs leading-relaxed text-white/80 print:text-gray-800">
            {limitationsText}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-white/[0.08] pt-3.5 text-[10px] text-white/45 print:border-gray-400 print:text-gray-600">
          <div className="flex flex-col justify-between gap-1 font-mono sm:flex-row">
            <div>
              GENERATED: {new Date().toISOString()} • ENGINE: FloodScope Deterministic SITREP
            </div>
            <div>
              SOURCE: PRE-COMPUTED SATELLITE REPOSITORIES ONLY
            </div>
          </div>

          <div className="mt-2 text-[9px] leading-tight text-white/40 print:text-gray-500">
            {populated.attribution_notice}
          </div>
        </div>
      </div>
    </div>
  );
};
