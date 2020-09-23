import React, { Component } from 'react'
import { Router, Switch, Route } from 'react-router-dom'
import axios from 'axios'
import { Spin } from 'antd'
import { createBrowserHistory as createHistory } from 'history'

import './App.scss'
import META from '../utils/metadata.json'
import Table from '../bvc/table/Table'

export const history = createHistory()

interface CState {
	loading: boolean
	data: any[]
}

export class App extends Component<any, CState> {
	constructor(props: any) {
		super(props)
		this.state = { loading: true, data: [] }
	}

	async componentDidMount() {
		try {
			const response = await axios.get('http://localhost:5000/')
			// console.log(response.data)
			this.setState({ data: response.data }, () => this.setState({ loading: false }))
		} catch (error) {
			console.log(error)
		}
	}

	render() {
		if (this.state.loading) {
			return (
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
					<Spin size='large' />
				</div>
			)
		}

		return (
			<>
				<Router history={history}>
					<Switch>
						<Route exact path='/' render={(props) => <Table meta={META} data={this.state.data} {...props} />} />
					</Switch>
				</Router>
			</>
		)
	}
}

export default App
