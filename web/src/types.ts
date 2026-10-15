\export interface PipelineMetadata {
  event_name?: string;
  event_date: string;
  snapshot_date: string;
  sar_platform?: string;
  sar_orbit_numbers: string | number | (string | number)[];
  threshold_method: string;
  threshold_value: string;
  area_of_interest?: string;
  crs?: string;
  pipeline_version?: string;
  dem_source?: string;
  is_sample_data?: boolean;
  [key: string]: unknown;
}

export interface ReportTemplateSection {
  title: string;
  subtitle: string;
  alert_level: string;
  section_metadata: string;
  metadata_text: string;
  section_findings: string;
  findings_text: string;
  section_priorities: string;
  priorities_text: string;
  section_limitations: string;
  limitations_text: string;
  attribution_notice: string;
  [key: string]: string;
}

export interface ReportTemplates {
  en: ReportTemplateSection;
  ne: ReportTemplateSection;
}

export interface GeoJsonFeature {
  type: 'Feature';
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | 'MultiLineString' | 'MultiPoint';
    coordinates: any;
  };
}

export interface GeoJsonCollection {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJsonFeature[];
  [key: string]: unknown;
}

export interface LoadedPipelineData {
  floodExtent: GeoJsonCollection;
  damage: GeoJsonCollection;
  roads: GeoJsonCollection;
  settlements: GeoJsonCollection;
  metadata: PipelineMetadata;
  reportTemplate: ReportTemplates;
buildings: GeoJsonCollection;
}


export interface ComputedMetrics {
  floodPolygonsCount: number;
  candidatePixels: number;
  candidateAreaSqKm: number;
  buildingsInFlood: number;
  affectedRoads: number;
  unaffectedRoads: number;
  settlementsCutOff: number;
  settlementsConnected: number;
  settlementsNotAssessed: number;
  totalSettlements: number;
  totalRoadSegments: number;
  impactsAssessed: boolean;
}
