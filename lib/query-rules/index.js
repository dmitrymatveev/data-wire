module.exports = {
	include: require('./include-related'),
	sort: require('./sort'),
	page: require('./filter'),
	filter: require('./filter'),
	fields: require('./sparse-fields'),

	getter: {
		validateQueryParams(rule, r, q, d) {
			return rule.validateQueryParams(r, q, d);
		},
		validateResponseObject(rule, r, q, d) {
			return rule.validateResponseObject(r, q, d);
		}
	}
};