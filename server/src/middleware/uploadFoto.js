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

const upload = multer({ storage });

// log quando o single("foto") for chamado
const middleware = upload.single("foto");
module.exports = (req, res, next) => {
  console.log(">>> uploadFoto.single chamado");
  middleware(req, res, next);
};
