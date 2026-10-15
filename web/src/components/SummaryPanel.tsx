import React, { useState } from 'react';
import {
  Waves,
  Home,
  Route,
  AlertOctagon,
  HelpCircle,
  Calendar,
  Clock,
  Satellite,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { ComputedMetrics, PipelineMetadata } from '../types';
import { formatOrbitNumbers } from '../utils/metrics';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface SummaryPanelProps {
  metrics: ComputedMetrics;
  metadata: PipelineMetadata;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  metrics,
  metadata,
  activeFilter,
  onSelectFilter,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const prefersReduced = usePrefersReducedMotion();

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-IN').format(value);

  const orbitsDisplay = formatOrbitNumbers(metadata.sar_orbit_numbers);

  const cards = [
    {
      id: 'flood',
      title: 'Candidate Polygons',
      value: formatNumber(metrics.floodPolygonsCount),
      subtitle: 'Potential flood-change areas',
      icon: <Waves className="h-4 w-4" />,
      color: '#4da3ff',
      assessed: true,
    },
    {
      id: 'buildings_exposed',
      title: 'Potentially Exposed Buildings',
      value: formatNumber(metrics.buildingsInFlood),
      subtitle: 'Footprints intersecting preliminary flood-change candidates; damage unverified',
      icon: <Home className="h-4 w-4" />,
      color: '#ff8a3d',
      assessed: true,
    },

{
  id: 'roads_affected',
  title: 'Road Lines Intersecting Candidates',
  value: formatNumber(
    Number(metadata.road_lines_intersecting_candidates ?? 0)
  ),
  subtitle: `${formatNumber(
    Number(metadata.road_line_features_assessed ?? 0)
  )} road-line features assessed; intersection does not confirm damage`,
  icon: <Route className="h-4 w-4" />,
  color: '#ff4d5e',
  assessed: true,
},


{
  id: 'settlements_cutoff',
  title: 'Settlements Near Candidates',
  value: formatNumber(
    Number(metadata.settlements_within_500m_of_candidates ?? 0)
  ),
  subtitle: `${formatNumber(
    Number(metadata.settlement_points_assessed ?? 0)
  )} settlement points assessed; cut-off status unverified`,
  icon: <AlertOctagon className="h-4 w-4" />,
  color: '#ff4d5e',
  assessed: true,
},

    {
      id: 'reference_comparison',
      title: 'Reference Comparison',
      value: 'Preliminary',
      subtitle: 'Reference and SAR acquisition dates differ',
      icon: <HelpCircle className="h-4 w-4" />,
      color: '#a1a1aa',
      assessed: true,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-[#4da3ff]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
            ASMR1 Research Summary
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-white/45 sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#3ddc97]" />
            <span>Pre-computed results</span>
          </span>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-3.5 py-1 text-xs font-medium text-white transition hover:bg-white/[0.1]"
          >
            {isOpen ? 'Collapse' : 'Expand'}
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        style={{ transitionDuration: prefersReduced ? '0ms' : '300ms' }}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 p-5">
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/45">
                  Analysis indicators
                </span>
                <span className="text-xs text-white/45">
                  Candidate detections are not confirmed flooding
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {cards.map((card) => {
                  const isActive = activeFilter === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        if (card.assessed) {
                          onSelectFilter?.(isActive ? null : card.id);
                        }
                      }}
                      disabled={!card.assessed}
                      className={`group flex min-h-[150px] flex-col justify-between rounded-[20px] border p-4 text-left transition-all ${
                        isActive
                          ? 'border-[#4da3ff] bg-[#4da3ff]/15 ring-1 ring-[#4da3ff]'
                          : 'border-white/[0.08] bg-[#0c0c0e]'
                      } ${
                        card.assessed
                          ? 'cursor-pointer hover:border-white/[0.18] hover:bg-white/[0.02]'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-white/70">
                          {card.title}
                        </span>
                        <span
                          className="shrink-0 rounded-full p-1.5"
                          style={{
                            backgroundColor: `${card.color}22`,
                            color: card.color,
                          }}
                        >
                          {card.icon}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div
                          className={`font-extrabold tracking-tight text-white ${
                            card.value.length > 10 ? 'text-lg' : 'text-2xl'
                          }`}
                        >
                          {card.value}
                        </div>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-white/45">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[16px] border border-white/[0.08] bg-[#0c0c0e] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Satellite className="h-4 w-4 text-[#4da3ff]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Sensor &amp; processing metadata
                </span>
                <span className="ml-auto rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] text-white/80">
                  {metadata.pipeline_version || 'ASMR1'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[12px] border border-white/[0.06] bg-black/50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-white/45">
                    <Calendar className="h-3.5 w-3.5 text-[#4da3ff]" />
                    Before acquisition
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {metadata.before_acquisition_date || metadata.event_date || 'Not available'}
                  </div>
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-black/50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-white/45">
                    <Clock className="h-3.5 w-3.5 text-[#4da3ff]" />
                    After acquisition
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {metadata.after_acquisition_date || metadata.snapshot_date || 'Not available'}
                  </div>
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-black/50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-white/45">
                    <Satellite className="h-3.5 w-3.5 text-[#4da3ff]" />
                    Platform / orbit
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {metadata.sar_platform || 'Sentinel-1 SAR'}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">{orbitsDisplay}</div>
                </div>

                <div className="rounded-[12px] border border-white/[0.06] bg-black/50 p-3">
                  <div className="mb-1 text-white/45">Coordinate system</div>
                  <div className="text-sm font-semibold text-white">
                    {metadata.crs || 'EPSG:4326'}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {metadata.area_of_interest || 'Nepal study area'}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Detection method
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/75">
                  {metadata.threshold_method || 'SAR backscatter-change analysis'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                  Thresholds: {metadata.threshold_value || 'Not specified'}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-[#ff8a3d]/20 bg-[#ff8a3d]/[0.05] p-3">
                <p className="text-xs leading-relaxed text-white/65">
                  <strong className="text-[#ffb078]">Interpretation:</strong>{' '}
                  The potentially exposed building count represents footprints that intersect preliminary flood-change candidates. It is not a confirmed count of flooded or damaged buildings. Road-line intersections and settlement proximity are preliminary
spatial-exposure indicators. They do not confirm road blockage,
isolation, or loss of access.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
