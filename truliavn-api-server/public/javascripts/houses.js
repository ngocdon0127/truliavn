var HOST = 'http://ngocdon.me/#!';
var HOST_BE = 'http://ngocdon.me:3000';
var HouseRow = React.createClass({
	render: function() {
		var house = this.props.house;
		var thumbnail = '';
		if (house.images.length > 0){
			thumbnail = house.images[0];
		}
		else{
			thumbnail = 'http://kenh14.vcmedia.vn/QuickNewsK14/1567947/2014/05/img_201405191004073256.jpg';
		}
		var btnReview = 
		<td><button type="button" className={house.hidden ? "btn btn-primary" : "btn btn-warning"} onClick={this.handleReview.bind(this, this.props.index)}>{house.hidden ? 'Show' : 'Hide'}</button></td>
		return (
			<tr>
				<td><img className="img-responsive" src={thumbnail} /></td>
				<td><a href={HOST + '/houses/' + house.id}>{house.title}</a></td>
				<td>{house.address}</td>
				<td dangerouslySetInnerHTML={{__html: house.description}}></td>
				<td>{house.price}</td>
				<td>{house.area}</td>
				<td><button type="button" className="btn btn-danger" onClick={this.handleDeleteClick.bind(this, this.props.index)}>Delete</button></td>
				{btnReview}
			</tr>
		)
	},
	handleDeleteClick: function (index) {
		var c = confirm('Delete this house?');
		if (c){
			this.props.onUserClick(index);
		}
	},
	handleReview: function (index) {
		this.props.onReview(index);
	}
})

var Houses = React.createClass({
	render: function() {
		var houses = this.props.houses;
		var rows = [];
		houses.map(function (house, index) {
			rows.push(<HouseRow house={house} key={index} onUserClick={this.handleDeleteClick} index={index} onReview={this.handleReview} />);
		}.bind(this));
		return (
			<tbody>
				{rows}
			</tbody>
		);
	},
	handleDeleteClick: function (index) {
		this.props.onUserClick(index);
	},
	handleReview: function (index) {
		this.props.onReview(index);
	}
});

var SelectCity = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Thành Phố---</option>);
		for (var i in this.props.cities) {
			var city = this.props.cities[i];
			opts.push(<option value={i} key={i}>{city.cityName}</option>);
		}
		return (
			<select className="form-control" onChange={this.selectCity} value={this.props.city}>
				{opts}
			</select>
		);
	}
});

var SelectDistrict = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Quận/Huyện---</option>);
		for (var i in this.props.districts) {
			var district = this.props.districts[i];
			opts.push(<option value={i} key={i}>{district.districtName}</option>);
		}
		return (
			<select className="form-control" onChange={this.selectDistrict} value={this.props.district}>
				{opts}
			</select>
		);
	},
	selectDistrict: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	}
});

var SelectWard = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Phường/Xã---</option>);
		for (var i in this.props.wards) {
			var ward = this.props.wards[i];
			opts.push(<option value={i} key={i}>{ward.wardName}</option>);
		}
		return (
			<select className="form-control" onChange={this.selectWard} value={this.props.ward}>
				{opts}
			</select>
		);
	},
	selectWard: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	}
});

var SelectStreet = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Đường phố---</option>);
		for (var i in this.props.streets) {
			var street = this.props.streets[i];
			opts.push(<option value={i} key={i}>{street.streetName}</option>);
		}
		return (
			<select className="form-control" onChange={this.selectStreet} value={this.props.street}>
				{opts}
			</select>
		);
	}
});

var SelectHidden = React.createClass({
	selectHidden: function (onlyHidden) {
		this.props.handleChange(parseInt(this.refs.onlyhidden.value));
	},
	render: function() {
		return (
			<select className="form-control" ref="onlyhidden" onChange={this.selectHidden}>
				<option value={-1}>---Tất cả---</option>
				<option value={0}>---Chỉ bài đăng đang hiển thị---</option>
				<option value={1}>---Chỉ bài đăng đang ẩn---</option>
			</select>
		);
	}
});

var SelectUser = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Người đăng tin---</option>);
		for (var i in this.props.users) {
			var user = this.props.users[i];
			opts.push(<option value={user.id} key={i}>{user.fullname}</option>);
		}
		return (
			<select className="form-control" onChange={this.selectUser}>
				{opts}
			</select>
		);
	},
	selectUser: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	}
});

var HOUSE_PER_PAGE = 10;
var HOUSE_TYPE_CHUNG_CU = 0;
var HOUSE_TYPE_NHA_RIENG = 1;
var HOUSE_TYPE = {
	0: 'Chung cư',
	1: 'Nhà riêng'
}

var SelectType = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Loại---</option>);
		opts.push(<option value={HOUSE_TYPE_CHUNG_CU} key={HOUSE_TYPE_CHUNG_CU}>{HOUSE_TYPE[HOUSE_TYPE_CHUNG_CU]}</option>);
		opts.push(<option value={HOUSE_TYPE_NHA_RIENG} key={HOUSE_TYPE_NHA_RIENG}>{HOUSE_TYPE[HOUSE_TYPE_NHA_RIENG]}</option>);
		return (
			<select className="form-control" onChange={this.selectType} value={this.props.type}>
				{opts}
			</select>
		);
	},
	selectType: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	}
});

var HOUSE_FOR_RENT = 0;
var HOUSE_FOR_SELL = 1;
var HOUSE_FOR = {
	0: 'Cho thuê',
	1: 'Rao bán'
}

var SelectHouseFor = React.createClass({
	render: function() {
		var opts = [];
		opts.push(<option value='-1' key='-1'>---Hình thức---</option>);
		opts.push(<option value={HOUSE_FOR_RENT} key={HOUSE_FOR_RENT}>{HOUSE_FOR[HOUSE_FOR_RENT]}</option>);
		opts.push(<option value={HOUSE_FOR_SELL} key={HOUSE_FOR_SELL}>{HOUSE_FOR[HOUSE_FOR_SELL]}</option>);
		return (
			<select className="form-control" onChange={this.selectHouseFor} value={this.props.housefor}>
				{opts}
			</select>
		);
	},
	selectHouseFor: function (event) {
		console.log(parseInt(event.target.value));
		this.props.handleChange(parseInt(event.target.value));
	}
});

var App = React.createClass({
	getInitialState: function () {
		return {
			houses: [],
			users: [],
			user: -1,
			curpage: 0,
			max: 0,
			onlyHidden: -1,
			city: -1,
			district: -1,
			ward: -1,
			street: -1,
			type: -1,
			houseFor: -1,
			places: {
				cities: {},
				districts: {},
				wards: {},
				streets: {}
			}
		}
	},
	componentDidMount: function () {
		this.init();
		this.updateList();
		var self = this;

		// scroll to load more.
		// already work.
		// $(window).scroll(function() {
		// 	if($(window).scrollTop() + $(window).height() == $(document).height()) {
		// 		// alert("bottom!");
		// 		self.changeState(['curpage'], [self.state.curpage + 1], function () {
		// 			self.updateList();
		// 		});
		// 	}
		// });
	},
	updateList: function () {
		var url = '/api/houses?specific=1&includehidden=1&offset=' + (this.state.curpage * HOUSE_PER_PAGE);
		if (parseInt(this.state.city) > 0){
			url += '&city=' + parseInt(this.state.city);
		}
		if (parseInt(this.state.district) > 0){
			url += '&district=' + parseInt(this.state.district);
		}
		if (parseInt(this.state.ward) > 0){
			url += '&ward=' + parseInt(this.state.ward);
		}
		if (parseInt(this.state.street) > 0){
			url += '&street=' + parseInt(this.state.street);
		}
		if (parseInt(this.state.user) > 0){
			url += '&owner=' + parseInt(this.state.user);
		}
		if (parseInt(this.state.onlyHidden) >= 0){
			url += '&hidden=' + parseInt(this.state.onlyHidden);
		}
		var type = parseInt(this.state.type);
		if ((type >= 0) && (type < 2)){
			url += '&type=' + (type ? 'house' : 'apartment');
		}
		var houseFor = parseInt(this.state.houseFor)
		if ((houseFor >= 0) && (houseFor < 2)){
			url += '&housefor=' + (houseFor ? 'sell' : 'rent');
		}
		url += '&count=' + HOUSE_PER_PAGE;
		// console.log(url);
		// houses
		$.ajax({
			url: url,
			method: 'GET',
			success: function (data) {
				console.log(data);
				if (data.status == 'success'){

					// scroll to seek
					// this.changeState(['houses'], [this.state.houses.concat(data.houses)]);

					this.changeState(['houses'], [data.houses]);
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		});
		url = url.substring(0, url.indexOf('&count='));
		url += '&count=-1&onlycount=1';
		// console.log(url);
		$.ajax({
			url: url,
			method: 'GET',
			success: function (data) {
				console.log(data);
				if (data.status == 'success'){
					this.changeState(['max'], [data.count]);
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		})
	},
	init: function () {

		//citites
		$.ajax({
			url: '/api/cities',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					this.changeState(['places'], [{
						cities    : data.cities,
						districts : this.state.places.districts,
						wards     : this.state.places.wards,
						streets   : this.state.places.streets
					}])
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		});

		// districts
		$.ajax({
			url: '/api/districts',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					this.changeState(['places'], [{
						cities    : this.state.places.cities,
						districts : data.districts,
						wards     : this.state.places.wards,
						streets   : this.state.places.streets
					}])
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		});

		// wards
		$.ajax({
			url: '/api/wards',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					this.changeState(['places'], [{
						cities    : this.state.places.cities,
						districts : this.state.places.districts,
						wards     : data.wards,
						streets   : this.state.places.streets
					}])
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		});

		// streets
		$.ajax({
			url: '/api/streets',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					this.changeState(['places'], [{
						cities    : this.state.places.cities,
						districts : this.state.places.districts,
						wards     : this.state.places.wards,
						streets   : data.streets
					}])
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		});

		// users
		$.ajax({
			url: '/api/allusers',
			method: 'GET',
			success: function (data) {
				// console.log(data);
				this.changeState(['users'], [data.users]);
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		})
	},
	changeState: function (props, vals, callback){
		if ((props instanceof Array) && (vals instanceof Array) && (props.length === vals.length)){
			this.setState(function (preState, curProps) {
				var newState = {};
				for(var i in preState){
					newState[i] = preState[i];
				}
				for (var i = 0; i < props.length; i++) {
					var prop = props[i];
					var val = vals[i];
					newState[prop] = val;
				}
				return newState;
			}, callback);

			// for (var i = 0; i < props.length; i++) {
			// 	var prop = props[i];
			// 	var val = vals[i];
			// 	this.state[prop] = val; // do not do that.

			// 	// NEVER mutate this.state directly, as calling setState() afterwards may replace 
			// 	// the mutation you made. Treat this.state as if it were immutable.

			// 	// https://facebook.github.io/react/docs/component-api.html
			// }
			// this.setState(this.state, callback);
		}
		else{
			callback();
		}
	},
	selectCity: function (cityId) {
		var self = this;
		self.changeState(['city', 'houses', 'curpage', 'district', 'ward', 'street'], [cityId, [], 0, -1, -1, -1], function () {
			self.updateList();
		});
	},
	selectDistrict: function (districtId) {
		var self = this;
		self.changeState(['houses', 'district', 'curpage', 'ward', 'street'], [[], districtId, 0, -1, -1], function () {
			self.updateList();
		})
	},
	selectWard: function (wardId) {
		var self = this;
		self.changeState(['houses', 'ward', 'curpage', 'street'], [[], wardId, 0, -1], function () {
			self.updateList();
		})
	},
	selectStreet: function (streetId) {

		// TO DO

		this.changeState(['street', 'curpage'], [streetId, 0], function () {
			this.updateList();
		}.bind(this));
	},
	selectType: function (type) {
		this.changeState(['houses', 'type', 'curpage'], [[], type, 0], function () {
			this.updateList();
		}.bind(this));
	},
	selectHouseFor: function (housefor) {
		this.changeState(['houses', 'houseFor', 'curpage'], [[], housefor, 0], function () {
			this.updateList();
		}.bind(this));
	},
	selectHidden: function (onlyHidden) {
		this.changeState(['houses', 'onlyHidden'], [[], onlyHidden], function () {
			this.updateList();
		}.bind(this));
	},
	selectUser: function (userId) {
		this.changeState(['houses', 'user'], [[], userId], function () {
			this.updateList();
		}.bind(this));
	},
	reviewHouse: function (index) {
		var self = this;
		var houseId = this.state.houses[index].id;
		var hidden = this.state.houses[index].hidden;
		$.ajax({
			url: '/api/house/' + houseId + '/review/' + (hidden ? 'show' : 'hide'),
			method: 'GET',
			success: function (data) {
				console.log(data);
				self.updateList();
			},
			error: function (err) {
				console.log(err);
			}
		})
	},
	render: function() {
		var self = this;
		var opts = [];
		opts.push(<option value={0} key={-1}>--- Chọn trang (Có tất cả {this.state.max} nhà) ---</option>);
		for (var i = 0; i < this.state.max / HOUSE_PER_PAGE; i++) {
			opts.push(<option value={i} key={i}>{i}</option>);
		}
		function filterDistricts (districts) {
			// return districts;
			if (self.state.city > 0){
				var results = {};
				for(var i in districts){
					var district = districts[i];
					if (district.cityId == self.state.city){
						results[i] = district;
					}
				}
				return results;
			}
			return districts;
		}
		function filterWards (wards) {
			// return wards;
			if (self.state.district > 0){
				var results = {};
				for(var i in wards){
					var ward = wards[i];
					if (ward.districtId == self.state.district){
						results[i] = ward;
					}
				}
				return results;
			}
			return wards;
		}
		function filterStreets (streets) {
			// return streets;
			if (self.state.district > 0){
				var results = {};
				for(var i in streets){
					var street = streets[i];
					if (street.districtId == self.state.district){
						results[i] = street;
					}
				}
				return results;
			}
			return streets;
		}

		return (
			<div>
				<div className="row select">
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectHidden handleChange={this.selectHidden} />
					</div>
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectUser handleChange={this.selectUser} users={this.state.users} />
					</div>
				</div>
				<div className="row select">
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectType type={this.state.type} handleChange={this.selectType} />
					</div>
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectHouseFor housefor={this.state.houseFor} handleChange={this.selectHouseFor} />
					</div>
				</div>
				<div className="row select">
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectCity cities={this.state.places.cities} />
					</div>
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectDistrict districts={filterDistricts(this.state.places.districts)} handleChange={this.selectDistrict} />
					</div>
				</div>
				<div className="row select">
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectWard wards={filterWards(this.state.places.wards)} handleChange={this.selectWard}/>
					</div>
					<div className="col-xs-6 col-sm-6 col-md-6 col-lg-6">
						<SelectStreet streets={filterWards(this.state.places.streets)} />
					</div>
				</div>
				<div className="row select">
					<div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 select">
						<button type="button" className="btn btn-primary button btn-block" onClick={this.pre}>Pre</button>
					</div>
					<div className="col-xs-12 col-sm-4 col-md-6 col-lg-6 select">
						<select className="form-control" onChange={this.seek} value={this.state.curpage}>{opts}</select>
					</div>
					<div className="col-xs-12 col-sm-4 col-md-3 col-lg-3 select">
						<button type="button" className="btn btn-primary button btn-block" onClick={this.next}>Next</button>
					</div>
					
				</div>
				<div className="row select">
					<table className="table table-hover table-responsive">
						<thead>
							<tr>
								<th>Ảnh</th>
								<th>Tiêu đề</th>
								<th>Địa chỉ</th>
								<th>Mô tả</th>
								<th>Giá (triệu đồng)</th>
								<th>Diện tích (m<sup>2</sup>)</th>
								<th></th>
							</tr>
						</thead>
						<Houses houses={this.state.houses} onUserClick={this.handleDeleteClick} onReview={this.reviewHouse} />
					</table>
				</div>
			</div>
		);
	},
	pre: function () {
		this.changeState(['curpage'], [(this.state.curpage >= 1) ? (this.state.curpage - 1) : 0], function () {
			this.updateList();
		}.bind(this));
	},
	next: function () {
		this.changeState(['curpage'], [(this.state.curpage + 1 <= this.state.max / HOUSE_PER_PAGE) ? (this.state.curpage + 1) : Math.floor(this.state.max / HOUSE_PER_PAGE)], function () {
			this.updateList();
		}.bind(this));
	},
	seek: function (event) {
		this.changeState(['curpage'], [parseInt(event.target.value)], function () {
			this.updateList();
		}.bind(this));
	},
	handleDeleteClick: function (index) {
		var houseId = this.state.houses[index].id;
		this.state.houses.splice(index + this.state.curpage * HOUSE_PER_PAGE, 1);
		this.setState({
			houses: this.state.houses,
			curpage: this.state.curpage
		})
		console.log(index + ':' + houseId);
		// return;
		$.ajax({
			url: '/api/house/' + houseId + '/delete',
			method: 'GET',
			success: function (data) {
				console.log(data);
				if (data.status == 'error'){
					alert(data.error);
				}
				this.updateList();
			}.bind(this),
			error: function (err) {
				console.log(err);
				this.updateList();
			}.bind(this)
		})
	}
});

ReactDOM.render(<App />, document.getElementById('root'));