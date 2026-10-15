
import {
  LoadedPipelineData,
  PipelineMetadata,
  ReportTemplates,
  GeoJsonCollection
} from '../types';

export async function fetchJsonFile<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load ${path}: HTTP ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function loadAllPipelineData(): Promise<LoadedPipelineData> {
  const [
    floodExtent,
    damage,
    roads,
    settlements,
    buildings,
    metadata,
    reportTemplate
  ] = await Promise.all([
    fetchJsonFile<GeoJsonCollection>('/data/flood_extent.geojson'),
    fetchJsonFile<GeoJsonCollection>('/data/damage.geojson'),
    fetchJsonFile<GeoJsonCollection>('/data/roads.geojson'),
    fetchJsonFile<GeoJsonCollection>('/data/settlements.geojson'),
    fetchJsonFile<GeoJsonCollection>('/data/buildings.geojson'),
    fetchJsonFile<PipelineMetadata>('/data/metadata.json'),
    fetchJsonFile<ReportTemplates>('/data/report_template.json')
  ]);

  return {
    floodExtent,
    damage,
    roads,
    settlements,
    buildings,
    metadata,
    reportTemplate
  };
}
