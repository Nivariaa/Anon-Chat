import express from 'express'
import path from 'path'
import http from 'http'
import {Server} from 'socket.io'

// since this system does not have a database functionality, we are just going to create a 
// variable to keep track of which username has which ID
let users = []

// specify a port number
const PORT = 3000

// make an instance of express
const app = express()

// tell express to host static files in the 'public folder'
app.use(express.static('public'))

// make a server using socket.io
const httpServer = http.createServer(app)
const io = new Server(httpServer)

// get all the ID of the room mates in a specific room
const getRoommates = (userID, room) => {

	// make an array that holds room mates
	let roommates = []

	// setRooms will hold all the ID of the users in the room
	const mapRooms = io.sockets.adapter.rooms
	const setRooms = mapRooms.get(room)

	// for every ID
	for(const roommate of setRooms){

		// if the id is not equal to the userID
		if(roommate != userID){

			// add it in the roommates array
			roommates.push(users[room][roommate])			
		}
	}

	// return roommates array
	return roommates
}

// this is called whenever a user connects to the server
io.on('connection', (socket) => {

	// if a user joins a room
	socket.on('joinedRoom', (username, room) => {

		// if the room that the user joined is does not exist in the users array, add it
		if(users[room] == null) users[room] = []

		// add the user and their corresponding ID to the users array
		users[room][socket.id] = username

		// join the user to the room
		socket.join(room)

		// tell every user in the room that someone has joined
		socket.to(room).emit('someoneJoinedRoom', username)

		// send the user an array of all the users in the same room and their IDs
		socket.emit('getRoommates', getRoommates(socket.id, room))
	})

	// whenever someone sends a message
	socket.on('sendMessage', (message, room, username) => {

		// send that message to everyone in the same room
		socket.broadcast.to(room).emit('receiveMessage', message, username)
	})

	// whenever someone leaves a room
	socket.on('leftRoom', (username, room) => {

		// remove them from the users array
		delete users[room][socket.id]

		// tell everyone in the same room that that user has left the room
		socket.broadcast.to(room).emit('someoneLeft', username)
	})
})


// start the server on the port defined
httpServer.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})