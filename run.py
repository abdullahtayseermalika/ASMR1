
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"


def main():
    print("=" * 45)
    print("ASMR1 | Mapping Flood Damage from Space")
    print("=" * 45)
    print(f"Python version : {sys.version.split()[0]}")
    print(f"Project folder : {PROJECT_ROOT}")
    print(f"Data directory : {DATA_DIR}")
    print()
    print("Project environment initialized successfully.")
    print("Workflow: Sentinel-1 preprocessing, change detection,")
    print("          candidate filtering, and reference comparison.")
    print()
    print("Note: candidate pixels are not confirmed flood extent.")


if __name__ == "__main__":
    main()
