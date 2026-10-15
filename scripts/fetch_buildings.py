
import json
import time
from pathlib import Path

import requests
from shapely.geometry import Polygon, mapping

SOUTH, WEST = 27.7182, 84.9593
NORTH, EAST = 28.2823, 85.5363

# Smaller tiles reduce server load per request.
TILE_ROWS = 3
TILE_COLS = 3

BASE = Path.home() / "Projects/ASMR1/web/public/data"
CACHE = Path.home() / "Projects/ASMR1/data/osm_building_tiles"
OUTPUT = BASE / "buildings.geojson"

ENDPOINT = "https://overpass-api.de/api/interpreter"

session = requests.Session()
session.headers.update({
    "User-Agent": "ASMR1-FloodScope/1.0 (research building exposure analysis)"
})

CACHE.mkdir(parents=True, exist_ok=True)
elements_by_id = {}

lat_step = (NORTH - SOUTH) / TILE_ROWS
lon_step = (EAST - WEST) / TILE_COLS

for row in range(TILE_ROWS):
    for col in range(TILE_COLS):
        s = SOUTH + row * lat_step
        n = SOUTH + (row + 1) * lat_step
        w = WEST + col * lon_step
        e = WEST + (col + 1) * lon_step

        cache_file = CACHE / f"tile_{row}_{col}.json"

        if cache_file.exists():
            print(f"Loading cached tile {row + 1}/{TILE_ROWS}, {col + 1}/{TILE_COLS}")
            data = json.loads(cache_file.read_text())
        else:
            query = f"""
            [out:json][timeout:90];
            way["building"]({s},{w},{n},{e});
            out geom;
            """

            data = None
            for attempt in range(3):
                try:
                    print(
                        f"Downloading tile {row + 1}/{TILE_ROWS}, "
                        f"{col + 1}/{TILE_COLS}, attempt {attempt + 1}"
                    )
                    response = session.post(
                        ENDPOINT,
                        data={"data": query},
                        timeout=120,
                    )
                    response.raise_for_status()
                    data = response.json()
                    cache_file.write_text(json.dumps(data))
                    break
                except Exception as exc:
                    print(f"Tile request failed: {exc}")
                    if attempt < 2:
                        time.sleep(20 * (attempt + 1))

            if data is None:
                raise SystemExit(
                    f"Tile {row},{col} failed. Completed tiles are cached; "
                    "rerun later to resume."
                )

            # Be gentle to the public API.
            time.sleep(3)

        for element in data.get("elements", []):
            if element.get("type") == "way":
                elements_by_id[element["id"]] = element

features = []

for element in elements_by_id.values():
    coordinates = [
        (node["lon"], node["lat"])
        for node in element.get("geometry", [])
        if "lon" in node and "lat" in node
    ]

    if len(coordinates) < 4 or coordinates[0] != coordinates[-1]:
        continue

    try:
        polygon = Polygon(coordinates)
        if not polygon.is_valid:
            polygon = polygon.buffer(0)

        if polygon.is_empty or polygon.geom_type not in ("Polygon", "MultiPolygon"):
            continue

        tags = element.get("tags", {})
        features.append({
            "type": "Feature",
            "id": f"osm-way-{element['id']}",
            "properties": {
                "osm_id": element["id"],
                "building": tags.get("building", "yes"),
                "name": tags.get("name"),
                "source": "OpenStreetMap",
                "in_flood_extent": False,
            },
            "geometry": mapping(polygon),
        })
    except Exception:
        continue

if not features:
    raise SystemExit("No usable building polygons were found; output was not written.")

collection = {
    "type": "FeatureCollection",
    "name": "ASMR1 OpenStreetMap building footprints",
    "features": features,
}

BASE.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(collection) + "\n", encoding="utf-8")

print(f"\nSaved: {OUTPUT}")
print(f"Unique OSM ways retrieved: {len(elements_by_id):,}")
print(f"Usable building polygons: {len(features):,}")
print("Source: OpenStreetMap; coverage may be incomplete.")
