const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const authRoutes = require('./router/auth');
const { sequelize } = require('./models/index'); // sequelize ni models dan chaqirish

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

app.use('/api/auth', authRoutes);


// Server ishga tushganda sequelize sync ni chaqiramiz
sequelize.sync({ force: false})
  .then(() => {
    console.log('Jadvallar yaratildi yoki o\'zgartirildi');
  });


// swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Hujjatlari',
      version: '1.0.0',
      description: 'Mobil ilova uchun API hujjatlari',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./swagger/auth.js'], // Swagger fayllarining joylashuvi
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', async (req, res) => {
    res.json('hello')
})


const server = http.createServer(app)

module.exports = server;
