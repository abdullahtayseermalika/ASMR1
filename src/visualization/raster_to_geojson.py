
import json
from pathlib import Path

import rasterio
from rasterio.features import shapes

RASTER = Path(
    "/mnt/hdd/ASMR1-data/processed/flood_candidates_v3_dualpol.tif"
)
OUTPUT = Path("web/public/data/flood_extent.geojson")


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with rasterio.open(RASTER) as src:
        data = src.read(1)
        transform = src.transform

        mask = data == 1

        print(f"Raster: {src.width} x {src.height}")
        print(f"CRS: {src.crs}")
        print(f"Candidate pixels: {int(mask.sum()):,}")

        features = []

        for geom, value in shapes(
            data,
            mask=mask,
            transform=transform,
            connectivity=8,
        ):
            if value != 1:
                continue

            features.append({
                "type": "Feature",
                "properties": {
                    "class": "potential_flood_change"
                },
                "geometry": geom,
            })

    collection = {
        "type": "FeatureCollection",
        "name": "ASMR1 potential flood-change candidates",
        "features": features,
    }

    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(collection, f, separators=(",", ":"))

    print(f"GeoJSON features: {len(features):,}")
    print(f"Saved to: {OUTPUT.resolve()}")
    print(f"File size: {OUTPUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
