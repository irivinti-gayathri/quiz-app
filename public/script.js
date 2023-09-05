const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const joinRoomSection = document.getElementById('join-room');
    const quizContainer = document.getElementById('quiz-container');
    const roomCodeInput = document.getElementById('room-code');
    const playerNameInput = document.getElementById('player-name');
    const joinButton = document.getElementById('join-button');
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const nextButton = document.getElementById('next-button');
    const resultElement = document.getElementById('result');

    let currentQuestionIndex = -1;
    let score = 0;
    let questions = [];

    // Function to join a quiz room
    function joinQuizRoom(roomCode, playerName) {
        socket.emit('joinQuizRoom', roomCode);

        // Hide the join room section and show the quiz section
        joinRoomSection.style.display = 'none';
        quizContainer.style.display = 'block';

        // Request the first question from the server when a player joins
        socket.emit('requestQuestion');
    }

    // Event listener for joining a room
    joinButton.addEventListener('click', () => {
        const roomCode = roomCodeInput.value.trim();
        const playerName = playerNameInput.value.trim();

        if (roomCode && playerName) {
            joinQuizRoom(roomCode, playerName);
        }
    });

    // Event listener for the "Next" button
    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        } else {
            // Quiz finished
            questionElement.textContent = 'Quiz Finished!';
            optionsElement.innerHTML = `<p>Your Score: ${score} out of ${questions.length}</p>`;
            nextButton.disabled = true;
        }
    });

    // Function to display a question and its options
    function displayQuestion(index) {
        const question = questions[index];
        questionElement.textContent = question.question;
        optionsElement.innerHTML = '';

        question.options.forEach((option, optionIndex) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => checkAnswer(optionIndex, question.correctAnswerIndex));
            optionsElement.appendChild(button);
        });

        // Clear the result message
        resultElement.textContent = '';

        // Disable the "Next" button until the user selects an answer
        nextButton.disabled = true;
    }

    // Function to check the selected answer
    function checkAnswer(selectedOptionIndex, correctAnswerIndex) {
        if (selectedOptionIndex === correctAnswerIndex) {
            score++;
            resultElement.textContent = 'Correct!';
        } else {
            resultElement.textContent = 'Incorrect!';
        }

        // Enable the "Next" button
        nextButton.disabled = false;
    }

    // Socket.io event handlers
    socket.on('roomFull', () => {
        alert('The room is full. You cannot join.');
        // Redirect or handle as needed
    });

    socket.on('newQuestion', (questionData) => {
        questions = questionData.questions;
        currentQuestionIndex = -1;
        score = 0;
        nextButton.disabled = false;
        displayQuestion(0);
    });
});
