const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const http = require('http');

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
    res.header({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "*",
    });
    next();
});

// Static file serving
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api", router);

app.use(errorHandler);

// Root route
app.get('/', async (req, res) => {
    console.log("test");
    res.json('hello');
});

const server = http.createServer(app);

module.exports = server;