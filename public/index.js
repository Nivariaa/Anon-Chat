
// when index.html loads, set the focus to the username field
const usernameField = document.querySelector('#username')
usernameField.focus()

// get room and form elements from the DOM
const room = document.querySelector('#room')
const form = document.querySelector('form')

// if there was a submit event
form.addEventListener('submit', (e) => {

	// do not submit the form right away 
	e.preventDefault()

	// check if the room value is changed
	if(room.value == '--- Select a room to join ---') return

	// if so, submit the form
	form.submit()
})