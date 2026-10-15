
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Waves,
  Map as MapIcon,
  FileText,
  BookOpen,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Upload
} from 'lucide-react';
import { LoadedPipelineData, GeoJsonFeature } from './types';
import { loadAllPipelineData } from './utils/dataLoader';
import { computeMetrics } from './utils/metrics';
import { SampleDataBanner } from './components/SampleDataBanner';
import { SummaryPanel } from './components/SummaryPanel';
import { MapComponent } from './components/MapComponent';
import { SituationReportView } from './components/SituationReportView';
import { AttributionFooter } from './components/AttributionFooter';
import { ReadmeModal } from './components/ReadmeModal';

export default function App() {
  const [pipelineData, setPipelineData] =
    useState<LoadedPipelineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] =
    useState<'map' | 'sitrep'>('map');
  const [isReadmeOpen, setIsReadmeOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    feature: GeoJsonFeature;
    category: string;
  } | null>(null);

  // Load all pipeline data files.
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await loadAllPipelineData();
      setPipelineData(data);
    } catch (err) {
      console.error('Error loading FloodScope pipeline data:', err);
      setErrorMessage(
        (err as Error).message ||
          'Failed to read /data directory files.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate metrics from the loaded pipeline files.
  const metrics = useMemo(() => {
    if (!pipelineData) return null;

    return computeMetrics(
      pipelineData.floodExtent,
      pipelineData.damage,
      pipelineData.roads,
      pipelineData.settlements,
      pipelineData.metadata,
      pipelineData.buildings
    );
  }, [pipelineData]);

  // Replace loaded datasets without discarding other layers.
  const handleDataReplaced = (
    newData: Partial<LoadedPipelineData>
  ) => {
    setPipelineData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...newData
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-white selection:bg-[#4da3ff] selection:text-black font-['Inter',sans-serif]">
      {pipelineData?.metadata && (
        <SampleDataBanner
          isSampleData={Boolean(
            pipelineData.metadata.is_sample_data ?? true
          )}
          onOpenReadme={() => setIsReadmeOpen(true)}
          onOpenUpload={() => setIsReadmeOpen(true)}
        />
      )}

      <header className="no-print sticky top-0 z-40 border-b border-white/[0.08] bg-[#000000]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0c0c0e] px-3.5 py-1.5 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4da3ff] text-black">
              <Waves className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-xs font-bold tracking-tight text-white">
              FloodScope
            </span>
            <span className="hidden sm:inline-block border-l border-white/[0.08] pl-1 text-[10px] font-semibold uppercase text-white/45">
              Rescue Prototype
            </span>
          </div>

          <nav className="flex items-center rounded-full border border-white/[0.08] bg-[#0c0c0e]/90 p-1 shadow-md backdrop-blur-xl">
            <button
              onClick={() => setCurrentView('map')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                currentView === 'map'
                  ? 'bg-white font-semibold text-black shadow-sm'
                  : 'font-medium text-white/65 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map & Summary</span>
              <span className="sm:hidden">Map</span>
            </button>

            <button
              onClick={() => setCurrentView('sitrep')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                currentView === 'sitrep'
                  ? 'bg-white font-semibold text-black shadow-sm'
                  : 'font-medium text-white/65 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Situation Report</span>
              <span className="sm:hidden">SITREP</span>
            </button>

            <button
              onClick={() => setIsReadmeOpen(true)}
              className="hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition-all hover:text-white md:flex"
              title="View data pipeline schema and file replacement guide"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#4da3ff]" />
              <span>Pipeline README</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReadmeOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black shadow-sm transition-all hover:bg-neutral-200 active:scale-95"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Load Pipeline Files</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="rounded-full border border-white/[0.08] bg-[#0c0c0e] p-2 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              title="Reload files from /data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isLoading ? 'animate-spin text-[#4da3ff]' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="pointer-events-none absolute -top-8 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 select-none overflow-hidden">
          <div className="absolute left-1/4 top-0 h-[180px] w-[340px] rounded-full bg-[#ff8a3d]/[0.12] blur-[80px]" />
          <div className="absolute left-1/2 top-6 h-[180px] w-[320px] -translate-x-1/2 rounded-full bg-[#a855f7]/[0.12] blur-[80px]" />
          <div className="absolute right-1/4 top-0 h-[180px] w-[340px] rounded-full bg-[#4da3ff]/[0.15] blur-[80px]" />
        </div>

        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                FloodScope Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-base font-normal text-white/70">
                Satellite SAR flood-change candidates and preliminary
                exposure indicators for disaster assessment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-3.5 py-1 text-xs font-medium text-white/50">
                Sentinel-1 SAR • WorldDEM-30
              </span>
            </div>
          </div>
        </div>

        {isLoading && !pipelineData && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-[#4da3ff]" />
            <p className="font-mono text-sm text-white/70">
              Loading processed satellite data...
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-[20px] border border-[#ff4d5e]/40 bg-[#ff4d5e]/10 p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 shrink-0 text-[#ff4d5e]" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Failed to load pipeline data
                </h3>
                <p className="mt-1 font-mono text-xs text-white/70">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={fetchData}
                className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-all hover:bg-neutral-200 active:scale-95"
              >
                Retry Loading
              </button>
              <button
                onClick={() => setIsReadmeOpen(true)}
                className="rounded-full border border-white/[0.12] bg-[#0c0c0e] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.06]"
              >
                Check Pipeline Guide
              </button>
            </div>
          </div>
        )}

        {pipelineData && metrics && (
          <div>
            {currentView === 'map' && (
              <div className="space-y-6">
                <SummaryPanel
                  metrics={metrics}
                  metadata={pipelineData.metadata}
                  activeFilter={activeFilter}
                  onSelectFilter={setActiveFilter}
                />

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-[#4da3ff]" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                        Flood Candidates & Infrastructure Exposure
                      </h2>
                    </div>
                    <span className="text-xs text-white/45">
                      Select a map feature to inspect its GeoJSON attributes
                    </span>
                  </div>

                  <MapComponent
                    floodExtent={pipelineData.floodExtent}
                    damage={pipelineData.damage}
                    roads={pipelineData.roads}
                    settlements={pipelineData.settlements}
                    buildings={pipelineData.buildings}
                    selectedFeature={selectedFeature}
                    onSelectFeature={setSelectedFeature}
                    activeFilter={activeFilter}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-5 shadow-2xl animate-card-fade">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Preliminary Situation Report
                      </div>
                      <div className="text-xs text-white/60">
                        Building exposure is a screening result, not confirmed damage.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentView('sitrep')}
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-sm transition-all hover:bg-neutral-200 active:scale-95"
                  >
                    <span>Open Situation Report</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {currentView === 'sitrep' && (
              <SituationReportView
                reportTemplate={pipelineData.reportTemplate}
                metrics={metrics}
                metadata={pipelineData.metadata}
              />
            )}
          </div>
        )}
      </main>

      <AttributionFooter />

      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        onDataReplaced={handleDataReplaced}
        onResetToSample={fetchData}
      />
    </div>
  );
}
