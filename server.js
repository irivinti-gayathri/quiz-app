const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Socket.io logic
const connectedUsers = {};

// Load questions from questions.json
const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'questions.json'), 'utf-8'));



io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a quiz room (e.g., a unique room per quiz session)
    socket.on('joinQuizRoom', (roomCode) => {
        socket.join(roomCode);

        // Store the user in the connectedUsers object with their socket ID and room code
        connectedUsers[socket.id] = roomCode;

        // Notify all users in the room that a new user has joined
        io.to(roomCode).emit('userJoined', socket.id);

        // Send the questions to the user who just joined the room
        socket.emit('newQuestion', { questions: questionsData });

        // Optionally, you can also track user scores in this room
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Check if the user was in a room
        const roomCode = connectedUsers[socket.id];
        if (roomCode) {
            // Notify all users in the room that a user has left
            io.to(roomCode).emit('userLeft', socket.id);

            // Remove the user from the connectedUsers object
            delete connectedUsers[socket.id];
        }
    });

    // Add more Socket.io events for quiz functionality here
    // For example, receiving and checking answers
});
