var UserRow = React.createClass({
	render: function() {
		var roles = this.props.roles;
		var opts = [];
		var defaultValue = -1;
		var user = this.props.user;
		var perms = this.props.perms;
		var me = this.props.me;

		opts.push(<option key={-1} value={-1}>{'--- Choose role ---'}</option>);
		roles.forEach(function (role, index) {
			opts.push(<option key={role.perm} value={role.perm}>{role.name}</option>)
			if (role.perm == user.permission){
				defaultValue = role.perm;
			}
		});

		var display = ((me.permission >= perms.PERM_CHANGE_PERM.perm) && (me.permission > user.permission)) ? true : false;
		if (me.permission >= roles[0].perm){
			display = true;
		}
		var select =  (
			<select defaultValue={defaultValue} disabled={!display} ref="level">
				{opts}
			</select>
		)

		var btns = [];
		if ((me.permission >= roles[0].perm) || (me.permission >= perms.PERM_DELETE_ACCOUNT.perm)){
			btns.push(<button
				key={'btnDelete'}
				className="btn btn-danger button" 
				onClick={this.handleDeleteClick.bind(this, this.props.index)}>Delete this user</button>
			)
		}

		if ((me.permission >= roles[0].perm) || ((me.permission >= perms.PERM_CHANGE_PERM.perm) && (me.permission > user.permission))){
			btns.push(<button
				key={'btnUpdate'}
				className="btn btn-primary button" 
				onClick={this.handleUpdateClick.bind(this, this.props.index)}>Update</button>
			)
		}

		return (
			<tr>
				<td>{user.fullname}</td>
				<td>{user.email}</td>
				
				<td>
					{select}
				</td>
				<td>
					{btns}
				</td>
			</tr>
		);
	},
	handleDeleteClick: function (index) {
		var c = confirm('Delete this user?');
		if (c){
			this.props.onUserClickDelete(index);
		}
	},
	handleUpdateClick: function (index) {
		this.props.onUserClickUpdate(index, parseInt(this.refs.level.value));
	}
});

var UserBody = React.createClass({
	render: function() {
		var rows = [];
		this.props.users.forEach(function (user, index) {
			rows.push(<UserRow
				user={user}
				me={this.props.me}
				perms={this.props.perms}
				key={index}
				index={index}
				roles={this.props.roles}
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
			users: [],
			roles: [],
			perms: {},
			me: {}
		}
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
	render: function() {
		return (
			<table className="table table-hover">
				<thead>
					<tr>
						<th>Tên</th>
						<th>Email</th>
						<th>Vai trò</th>
						<th>Hành động</th>
					</tr>
				</thead>
				<UserBody 
					users={this.state.users}
					roles={this.state.roles}
					me={this.state.me}
					perms={this.state.perms}
					onUserClickDelete={this.deleteHandler}
					onUserClickUpdate={this.updateHandler} />
			</table>
		)
	},
	updateList: function () {
		// console.log('start updating');
		var self = this;
		$.ajax({
			url: '/api/allusers',
			method: 'GET',
			success: function (data) {
				if (data.status == 'success'){
					// console.log('success')
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
							users: data.users,
							roles: data.roles,
							perms: data.perms,
							me: data.currentUser
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
		this.changeState(['users'], [this.state.users]);
		$.ajax({
			url: '/api/user/' + userId + '/delete',
			method: 'GET',
			success: function (data) {
				// console.log('success');
				console.log(data);
				alert('Deleted');
				this.updateList();
			}.bind(this),
			error: function (err) {
				console.log(err);
				alert(JSON.parse(err.responseText).error);
				this.updateList();
			}.bind(this)
		})
	},
	updateHandler: function (userIndex, newPerm) {
		var userId = this.state.users[userIndex].id;
		$.ajax({
			url: '/api/user/change/permission/' + userId + '/' + parseInt(newPerm),
			method: 'GET',
			success: function (data) {
				console.log(data);
				this.updateList();
				if (data.status == 'success'){
					alert('Updated')
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
				this.updateList();
				alert(JSON.parse(err.responseText).error);
			}.bind(this)
		})
	}
});

ReactDOM.render(<Users />, document.getElementById('root'));