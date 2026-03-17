#!/bin/bash

# Comprobar si existe la carpeta dist y limpiar conservando archivos de Windows
if [ -d "dist" ]; then
    echo "Limpiando carpeta dist (conservando Windows)..."
    # Busca y elimina todo lo que NO sea latest.yml, .exe o .blockmap
    find dist -mindepth 1 -maxdepth 1 ! -name 'win-unpacked' ! -name 'latest.yml' ! -name '*.exe' ! -name '*.nsis' ! -name '*.7z' ! -name '*.blockmap' -exec rm -rf {} +
    echo "Limpieza completada."
else
    echo "No existe carpeta dist previa."
fi

echo "Iniciando construcción Linux (npm run dist:linux)..."
npm run dist:linux