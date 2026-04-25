import os
import sys
import site


def patch_cosmpy_protobuf():
    site_packages = site.getsitepackages()[0]
    init_path = os.path.join(
        site_packages, "cosmpy", "protos", "google", "protobuf", "__init__.py"
    )
    if os.path.exists(init_path):
        os.remove(init_path)
        pycache = os.path.join(
            site_packages, "cosmpy", "protos", "google", "protobuf", "__pycache__"
        )
        if os.path.isdir(pycache):
            import shutil

            shutil.rmtree(pycache)
        print(f"[patch] Removed {init_path}")


if __name__ == "__main__":
    patch_cosmpy_protobuf()
