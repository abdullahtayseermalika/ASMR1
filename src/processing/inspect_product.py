from pathlib import Path
import sys

from snappy import ProductIO


def inspect(path):
    print(f"\n{'=' * 65}")
    print(f"Product: {path}")

    product = ProductIO.readProduct(str(path))

    if product is None:
        print("ERROR: SNAP could not open this product.")
        return

    try:
        print("Product name:", product.getName())
        print("Product type:", product.getProductType())
        print("Dimensions:", product.getSceneRasterWidth(),
              "x", product.getSceneRasterHeight())

        print("\nBands:")
        for band in product.getBands():
            print(
                f"  name={band.getName()}, "
                f"type={band.getDataType()}, "
                f"unit={band.getUnit()}, "
                f"no-data-used={band.isNoDataValueUsed()}, "
                f"no-data={band.getNoDataValue()}"
            )

        print("\nMetadata:")
        root = product.getMetadataRoot()
        for element in root.getElements():
            print(" ", element.getName())

    finally:
        ProductIO.closeProduct(product)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_product.py PRODUCT_PATH")
        sys.exit(1)

    inspect(Path(sys.argv[1]))
