import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

export const AttributionFooter: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-white/[0.08] bg-[#000000] px-4 py-8 text-xs text-white/45">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-white/70">
            <span className="flex h-2 w-2 rounded-full bg-[#4da3ff]"></span>
            <span className="font-semibold uppercase tracking-wider text-white text-xs">
              FloodScope Dashboard • Satellite SAR Disaster Intelligence
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#ff8a3d]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="font-semibold text-xs">Educational Prototype — Rescue Decision Support</span>
          </div>
        </div>

        {/* Required Exact Attributions */}
        <div className="space-y-2 rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] p-5 font-mono text-xs text-white/70">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4da3ff]" />
            <span className="font-semibold uppercase tracking-wider text-white">
              Mandatory Data & Sensor Attributions:
            </span>
          </div>
          <ul className="list-inside list-disc space-y-1.5 pl-1 leading-relaxed text-white/65">
            <li>
              <span>Contains modified Copernicus Sentinel data 2026.</span>
            </li>
            <li>
              <span>
                Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
              </span>
            </li>
            <li>
              <span>© OpenStreetMap contributors.</span>
            </li>
            <li>
              <span>
                Training data: Bountos et al., 2024 (Kuro Siwo); Bonafilia et al., CVPR Workshops 2020 (Sen1Floods11), if used.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
