import React, { Component } from 'react'

export class ViewArrayValue extends Component<any, any> {
	constructor(props: any) {
		super(props)
		this.state = { value: [] }
	}

	componentDidMount() {
		this.setState({ value: this.props.value })
	}

	refresh(params: any) {
		this.setState({ value: params.value })
	}

	render() {
		const { value } = this.state
		const { colDef } = this.props
		const { fieldProps } = colDef

		return <div>{value.map((val: any) => fieldProps.options.object[val].label).join(', ')}</div>
	}
}

export default ViewArrayValue
