const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

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

// swagger
// Swagger options
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

  // Swagger docs va UI ni o'rnatish
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.get('/', async (req, res) => {
    res.json('hello')
})

const server = http.createServer(app)

module.exports = server;
