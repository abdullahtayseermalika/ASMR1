import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from shapely.geometry import mapping

ROOT = Path.home() / "Projects/ASMR1"

BUILDINGS = Path(
    "/mnt/hdd/ASMR1-data/reference/building_footprints.geojson"
)
FLOOD = Path(
    "/mnt/hdd/ASMR1-data/processed/flood_candidates_v3_dualpol.tif"
)
OUTPUT = ROOT / "web/public/data/buildings.geojson"
REPORT = ROOT / "results/reports/building_exposure.json"

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)

print("Loading building footprints...")
buildings = gpd.read_file(BUILDINGS)
buildings = buildings[
    buildings.geometry.notna()
    & ~buildings.geometry.is_empty
    & buildings.geometry.geom_type.isin(["Polygon", "MultiPolygon"])
    & buildings["building"].notna()
].copy()

print(f"Building footprints loaded: {len(buildings):,}")

print("Opening flood-candidate raster...")
with rasterio.open(FLOOD) as src:
    print("Raster CRS:", src.crs)
    print("Raster size:", src.width, "x", src.height)

    if buildings.crs != src.crs:
        buildings = buildings.to_crs(src.crs)

    transform = src.transform
    raster_bounds = src.bounds
    nodata = src.nodata

    # Only geometries intersecting the raster footprint are assessed.
    bounds = buildings.bounds
    intersects_raster = (
        (bounds.maxx > raster_bounds.left)
        & (bounds.minx < raster_bounds.right)
        & (bounds.maxy > raster_bounds.bottom)
        & (bounds.miny < raster_bounds.top)
    )

    buildings = buildings.loc[intersects_raster].copy()
    print(f"Footprints within raster bounds: {len(buildings):,}")

    # Read candidate pixels in small windows, not the full raster.
    # Candidate raster values are 1; NoData is 255.
    candidate_count = 0
    exposed_indices = set()

    window_size = 512

    for row in range(0, src.height, window_size):
        for col in range(0, src.width, window_size):
            window = rasterio.windows.Window(
                col,
                row,
                min(window_size, src.width - col),
                min(window_size, src.height - row),
            )
            data = src.read(1, window=window)
            valid = np.isfinite(data)

            if nodata is not None:
                valid &= data != nodata

            # Candidate pixels are nonzero valid pixels.
            candidate = valid & (data != 0)
            if not candidate.any():
                continue

            candidate_count += int(candidate.sum())

            window_transform = src.window_transform(window)
            candidate_shapes = list(
                rasterio.features.shapes(
                    candidate.astype(np.uint8),
                    mask=candidate,
                    transform=window_transform,
                )
            )

            # Prepare candidate geometries for spatial matching.
            from shapely.geometry import shape
            candidate_geometries = [
                shape(geom)
                for geom, value in candidate_shapes
                if value == 1
            ]

            if not candidate_geometries:
                continue

            candidate_gdf = gpd.GeoDataFrame(
                {"geometry": candidate_geometries},
                geometry="geometry",
                crs=src.crs,
            )

            # Find building footprints intersecting this window's candidates.
            # STRtree-based GeoPandas spatial joins avoid comparing all pairs.
            window_bounds = rasterio.windows.bounds(window, transform)
            minx, miny, maxx, maxy = window_bounds
            possible = buildings.cx[minx:maxx, miny:maxy]

            if possible.empty:
                continue

            joined = gpd.sjoin(
                possible[["geometry"]],
                candidate_gdf,
                how="inner",
                predicate="intersects",
            )
            exposed_indices.update(joined.index.unique().tolist())

    exposed_indices = set(exposed_indices)
    buildings["potentially_exposed"] = buildings.index.isin(exposed_indices)

    total = len(buildings)
    exposed = int(buildings["potentially_exposed"].sum())
    percent = (exposed / total * 100) if total else 0.0

    # Save only potentially exposed building footprints to the dashboard.
    exposed_buildings = buildings[buildings["potentially_exposed"]].copy()
    exposed_buildings.to_file(OUTPUT, driver="GeoJSON")

    report = {
        "analysis_name": "Preliminary building exposure to flood-change candidates",
        "candidate_raster": str(FLOOD),
        "building_source": str(BUILDINGS),
        "crs": str(src.crs),
        "candidate_pixels_detected": candidate_count,
        "building_footprints_assessed": total,
        "potentially_exposed_buildings": exposed,
        "potentially_exposed_percent": round(percent, 3),
        "output_geojson": str(OUTPUT),
        "interpretation": (
            "Potential exposure only. Intersection with preliminary "
            "flood-change candidates does not confirm inundation or damage."
        ),
    }

with open(REPORT, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print("\n--- BUILDING EXPOSURE RESULTS ---")
print(f"Candidate pixels: {candidate_count:,}")
print(f"Building footprints assessed: {total:,}")
print(f"Potentially exposed buildings: {exposed:,}")
print(f"Potentially exposed: {percent:.3f}%")
print(f"GeoJSON saved: {OUTPUT}")
print(f"Report saved: {REPORT}")
print("\nNOTE: Potential exposure is not confirmed damage.")
