import os
import urllib.request
import zipfile
import tarfile
import platform
import shutil


def _find_binary(root: str, binary_name: str) -> str | None:
    for current_root, _dirs, files in os.walk(root):
        if binary_name in files:
            return os.path.join(current_root, binary_name)
    return None

def install_tectonic() -> str:
    system = platform.system().lower()
    
    version = "0.15.0"
    
    if system == "windows":
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-pc-windows-msvc.zip"
        binary_name = "tectonic.exe"
        archive_name = "tectonic_temp.zip"
    elif system == "darwin": # macOS
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-apple-darwin.tar.gz"
        binary_name = "tectonic"
        archive_name = "tectonic_temp.tar.gz"
    else: # linux
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-unknown-linux-gnu.tar.gz"
        binary_name = "tectonic"
        archive_name = "tectonic_temp.tar.gz"
        
    print(f"Downloading Tectonic v{version} from {url}...")
    
    temp_extract_dir = "tectonic_extract"
    try:
        urllib.request.urlretrieve(url, archive_name)
        print("Download complete. Extracting...")

        if os.path.exists(temp_extract_dir):
            shutil.rmtree(temp_extract_dir)
        os.makedirs(temp_extract_dir, exist_ok=True)
        
        if url.endswith(".zip"):
            with zipfile.ZipFile(archive_name, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_dir)
        else:
            with tarfile.open(archive_name, "r:gz") as tar_ref:
                tar_ref.extractall(temp_extract_dir)

        binary_path = _find_binary(temp_extract_dir, binary_name)
        if not binary_path:
            raise RuntimeError("Extraction failed or binary not found")

        target_path = os.path.join(os.getcwd(), binary_name)
        shutil.copy2(binary_path, target_path)
        print(f"Successfully installed compiled binary: {target_path}")
            
        if system != "windows":
            os.chmod(target_path, 0o755)
            if not os.access(target_path, os.X_OK):
                raise RuntimeError(f"Installed binary is not executable: {target_path}")

        if not os.path.exists(target_path):
            raise RuntimeError(f"Installed binary not found at target path: {target_path}")

        return target_path
    except Exception as e:
        raise RuntimeError(f"Error downloading or extracting Tectonic: {e}") from e
    finally:
        if os.path.exists(archive_name):
            os.remove(archive_name)
        if os.path.exists(temp_extract_dir):
            shutil.rmtree(temp_extract_dir)

if __name__ == "__main__":
    binary_path = install_tectonic()
    print(f"Tectonic ready at: {binary_path}")
