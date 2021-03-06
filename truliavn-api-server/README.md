API for TruliaVN
================



## Run

	cp config/apikey.js.example config/apikey.js
	cp config/database.js.example config/database.js
Config ```config/apikey.js``` and ```config/database.js``` and run

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
		"title": null,
		"crawledFrom": null,
		"address": "Dinh Cong Thuong",
		"formatted_address": "Định Công Thượng, Hoàng Mai, Hà Nội, Vietnam",
		"area": 0,
		"houseFor": 0,
		"lon": 105.823,
		"lat": 20.9848,
		"noOfBedrooms": 1,
		"noOfBathrooms": 1,
		"noOfFloors": 1,
		"interior": null,
		"buildIn": 2016,
		"price": 0,
		"ownerId": 1,
		"crawledOwnerId": null,
		"city": 1,
		"district": 15,
		"ward": 48,
		"status": 0,
		"description": "Mo ta",
		"feePeriod": 1,
		"created_at": "2016-06-17T07:23:46.000Z",
		"images": [
			"uploads/images/056324f41428f556023730e53fb69db4",
			"uploads/images/d7c71db7463cbddac37cd8a17bd5bba0"
		],
		"ownerInfo": {
			"id": 1,
			"email": "zuck@example.com",
			"fullname": null,
			"phone": "01234567890",
			"address": "Ha Noi"
		}
	}
}

``pretty:``

	{
	"status": "success",
	"house": {
		"id": 24,
		"type": "Chung cư",
		"title": null,
		"crawledFrom": null,
		"address": "Dinh Cong Thuong",
		"formatted_address": "Định Công Thượng, Hoàng Mai, Hà Nội, Vietnam",
		"area": 0,
		"houseFor": "Cho thuê",
		"lon": 105.823,
		"lat": 20.9848,
		"noOfBedrooms": 1,
		"noOfBathrooms": 1,
		"noOfFloors": 1,
		"interior": null,
		"buildIn": 2016,
		"price": 0,
		"ownerId": 1,
		"crawledOwnerId": null,
		"city": "Hà Nội",
		"district": "Long Biên",
		"ward": "Long Biên",
		"status": "Có sẵn",
		"description": "Mo ta",
		"feePeriod": 1,
		"created_at": "2016-06-17T07:23:46.000Z",
		"images": [
			"uploads/images/056324f41428f556023730e53fb69db4",
			"uploads/images/d7c71db7463cbddac37cd8a17bd5bba0"
		],
		"ownerInfo": {
			"id": 1,
			"email": "zuck@example.com",
			"fullname": null,
			"phone": "01234567890",
			"address": "Ha Noi"
		}
	}
}

### 1.2. Create a new House - POST Request
	$ http://localhost:3000/api/house

`` Request must include email + token of an authenticated user. ``

see in Google Drive folder

### 1.3. Update a house - POST Request

	$ http://localhost:3000/api/house/edit
`` Request must include email + token of an authenticated user. ``

see in Google Drive folder

### 1.4. Delete a house - POST Request
	$ http://localhost:3000/api/house/delete
`` Request must include email + token of an authenticated user. ``
#### Request:
- email
- token
- houseId

### 1.5. Get multiple houses - GET Request
	http://localhost:3000/api/houses

#### Filters can used with this API endpoint:
- raw (``0`` or ``1``)
- type (``'nha-rieng'`` or ``'chung-cu'``)
- housefor (``'ban'`` or ``'thue'``)
- city (id of the city)
- district (id of the district)
- ward (id of the wart)



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

### 2.3. Logout - POST Request
	$ http://localhost:3000/api/logout
#### Request include:
- email
- token

## 3. API about places

### 3.1 Request for all cities - GET Request
	http://localhost:3000/api/cities

#### Response
	{
		"status": "success",
		"cities": {
			"1": {
				"cityName": "Hà Nội"
			}
		}
	}

### 3.2 Request for districts - GET Request
	http://localhost:3000/api/districts
	http://localhost:3000/api/districts?city=1

#### Example Response
	{
	"status": "success",
		"districts": {
			"1": {
				"cityId": 1,
				"districtName": "Ba Đình"
			},
			"2": {
				"cityId": 1,
				"districtName": "Ba Vì"
			},
			"3": {
				"cityId": 1,
				"districtName": "Bắc Từ Liêm"
			},
			"4": {
				"cityId": 1,
				"districtName": "Cầu Giấy"
			},
			"30": {
				"cityId": 1,
				"districtName": "Ứng Hòa"
			}
		}
	}

### 3.3 Request for wards - GET Request
	http://localhost:3000/api/wards
	http://localhost:3000/api/wards?districts=15

#### Example Response
	{
		"status": "success",
		"wards": {
			"14": {
				"districtId": 11,
				"wardName": "Minh Khai"
			},
			"23": {
				"districtId": 11,
				"wardName": "Trương Định"
			},
			"39": {
				"districtId": 13,
				"wardName": "Phan Chu Trinh"
			},
			"48": {
				"districtId": 15,
				"wardName": "Long Biên"
			},
			"49": {
				"districtId": 15,
				"wardName": "Ngọc Lâm"
			}
		}
	}