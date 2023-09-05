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
const roomScores = {}; 
const roomUserNames = {}; 

// Load questions from questions.json
const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'questions.json'), 'utf-8'));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a quiz room (only room number 100 is allowed)
    socket.on('joinQuizRoom', (roomCode, userName) => {
        if (roomCode === '100') {
            socket.join(roomCode);

            // Store the user in the connectedUsers object with their socket ID and room code
            connectedUsers[socket.id] = roomCode;

            // Initialize the user's score to 0
            roomScores[socket.id] = 0;

            // Store the user's name
            roomUserNames[socket.id] = userName;

            // Notify all users in the room that a new user has joined
            io.to(roomCode).emit('userJoined', { id: socket.id, name: userName });

            // Send the current scores and user names to all users in the room
            io.to(roomCode).emit('updateScores', { scores: roomScores, names: roomUserNames });

            // Send the questions to the user who just joined the room
            socket.emit('newQuestion', { questions: questionsData });
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Check if the user was in room 100
        const roomCode = connectedUsers[socket.id];
        if (roomCode === '100') {
            // Notify all users in room 100 that a user has left
            io.to(roomCode).emit('userLeft', socket.id);

            // Remove the user from the connectedUsers, roomScores, and roomUserNames objects
            delete connectedUsers[socket.id];
            delete roomScores[socket.id];
            delete roomUserNames[socket.id];

            // Send the updated scores and user names to all users in the room
            io.to(roomCode).emit('updateScores', { scores: roomScores, names: roomUserNames });
        }
    });
});
