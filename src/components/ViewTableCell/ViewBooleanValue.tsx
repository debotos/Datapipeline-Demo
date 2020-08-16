import React, { Component } from 'react'

export class ViewBooleanValue extends Component<any, any> {
	constructor(props: any) {
		super(props)
		this.state = { value: false }
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

		return <div>{fieldProps.options.find((option: any) => option.value === value).label}</div>
	}
}

export default ViewBooleanValue
