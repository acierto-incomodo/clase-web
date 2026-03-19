#!/bin/bash
set -e

BASE_ASIGNATURAS="asignaturas"
BASE_AKADEMIA="akademia"
BASE_ZIP="asignaturas-zip"
PARTE1="$BASE_ZIP/parte1/asignaturas"
PARTE2="$BASE_ZIP/parte2/asignaturas"
PARTE3="$BASE_ZIP/parte3"

echo "Preparando estructura de 'asignaturas-zip'..."
rm -rf "$PARTE1" "$PARTE2" "$PARTE3"
mkdir -p "$PARTE1" "$PARTE2" "$PARTE3"

echo "Copiando carpetas a parte1..."
for folder in euskera filosofia fisika gaztelera historia; do
  SRC="$BASE_ASIGNATURAS/$folder"
  DST="$PARTE1/$folder"
  if [ -d "$SRC" ]; then
    echo "  - $folder"
    cp -R "$SRC" "$DST"
  else
    echo "  - $folder (no existe, se omite)"
  fi
done

echo "Copiando carpetas a parte2..."
for folder in ingelesa marrazketa-teknikoa-II matematika mekanika tutoretza; do
  SRC="$BASE_ASIGNATURAS/$folder"
  DST="$PARTE2/$folder"
  if [ -d "$SRC" ]; then
    echo "  - $folder"
    cp -R "$SRC" "$DST"
  else
    echo "  - $folder (no existe, se omite)"
  fi
done

echo "Copiando carpeta akademia a parte3..."
SRC_AKA="$BASE_AKADEMIA"
DST_AKA="$PARTE3/akademia"
if [ -d "$SRC_AKA" ]; then
  echo "  - akademia"
  cp -R "$SRC_AKA" "$DST_AKA"
else
  echo "  - akademia (no existe, se omite)"
fi

echo "Copias completadas en 'asignaturas-zip/parte1', 'parte2' y 'parte3'."

