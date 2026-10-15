import React, { useState } from 'react';
import {
  BookOpen,
  X,
  AlertCircle,
  Terminal,
  FolderCheck,
  RefreshCw
} from 'lucide-react';
import { LoadedPipelineData } from '../types';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReplaced?: (newData: Partial<LoadedPipelineData>) => void;
  onResetToSample?: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  onDataReplaced,
  onResetToSample
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'schema' | 'uploader'>('guide');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (fileType: keyof LoadedPipelineData, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (onDataReplaced) {
          onDataReplaced({ [fileType]: parsed });
          setUploadStatus(`Successfully updated ${fileType} in memory!`);
          setTimeout(() => setUploadStatus(null), 4000);
        }
      } catch (err) {
        setUploadStatus(`Error parsing ${file.name}: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] shadow-2xl animate-card-fade">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pipeline Integration Guide & README
              </h2>
              <p className="text-xs text-white/45">
                Replacing sample files with live satellite pipeline outputs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pill Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-6 py-2.5 text-xs font-semibold gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-black font-semibold'
                : 'text-white/60 hover:text-white bg-transparent'
            }`}
          >
            How to Replace Files
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === 'schema'
                ? 'bg-white text-black font-semibold'
                : 'text-white/60 hover:text-white bg-transparent'
            }`}
          >
            Data Schemas & Attributes
          </button>
          <button
            onClick={() => setActiveTab('uploader')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === 'uploader'
                ? 'bg-white text-black font-semibold'
                : 'text-white/60 hover:text-white bg-transparent'
            }`}
          >
            Live In-Browser File Loader
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-white/70 leading-relaxed">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-[#ff8a3d]/30 bg-[#ff8a3d]/10 p-4 text-[#ff8a3d]">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Deterministic Data Policy</span>
                </div>
                <p className="text-xs text-white/80">
                  FloodScope computes zero satellite geometry and executes no AI text generation on the fly.
                  Every metric, count, and report string is derived strictly from pre-computed static files in the <code className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">/data</code> folder.
                </p>
              </div>

              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FolderCheck className="h-4 w-4 text-[#4da3ff]" />
                1. Replacing Files in Project Directory
              </h3>
              <p>
                To replace the demonstration sample data with real pipeline outputs in your deployed or locally hosted application:
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-xs text-white/70">
                <li>
                  Ensure your pipeline exports 6 files matching these exact file names into <code className="text-[#4da3ff] font-mono">public/data/</code>:
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-white/50">
                    <li><strong className="text-white">flood_extent.geojson</strong> — Polygon / MultiPolygon footprints of detected standing water</li>
                    <li><strong className="text-white">damage.geojson</strong> — Damaged or inundated buildings</li>
                    <li><strong className="text-white">roads.geojson</strong> — Road networks with <code className="text-[#ff4d5e]">status: "affected"</code> or <code className="text-white/80">"unaffected"</code></li>
                    <li><strong className="text-white">settlements.geojson</strong> — Settlements with <code className="text-[#ff4d5e]">status: "cut_off"</code>, <code className="text-[#3ddc97]">"connected"</code>, or <code className="text-[#8a8a93]">"not_assessed"</code></li>
                    <li><strong className="text-white">metadata.json</strong> — Event metadata, snapshot time, orbit IDs, threshold method/value</li>
                    <li><strong className="text-white">report_template.json</strong> — English & Nepali report templates with placeholders</li>
                  </ul>
                </li>
                <li>
                  In <code className="text-[#4da3ff] font-mono">metadata.json</code>, set <code className="text-[#3ddc97] font-mono">"is_sample_data": false</code>. This will immediately dismiss the "SAMPLE DATA, NOT REAL" banner.
                </li>
                <li>
                  Reload the page. The Leaflet map, live metrics, and Situation Report will automatically refresh.
                </li>
              </ol>

              <h3 className="mt-6 font-bold text-white text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#4da3ff]" />
                2. Automated Pipeline Output Export (Example Python / GEE Snippet)
              </h3>
              <div className="rounded-[16px] bg-black/80 p-4 font-mono text-xs text-white/80 border border-white/[0.08]">
                <pre>{`# Example export pipeline output directly into FloodScope /data folder:
import json
import geopandas as gpd

# 1. Export flood polygons
flood_gdf.to_file("public/data/flood_extent.geojson", driver="GeoJSON")

# 2. Export damaged buildings
damage_gdf.to_file("public/data/damage.geojson", driver="GeoJSON")

# 3. Export roads with status column ('affected' or 'unaffected')
roads_gdf.to_file("public/data/roads.geojson", driver="GeoJSON")

# 4. Export settlements with status ('cut_off', 'connected', 'not_assessed')
settlements_gdf.to_file("public/data/settlements.geojson", driver="GeoJSON")

# 5. Write metadata
metadata = {
    "event_name": "Koshi Basin Flood",
    "event_date": "2026-08-14",
    "snapshot_date": "2026-08-16T04:42:00Z",
    "sar_platform": "Sentinel-1C",
    "sar_orbit_numbers": "142, 219",
    "threshold_method": "Bimodal Otsu Backscatter Intensity Analysis",
    "threshold_value": "-14.85 dB",
    "is_sample_data": False
}
with open("public/data/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="font-bold text-white text-sm font-sans">
                GeoJSON Schema & Property Conventions
              </h3>
              <p className="font-sans text-white/70">
                Coordinates must use WGS84 standard (<code className="text-[#4da3ff]">EPSG:4326</code>) with coordinates ordered as <code className="text-[#4da3ff]">[longitude, latitude]</code>.
              </p>

              <div className="space-y-3">
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3.5">
                  <div className="font-bold text-[#4da3ff]">1. flood_extent.geojson</div>
                  <div className="text-white/45 text-[11px] mt-1">Geometry: Polygon or MultiPolygon</div>
                  <div className="text-white/45 text-[11px]">Key properties: <code className="text-white/80">id</code>, <code className="text-white/80">water_depth_est</code>, <code className="text-white/80">area_sqkm</code>, <code className="text-white/80">slope_filter</code></div>
                </div>

                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3.5">
                  <div className="font-bold text-[#ff8a3d]">2. damage.geojson</div>
                  <div className="text-white/45 text-[11px] mt-1">Geometry: Point</div>
                  <div className="text-white/45 text-[11px]">Key properties: <code className="text-white/80">id</code>, <code className="text-white/80">type</code>, <code className="text-white/80">building_use</code>, <code className="text-white/80">in_flood_extent: true</code>, <code className="text-white/80">damage_grade</code></div>
                </div>

                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3.5">
                  <div className="font-bold text-[#ff4d5e]">3. roads.geojson</div>
                  <div className="text-white/45 text-[11px] mt-1">Geometry: LineString</div>
                  <div className="text-white/45 text-[11px]">Key properties: <code className="text-white/80">id</code>, <code className="text-white/80">name</code>, <code className="text-[#ff4d5e]">status: "affected" | "unaffected"</code></div>
                </div>

                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3.5">
                  <div className="font-bold text-[#3ddc97]">4. settlements.geojson</div>
                  <div className="text-white/45 text-[11px] mt-1">Geometry: Point</div>
                  <div className="text-white/45 text-[11px]">Key properties: <code className="text-white/80">id</code>, <code className="text-white/80">name</code>, <code className="text-white/80">population</code>, <code className="text-[#ff4d5e]">status: "cut_off" | "connected" | "not_assessed"</code></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'uploader' && (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3.5 text-xs text-white/70">
                <span className="font-bold text-white">Instant In-Memory Preview: </span>
                You can test custom pipeline outputs right now in this browser session without touching the disk or restarting Vite. Select any GeoJSON or JSON file below.
              </div>

              {uploadStatus && (
                <div className="rounded-full bg-[#3ddc97]/15 border border-[#3ddc97]/30 px-4 py-2 text-xs font-mono text-[#3ddc97]">
                  {uploadStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Flood Extent */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">flood_extent.geojson</div>
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={(e) => handleFileUpload('floodExtent', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-[#4da3ff] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-[#4da3ff]/90 cursor-pointer"
                  />
                </div>

                {/* 2. Damage */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">damage.geojson</div>
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={(e) => handleFileUpload('damage', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-[#ff8a3d] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-[#ff8a3d]/90 cursor-pointer"
                  />
                </div>

                {/* 3. Roads */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">roads.geojson</div>
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={(e) => handleFileUpload('roads', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-[#ff4d5e] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-[#ff4d5e]/90 cursor-pointer"
                  />
                </div>

                {/* 4. Settlements */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">settlements.geojson</div>
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={(e) => handleFileUpload('settlements', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-[#3ddc97] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-[#3ddc97]/90 cursor-pointer"
                  />
                </div>

                {/* 5. Metadata */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">metadata.json</div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload('metadata', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-neutral-200 cursor-pointer"
                  />
                </div>

                {/* 6. Report Template */}
                <div className="rounded-[16px] border border-white/[0.08] bg-black/60 p-3">
                  <div className="font-bold text-white mb-1">report_template.json</div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileUpload('reportTemplate', e)}
                    className="w-full text-white/50 file:mr-2 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-neutral-200 cursor-pointer"
                  />
                </div>
              </div>

              {onResetToSample && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onResetToSample();
                      setUploadStatus('Reset to default sample dataset.');
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 py-1.5 text-xs font-semibold text-white transition-colors border border-white/[0.08]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Restore Default Sample Files</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] p-5">
          <span className="text-[11px] text-white/45">
            FloodScope Educational Decision Support Framework
          </span>
          <button
            onClick={onClose}
            className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
