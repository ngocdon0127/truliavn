module.exports = function (mongoose) {
	var permissionSchema = mongoose.Schema({
		PERMS: {
			PERM_ACCESS_MANAGE_PAGE: Number,
			PERM_DELETE_ACCOUNT: Number,
			PERM_DELETE_HOUSE: Number,
			PERM_CHANGE_PERM: Number,
			PERM_REVIEW_HOUSE: Number
		},
		ROLES: [
			{name: String, perm: Number}
		]
	});

	var Permission = mongoose.model('Permission', permissionSchema);
	return Permission
}