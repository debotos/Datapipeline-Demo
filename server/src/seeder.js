var faker = require('faker')

const Data = require('./model')

const genders = ['male', 'female']
const booleans = [true, false]
const permissions = ['add', 'read', 'edit', 'delete']
const roles = ['admin', 'partner', 'user']
const status = ['Working', 'Sleeping', 'Busy']
const birth_years = [1997, 1994, 1998, 2020, 2016, 2010, 1977, 2004]

function generateData() {
	return {
		first_name: faker.name.firstName(),
		last_name: faker.name.lastName(),
		email: faker.internet.email(),
		company: faker.company.companyName(),
		gender: faker.random.arrayElement(genders),
		phone: faker.phone.phoneNumber(),
		age: faker.random.number({ min: 20, max: 100 }),
		country: faker.address.country(),
		state: faker.address.state(),
		city: faker.address.city(),
		address: faker.address.streetAddress(),
		active: faker.random.arrayElement(booleans),
		verified: faker.random.arrayElement(booleans),
		online: faker.random.arrayElement(booleans),
		permission: faker.random.arrayElement(permissions),
		role: faker.random.arrayElement(roles),
		about: faker.lorem.paragraph(),
		birth_year: faker.random.arrayElement(birth_years),
		position: faker.name.jobTitle(),
		balance: faker.finance.amount(),
		status: faker.random.arrayElement(status),
		facebook: faker.image.imageUrl(),
		twitter: faker.image.imageUrl(),
		linkedin: faker.image.imageUrl(),
		github: faker.image.imageUrl(),
		gitlab: faker.image.imageUrl(),
		stack_overflow: faker.image.imageUrl(),
		instagram: faker.image.imageUrl(),
		reddit: faker.image.imageUrl(),
		telegram: faker.image.imageUrl(),
		medium: faker.image.imageUrl(),
	}
}

module.exports = async function seedDatabase(count = 100000) {
	await Data.deleteMany({})
	console.log('Seeding started!')
	for (let index = 0; index < count; index++) {
		const newData = new Data(generateData())
		await newData.save()
	}
}
