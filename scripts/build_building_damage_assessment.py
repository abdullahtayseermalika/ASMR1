
import json
import math
from pathlib import Path

import geopandas as gpd

ROOT = Path.home() / "Projects" / "ASMR1"
DATA = ROOT / "web" / "public" / "data"

BUILDINGS_PATH = DATA / "buildings.geojson"
FLOOD_PATH = DATA / "flood_extent.geojson"
OUTPUT_PATH = DATA / "damage.geojson"


def load_geojson(path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


buildings_data = load_geojson(BUILDINGS_PATH)
flood_data = load_geojson(FLOOD_PATH)

buildings = gpd.GeoDataFrame.from_features(
    buildings_data["features"], crs="EPSG:4326"
)
flood = gpd.GeoDataFrame.from_features(
    flood_data["features"], crs="EPSG:4326"
)

buildings = buildings[
    buildings.geometry.notna() & ~buildings.geometry.is_empty
].copy()
flood = flood[
    flood.geometry.notna() & ~flood.geometry.is_empty
].copy()

candidate_union = flood.geometry.union_all()

candidate_union_m = gpd.GeoSeries(
    [candidate_union], crs="EPSG:4326"
).to_crs("EPSG:32645").iloc[0]

output_features = []

for index, row in buildings.iterrows():
    geometry = row.geometry
    building_m = gpd.GeoSeries(
        [geometry], crs="EPSG:4326"
    ).to_crs("EPSG:32645").iloc[0]

    intersects = bool(geometry.intersects(candidate_union))
    overlap_area = (
        float(building_m.intersection(candidate_union_m).area)
        if intersects else 0.0
    )

    source = row.drop(labels="geometry").to_dict()

    useful_properties = {
        "building_type": source.get("building")
        or source.get("building_1")
        or "unspecified",
        "osm_name": source.get("name") or None,
        "assessment_status": "potential_exposure",
        "candidate_intersection": intersects,
        "candidate_overlap_area_m2": round(overlap_area, 2),
        "damage_status": "unverified",
        "damage_evidence": "No independent building-damage evidence supplied",
    }

    output_features.append({
        "type": "Feature",
        "geometry": json.loads(
            gpd.GeoSeries([geometry], crs="EPSG:4326").to_json()
        )["features"][0]["geometry"],
        "properties": useful_properties,
    })

result = {
    "type": "FeatureCollection",
    "name": "Preliminary Building Exposure Assessment",
    "features": output_features,
}

OUTPUT_PATH.write_text(
    json.dumps(result, indent=2, allow_nan=False),
    encoding="utf-8",
)

print("Clean building assessment created.")
print("Building records:", len(output_features))
print("Potential exposure:", sum(
    f["properties"]["candidate_intersection"]
    for f in output_features
))
print("Confirmed damage: 0")
print("Output:", OUTPUT_PATH)
