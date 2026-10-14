from pathlib import Path
import rasterio

ROOT = Path("/mnt/hdd/ASMR1-data/sentinel1")

for scene in ("before", "after"):
    files = list(
        (ROOT / scene / "unpacked").rglob("measurement/*.tiff")
    )

    print(f"\n=== {scene.upper()} ===")

    if not files:
        print("No measurement TIFF files found.")
        continue

    for path in files:
        with rasterio.open(path) as src:
            print(f"\nFile: {path.name}")
            print(f"Size: {src.width} x {src.height}")
            print(f"CRS: {src.crs}")
            print(f"Data type: {src.dtypes}")
            print(f"Bands: {src.count}")
            print(f"Bounds: {src.bounds}")
            print(f"NoData: {src.nodata}")
