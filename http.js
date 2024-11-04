const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const errorHandler = require("./middleware/ErrorHandlingMiddlware");
const http = require('http');
const { Server } = require('socket.io')
const { Users, Driver, Assignment, Location, Load } = require('./models');

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

app.use(errorHandler);

// Root route
app.get('/', async (req, res) => {
    console.log("test");
    res.json('hello');
});

async function saveLocationToDB(driverId, latitude, longitude) {
    const assignment = await Assignment.findOne({
        where: {
            driver_id: driverId,
            assignment_status: "assigned",
        },
        order: [['createdAt', 'DESC']],
    });

    if (!assignment) {
        console.log(`Haydovchiga yuk topilmadi: ${driverId}`);
        return;
    }

    await Location.create({
        assignment_id: assignment.id,
        latitude,
        longitude,
        recordedAt: new Date(),
    });
}


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
        this.onlineDrivers = new Set();
        this.onlineOwners = new Set();

        this.io.on('connection', async (socket) => {

            const { user_id, unique_id, role } = socket.handshake.query;

            if (!(user_id && unique_id && role)) {
                console.log('❌ Token yo\'q. Ulana olmadi.');
                socket.disconnect();
                return;
            }

            const user = await Users.findByPk(user_id);
            if (!user) {
                console.log('❌ Foydalanuvchi topilmadi.');
                socket.disconnect();
                return;
            }

            if (role == 'driver') {
                this.onlineDrivers.add(socket);
            }

            if (role == 'cargo_owner') {
                this.onlineDrivers.add(socket);
            }

            this.onlineUsers.add(socket);

            console.log(`📊 Total online users: ${this.onlineUsers.size}`);
            console.log('👥 Current users:', Array.from(this.onlineUsers));

            socket.on('locationUpdate', async ({ latitude, longitude, driverId }) => {
                console.log(`📍 Yangi joylashuv qabul qilindi: ${driverId}, ${latitude}, ${longitude}`);

                try {
                    await saveLocationToDB(driverId, latitude, longitude);
                    console.log("Joylashuv muvaffaqiyatli saqlandi.");
                } catch (error) {
                    console.error("Joylashuvni saqlashda xatolik yuz berdi:", error);
                }

                const assignment = await Assignment.findOne({ where: { driver_id: driverId } });
                if (!assignment) {
                    console.log("Ushbu haydovchi uchun yuk topilmadi.");
                    return;
                }

                const load = await Load.findByPk(assignment.load_id);
                if (!load) {
                    console.log("Yuk ma'lumotlari topilmadi.");
                    return;
                }

                const ownerId = load.owner_id;

                const cargoOwnerSocket = Array.from(this.onlineOwners).find(socket =>
                    socket.handshake.query.user_id === ownerId.toString()
                );

                if (cargoOwnerSocket) {
                    cargoOwnerSocket.emit('driverLocationUpdated', {
                        driverId,
                        latitude,
                        longitude,
                    });
                } else {
                    console.log("Yuk egasi hozirda onlayn emas.");
                }
            });

            // User disconnect bo'lganda
            socket.on('disconnect', () => {
                console.log('🔴 User disconnected:', socket.id);
                this.onlineUsers.delete(socket.id);
                if (role === 'driver') {
                    this.onlineDrivers.delete(socket.id);
                } else if (role === 'cargo_owner') {
                    this.onlineOwners.delete(socket.id);
                }
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

    getOnlineOwners() {
        return {
            drivers: Array.from(this.onlineDrivers),
            count: this.onlineDrivers.size
        };
    }

    getOnlineDrivers() {
        return {
            owners: Array.from(this.onlineOwners),
            count: this.onlineOwners.size
        };
    }

    async createdNewLoad(message) {
        const emptyDrivers = [];

        for (const socket of this.onlineDrivers) {
            const user = await Users.findByPk(socket.handshake.query.user_id);
            if (user && user.role === 'driver') {
                const driverDetails = await Driver.findOne({ where: { user_id: user.id } });

                if (driverDetails && driverDetails.driver_status === 'empty') {
                    emptyDrivers.push(socket);
                }
            }
        }

        for (const socket of emptyDrivers) {
            socket.emit('created_load', message);
        }
    }


}

const socketService = new SocketService();

module.exports = { server, socketService, app };