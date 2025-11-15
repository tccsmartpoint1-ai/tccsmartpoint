const multer = require("multer");
const path = require("path");

// Local onde as fotos serão salvas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve("uploads", "fotos"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `colab_${Date.now()}${ext}`;
    cb(null, name);
  }
});

// Filtrar formatos permitidos
const fileFilter = (req, file, cb) => {
  const permitidos = ["image/jpeg", "image/png", "image/webp"];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato não permitido. Use JPG, PNG ou WEBP."));
  }
};

// Exporta o middleware já configurado
module.exports = multer({ storage, fileFilter });
