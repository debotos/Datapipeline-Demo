import React, { Component } from 'react'
import { Checkbox, Col, Row, Button, Form } from 'antd'
import { FormInstance } from 'antd/lib/form'
import styled from 'styled-components'

import { getElementSize } from '../../utils/helpers'

export class EditArrayValue extends Component<any, any> {
	private containerElement = React.createRef<any>()
	private formRef = React.createRef<FormInstance>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: [], // For refresh() & Ajax purpose only
			isPopup: false,
		}
	}

	componentDidMount() {
		const { colDef, value } = this.props
		this.setState({ value, isPopup: colDef?.fieldProps?.popupEdit })
	}

	componentWillUnmount() {
		this.props.api.resetRowHeights()
	}

	afterGuiAttached = () => {
		const { isPopup } = this.state
		if (!isPopup) {
			const el = this.containerElement?.current
			const { height } = getElementSize(el)
			this.props.node.setRowHeight(height)
			this.props.api.onRowHeightChanged()
		}
	}

	getValue() {
		return this.state.value
	}

	isPopup() {
		return this.state.isPopup
	}

	onFinish = (values: any) => {
		console.log('Form submitted with:', values)
		const { field } = this.props.colDef
		this.setState({ value: values[field] })
		// Ajax req to save the data
		this.props.api.stopEditing()
	}

	render() {
		const { isPopup } = this.state
		const { colDef, value } = this.props
		const { field, fieldProps } = colDef

		const style = { marginBottom: 3 }

		return (
			<Container ref={this.containerElement} isPopup={isPopup}>
				<Form
					className='inline-edit-form'
					ref={this.formRef}
					name={`${field}-edit-form`}
					onFinish={this.onFinish}
					initialValues={{ [field]: value }}
				>
					<Form.Item name={field} rules={fieldProps.validation} validateFirst style={{ ...style }}>
						<Checkbox.Group>
							<Row>
								{fieldProps.options.array.map((option: any) => {
									const { label, value: val, disabled } = option
									return (
										<Col span={12} key={val}>
											<Checkbox value={val} disabled={disabled}>
												{label}
											</Checkbox>
										</Col>
									)
								})}
							</Row>
						</Checkbox.Group>
					</Form.Item>
				</Form>
			</Container>
		)
	}
}

export default EditArrayValue

export const Container = styled.div<any>`
	margin: ${(props) => (props.isPopup === true ? '15px' : '5px 0 13px 0')};
	overflow-y: scroll;
`
