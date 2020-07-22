import React from 'react'
import { Router, Switch, Route } from 'react-router-dom'
import { createBrowserHistory as createHistory } from 'history'

import './App.css'
import META from '../utils/metadata.json'
import DATA from '../utils/data.json'
import Table from '../bvc/Table'

export const history = createHistory()

function App() {
	return (
		<div className='App'>
			<Router history={history}>
				<Switch>
					<Route exact path='/' render={(props) => <Table meta={META} data={DATA} {...props} />} />
				</Switch>
			</Router>
		</div>
	)
}

export default App
