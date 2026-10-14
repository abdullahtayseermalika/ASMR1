import requests
from datetime import date, timedelta

CATALOGUE_URL = (
    "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
)


def search_sentinel1(flood_date, bbox, window_days=18):
    """
    Search Sentinel-1 GRD scenes near a flood date.

    bbox = (west, south, east, north)
    Coordinates must use longitude/latitude (EPSG:4326).
    """

    event = date.fromisoformat(flood_date)
    west, south, east, north = bbox

    polygon = (
        f"{west} {south},"
        f"{east} {south},"
        f"{east} {north},"
        f"{west} {north},"
        f"{west} {south}"
    )

    geometry = f"POLYGON(({polygon}))"

    start = event - timedelta(days=window_days)
    end = event + timedelta(days=window_days)

    spatial_filter = (
        "OData.CSC.Intersects("
        f"area=geography'SRID=4326;{geometry}')"
    )

    product_filter = (
        "Collection/Name eq 'SENTINEL-1' "
        "and Attributes/OData.CSC.StringAttribute/"
        "any(a:a/Name eq 'productType' "
        "and a/OData.CSC.StringAttribute/Value "
        "eq 'IW_GRDH_1S') "
        f"and ContentDate/Start ge {start.isoformat()}T00:00:00.000Z "
        f"and ContentDate/Start le {end.isoformat()}T23:59:59.999Z"
    )

    params = {
        "$filter": f"{spatial_filter} and ({product_filter})",
        "$select": "Id,Name,ContentDate,GeoFootprint",
        "$orderby": "ContentDate/Start asc",
        "$top": 100,
    }

    response = requests.get(
        CATALOGUE_URL,
        params=params,
        timeout=60,
    )
    response.raise_for_status()

    products = response.json().get("value", [])

    print(f"\nFlood date: {event}")
    print(f"Search window: {start} to {end}")
    print(f"Matching scenes: {len(products)}\n")

    for product in products:
        content_date = product.get("ContentDate", {})
        acquired = content_date.get("Start", "Unknown")

        print(f"Name: {product.get('Name', 'Unknown')}")
        print(f"Acquired: {acquired}")
        print(f"Product ID: {product.get('Id', 'Unknown')}")
        print("-" * 60)

    return products


if __name__ == "__main__":
    # Initial test area only; replace with the judges' selected area.
    test_bbox = (85.0, 27.8, 85.5, 28.2)

    try:
        search_sentinel1(
            flood_date="2026-08-26",
            bbox=test_bbox,
        )
    except requests.RequestException as exc:
        print(f"Catalogue request failed: {exc}")
