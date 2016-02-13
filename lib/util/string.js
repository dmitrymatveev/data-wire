"use strict";

var pluralize = require('pluralize');

const STRING_DASHERIZE_REGEXP = (/[ _]/g);
const STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
const STRING_CAMELIZE_REGEXP_1 = (/(\-|\_|\.|\s)+(.)?/g);
const STRING_CAMELIZE_REGEXP_2 = (/(^|\/)([A-Z])/g);
const STRING_UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
const STRING_UNDERSCORE_REGEXP_2 = (/\-|\s+/g);

function formatAsDashed (str) {
	return formatAsLowerCase(str).replace(STRING_DASHERIZE_REGEXP, '-');
}

function formatAsCamelCase (str) {
	return str.replace(STRING_CAMELIZE_REGEXP_1, function(match, separator, chr) {
		return chr ? chr.toUpperCase() : '';
	}).replace(STRING_CAMELIZE_REGEXP_2, function(match) {
		return match.toLowerCase();
	});
}

function formatAsLowerCase (str) {
	return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}

function formatAsUnderscored (str) {
	return str.replace(STRING_UNDERSCORE_REGEXP_1, '$1_$2').
	replace(STRING_UNDERSCORE_REGEXP_2, '_').toLowerCase();
}

module.exports = {
	pluralize,

	strategies: {
		formatAsDashed,
		formatAsCamelCase,
		formatAsLowerCase,
		formatAsUnderscored,
		undefined: formatAsDashed
	},

	FORMAT: {
		dashed: "formatAsDashed",
		camelCase: "formatAsCamelCase",
		underscored: "formatAsUnderscored"
	}
};