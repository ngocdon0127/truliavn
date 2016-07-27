var UserRow = React.createClass({
	render: function() {
		// console.log('render');
		// console.log(this.props.user);
		var user = this.props.user;

		return (
			<tr>
				<td>{user.fullname}</td>
				<td>{user.email}</td>
				<td><input type="text" defaultValue={user.permission} ref="level" /></td>
				<td>
					<button className="btn btn-danger button" onClick={this.handleDeleteClick.bind(this, this.props.index)}>Delete this user</button>
					<button className="btn btn-primary button" onClick={this.handleUpdateClick.bind(this, this.props.index)}>Update</button>
				</td>
			</tr>
		);
	},
	handleDeleteClick: function (index) {
		// console.log(index);
		this.props.onUserClickDelete(index);
	},
	handleUpdateClick: function (index) {
		// console.log(index);
		// console.log(this.refs.level.value);
		this.props.onUserClickUpdate(index, parseInt(this.refs.level.value));
		// this.props.onUserClickUpdate(index, 1);
	}
});

var UserBody = React.createClass({
	render: function() {
		var rows = [];
		this.props.users.forEach(function (user, index) {
			rows.push(<UserRow 
				user={user} 
				key={index} 
				index={index} 
				onUserClickDelete={this.handleDeleteClick} 
				onUserClickUpdate={this.handleUpdateClick} />
			)
		}.bind(this));
		return (
			<tbody>
				{rows}
			</tbody>
		)
	},
	handleDeleteClick: function (index) {
		this.props.onUserClickDelete(index)
	},
	handleUpdateClick: function (index, newPerm) {
		this.props.onUserClickUpdate(index, newPerm);
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
						<th>Tên</th>
						<th>Email</th>
						<th>Level</th>
						<th></th>
					</tr>
				</thead>
				<UserBody 
					users={this.state.users} 
					onUserClickDelete={this.deleteHandler}
					onUserClickUpdate={this.updateHandler} />
			</table>
		)
	},
	updateList: function () {
		console.log('start updating');
		var self = this;
		$.ajax({
			url: '/api/allusers',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					console.log('success')
					// console.log(data);

					/** 
					 * 
					 * Phải xoá state cũ trước khi update state mới.
					 * Như vậy input mới update được giá trị mới nhất.
					 * 
					 * React chỉ re-render những child component có props được truyền xuống là những state của parent
					 * thoả mãn state đó vừa được thay đổi
					 * => nếu update thất bại, state của parent không đổi
					 * => không re-render
					 * => input (level) vẫn giữ giá trị user nhập vào 
					 * Ngược lại nếu xoá hết state (@@) sau đó cập nhật state mới thì mọi child component đều được re-render
					 */
					this.setState({
						users: []
					}, function () {
						self.setState({
							users: data.users
						})
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
				// console.log('success');
				console.log(data);
				this.updateList();
			}.bind(this),
			error: function (err) {
				// console.log('error')
				// if (.status == 'error'){
				// 	alert(data.error);
				// }
				alert(JSON.parse(err.responseText).error);
				this.updateList();
			}.bind(this)
		})
	},
	updateHandler: function (userIndex, newPerm) {
		var userId = this.state.users[userIndex].id;
		$.ajax({
			url: '/api/user/changePermission/' + userId + '/' + parseInt(newPerm),
			method: 'GET',
			success: function (data) {
				console.log(data);
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