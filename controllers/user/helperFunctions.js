const multer = require("multer");
const path = require("path");
const { Users } = require("../../models/models");
const NodeCache = require("node-cache");
const cache = new NodeCache();

class HelperFunction {
  generateRandomCode(length = 4) {
    const characters = "0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  }
  generateUniqueId = function () {
    // Masalan, 6 xonali tasodifiy raqam generatsiya qilish
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 xonali raqam
  }
  uploadQ() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        // Save files in the 'uploads' directory
        cb(null, path.join(__dirname, "../uploads"));
      },
      filename: function (req, file, cb) {
        // Save the file with the original name or customize it
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    // Set up multer with file filter (optional) and storage
    const upload = multer({ storage: storage });
    return upload;
  }
  setItemCeche({ key, value, second }) {
    return cache.set(key, value, second);
  }
  getItemCeche(key) {
    const value = cache.get(key);
    return value;
  }
  async generateUniqueUserId() {
    const excludedNumbers = [
      100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
      111111, 222222, 333333, 444444, 555555, 666666, 777777, 888888, 999999,
    ];

    let userId;
    let isUnique = false;

    while (!isUnique) {
      // Generate a random 6-digit number between 100000 and 999999
      userId = Math.floor(Math.random() * 900000) + 100000;

      // Check if the userId is in the excluded list
      if (excludedNumbers.includes(userId)) {
        continue; // Skip if it's in the excluded list
      }

      // Check if the generated userId already exists in the database
      const existingUser = await Users.findOne({
        where: {
          userid: userId,
        },
      });

      // If no user is found, the userId is unique
      if (!existingUser) {
        isUnique = true;
      }
    }

    return userId;
  }
}

module.exports = new HelperFunction();
