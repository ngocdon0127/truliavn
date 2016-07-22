var SelectType = React.createClass({
	render: function() {

		return (
			<select className="form-control" onChange={this.setType}>
				<option value="-1">---Vị trí nhà---</option>
				<option value="0">Mặt đường</option>
				<option value="1">Trong ngõ</option>
			</select>
		);
	},
	setType: function (event) {
		console.log(parseInt(event.target.value));
		this.props.handleChange(parseInt(event.target.value));
	},
})

var SelectDistrict = React.createClass({

	setDistrict: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	},

	render: function() {
		var availableDistricts = this.props.districts;
		var opts = [];
		opts.push(<option value="-1" key={-1}>---Chọn Quận/Huyện ---</option>);
		for (var i = 0; i < availableDistricts.length; i++) {
			var district = availableDistricts[i];
			opts.push(<option value={district.id} key={district.id}>{district.districtName}</option>)
		}
		return (
			<select className="form-control" onChange={this.setDistrict}>
				{opts}
			</select>
		);
	}
});

var SelectStreet = React.createClass({
	setDistrict: function (event) {
		this.props.handleChange(parseInt(event.target.value));
	},

	render: function() {
		var streets = this.props.streets;
		var opts = [];
		opts.push(<option value="-1" key={-1}>---Chọn Đường ---</option>);
		for (var i = 0; i < streets.length; i++) {
			var street = streets[i];
			opts.push(<option value={street.id} key={street.id}>{street.street + '(' + street.start_position + ' - ' + street.end_position + ')'}</option>)
		}
		return (
			<select className="form-control" onChange={this.setDistrict}>
				{opts}
			</select>
		);
	}
});

var InputData = React.createClass({
	render: function() {
		var placeholder = '';
		if (this.props.type === 0){
			placeholder = 'Mặt tiền rộng bao nhiêu mét ?';
		}
		else if (this.props.type === 1){
			placeholder = 'Sâu trong hẻm bao nhiêu mét ?'
		}
		else {
			placeholder = 'Chọn vị trí nhà'
		}
		return (
			<div>
				<input type="number" className="form-control" placeholder={placeholder} ref="frontendOrDistance" />
				<input type="number" className="form-control" placeholder='Diện tích bao nhiêu mét vuông' ref="area"/>
				<button className="btn btn-success" onClick={this.estimate}>Định giá</button>
			</div>
		);
	},
	estimate: function () {
		var area = parseFloat(this.refs.area.value);
		area = area ? area : 0;
		var frontendOrDistance = parseFloat(this.refs.frontendOrDistance.value);
		frontendOrDistance = frontendOrDistance ? frontendOrDistance : 0;
		this.props.estimate(frontendOrDistance, area);
	}
});

var App = React.createClass({
	getInitialState: function() {
		return {
			type: -1,
			input: -1,
			district: -1,
			street: -1,
			data: []
		}
	},
	componentDidMount: function() {
		$.ajax({
			url: '/api/estimate',
			method: 'GET',
			success: function (data) {
				console.log(data);
				this.setState({
					type: this.state.type,
					level: this.state.level,
					data: data.data
				});
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		})
	},
	setDistrict: function (district) {
		if (parseInt(district)){
			this.changeState(['district'], [district]);
		}
	},
	setStreet: function (street) {
		if (parseInt(street)){
			this.changeState(['street'], [street]);
		}
	},
	setType: function (type) {
		if (parseInt(type) >= 0){
			this.changeState(['type'], [type]);
		}
	},
	estimate: function (frontendOrDistance, area) {
		console.log('start estimating');
		var data = {
			street: this.state.street
		}
		if (this.state.type == 0){
			data.frontend = frontendOrDistance
		}
		else if (this.state.type == 1){
			data.distance = frontendOrDistance
		}
		else{
			return alert('select type');
		}
		data.area = area;
		console.log(data);
		$.ajax({
			url: '/api/estimate',
			method: 'POST',
			data: data,
			success: function (data) {
				alert(data.price + ' triệu đồng');
			},
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
		}
		else{
			callback();
		}
	},
	render: function() {
		var districts = [];
		for(var i in this.state.data){
			districts.push({
				id: i,
				districtName: this.state.data[i][0].districtName
			})
		}
		var streets = [];
		if (this.state.district > -1){
			streets = this.state.data[this.state.district];
		}
		return (
			<div>
				<div className="row">
					<SelectType handleChange={this.setType} />
				</div>
				<div className="row">
					<SelectDistrict districts={districts} handleChange={this.setDistrict}/>
				</div>
				<div className="row">
					<SelectStreet streets={streets} handleChange={this.setStreet}/>
				</div>
				<div className="row">
					<InputData type={this.state.type} estimate={this.estimate}/>
				</div>
			</div>
			
		);
	}
});

ReactDOM.render(<App />, document.getElementById('root'));