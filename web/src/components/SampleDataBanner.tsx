import React from 'react';
import { AlertTriangle, BookOpen, Upload } from 'lucide-react';

interface SampleDataBannerProps {
  isSampleData: boolean;
  onOpenReadme: () => void;
  onOpenUpload?: () => void;
}

export const SampleDataBanner: React.FC<SampleDataBannerProps> = ({
  isSampleData,
  onOpenReadme,
  onOpenUpload
}) => {
  if (!isSampleData) return null;

  return (
    <div className="no-print bg-[#f59e0b] text-black px-4 py-2.5 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[#f59e0b] font-black">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#f59e0b]">
              SAMPLE DATA, NOT REAL
            </span>
            <span className="font-medium text-xs sm:text-sm text-black">
              Demonstration dataset loaded. Numbers and flood footprints are synthetic simulations for operational training.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 rounded-full bg-black/90 hover:bg-black px-3 py-1 text-xs font-semibold text-[#f59e0b] transition-all hover:scale-105 active:scale-95"
              title="Upload your own pipeline files"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Load Pipeline Files</span>
            </button>
          )}
          <button
            onClick={onOpenReadme}
            className="flex items-center gap-1.5 rounded-full bg-black/15 hover:bg-black/25 px-3 py-1 text-xs font-semibold text-black transition-colors border border-black/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>How to Replace with Pipeline Output</span>
          </button>
        </div>
      </div>
    </div>
  );
};
