var HouseRow = React.createClass({
	render: function() {
		var house = this.props.house;
		return (
			<tr>
				<td>{house.title}</td>
				<td>{house.address}</td>
				<td dangerouslySetInnerHTML={{__html: house.description}}></td>
				<td>{house.price}</td>
				<td>{house.area}</td>
				<td><button type="button" className="btn btn-danger" onClick={this.handleDeleteClick.bind(this, this.props.index)}>Delete</button></td>
			</tr>
		)
	},
	handleDeleteClick: function (index) {
		this.props.onUserClick(index);
	}
})

var Houses = React.createClass({
	render: function() {
		var houses = this.props.houses;
		var rows = [];
		houses.map(function (house, index) {
			rows.push(<HouseRow house={house} key={index} onUserClick={this.handleDeleteClick} index={index}/>);
		}.bind(this));
		return (
			<tbody>
				{rows}
			</tbody>
		);
	},
	handleDeleteClick: function (index) {
		this.props.onUserClick(index);
	}
});

var HOUSE_PER_PAGE = 5;

var App = React.createClass({
	getInitialState: function () {
		return {
			houses: [],
			curpage: 0
		}
	},
	componentDidMount: function () {
		this.updateList();
	},
	updateList: function () {
		var url = '/api/houses?specific=1&count=-1';
		// console.log(url);
		$.ajax({
			url: url,
			method: 'GET',
			success: function (data) {
				console.log(data);
				if (data.status == 'success'){
					this.setState({
						houses: data.houses,
						curpage: this.state.curpage
					})
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		})
	},
	render: function() {
		var opts = [];
		for (var i = 0; i < this.state.houses.length / HOUSE_PER_PAGE; i++) {
			opts.push(<option value={i} key={i}>{i}</option>);
		}
		return (
			<div>
				<select className="form-control" onChange={this.seek} value={this.state.curpage}>
					{opts}
				</select>
				<button type="button" className="btn btn-primary" onClick={this.pre}>Pre</button>
				<button type="button" className="btn btn-primary" onClick={this.next}>Next</button>
				<table className="table table-hover">
					<thead>
						<tr>
							<th>Title</th>
							<th>Address</th>
							<th>Description</th>
							<th>Price</th>
							<th>Area</th>
							<th>Action</th>
						</tr>
					</thead>
					<Houses houses={this.state.houses.slice(this.state.curpage * HOUSE_PER_PAGE, this.state.curpage * HOUSE_PER_PAGE + HOUSE_PER_PAGE)} onUserClick={this.handleDeleteClick}/>
				</table>
			</div>
		);
	},
	pre: function () {
		this.setState({
			houses: this.state.houses,
			curpage: (this.state.curpage >= 1) ? (this.state.curpage - 1) : 0
		}, function () {
			// this.updateList();
		}.bind(this));
	},
	next: function () {
		this.setState({
			houses: this.state.houses,
			curpage: (this.state.curpage + 1 <= this.state.houses.length / HOUSE_PER_PAGE) ? (this.state.curpage + 1) : Math.floor(this.state.houses.length / HOUSE_PER_PAGE)
		}, function () {
			// this.updateList();
		}.bind(this));
	},
	seek: function (event) {
		console.log(event.target.value);
		this.setState({
			houses: this.state.houses,
			curpage: parseInt(event.target.value)
		})
	},
	handleDeleteClick: function (index) {
		var houseId = this.state.houses[index].id;
		this.state.houses.splice(index + this.state.curpage * HOUSE_PER_PAGE, 1);
		this.setState({
			houses: this.state.houses,
			curpage: this.state.curpage
		})
		console.log(index + ':' + houseId);
		return;
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