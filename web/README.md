# FloodScope Dashboard

FloodScope Dashboard is an educational disaster intelligence prototype engineered for emergency response and rescue teams. It visualizes the pre-computed outputs of a satellite synthetic aperture radar (SAR) flood-analysis pipeline and generates a deterministic, bilingual situation report (SITREP) in English and Nepali.

---

## Strict Deterministic Architecture

The application does **not** fetch live satellite data, run heavy spatial models in the client, or call any generative AI APIs. Every single figure, count, polygon, and sentence is derived exclusively from 6 pre-computed files located in the `/data` directory:

1. `flood_extent.geojson`: Polygons of standing surface water detected via Sentinel-1 SAR.
2. `damage.geojson`: Damaged or inundated structures.
3. `roads.geojson`: Road network line segments with status (`affected` or `unaffected`).
4. `settlements.geojson`: Community point locations with connectivity status (`cut_off`, `connected`, or `not_assessed`).
5. `metadata.json`: Technical parameters including event date, snapshot timestamp, SAR orbit numbers, and thresholding method/value.
6. `report_template.json`: Bilingual SITREP templates with placeholders like `{buildings_in_flood}`, `{settlements_cutoff}`, etc.

---

## How to Replace Sample Files with Real Pipeline Output

The repository includes a synthetic demonstration dataset so the application can be opened and tested immediately. A warning banner (`SAMPLE DATA, NOT REAL`) remains active until real pipeline data is deployed.

### Step-by-Step Instructions:

1. **Locate the data directory:**
   All pre-computed files are stored in `public/data/` (or `/data/` on the web server):
   ```
   public/
   └── data/
       ├── flood_extent.geojson
       ├── damage.geojson
       ├── roads.geojson
       ├── settlements.geojson
       ├── metadata.json
       └── report_template.json
   ```

2. **Generate and copy your pipeline outputs:**
   Ensure your pipeline (e.g., ESA SNAP, Google Earth Engine, or Python GDAL/rasterio scripts) exports files matching the exact names and schema conventions described below.

3. **Coordinate Reference System (CRS):**
   All GeoJSON files must use standard WGS 84 (`EPSG:4326`) with coordinates structured in `[longitude, latitude]` order.

4. **Deactivate the sample data flag:**
   In `public/data/metadata.json`, update the `"is_sample_data"` field:
   ```json
   {
     "is_sample_data": false
   }
   ```
   Setting this to `false` automatically dismisses the "SAMPLE DATA, NOT REAL" banner.

5. **Test in the Browser:**
   You can also click **"Pipeline README"** or **"Load Pipeline Files"** in the top navigation bar to test your GeoJSON files in-memory before copying them into the project repository.

---

## GeoJSON Schema Specifications

### 1. `flood_extent.geojson`
* **Geometry**: `Polygon` or `MultiPolygon`
* **Key Properties**:
  * `id`: Unique identifier (e.g., `"FLD-ZONE-01"`)
  * `name`: Optional localized water body name
  * `water_depth_est`: Estimated depth string (e.g., `"2.4 m"`)
  * `area_sqkm`: Surface area in square kilometers

### 2. `damage.geojson`
* **Geometry**: `Point`
* **Key Properties**:
  * `id`: Structure ID (e.g., `"BLD-101"`)
  * `type`: `"damaged_building"`
  * `building_use`: Structure category (e.g., `"Residential"`, `"School"`, `"Health Post"`)
  * `in_flood_extent`: Boolean (`true` or `false`)
  * `damage_grade`: Severity description

### 3. `roads.geojson`
* **Geometry**: `LineString`
* **Key Properties**:
  * `id`: Road segment ID (e.g., `"RD-201"`)
  * `name`: Road or highway name
  * `status`: **`"affected"`** (rendered red) or **`"unaffected"`** (rendered grey)
  * `passability`: Operational transit notes (e.g., `"Closed - Inundated > 0.8m"`)

### 4. `settlements.geojson`
* **Geometry**: `Point`
* **Key Properties**:
  * `id`: Settlement identifier (e.g., `"SET-01"`)
  * `name`: Village or town name
  * `status`: **`"cut_off"`** (rendered red with alert), **`"connected"`** (rendered green), or **`"not_assessed"`** (rendered grey)
  * `population`: Number of residents
  * `isolation_cause`: Reason for isolation (e.g., access bridges submerged)

### 5. `metadata.json`
```json
{
  "event_name": "Koshi River Monsoon Surge",
  "event_date": "2026-08-14",
  "snapshot_date": "2026-08-16T04:42:00Z",
  "sar_platform": "Sentinel-1C Synthetic Aperture Radar",
  "sar_orbit_numbers": "142, 219",
  "threshold_method": "Bimodal Otsu Backscatter Intensity Analysis",
  "threshold_value": "-14.85 dB (VH), -8.20 dB (VV)",
  "pipeline_version": "FloodScope-SAR-v2.6",
  "is_sample_data": false
}
```

---

## Mandatory Limitations & Disclaimers

> "Sentinel satellites revisit an area every few days and cannot warn of sudden collapses. Radar can confuse debris with other rough or bright surfaces. OpenStreetMap may miss settlements in remote areas, and those are not assessed. Radar shadow and layover on steep slopes are flagged separately, not counted as flood. This is an educational prototype, not an operational tool."

---

## Mandatory Data Attributions

* Contains modified Copernicus Sentinel data 2026.
* Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
* © OpenStreetMap contributors.
* Training data: Bountos et al., 2024 (Kuro Siwo); Bonafilia et al., CVPR Workshops 2020 (Sen1Floods11), if used.
