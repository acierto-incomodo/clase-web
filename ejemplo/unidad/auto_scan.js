const fs = require("fs");
const path = require("path");

// Configuración
const HTML_FILE = "index.html";
const SECTIONS = {
  "lista-teoria": "teoria", // ID del <ul> : Nombre de la carpeta
  "lista-ariketak": "ejercicios",
  "lista-zuzenketak": "correcciones",
};

// Estilo para los enlaces (copiado de tu HTML original para mantener consistencia)
const LINK_STYLE =
  "color: var(--text-color, #fff); text-decoration: underline;";

/**
 * Función recursiva para encontrar archivos PDF
 */
function findPdfs(dir, fileList = []) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findPdfs(filePath, fileList);
    } else {
      if (path.extname(file).toLowerCase() === ".pdf") {
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

    const pdfs = findPdfs(folderName);

    // Generar el HTML de la lista
    let listHtml = "";
    if (pdfs.length === 0) {
      listHtml =
        '    <li><span style="color: #888;">Ez dago fitxategirik.</span></li>';
    } else {
      pdfs.forEach((pdfPath) => {
        // Convertir path de sistema (posiblemente con backslashes en Windows) a URL (slashes)
        const href = pdfPath.split(path.sep).join("/");
        const fileName = path.basename(pdfPath);

        // Crear el elemento de lista
        listHtml += `    <li><a href="${href}" style="${LINK_STYLE}">📄 ${fileName}</a></li>\n`;
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
        `✅ Sección '${listId}' actualizada con ${pdfs.length} archivos.`
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
