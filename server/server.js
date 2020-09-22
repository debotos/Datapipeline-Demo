const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const compression = require('compression')

const Data = require('./src/model')
const seedDatabase = require('./src/seeder')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(morgan('tiny'))
app.use(compression())

const connectionString = 'mongodb://localhost:27017/ezilm-datapipeline'
mongoose
	.connect(connectionString, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then(() => console.log(`✅ Connected to MongoDB`))
	.catch((error) => console.error(` ❌ Error: Unable to connect MongoDB!`, error))

seedDatabase(100)

app.get('/', (req, res) => {
	Data.find({}, (err, data) => {
		if (err) {
			res.send(err)
		}
		res.json(data)
	})
})

app.listen(5000, () => console.log('🚀 Server started on port 5000'))
