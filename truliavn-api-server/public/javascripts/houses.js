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
			</tr>
		)
	}
})

var testHouse = {
	"id": 7047,
	"type": "Nhà riêng",
	"houseFor": "Cho thuê",
	"lat": 21.0213,
	"lon": 105.851,
	"title": "Cho thuê nhà riêng khu Trần Hưng Đạo - Lý Thường Kiệt",
	"address": "Đường Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
	"formatted_address": "Trần Hưng Đạo, Hoàn Kiếm, Hà Nội, Vietnam",
	"price": 12,
	"area": 80,
	"description": "Cho thuê nhà riêng khu Trần Hưng Đạo, <a href=\"/cho-thue-nha-rieng-pho-ly-thuong-kiet-1\">Lý Thường Kiệt</a> nhà diện tích 80m2 trong nội thành có 2PN sàn gỗ có NL DH. 1WC ban công phơi đồ rộng sân để xe riêng nhà để được 7 xe. Trước cửa có một khoảng sân trung rộng và thoáng. Nhà đẹp nằm trong khu trung tâm Hoàn Kiếm giá cho thuê là 12tr.\nLiên hệ bất động sản Việt Mỹ 201 Khâm Thiên (phòng 303 tòa nhà Unimex) Văn phòng có chỗ để xe ô tô, mời vào website xem ảnh. <a rel=\"nofollow\" target=\"_blank\" href=\"http://www.vietmyland.net\">www.vietmyland.net</a> hoặc <a rel=\"nofollow\" target=\"_blank\" href=\"http://www.muabanthue.net\">www.muabanthue.net</a> 0975113985 - 0932257986 - 0902207986 - 0989998186-0949998008",
	"city": "Hà Nội",
	"district": "Hoàn Kiếm",
	"ward": "Trần Hưng Đạo",
	"ownerId": -1,
	"crawledOwnerId": 1709,
	"noOfBedrooms": 2,
	"noOfBathrooms": 2,
	"noOfFloors": 0,
	"interior": null,
	"buildIn": 0,
	"status": "Có sẵn",
	"created_at": "2016-06-24T14:46:48.000Z",
	"images": [
		"uploads/images/505abe683b11f53127b876ca2eec39d2",
		"uploads/images/0573558a7a7ee87c7dfaca12e479667c",
		"uploads/images/5029ac7ad025a8ef83681c51d6f1e216",
		"uploads/images/950d244039f79eb361ef6f99b945899d",
		"uploads/images/f9ad132f0dc008d089657537a2026e4b",
		"uploads/images/f2df32a9be321496b1c48a4c3d72aea1",
		"uploads/images/787ef1a225175aaa4572be89cfc4eb4b",
		"uploads/images/1936440cec987808dbb2c4e5f887d5f4"
	],
	"ownerInfo": {
		"id": 1709,
		"email": "vietmyland@yahoo.com",
		"fullname": "Đặng Minh Hoàng",
		"phone": "0989998186",
		"address": "201 Khâm Thiên - Đống Đa- Hà Nội( phòng 303 tòa nhà Unimex. Văn phòng có chỗ để ôtô)",
		"mobile": "0989998186"
	}
}

var Houses = React.createClass({
	render: function() {
		var houses = this.props.houses;
		var rows = [];
		houses.map(function (house, index) {
			rows.push(<HouseRow house={house} key={index} />);
		});
		return (
			<tbody>
				{rows}
			</tbody>
		);
	}
});

var App = React.createClass({
	getInitialState: function () {
		return {
			houses: [],
			email: "<%= email %>",
			token: "<%= token %>"
		}
	},
	componentDidMount: function () {
		this.updateList();
	},
	updateList: function () {
		$.ajax({
			url: '/api/houses?specific=1&count=20',
			method: 'GET',
			success: function (data) {
				console.log(data);
				if (data.status == 'success'){
					this.setState({
						houses: data.houses
					})
				}
			}.bind(this),
			error: function (err) {
				console.log(err);
			}
		})
	},
	render: function() {
		return (
			<table className="table table-hover">
				<thead>
					<tr>
						<th>Title</th>
						<th>Address</th>
						<th>Description</th>
						<th>Price</th>
						<th>Area</th>
					</tr>
				</thead>
				<Houses houses={this.state.houses}/>
			</table>
		);
	}
});

ReactDOM.render(<App />, document.getElementById('root'));