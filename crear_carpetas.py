import json
import os

def crear_estructura(base_path, estructura):
    """
    Recorre recursivamente el diccionario 'estructura' y crea las carpetas.
    """
    for nombre_carpeta, contenido in estructura.items():
        # Crear la ruta completa
        ruta_actual = os.path.join(base_path, nombre_carpeta)
        
        try:
            os.makedirs(ruta_actual, exist_ok=True)
            print(f"[OK] Carpeta creada: {ruta_actual}")
        except OSError as e:
            print(f"[ERROR] No se pudo crear {ruta_actual}: {e}")

        # Si el contenido es otro diccionario, recursamos (es una subcarpeta con cosas dentro)
        if isinstance(contenido, dict):
            crear_estructura(ruta_actual, contenido)
        # Si el contenido es una lista, creamos carpetas para cada elemento de la lista
        elif isinstance(contenido, list):
            for item in contenido:
                ruta_item = os.path.join(ruta_actual, str(item))
                os.makedirs(ruta_item, exist_ok=True)
                print(f"[OK] Carpeta creada: {ruta_item}")

if __name__ == "__main__":
    archivo_json = 'carpetas.json'
    
    if os.path.exists(archivo_json):
        with open(archivo_json, 'r', encoding='utf-8') as f:
            datos = json.load(f)
        crear_estructura('.', datos)
    else:
        print(f"No se encontró el archivo '{archivo_json}'. Asegúrate de crearlo primero.")
