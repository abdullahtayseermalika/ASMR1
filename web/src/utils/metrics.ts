
import {
  ComputedMetrics,
  GeoJsonCollection,
  PipelineMetadata,
  ReportTemplateSection,
} from '../types';

export function computeMetrics(
  floodExtent: GeoJsonCollection,
  damage: GeoJsonCollection,
  roads: GeoJsonCollection,
  settlements: GeoJsonCollection,
  metadata?: PipelineMetadata,
  buildings?: GeoJsonCollection,
): ComputedMetrics {
  // Count GeoJSON features, not individual MultiPolygon components.
  const floodPolygonsCount = (floodExtent?.features ?? []).filter(
    (feature) =>
      feature.geometry?.type === 'Polygon' ||
      feature.geometry?.type === 'MultiPolygon',
  ).length;

  const candidatePixels = Number(metadata?.candidate_pixels ?? 0);
  const candidateAreaSqKm = Number(metadata?.candidate_area_sq_km ?? 0);

  // Count building footprints flagged as potentially exposed.
  const potentiallyExposedBuildings = (
    buildings?.features ?? []
  ).filter((feature) => {
    const value = feature.properties?.potentially_exposed;

    return (
      value === undefined ||
      value === true ||
      value === 'true' ||
      value === 1
    );
  }).length;

  // These datasets describe spatial exposure, not verified impacts.
  // Do not infer damage, blocked roads, or isolated settlements
  // from feature presence or generic status fields.
  const affectedRoads = Number(
    metadata?.road_lines_intersecting_candidates ?? 0,
  );

  const totalRoadSegments = Number(
    metadata?.road_line_features_assessed ??
      roads?.features?.length ??
      0,
  );

  const settlementsCutOff = Number(
    metadata?.settlements_intersecting_candidates ?? 0,
  );

  const settlementsWithin500m = Number(
    metadata?.settlements_within_500m_of_candidates ?? 0,
  );

  const totalSettlements = Number(
    metadata?.settlement_points_assessed ??
      settlements?.features?.length ??
      0,
  );

  // There is no independently verified building-damage count.
  const buildingsInFlood = 0;

  // Preserve the existing interface while avoiding unsupported claims.
  const unaffectedRoads = Math.max(
    0,
    totalRoadSegments - affectedRoads,
  );

  const settlementsConnected = 0;
  const settlementsNotAssessed = totalSettlements;

  // File availability does not mean impacts have been verified.
  const impactsAssessed = false;

  return {
    floodPolygonsCount,
    candidatePixels,
    candidateAreaSqKm,
    buildingsInFlood,
    affectedRoads,
    unaffectedRoads,
    settlementsCutOff,
    settlementsConnected,
    settlementsNotAssessed,
    totalSettlements,
    totalRoadSegments,
    impactsAssessed,
  };
}

export function formatOrbitNumbers(
  orbits: PipelineMetadata['sar_orbit_numbers'],
): string {
  if (Array.isArray(orbits)) {
    return orbits.join(', ');
  }

  return String(orbits || 'not available');
}

export function populateReportTemplate(
  templateSection: ReportTemplateSection,
  metrics: ComputedMetrics,
  metadata: PipelineMetadata,
): ReportTemplateSection {
  const replacements: Record<string, string | number> = {
    flood_polygons_count:
      metadata.candidate_polygons ?? metrics.floodPolygonsCount,

    candidate_pixels: metrics.candidatePixels,

    candidate_area_sq_km:
      metrics.candidateAreaSqKm.toFixed(4),

    // Never report candidate intersections as verified damage.
    buildings_in_flood: 'Unverified — exposure only',

    // These counts are spatial intersections, not confirmed impacts.
    affected_roads: metadata.road_lines_intersecting_candidates ?? 0,

    unaffected_roads: 'Not assessed',

    settlements_cutoff: 'Not verified',

    settlements_connected: 'Not verified',

    settlements_unassessed:
      metadata.settlement_points_assessed ??
      metrics.totalSettlements,

    event_date: metadata.event_date || 'not available',
    snapshot_date: metadata.snapshot_date || 'not available',

    sar_orbit_numbers: formatOrbitNumbers(
      metadata.sar_orbit_numbers,
    ),

    threshold_method:
      metadata.threshold_method || 'not available',

    threshold_value:
      metadata.threshold_value || 'not available',

    sar_platform:
      metadata.sar_platform || 'Sentinel-1 SAR',

    event_name:
      metadata.event_name || 'Hydrological Flood Event',

    area_of_interest:
      metadata.area_of_interest || 'Monitored Region',

    pipeline_version:
      metadata.pipeline_version || 'FloodScope Pipeline',
  };

  const fillText = (text: string): string => {
    if (!text) return '';

    return text.replace(/\{(\w+)\}/g, (match, key) =>
      key in replacements ? String(replacements[key]) : match,
    );
  };

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(templateSection)) {
    result[key] =
      typeof value === 'string'
        ? fillText(value)
        : String(value ?? '');
  }

  return result as ReportTemplateSection;
}
