require("dotenv").config();
const PORT = process.env.PORT || 5000;
const models = require("./models/models");
const sequelize = require("./db");
const server = require('./http')
const chat = require('./controllers/chat');
//
const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        server.listen(PORT, () => {
            console.log(`Server run ${PORT} ...`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();