const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDB');
const mongoose = require('mongoose')
const morgan = require('morgan');
const user = require('./routes/user');
const users = require('./routes/users');
const messages = require('./routes/message')
const errorResponse = require('./middleware/errorHandler')
const allPosts = require('./routes/allposts')
const cookieParser = require('cookie-parser')
const post = require('./routes/post')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const hpp = require('hpp');
const fileUpload = require('express-fileupload');
const notification = require('./routes/notification')
const messageNotification = require('./routes/messageNotification')
const { Server } = require("socket.io");
const redis = require('redis');
const connectRedis = require('./config/redis')





mongoose.set('strictQuery', true);
dotenv.config({ path: './config/config.env' })

const app = express();
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(helmet());
app.use(xss());
app.use(hpp())
app.use(cors());
app.use(mongoSanitize());

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));

app.use('/api/v1/user', user);
app.use('/api/v1/posts', post);
app.use('/api/v1/all_posts', allPosts);
app.use('/api/v1/adminusers', users);
app.use('/api/v1/notifications', notification);
app.use('/api/v1/messages', messages);
app.use('/api/v1/messageNotification', messageNotification)
app.use(errorResponse)
connectDB();

const PORT = process.env.PORT || 5000;

let onlineUsers = [];
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on("add-user", (userId) => {
        onlineUsers = onlineUsers.filter(user => user.userId !== userId)
        onlineUsers.push({ userId: userId, socketId: socket.id })
        console.log(onlineUsers, "onlineUsers");
        io.emit("get-users", onlineUsers)
    });

    socket.on("send-message", ({ senderId, receiverId, text }) => {
        const user = onlineUsers.find(user => user.userId == receiverId)
        console.log(user, "usertosendmessage")
        console.log({ senderId, receiverId, text }, "message");
        if (user) {
            console.log(user, "usertosendmessage")
            io.emit("get-message", {
                senderId,
                text
            })
        }
    })


    // socket.on('')

    socket.on('disconnect', () => {
        console.log('User disconnected');
        onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id)
        io.emit("get-users", onlineUsers)
        console.log(onlineUsers, "onlineUsers");
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


// process.on('unhandledRejection', (err, promise) => {
//     console.log(`Error: ${err.message}`);
//     Server.close(() => { process.exit(1) });
// })