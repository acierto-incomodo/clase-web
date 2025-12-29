const fs = require("fs");
const path = require("path");

// Configuración
const HTML_FILE = "index.html";
const SECTIONS = {
  "lista-teoria": "teoria", // ID del <ul> : Nombre de la carpeta
  "lista-ariketak": "ariketak",
  "lista-eskemak": "eskemak",
  "lista-testu-iruzkinak": "testu-iruzkinak",
  "lista-extra": "extra",
};

// Estilo para los enlaces (copiado de tu HTML original para mantener consistencia)
const LINK_STYLE =
  "color: var(--text-color, #fff); text-decoration: underline;";

/**
 * Función recursiva para encontrar archivos (PDF, MP4, M4A)
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
      if (ext === ".pdf" || ext === ".mp4" || ext === ".m4a") {
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
        if (ext === ".mp4") icon = "🎥";
        if (ext === ".m4a") icon = "🎵";

        // Crear el elemento de lista
        listHtml += `    <li><a href="${href}" style="${LINK_STYLE}">${icon} ${fileName}</a></li>\n`;
      });
    }

    // Usar Regex para reemplazar el contenido dentro del <ul> específico
    // Busca: <ul id="mi-id" ...> CONTENIDO </ul>
    const regex = new RegExp(
      `(<ul[^>]*id="${listId}"[^>]*>)[\\s\\S]*?(<\\/ul>)`,
      "i"
    );

    if (regex.test(htmlContent)) {
      htmlContent = htmlContent.replace(regex, `$1\n${listHtml}$2`);
      changesMade = true;
      console.log(
        `✅ Sección '${listId}' actualizada con ${files.length} archivos.`
      );
    } else {
      console.warn(
        `⚠️ No se encontró el elemento con id="${listId}" en el HTML.`
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
