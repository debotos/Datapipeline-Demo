const mongoose = require('mongoose')

const Schema = mongoose.Schema

const DataSchema = new Schema(
	{
		first_name: { type: String, required: 'Enter provide first name' },
		last_name: { type: String, required: 'Enter provide last name' },
		email: { type: String, required: 'Email is required' },
		company: { type: String },
		gender: { type: String },
		phone: { type: String },
		age: { type: Number },
		country: { type: String },
		state: { type: String },
		city: { type: String },
		address: { type: String },
		active: { type: Boolean },
		verified: { type: Boolean },
		online: { type: Boolean },
		permission: [{ type: String }],
		role: [{ type: String }],
		about: { type: String },
		birth_year: { type: Number },
		position: { type: String },
		balance: { type: Number },
		status: { type: String },
		facebook: { type: String },
		twitter: { type: String },
		linkedin: { type: String },
		github: { type: String },
		gitlab: { type: String },
		stack_overflow: { type: String },
		instagram: { type: String },
		reddit: { type: String },
		telegram: { type: String },
		medium: { type: String },
	},
	{ timestamps: true }
)

DataSchema.plugin(require('meanie-mongoose-to-json'))

module.exports = mongoose.model('Data', DataSchema)
