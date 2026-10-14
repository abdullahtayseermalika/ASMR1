import getpass
import os
import sys
from pathlib import Path

import requests

TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)
DOWNLOAD_URL = (
    "https://download.dataspace.copernicus.eu/"
    "odata/v1/Products"
)

PRODUCTS = {
    "before": "be06e5d4-0eac-40af-954c-b4c7140c52c7",
    "after": "7f4ba72c-7460-41b9-9b20-30e3ce134335",
}

DATA_ROOT = Path("/mnt/hdd/ASMR1-data/sentinel1")


def get_token():
    username = input("Copernicus username/email: ").strip()
    password = getpass.getpass("Copernicus password: ")

    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": "cdse-public",
            "username": username,
            "password": password,
            "grant_type": "password",
        },
        timeout=60,
    )

    if response.status_code != 200:
        print("Authentication failed:", response.status_code)
        print(response.text[:500])
        sys.exit(1)

    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("No access token returned.")

    return token


def download_product(token, label, product_id):
    output_dir = DATA_ROOT / label
    output_dir.mkdir(parents=True, exist_ok=True)

    # The API serves the complete product as a ZIP archive.
    output_file = output_dir / f"{label}.zip"
    partial_file = output_dir / f"{label}.zip.part"

    url = f"{DOWNLOAD_URL}({product_id})/$value"
    headers = {"Authorization": f"Bearer {token}"}

    # Start a fresh transfer. Avoid unsafe resume behavior when the
    # server doesn't confirm that byte ranges are supported.
    partial_file.unlink(missing_ok=True)

    print(f"\nDownloading {label} product to {output_file}")
    print("This may take a while.")

    with requests.get(
        url,
        headers=headers,
        stream=True,
        allow_redirects=True,
        timeout=(30, 180),
    ) as response:
        if response.status_code != 200:
            print("Download failed:", response.status_code)
            print(response.text[:500])
            return

        total = int(response.headers.get("Content-Length", 0))
        downloaded = 0

        with partial_file.open("wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                file.write(chunk)
                downloaded += len(chunk)

                if total:
                    percent = downloaded * 100 / total
                    print(
                        f"\rProgress: {percent:5.1f}% "
                        f"({downloaded / 1024**2:.0f} MiB)",
                        end="",
                        flush=True,
                    )
                else:
                    print(
                        f"\rDownloaded {downloaded / 1024**2:.0f} MiB",
                        end="",
                        flush=True,
                    )

    print()

    if total and downloaded != total:
        print("Size mismatch. Keeping partial file for diagnosis.")
        return

    partial_file.replace(output_file)
    print(f"Saved: {output_file}")


def main():
    if os.name != "posix":
        raise RuntimeError("This downloader is intended for Linux.")

    token = get_token()

    for label, product_id in PRODUCTS.items():
        download_product(token, label, product_id)


if __name__ == "__main__":
    main()
