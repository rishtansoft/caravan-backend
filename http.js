const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
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


const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'API Information',
      },
      servers: [
        {
          url: process.env.BASE_URL,
        },
      ],
    },
    apis: ['./swagger/admin/auth.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root route
app.get('/', async (req, res) => {
    res.json('hello');
});

const server = http.createServer(app);

module.exports = server;