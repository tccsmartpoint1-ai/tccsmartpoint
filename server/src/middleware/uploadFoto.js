const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

console.log(">>> uploadFoto.js carregado");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log(">>> uploadFoto params executado");
    console.log("FILE:", file);

    return {
      folder: "smartpoint/colaboradores",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "auto" }
      ]
    };
  }
});

// ENVOLVE O MULTER PRA CAPTURAR ERRO
const upload = multer({ storage });

module.exports = (req, res, next) => {
  console.log(">>> uploadFoto.single chamado");

  upload.single("foto")(req, res, function (err) {
    if (err) {
      console.error(">>> ERRO NO MULTER/CLOUDINARY:", err);
      return res.status(500).json({ error: "Falha no upload", detalhes: err.message });
    }
    next();
  });
};
