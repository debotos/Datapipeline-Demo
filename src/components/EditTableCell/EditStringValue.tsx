import React, { Component } from 'react'
import { Input, Button, Form } from 'antd'
import { FormInstance } from 'antd/lib/form'
import styled from 'styled-components'

export class EditStringValue extends Component<any, any> {
	private formRef = React.createRef<FormInstance>()
	private inputRef = React.createRef<any>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: [], // For refresh() & Ajax purpose only
		}
	}

	componentDidMount() {
		this.setState({ value: this.props.value })
	}

	afterGuiAttached = () => {
		this.inputRef.current.focus()
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
					<Form.Item
						name={field}
						hasFeedback={fieldProps.hasFeedback}
						rules={fieldProps.validation}
						validateFirst
						style={{ ...style }}
					>
						<Input
							allowClear
							autoFocus
							onPressEnter={() => this.formRef.current.submit()}
							placeholder={fieldProps.placeholder}
							ref={this.inputRef}
						/>
					</Form.Item>
					<Form.Item style={{ ...style, textAlign: 'center' }}>
						<Button size='small' type='primary' htmlType='submit' ghost>
							Save
						</Button>
						<Button
							type='link'
							size='small'
							htmlType='button'
							onClick={() => this.formRef.current.resetFields()}
						>
							Reset
						</Button>
					</Form.Item>
				</Form>
			</Container>
		)
	}
}

export default EditStringValue

const Container = styled.div`
	padding: 10px 20px;
`
