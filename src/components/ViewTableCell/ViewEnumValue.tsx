import React, { Component } from 'react'

export class ViewEnumValue extends Component<any, any> {
	constructor(props: any) {
		super(props)
		this.state = { value: '' }
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

		if (!value) return null

		return <div>{fieldProps.options.object[value].label}</div>
	}
}

export default ViewEnumValue
