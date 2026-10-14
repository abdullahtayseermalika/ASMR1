import requests

def inspect_download_size(product_id):
    url = f"{BASE_URL}({product_id})"

    response = requests.get(
        url,
        params={"$select": "Id,Name,ContentLength"},
        timeout=60,
    )
    response.raise_for_status()
    product = response.json()

    size_bytes = product.get("ContentLength")

    print(f"Product: {product.get('Name')}")
    if size_bytes is not None:
        print(f"Size: {size_bytes / (1024 ** 3):.2f} GiB")
    else:
        print("Size: not provided by catalogue")

PRODUCTS = {
    "before": "be06e5d4-0eac-40af-954c-b4c7140c52c7",
    "after": "7f4ba72c-7460-41b9-9b20-30e3ce134335",
}

BASE_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"


def inspect_product(label, product_id):
    url = f"{BASE_URL}({product_id})"

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    product = response.json()

    print(f"\n--- {label.upper()} ---")
    print("Name:", product.get("Name"))
    print("Acquisition:", product.get("ContentDate", {}).get("Start"))
    print("Footprint:", product.get("GeoFootprint"))

    if not product.get("GeoFootprint"):
        print("Warning: footprint unavailable.")


if __name__ == "__main__":

    for label, product_id in PRODUCTS.items():
        print(f"\nChecking {label} product size...")
        inspect_download_size(product_id)

    for label, product_id in PRODUCTS.items():
        try:
            inspect_product(label, product_id)
        except requests.RequestException as exc:
            print(f"Could not inspect {label} product: {exc}")
