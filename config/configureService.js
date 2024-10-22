require('dotenv').config();  // .env faylini o'qish uchun dotenv modulini chaqiramiz

class ConfigService {
    constructor() {
        // S3 uchun kerakli parametrlarni .env fayldan o'qib olamiz
        this.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
        this.S3_SECRET_KEY = process.env.S3_SECRET_KEY;
        this.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
        this.S3_REGION = process.env.S3_REGION;
        this.S3_ENDPOINT = process.env.S3_ENDPOINT;
    }

    // Kerakli parametrlarni olish uchun metodlarni yaratamiz
    get(key) {
        return this[key];
    }
}

const configService = new ConfigService();

module.exports = configService;
