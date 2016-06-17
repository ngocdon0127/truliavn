API for TruliaVN
================

## Run
	$ npm install && npm start

## API for operation with House

### Get information of a House by its id. - GET Request
	$ http://localhost:3000/api/house/1

### Create a new House - POST Request
	$ http://localhost:3000/api/house

`` Request must include email + token of an authenticated user. ``

Demo in `` http://localhost:3000/addhouse ``

`` /views/addhouse.ejs ``

### Update a house - POST Request
	$ http://localhost:3000/api/house/edit
`` Request must include email + token of an authenticated user. ``

Demo in `` http://localhost:3000/edithouse/1 ``

`` /views/edithouse.ejs ``

### Delete a house - POST Request
	$ http://localhost:3000/api/house/delete
`` Request must include email + token of an authenticated user. ``


## API for operation with User
`` building... ``