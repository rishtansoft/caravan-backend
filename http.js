const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");

const app = express();
const http = require('http')
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use("/api", router);
app.use(errorHandler);
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    res.header({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "*",
    });
    next();
});

app.get('/', async (req, res) => {
    res.json('hello')
})


const server = http.createServer(app)

module.exports = server;
