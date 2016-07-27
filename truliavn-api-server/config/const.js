module.exports = {
	PERM_ACCESS_MANAGE_PAGE: 800,
	PERM_DELETE_ACCOUNT: 1000,
	PERM_DELETE_HOUSE: 9000,
	PERM_CHANGE_PERM: 900,
	ROLES: [
		{name: 'ADMIN', perm: 1000}, 
		{name: 'MANAGER', perm: 900},
		{name: 'CONTENT', perm: 800},
		{name: 'USER', perm: 0}
	]
}