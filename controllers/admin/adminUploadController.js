const ApiError = require("../../error/ApiError");
const utilFunctions = require("../../utils/index");
const configService = require("../../config/configureService");

class AdminUploadController {
    async upload(req, res, next) {
        try {
            if (!req.file) {
                return next(ApiError.badRequest("Fayl yuklanmagan"));
            }

            // Faqat rasm
            if (!req.file.mimetype.startsWith('image/')) {
                return next(ApiError.badRequest("Faqat rasm yuklash mumkin (JPEG, PNG, GIF)"));
            }

            // 5 MB maksimal
            if (req.file.size > 5 * 1024 * 1024) {
                return next(ApiError.badRequest("Fayl hajmi 5 MB dan oshmasligi kerak"));
            }

            const url = await utilFunctions.uploadFile(req.file, configService);

            return res.json({
                message: "Fayl muvaffaqiyatli yuklandi",
                url,
                size: req.file.size,
                mimetype: req.file.mimetype,
                originalname: req.file.originalname,
            });
        } catch (error) {
            console.error("Upload error:", error);
            next(ApiError.internal("Yuklashda xatolik: " + error.message));
        }
    }

    async deleteFile(req, res, next) {
        try {
            const { url } = req.body;
            if (!url) return next(ApiError.badRequest("URL kiritilmagan"));

            await utilFunctions.deleteFile(url, configService);
            return res.json({ message: "Fayl o'chirildi" });
        } catch (error) {
            console.error("Delete error:", error);
            next(ApiError.internal("Faylni o'chirishda xatolik: " + error.message));
        }
    }
}

module.exports = new AdminUploadController();
