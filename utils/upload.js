// Multer yuklash konfiguratsiyasi
const multer = require('multer');
const storage = multer.memoryStorage();  // Fayllarni xotirada saqlaymiz
const upload = multer({ storage: storage });

module.exports = upload;
