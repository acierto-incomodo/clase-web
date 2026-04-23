const fs = require("fs");
const path = require("path");

// Configuración
const HTML_FILE = "index.html";
// En inglés queremos listar TODO lo que haya dentro de la carpeta "todo-english"
// en un único bloque de lista.
const SECTIONS = {
  "lista-todo-english": "todo-english", // ID del <ul> : Carpeta raíz con todos los materiales
};

// Estilo para los enlaces (copiado de tu HTML original para mantener consistencia)
const LINK_STYLE =
  "color: var(--text-color, #fff); text-decoration: underline;";

/**
 * Función recursiva para encontrar archivos admitidos (PDF, audio, vídeo, Office, imágenes, etc.)
 */
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      // Documentos
      const docExts = [".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt"];
      // Hojas de cálculo
      const sheetExts = [".xls", ".xlsx", ".ods"];
      // Presentaciones
      const pptExts = [".ppt", ".pptx", ".odp"];
      // Imágenes
      const imageExts = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".heic",
      ];
      // Audio
      const audioExts = [".mp3", ".m4a", ".wav", ".flac", ".ogg"];
      // Vídeo
      const videoExts = [".mp4", ".mkv", ".mov", ".avi", ".webm"];
      // Comprimidos / otros útiles
      const archiveExts = [".zip", ".rar", ".7z"];

      if (
        docExts.includes(ext) ||
        sheetExts.includes(ext) ||
        pptExts.includes(ext) ||
        imageExts.includes(ext) ||
        audioExts.includes(ext) ||
        videoExts.includes(ext) ||
        archiveExts.includes(ext)
      ) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Función principal
 */
function updateHtml() {
  let htmlContent = fs.readFileSync(HTML_FILE, "utf8");
  let changesMade = false;

  for (const [listId, folderName] of Object.entries(SECTIONS)) {
    console.log(`🔍 Escaneando carpeta: ${folderName}...`);

    const files = findFiles(folderName);

    // Generar el HTML de la lista
    let listHtml = "";
    if (files.length === 0) {
      listHtml =
        '    <li><span style="color: #888;">Ez dago fitxategirik.</span></li>';
    } else {
      files.forEach((filePath) => {
        // Convertir path de sistema (posiblemente con backslashes en Windows) a URL (slashes)
        const href = filePath.split(path.sep).join("/");
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let icon = "📄";
        const audioExts = [".mp3", ".m4a", ".wav", ".flac", ".ogg"];
        const videoExts = [".mp4", ".mkv", ".mov", ".avi", ".webm"];
        const imageExts = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".webp",
          ".svg",
          ".heic",
        ];
        const sheetExts = [".xls", ".xlsx", ".ods"];
        const pptExts = [".ppt", ".pptx", ".odp"];
        const archiveExts = [".zip", ".rar", ".7z"];

        if (audioExts.includes(ext)) icon = "🎵";
        else if (videoExts.includes(ext)) icon = "🎥";
        else if (imageExts.includes(ext)) icon = "🖼️";
        else if (sheetExts.includes(ext)) icon = "📊";
        else if (pptExts.includes(ext)) icon = "📽️";
        else if (archiveExts.includes(ext)) icon = "🗂️";

        // Crear el elemento de lista
        listHtml += `    <li><a href="${href}" style="${LINK_STYLE}">${icon} ${fileName}</a></li>\n`;
      });
    }

    // Usar Regex para reemplazar el contenido dentro del <ul> específico
    // Busca: <ul id="mi-id" ...> CONTENIDO </ul>
    const regex = new RegExp(
      `(<ul[^>]*id="${listId}"[^>]*>)[\\s\\S]*?(<\\/ul>)`,
      "i",
    );

    if (regex.test(htmlContent)) {
      htmlContent = htmlContent.replace(regex, `$1\n${listHtml}$2`);
      changesMade = true;
      console.log(
        `✅ Sección '${listId}' actualizada con ${files.length} archivos.`,
      );
    } else {
      console.warn(
        `⚠️ No se encontró el elemento con id="${listId}" en el HTML.`,
      );
    }
  }

  if (changesMade) {
    fs.writeFileSync(HTML_FILE, htmlContent, "utf8");
    console.log(`\n🎉 ${HTML_FILE} eguneratuta!`);
  } else {
    console.log("\nNo se realizaron cambios.");
  }
}

// Ejecutar
try {
  updateHtml();
} catch (err) {
  console.error("Errorea:", err.message);
}
