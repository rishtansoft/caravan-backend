const { socketService } = require('../../http');
const ONLINE_ROOM = 'online_users';

class Sendmessage {
    async sendData(req, res, next) {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: "Message is required"
                });
            }

            console.log('📨 Broadcasting message to all users:', message);

            const result = socketService.broadcastMessage(message);

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: result.message
                });
            }

            res.status(200).json({
                success: true,
                message: "Message broadcast successfully",
                onlineUsers: result.onlineUsers,
                usersList: result.usersList
            });

        } catch (error) {
            console.error('❌ Error in sendData:', error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    async onlineUsers(req, res, next) {
        try {
            const { users, count } = socketService.getOnlineUsers();

            console.log('📊 Online users request');
            console.log('Total users:', count);
            console.log('Users:', users);

            res.status(200).json({
                success: true,
                onlineUsers: users,
                totalCount: count
            });

        } catch (error) {
            console.error('❌ Error in onlineUsers:', error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
}


module.exports = new Sendmessage();
