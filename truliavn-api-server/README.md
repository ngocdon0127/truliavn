API for TruliaVN
================



## Run

Config [/config/database.js](https://github.com/ngocdon0127/truliavn/tree/master/truliavn-api-server/config/database.js) and run

	$ npm install && npm start

## 1. API for operation with House

### 1.1. Get information of a House by its id - GET Request
	$ http://localhost:3000/api/house/24
	$ http://localhost:3000/api/house/24?raw=1

#### Example Response:

``raw=1:``

	{
		"status": "success",
		"house": {
			"id": 24,
			"type": 0,
			"address": "Dinh Cong Thuong",
			"area": 0,
			"houseFor": 0,
			"lon": 0,
			"lat": 0,
			"noOfBedrooms": 1,
			"noOfBathrooms": 1,
			"buildIn": 2016,
			"price": 0,
			"ownerId": 1,
			"city": "",
			"status": 0,
			"description": "Mo ta",
			"feePeriod": 1,
			"images": [
				"uploads/images/056324f41428f556023730e53fb69db4",
				"uploads/images/d7c71db7463cbddac37cd8a17bd5bba0"
			],
			"features": [
				42,
				43
			]
		}
	}

``pretty:``

	{
		"status": "success",
		"house": {
			"id": 24,
			"type": "Chung cu",
			"address": "Dinh Cong Thuong",
			"area": 0,
			"houseFor": "Cho thue",
			"lon": 0,
			"lat": 0,
			"noOfBedrooms": 1,
			"noOfBathrooms": 1,
			"buildIn": 2016,
			"price": 0,
			"ownerId": 1,
			"city": "",
			"status": "Co san",
			"description": "Mo ta",
			"feePeriod": 1,
			"images": [
				"uploads/images/056324f41428f556023730e53fb69db4",
				"uploads/images/d7c71db7463cbddac37cd8a17bd5bba0"
			],
			"features": [
				null,
				null
			]
		}
	}

### 1.2. Create a new House - POST Request
	$ http://localhost:3000/api/house

`` Request must include email + token of an authenticated user. ``

Demo in `` http://localhost:3000/addhouse ``

`` /views/addhouse.ejs ``

### 1.3. Update a house - POST Request

	$ http://localhost:3000/api/house/edit
`` Request must include email + token of an authenticated user. ``

Demo in `` http://localhost:3000/edithouse/1 ``

`` /views/edithouse.ejs ``

### 1.4. Delete a house - POST Request
	$ http://localhost:3000/api/house/delete
`` Request must include email + token of an authenticated user. ``
#### Request:
- email
- token
- houseId



## 2. API for operation with User

### 2.1. Register - POST Request
	$ http://localhost:3000/api/register
#### Request include:
- email
- password
- fullname
- phone
- address

#### Example Response:
	{
		status: 'success',
		user: {
			email: 'user@example.com',
			fullname: 'Mark Zuckerberg',
			token: 'ea82410c7a9991816b5eeeebe195e20a'
		}
	}

### 2.2. Login - POST Request
	$ http://localhost:3000/api/login
#### Request include:
- email
- password

#### Example Response:
	{
		status: 'error',
		error: 'Invalid password'
	}