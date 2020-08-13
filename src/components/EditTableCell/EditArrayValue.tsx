import React, { Component } from 'react'
import { Checkbox, Col, Row, Button, Form } from 'antd'
import { FormInstance } from 'antd/lib/form'
import styled from 'styled-components'

export class EditArrayValue extends Component<any, any> {
	private formRef = React.createRef<FormInstance>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: [], // For refresh() & Ajax purpose only
		}
	}

	componentDidMount() {
		this.setState({ value: this.props.value })
	}

	getValue() {
		return this.state.value
	}

	isPopup() {
		return true
	}

	onFinish = (values: any) => {
		console.log('Form submitted with:', values)
		const { field } = this.props.colDef
		this.setState({ value: values[field] })
		// Ajax req to save the data
		this.props.api.stopEditing()
	}

	render() {
		const { colDef, value } = this.props
		const { field, fieldProps } = colDef

		const style = { marginBottom: 3 }

		return (
			<Container>
				<Form
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
					<Form.Item style={{ ...style, textAlign: 'center' }}>
						<Button size='small' type='primary' htmlType='submit' ghost>
							Save
						</Button>
					</Form.Item>
				</Form>
			</Container>
		)
	}
}

export default EditArrayValue

const Container = styled.div`
	padding: 10px 20px;
`
