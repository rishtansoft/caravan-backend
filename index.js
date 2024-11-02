require("dotenv").config();
const PORT = process.env.PORT || 6000;
const models = require("./models/index");
const sequelize = require("./db");
const { server, socketService, app } = require("./http");
const sendmessage = require('./router/sendmessage/sendmessage')
// const { io } = require('./socketio')

// Connected userlarni saqlash uchun Map

app.use('/socket', sendmessage)



const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize
            .sync({ force: false, alter: true })
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




