
// get elements from the DOM
const conversationContainer = document.querySelector('#conversation-container')
const leave = document.querySelector('#leave')
const send = document.querySelector('#send')
const roomMatesContainer = document.querySelector('#room-mates')
const messageField = document.querySelector('textarea')

// set the focus to the message field so that users wont have to manually click it
messageField.focus()

// keep track of message field focus state
let messageFieldHasFocus = true

// these variables are used to get query strings' values from the URL bar
const urlString = window.location.href
const url = new URL(urlString)
const username = url.searchParams.get('username')
const room = url.searchParams.get('room')

// array that keeps track of room mates' usernames and the divs that show
// them on the left of the UI
let roommatesArray = []

// connect to the server via a websocket
const socket = io()

// creates a DOM element based on the arguments passed
const makeNode = (nodeType, attrType, identifier, parent, content) => {

	// creates an element and gives it an identifier
	const newNode = document.createElement(nodeType)
	newNode.setAttribute(attrType, identifier)

	// appends the element to the parent
	parent.appendChild(newNode)

	// set its inner text to content if content is supplied
	if(content != null) newNode.innerText = content

	// return the created element
	return newNode
}

// this function styles messages that will be shown to the user
const newMessage = (message, from) => {

	// make a wrapper that contains the sender and the message itself
	const messageContainer = makeNode('div', 'class', 'message-container', conversationContainer, null)

	// if the sender is not the user, give it a label that displays the sender
	if(from != username){
		makeNode('div', 'id', 'label', messageContainer, from)
		const messageContent = makeNode('div', 'class', 'message', messageContainer, message)
	}

	// else, if the sender is the user, give it an id of 'your-message' so that it will
	// be styled differently
	else{
		const messageContent = makeNode('div', 'class', 'message', messageContainer, message)
		messageContent.setAttribute('id', 'your-message')		
	}

	// whenever there is a new message, and the message field has the focus,
	// scroll the conversation down
	if(!messageFieldHasFocus) return
	conversationContainer.scrollTop = conversationContainer.scrollHeight
}

// similar to the newMessage function but this is for system messages
const newSystemMessage = (message) => {

	// make an element of that message
	makeNode('div', 'id', 'system-message', conversationContainer, message)

	// whenever there is a new system message, and the message field has the focus,
	// scroll the conversation down
	if(!messageFieldHasFocus) return
	conversationContainer.scrollTop = conversationContainer.scrollHeight
}

// this function is called whenever the user sends a message
const sendMessage = (message) => {

	// emit sendMessage to the server
	socket.emit('sendMessage', message, room, username)

	// add your own message to the frontend
	newMessage(message, username)

	// reset the message field
	messageField.value = ''
}

// this shows all users that are in the same room the moment you joined
const showRoommates = (roommates) => {

	// get the container element from the DOM
	const roomMatesContainer = document.querySelector('#room-mates')

	// for every room mate
	for(let i = 0; i < roommates.length; i++){

		// make an element so that they will be styled
		const newNode = makeNode('div', 'class', 'room-mate', roomMatesContainer, roommates[i])

		// add them to the roommatesArray, together with the elements that
		// corresponds to them
		roommatesArray[roommates[i]] = newNode
	}
}

// when the webpage loads, tell the server that you have joined a room, together with your
// username and the room that you have joined in
socket.emit('joinedRoom', username, room)

// this tells you that you have joined a room
newSystemMessage(`You have entered the ${room} room.`)

// make a system message that tells you whenever someone joins 
// the same room that you are in
socket.on('someoneJoinedRoom', (username) => {

	// if the room mate is already in the array, dont proceed this prevents
	// the system to send a new system message when a user hits refresh
	if(roommatesArray[username]) return

	// add the room mate in the roommatesArray and also on the room mates list on the left
	const newNode = makeNode('div', 'class', 'room-mate', roomMatesContainer, username)
	roommatesArray[username] = newNode

	// make the actual system message
	newSystemMessage(`${username} has entered the chat.`)
})

// whenever you join a room, the server sends you a list of all users that are in the same room
socket.on('getRoommates', (roommates) => {

	// and then showRoommates function is called to style them
	showRoommates(roommates)
})

// whenever someone sends a message, the server sends the message and its sender to all of the 
// users in the same room
socket.on('receiveMessage', (message, from) => {

	// and then show them in the DOM 
	newMessage(message, from)
})

// whenever someone leaves a room, notify everyone in the same room
socket.on('someoneLeft', (user) => {

	// get their element in the DOM
	const node = roommatesArray[user]

	// remove it on the roomMatesContainer and the roommatesArray
	roomMatesContainer.removeChild(node)
	delete roommatesArray[user]

	// make a system message that announces their leave
	newSystemMessage(`${user} has left the chat.`)
})


// this variable keeps track if Shift is pressed
let shift = false

// if shift is pressed down, set shift to true
document.addEventListener('keydown', (e) => {
	if(e.key == 'Shift') shift = true
})

// listen to keyboard keyup events
document.addEventListener('keyup', (e) => {

	// remove outer whitespaces of the message field
	const trimmedMessage = messageField.value.trim()

	// if Shift has been let go, set shift to false
	if(e.key == 'Shift') shift = false

	// if the key that has been pressed and release is not Enter
	// or if the message field contains nothing or only whitespaces
	// or if the shift is being held down
	// do not proceed
	if(e.key != 'Enter' || trimmedMessage == '' || shift) return

	// if all the conditions are satisfied (Enter is pressed and released, 
	// there is an actual message, and Shift is not being held down) call 
	// the sendMessage function
	sendMessage(trimmedMessage)
})

// do the same if the Send button is pressed rather than Enter
send.addEventListener('click', (e) => {
	e.preventDefault()
	sendMessage(messageField.value.trim())
})

// if the Leave button is pressed
leave.addEventListener('click', () => {

	// tell the server that you have left the room
	socket.emit('leftRoom', username, room)

	// redirect to the Login page
	window.location.replace('./')
})

// toggles the messageFieldHasFocus depending on whether the message field
// has the cursor focus
messageField.addEventListener('focusout', () => {
	messageFieldHasFocus = false
})
messageField.addEventListener('focusin', () => {
	messageFieldHasFocus = true
})