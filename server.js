const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const logFilePath = path.join(__dirname, 'log.txt');
const logBuffer = [];
const logLimit = 10;

let clientCounter = 0; // Counter to track the number of clients
const clients = {}; // { clientName: socketId }

// Serve static files from the "public" directory
app.use(express.static('public'));

io.on('connection', (socket) => {
  clientCounter++;
  const clientName = `client${clientCounter}`; // Generate a sequential client name
  console.log(socket.id);
  clients[clientName] = socket.id; // Map clientName to socket ID

  console.log('A client connected with name:', clientName);

  // Send the current log buffer to the newly connected client
  socket.emit('initialLogs', logBuffer);

  // Handle incoming log messages from clients
  socket.on('log', (message) => {
    if (logBuffer.length >= logLimit) {
      logBuffer.shift(); // Remove the oldest log
    }
    const logMessage = `${clientName}: ${message}`;
    logBuffer.push(logMessage); // Add the new log
    updateLogFile(); // Update the log file with the latest logs
    io.emit('updateLogs', logBuffer); // Broadcast updated logs to all clients
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected with name:', clientName);
    delete clients[clientName]; // Clean up the client name mapping
  });
});

function updateLogFile() {
  fs.writeFile(logFilePath, logBuffer.join('\n') + '\n', (err) => {
    if (err) {
      console.error('Error updating log file:', err);
    }
  });
}

const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
