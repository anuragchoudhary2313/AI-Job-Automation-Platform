import os
import urllib.request
import zipfile
import platform

def install_tectonic():
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    version = "0.15.0"
    
    if system == "windows":
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-pc-windows-msvc.zip"
        binary_name = "tectonic.exe"
    elif system == "darwin": # macOS
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-apple-darwin.tar.gz"
        binary_name = "tectonic"
    else: # linux
        url = f"https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@{version}/tectonic-{version}-x86_64-unknown-linux-gnu.tar.gz"
        binary_name = "tectonic"
        
    print(f"Downloading Tectonic v{version} from {url}...")
    
    temp_zip = "tectonic_temp.zip"
    try:
        urllib.request.urlretrieve(url, temp_zip)
        print("Download complete. Extracting...")
        
        if url.endswith(".zip"):
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                zip_ref.extractall(".")
        else:
            os.system(f"tar -xzf {temp_zip}")
            
        if os.path.exists(binary_name):
            print(f"Successfully installed compiled binary: {binary_name}")
            if system != "windows":
                os.chmod(binary_name, 0o755)
        else:
            print("Extraction failed or binary not found.")
    except Exception as e:
        print(f"Error downloading or extracting Tectonic: {e}")
    finally:
        if os.path.exists(temp_zip):
            os.remove(temp_zip)

if __name__ == "__main__":
    install_tectonic()
