
import json
from pathlib import Path

import geopandas as gpd

ROOT = Path.home() / "Projects" / "ASMR1"
DATA = ROOT / "web" / "public" / "data"
OUT = ROOT / "results" / "reports"
OUT.mkdir(parents=True, exist_ok=True)


def read_geojson(name):
    with (DATA / name).open(encoding="utf-8") as f:
        data = json.load(f)

    return gpd.GeoDataFrame.from_features(
        data["features"], crs="EPSG:4326"
    )


flood = read_geojson("flood_extent.geojson")
roads_all = read_geojson("roads.geojson")
settlements = read_geojson("settlements.geojson")

flood = flood[
    flood.geometry.notna() & ~flood.geometry.is_empty
]
flood_union = flood.geometry.union_all()

# Keep road lines only; exclude points and area polygons.
roads = roads_all[
    roads_all.geometry.notna()
    & ~roads_all.geometry.is_empty
    & roads_all.geometry.geom_type.isin(
        ["LineString", "MultiLineString"]
    )
].copy()

if not roads.empty:
    roads["intersects_candidate"] = (
        roads.geometry.intersects(flood_union)
    )
    exposed_roads = int(roads["intersects_candidate"].sum())
else:
    exposed_roads = 0

settlements = settlements[
    settlements.geometry.notna()
    & ~settlements.geometry.is_empty
].copy()

if not settlements.empty:
    settlements["intersects_candidate"] = (
        settlements.geometry.intersects(flood_union)
    )

    # Measure proximity in metres using a projected CRS.
    settlements_m = settlements.to_crs("EPSG:32645")
    flood_m = flood.to_crs("EPSG:32645")
    flood_union_m = flood_m.geometry.union_all()

    settlements["within_500m"] = (
        settlements_m.geometry.distance(flood_union_m) <= 500
    ).to_numpy()

    intersects = int(settlements["intersects_candidate"].sum())
    within_500m = int(settlements["within_500m"].sum())
else:
    intersects = 0
    within_500m = 0

report = {
    "analysis": "Preliminary road and settlement exposure",
    "candidate_polygons": int(len(flood)),
    "road_source_features": int(len(roads_all)),
    "road_line_features_assessed": int(len(roads)),
    "road_lines_intersecting_candidates": exposed_roads,
    "road_intersection_percent": round(
        100 * exposed_roads / len(roads), 2
    ) if len(roads) else None,
    "settlement_points_assessed": int(len(settlements)),
    "settlements_intersecting_candidates": intersects,
    "settlements_within_500m_of_candidates": within_500m,
    "interpretation": (
        "Spatial intersection and proximity indicate potential exposure only. "
        "They do not confirm road damage, passability, inundation, or loss "
        "of settlement access."
    )
}

report_path = OUT / "road_settlement_exposure.json"
report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

print(json.dumps(report, indent=2))
print("\nSaved report:", report_path)
