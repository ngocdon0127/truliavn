var UserRow = React.createClass({
	render: function() {
		var user = this.props.user
		return (
			<tr>
				<td>{user.fullname}</td>
				<td>{user.email}</td>
				<td>{user.permission}</td>
				<td><button className="btn btn-danger" onClick={this.handleDeleteClick.bind(this, this.props.index)}>Delete this user</button></td>
			</tr>
		);
	},
	handleDeleteClick: function (index) {
		console.log(index);
		this.props.onUserClickDelete(index);
	}
});

var UserBody = React.createClass({
	render: function() {
		var rows = [];
		this.props.users.forEach(function (user, index) {
			rows.push(<UserRow user={user} key={index} index={index} onUserClickDelete={this.handleDeleteClick}/>)
		}.bind(this));
		return (
			<tbody>
				{rows}
			</tbody>
		)
	},
	handleDeleteClick: function (index) {
		this.props.onUserClickDelete(index)
	}
});

var Users = React.createClass({
	getInitialState(){
		return {
			users: []
		}
	},
	render: function() {
		return (
			<table className="table table-hover">
				<thead>
					<tr>
						<th>FullName</th>
						<th>Email</th>
						<th>Permission</th>
						<th>Action</th>
					</tr>
				</thead>
				<UserBody users={this.state.users} onUserClickDelete={this.deleteHandler}/>
			</table>
		)
	},
	updateList: function () {
		$.ajax({
			url: '/api/allusers',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					this.setState({
						users: data.users
					})
				}
			}.bind(this),
			error: function (err) {
				console.log(err)
			}
		})
	},
	componentDidMount(){
		this.updateList()
	},
	deleteHandler: function (userIndex) {
		var userId = this.state.users[userIndex].id;
		this.state.users.splice(userIndex, 1);
		this.setState({
			users: this.state.users
		});
		$.ajax({
			url: '/api/user/' + userId + '/delete',
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

ReactDOM.render(<Users />, document.getElementById('root'));