import os
import subprocess

def main():
    # Directorio actual como raíz de búsqueda
    root_dir = os.getcwd()
    print(f"🔍 Buscando archivos 'auto_scan.js' recursivamente desde: {root_dir}\n")

    scripts_found = []

    # 1. Buscar todos los archivos auto_scan.js
    for dirpath, _, filenames in os.walk(root_dir):
        if "auto_scan.js" in filenames:
            full_path = os.path.join(dirpath, "auto_scan.js")
            scripts_found.append(full_path)

    if not scripts_found:
        print("⚠️ No se encontraron archivos 'auto_scan.js'.")
        return

    print(f"📋 Se encontraron {len(scripts_found)} scripts. Iniciando ejecución...\n")

    # 2. Ejecutar cada script en su directorio
    for script_path in scripts_found:
        directory = os.path.dirname(script_path)
        print(f"🚀 Ejecutando script en: {directory}")
        
        try:
            # Ejecuta 'node auto_scan.js' cambiando el directorio de trabajo (cwd)
            subprocess.run(["node", "auto_scan.js"], cwd=directory, check=True)
            print("✅ Ejecución finalizada.\n")
        except subprocess.CalledProcessError:
            print(f"❌ El script falló en: {directory}\n")
        except Exception as e:
            print(f"❌ Error inesperado: {e}\n")

if __name__ == "__main__":
    main()