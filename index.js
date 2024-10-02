require("dotenv").config();
const PORT = process.env.PORT || 5000;
const models = require("./models/index");
const sequelize = require("./db");
const server = require("./http");

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize
      .sync({ force: false })
      .then(() => {
        console.log("Database synced");
      })
      .catch((err) => {
        console.error("Error syncing database:", err);
      });
    server.listen(PORT, () => {
      console.log(`Server run ${PORT} ...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
