const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const router = require("./router/index");
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const http = require('http');
const { Server } = require('socket.io')

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
class SocketService {
    constructor() {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                allowedHeaders: ["Content-Type"],
                credentials: true
            }
        });

        this.onlineUsers = new Set();

        this.io.on('connection', (socket) => {
            console.log('🟢 New user connected:', socket.id);

            // Yangi user qo'shish
            this.onlineUsers.add(socket.id);

            console.log(`📊 Total online users: ${this.onlineUsers.size}`);
            console.log('👥 Current users:', Array.from(this.onlineUsers));

            // User disconnect bo'lganda
            socket.on('disconnect', () => {
                console.log('🔴 User disconnected:', socket.id);
                this.onlineUsers.delete(socket.id);
                console.log(`📊 Remaining online users: ${this.onlineUsers.size}`);
            });

            // Test message
            socket.emit('test_connection', {
                message: 'Connected to server successfully',
                socketId: socket.id
            });
        });
    }

    // Barcha online userlarga xabar yuborish
    broadcastMessage(message) {
        if (this.onlineUsers.size === 0) {
            return {
                success: false,
                message: "No online users found"
            };
        }

        this.io.emit('new_message', {
            message,
            timestamp: new Date(),
            from: 'ADMIN'
        });

        return {
            success: true,
            onlineUsers: this.onlineUsers.size,
            usersList: Array.from(this.onlineUsers)
        };
    }

    // Online userlar ro'yxatini olish
    getOnlineUsers() {
        return {
            users: Array.from(this.onlineUsers),
            count: this.onlineUsers.size
        };
    }
}

// Single instance yaratish
const socketService = new SocketService();




module.exports = { server, socketService, app };