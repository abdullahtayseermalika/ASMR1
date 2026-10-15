import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Info,
  X,
  Waves,
  Home,
  Route,
  AlertTriangle,
} from 'lucide-react';
import { GeoJsonCollection, GeoJsonFeature } from '../types';

interface MapComponentProps {
  floodExtent: GeoJsonCollection;
  damage: GeoJsonCollection;
  roads: GeoJsonCollection;
  settlements: GeoJsonCollection;
  buildings: GeoJsonCollection;
  selectedFeature: {
    feature: GeoJsonFeature;
    category: string;
  } | null;
  onSelectFeature: (
    selection: {
      feature: GeoJsonFeature;
      category: string;
    } | null
  ) => void;
  activeFilter?: string | null;
}

type LayerKey =
  | 'floodExtent'
  | 'buildings'
  | 'damage'
  | 'roads'
  | 'settlements';

interface LayerVisibility {
  floodExtent: boolean;
  buildings: boolean;
  damage: boolean;
  roads: boolean;
  settlements: boolean;
}

const STUDY_CENTER: L.LatLngExpression = [28.00025, 85.24775];

const escapeHtml = (value: unknown): string =>
  String(value ?? 'Not available').replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });

export const MapComponent: React.FC<MapComponentProps> = ({
  floodExtent,
  damage,
  roads,
  settlements,
  buildings,
  selectedFeature,
  onSelectFeature,
  activeFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const buildingsLayerRef = useRef<L.GeoJSON | null>(null);
  const damageLayerRef = useRef<L.GeoJSON | null>(null);
  const roadsLayerRef = useRef<L.GeoJSON | null>(null);
  const settlementsLayerRef = useRef<L.GeoJSON | null>(null);

  const [layersVisible, setLayersVisible] = useState<LayerVisibility>({
    floodExtent: true,
    buildings: true,
    damage: true,
    roads: false,
    settlements: false,
  });

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );

  const createPopupHtml = useCallback(
    (feature: GeoJsonFeature, category: string): string => {
      const properties = feature.properties || {};
      const entries = Object.entries(properties).slice(0, 12);

      const rows = entries
        .map(
          ([key, value]) => `
            <tr>
              <td style="padding:5px 10px 5px 0;color:#9ca3af;vertical-align:top">
                ${escapeHtml(key.replace(/_/g, ' '))}
              </td>
              <td style="padding:5px 0;color:#fff;overflow-wrap:anywhere">
                ${escapeHtml(
                  typeof value === 'object' ? JSON.stringify(value) : value
                )}
              </td>
            </tr>
          `
        )
        .join('');

      return `
        <div style="min-width:180px;max-width:280px;background:#0c0c0e;color:#fff;font-family:Inter,sans-serif">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#4da3ff;border-bottom:1px solid #303038;padding-bottom:8px;margin-bottom:8px">
            ${escapeHtml(category)}
          </div>
          ${
            rows
              ? `<table style="width:100%;font-size:11px;border-collapse:collapse"><tbody>${rows}</tbody></table>`
              : '<div style="font-size:12px;color:#a1a1aa">No additional attributes</div>'
          }
        </div>
      `;
    },
    []
  );

  const getCombinedBounds = useCallback((): L.LatLngBounds | null => {
    const layers = [
      floodLayerRef.current,
      buildingsLayerRef.current,
      damageLayerRef.current,
      roadsLayerRef.current,
      settlementsLayerRef.current,
    ];

    let bounds: L.LatLngBounds | null = null;

    for (const layer of layers) {
      if (!layer || !mapRef.current?.hasLayer(layer)) continue;

      try {
        const candidateBounds = layer.getBounds();
        if (!candidateBounds.isValid()) continue;

        if (bounds === null) {
          bounds = L.latLngBounds(
            candidateBounds.getSouthWest(),
            candidateBounds.getNorthEast()
          );
        } else {
          bounds.extend(candidateBounds);
        }
      } catch {
        // Ignore layers without usable bounds.
      }
    }

    return bounds;
  }, []);

  const handleResetBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.invalidateSize();
    const bounds = getCombinedBounds();

    if (bounds?.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 13,
      });
    } else {
      map.setView(STUDY_CENTER, 10);
    }
  }, [getCombinedBounds]);

  // Zoom to one individual footprint. The 105 candidate buildings are spread
  // across a large area, so fitting every building at once keeps each footprint
  // too small to inspect. The button focuses on the first footprint instead.
  const handleZoomToBuildings = useCallback(() => {
    const map = mapRef.current;
    const layer = buildingsLayerRef.current;
    if (!map || !layer) return;

    if (!map.hasLayer(layer)) {
      layer.addTo(map);
      layer.bringToFront();
      setLayersVisible((previous) => ({ ...previous, buildings: true }));
    }

    let firstBounds: L.LatLngBounds | null = null;
    layer.eachLayer((featureLayer: L.Layer) => {
      if (firstBounds) return;
      const candidate = featureLayer as L.Layer & { getBounds?: () => L.LatLngBounds };
      if (typeof candidate.getBounds === 'function') {
        const bounds = candidate.getBounds();
        if (bounds.isValid()) firstBounds = bounds;
      }
    });

    if (firstBounds?.isValid()) {
      map.fitBounds(firstBounds, { padding: [70, 70], maxZoom: 18 });
      if (map.getZoom() < 16) map.setZoom(16);
    } else {
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
    }
  }, []);

  // Initialize Leaflet once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: STUDY_CENTER,
      zoom: 10,
      zoomControl: false,
      preferCanvas: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topleft' }).addTo(map);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      floodLayerRef.current = null;
      buildingsLayerRef.current = null;
      damageLayerRef.current = null;
      roadsLayerRef.current = null;
      settlementsLayerRef.current = null;
    };
  }, []);

  // Rebuild map layers whenever data or visibility changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    [
      floodLayerRef,
      buildingsLayerRef,
      damageLayerRef,
      roadsLayerRef,
      settlementsLayerRef,
    ].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });

    if (floodExtent?.features?.length) {
      const layer = L.geoJSON(floodExtent as GeoJSON.FeatureCollection, {
        style: () => ({
          color: '#8cc4ff',
          weight: 1.2,
          opacity: layersVisible.floodExtent ? 0.95 : 0,
          fillColor: '#4da3ff',
          fillOpacity: layersVisible.floodExtent ? 0.48 : 0,
        }),
        onEachFeature: (feature, featureLayer) => {
          const typedFeature = feature as unknown as GeoJsonFeature;

          featureLayer.bindPopup(
            createPopupHtml(typedFeature, 'Potential Flood-Change Candidate'),
            { className: 'floodscope-popup' }
          );

          featureLayer.on('click', () => {
            if (layersVisible.floodExtent) {
              onSelectFeature({
                feature: typedFeature,
                category: 'Flood Candidate',
              });
            }
          });
        },
      });

      floodLayerRef.current = layer;
      if (layersVisible.floodExtent) {
        layer.addTo(map);
        layer.bringToBack();
      }
    }

    // These footprints intersect preliminary flood-change candidates.
    // They indicate potential exposure, not verified flood damage.
    if (buildings?.features?.length) {
      const layer = L.geoJSON(
        buildings as GeoJSON.FeatureCollection,
        {
          style: () => ({
            color: '#fff176',
            weight: 2.5,
            opacity: 1,
            fillColor: '#ff6b00',
            fillOpacity: 0.95,
          }),
          onEachFeature: (feature, featureLayer) => {
            const typedFeature = feature as unknown as GeoJsonFeature;

            featureLayer.bindPopup(
              createPopupHtml(
                typedFeature,
                'Potentially Exposed Building — Not Confirmed Damage'
              ),
              { className: 'floodscope-popup' }
            );

            featureLayer.on('click', () => {
              if (layersVisible.buildings) {
                onSelectFeature({
                  feature: typedFeature,
                  category: 'Potentially Exposed Building',
                });
              }
            });
          },
        }
      );

      buildingsLayerRef.current = layer;
      if (layersVisible.buildings) {
        layer.addTo(map);
        layer.bringToFront();
      }
    }

    if (damage?.features?.length) {
      const layer = L.geoJSON(
        damage as GeoJSON.FeatureCollection,
        {
          // This dataset contains building polygons, not only point features.
          // Orange means potential exposure; it does not confirm actual damage.
          style: (feature) => {
            const properties = feature?.properties ?? {};
            const isUnverified =
              properties.damage_status === 'unverified';

            return {
              color: isUnverified ? '#ffd166' : '#ff4d5e',
              weight: 2.5,
              opacity: 1,
              fillColor: isUnverified ? '#ff8a3d' : '#ff4d5e',
              fillOpacity: 0.85,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const typedFeature = feature as unknown as GeoJsonFeature;

            featureLayer.bindPopup(
              createPopupHtml(
                typedFeature,
                'Building Exposure Assessment — Damage Unverified'
              ),
              { className: 'floodscope-popup' }
            );

            featureLayer.on('click', () => {
              onSelectFeature({
                feature: typedFeature,
                category: 'Building Exposure Assessment',
              });
            });
          },
        }
      );

      damageLayerRef.current = layer;

      if (layersVisible.damage) {
        layer.addTo(map);
        layer.bringToFront();
      }
    }

    if (roads?.features?.length) {
      const layer = L.geoJSON(roads as GeoJSON.FeatureCollection, {
        style: (feature) => ({
          color:
            String(feature?.properties?.status ?? '').toLowerCase() ===
            'affected'
              ? '#ff4d5e'
              : '#b0b0b8',
          weight: 2,
          opacity: 0.9,
        }),
        onEachFeature: (feature, featureLayer) => {
          const typedFeature = feature as unknown as GeoJsonFeature;
          featureLayer.bindPopup(
            createPopupHtml(typedFeature, 'Road Feature')
          );
          featureLayer.on('click', () =>
            onSelectFeature({
              feature: typedFeature,
              category: 'Road',
            })
          );
        },
      });

      roadsLayerRef.current = layer;
      if (layersVisible.roads) layer.addTo(map);
    }

    if (settlements?.features?.length) {
      const layer = L.geoJSON(settlements as GeoJSON.FeatureCollection, {
        pointToLayer: (_feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 5,
            color: '#ffffff',
            weight: 1.5,
            fillColor: '#8a8a93',
            fillOpacity: 0.9,
          }),
        onEachFeature: (feature, featureLayer) => {
          const typedFeature = feature as unknown as GeoJsonFeature;
          featureLayer.bindPopup(
            createPopupHtml(typedFeature, 'Settlement Feature')
          );
          featureLayer.on('click', () =>
            onSelectFeature({
              feature: typedFeature,
              category: 'Settlement',
            })
          );
        },
      });

      settlementsLayerRef.current = layer;
      if (layersVisible.settlements) layer.addTo(map);
    }

    const timer = window.setTimeout(handleResetBounds, 150);
    return () => window.clearTimeout(timer);
  }, [
    floodExtent,
    buildings,
    damage,
    roads,
    settlements,
    layersVisible,
    createPopupHtml,
    handleResetBounds,
    onSelectFeature,
  ]);

  // Open the selected feature's popup.
  useEffect(() => {
    if (!selectedFeature) return;

    const layers = [
      floodLayerRef.current,
      buildingsLayerRef.current,
      damageLayerRef.current,
      roadsLayerRef.current,
      settlementsLayerRef.current,
    ];

    for (const group of layers) {
      if (!group) continue;

      group.eachLayer((layer: L.Layer) => {
        const geoLayer = layer as L.Layer & {
          feature?: GeoJSON.Feature;
          openPopup?: () => void;
        };

        if (geoLayer.feature === selectedFeature.feature) {
          geoLayer.openPopup?.();
        }
      });
    }
  }, [selectedFeature]);

  const toggleLayer = (key: LayerKey) => {
    setLayersVisible((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const layerOptions: {
    key: LayerKey;
    label: string;
    color: string;
    icon: React.ReactNode;
    available: boolean;
  }[] = [
    {
      key: 'floodExtent',
      label: 'Potential Flood-Change Candidates',
      color: '#4da3ff',
      icon: <Waves className="h-4 w-4" />,
      available: Boolean(floodExtent?.features?.length),
    },
    {
      key: 'buildings',
      label: 'Potentially Exposed Buildings',
      color: '#ff8a3d',
      icon: <Home className="h-4 w-4" />,
      available: Boolean(buildings?.features?.length),
    },
    {
      key: 'damage',
      label: 'Building Exposure — Damage Unverified',
      color: '#ffb078',
      icon: <Home className="h-4 w-4" />,
      available: Boolean(damage?.features?.length),
    },
    {
      key: 'roads',
      label: 'Road Impacts',
      color: '#ff4d5e',
      icon: <Route className="h-4 w-4" />,
      available: Boolean(roads?.features?.length),
    },
    {
      key: 'settlements',
      label: 'Settlement Status',
      color: '#8a8a93',
      icon: <AlertTriangle className="h-4 w-4" />,
      available: Boolean(settlements?.features?.length),
    },
  ];

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
      <div ref={containerRef} className="z-0 h-full w-full" />

      <div className="absolute right-3 top-3 z-[500] flex flex-wrap items-center gap-2">
        <button
          onClick={handleResetBounds}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0c0c0e]/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-white/[0.1]"
          title="Fit the map to available data"
        >
          <Maximize2 className="h-3.5 w-3.5 text-[#4da3ff]" />
          <span className="hidden sm:inline">Fit Data</span>
        </button>

        <button
          onClick={handleZoomToBuildings}
          disabled={!buildings?.features?.length}
          className="flex items-center gap-1.5 rounded-full border border-[#ff6b00]/30 bg-[#0c0c0e]/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
          title="Zoom to potentially exposed building footprints"
        >
          <Home className="h-3.5 w-3.5 text-[#ff6b00]" />
          <span className="hidden sm:inline">Zoom to Buildings</span>
        </button>

        <button
          onClick={() => setShowLayerPanel((value) => !value)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0c0c0e]/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-white/[0.1]"
        >
          <Layers className="h-3.5 w-3.5" />
          Map Layers
        </button>

        <button
          onClick={() => setShowLegend((value) => !value)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0c0c0e]/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition hover:bg-white/[0.1]"
        >
          <Info className="h-3.5 w-3.5" />
          Legend
        </button>
      </div>

      {showLayerPanel && (
        <div className="absolute right-3 top-14 z-[500] w-72 rounded-[18px] border border-white/[0.1] bg-[#0c0c0e]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Map Layers
            </span>
            <button
              onClick={() => setShowLayerPanel(false)}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close map layers"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {layerOptions.map((option) => {
              const visible = layersVisible[option.key];

              return (
                <button
                  key={option.key}
                  onClick={() => toggleLayer(option.key)}
                  disabled={!option.available}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                    visible
                      ? 'border-white/15 bg-white/[0.05] text-white'
                      : 'border-white/[0.06] text-white/60'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span className="flex items-center gap-2">
                    <span style={{ color: option.color }}>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                  {visible ? (
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-white/45">
            Building footprints shown in orange intersect preliminary
            flood-change candidates. This does not confirm flooding or damage.
            147 road lines intersect candidates; 37 settlements are within 500 m. These indicate potential exposure only, not confirmed damage or loss of access.
          </p>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[500] max-w-[285px] rounded-[16px] border border-white/[0.1] bg-[#0c0c0e]/95 p-4 text-white shadow-xl backdrop-blur-xl">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-white/70">
            Map Legend
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-sm border border-[#8cc4ff] bg-[#4da3ff]/80" />
              <span>Potential flood-change candidate</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-sm border border-[#fff176] bg-[#ff6b00]" />
              <span>Potentially exposed building</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-sm border border-[#ffd166] bg-[#ff8a3d]" />
              <span>Building exposure — damage unverified</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="h-[3px] w-4 rounded bg-[#b0b0b8]" />
              <span>147 road lines intersect candidates (potential exposure)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full border border-white bg-[#8a8a93]" />
              <span>37 settlements within 500 m of candidates</span>
            </div>
          </div>

          <div className="mt-3 border-t border-white/[0.08] pt-2 text-[10px] leading-relaxed text-white/45">
            No building damage is independently confirmed. Road and settlement proximity do not establish loss of access.
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-3 z-[400] max-w-[210px] rounded-xl border border-white/[0.08] bg-[#0c0c0e]/90 px-3 py-2 text-right text-[10px] text-white/65 shadow-lg backdrop-blur-md">
        <div className="font-semibold text-white/90">ASMR1 · Nepal</div>
        <div>EPSG:4326 · WGS 84</div>
        <div>Preliminary change assessment</div>
      </div>

      {activeFilter && (
        <div className="absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-full border border-[#4da3ff]/30 bg-[#0c0c0e]/95 px-3 py-1.5 text-xs text-white shadow-lg">
          Active filter: {activeFilter}
        </div>
      )}
    </div>
  );
};
