module.exports = function (router, connection, CITIES, DISTRICTS, WARDS, STREETS) {

// Initial

// city
connection.query(
	'SELECT * FROM cities',
	[],
	function (err, cities, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < cities.length; i++) {
			CITIES[cities[i].id] = {cityName: cities[i].cityName};
		}
		console.log('city ok.');
	}
)

// district
connection.query(
	'SELECT * FROM districts',
	[],
	function (err, districts, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < districts.length; i++) {
			DISTRICTS[districts[i].id] = {
				cityId: districts[i].cityId, 
				districtName: districts[i].districtName
			}
		}
		console.log('district ok.');
	}
)

// ward
connection.query(
	'SELECT * FROM wards',
	[],
	function (err, wards, fields) {
		if (err){
			console.log(err);
			return;
		}
		for (var i = 0; i < wards.length; i++) {
			WARDS[wards[i].id] = {
				districtId: wards[i].districtId,
				wardName: wards[i].wardName
			}
		}
		console.log('ward ok.');
	}
)

/**
 * ======================
 *
 * API about places
 *
 * ======================
 */

router.get('/cities', function (req, res) {
	res.status(200).json({
		status: 'success',
		cities: CITIES
	})
})

router.get('/districts', function (req, res) {
	var result = {};
	if (req.query.city){
		for (i in DISTRICTS){
			if (DISTRICTS[i].cityId == req.query.city){
				result[i] = DISTRICTS[i];
			}
		}
	}
	else{
		result = DISTRICTS;
	}
	res.status(200).json({
		status: 'success',
		districts: result
	})
})

router.get('/wards', function (req, res) {
	var result = {};
	if (req.query.district){
		for (i in WARDS){
			if (WARDS[i].districtId == req.query.district){
				result[i] = WARDS[i];
			}
		}
	}
	else{
		result = WARDS;
	}
	res.status(200).json({
		status: 'success',
		wards: result
	})
})

router.get('/streets', function (req, res) {
	var result = {};
	if (req.query.district){
		for (i in STREETS){
			if (STREETS[i].districtId == req.query.district){
				result[i] = STREETS[i];
			}
		}
	}
	else{
		result = STREETS;
	}
	res.status(200).json({
		status: 'success',
		wards: result
	})
})

}