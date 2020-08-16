import React, { Component } from 'react'
import { Input, Form } from 'antd'
import { FormInstance } from 'antd/lib/form'

import { getElementSize } from '../../utils/helpers'
import { Container } from './EditArrayValue'

export class EditStringValue extends Component<any, any> {
	private containerElement = React.createRef<any>()
	private formRef = React.createRef<FormInstance>()
	private inputRef = React.createRef<any>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: '', // For refresh() & Ajax purpose only
		}
	}

	componentDidMount() {
		const { colDef, value } = this.props
		this.setState({
			value,
			isPopup: colDef.fieldProps.type === 'textarea' ? true : colDef?.fieldProps?.popupEdit,
		})
	}

	componentWillUnmount() {
		this.props.api.resetRowHeights()
	}

	afterGuiAttached = () => {
		this.inputRef.current.focus()
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

	getField = () => {
		const { fieldProps } = this.props.colDef
		const rows = fieldProps.rows || 4
		switch (fieldProps.type) {
			case 'textarea': {
				return (
					<Input.TextArea
						allowClear
						style={{ minWidth: 300 }}
						bordered={false}
						onChange={(e: any) => this.setState({ value: e.target.value })}
						placeholder={fieldProps.placeholder}
						rows={rows}
						ref={this.inputRef}
					/>
				)
			}
			default: {
				return (
					<Input
						allowClear
						autoFocus
						onChange={(e: any) => this.setState({ value: e.target.value })}
						onPressEnter={() => this.formRef.current.submit()}
						placeholder={fieldProps.placeholder}
						ref={this.inputRef}
					/>
				)
			}
		}
	}

	isPopup() {
		return this.state.isPopup
	}

	isCancelAfterEnd = () => {
		return !!this.formRef.current.getFieldsError().filter(({ errors }) => errors.length).length
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

		const style = { marginBottom: isPopup ? 0 : 3 }

		return (
			<Container ref={this.containerElement} isPopup={isPopup} style={{ margin: isPopup && 5 }}>
				<Form
					className='inline-edit-form'
					size='middle'
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
						{this.getField()}
					</Form.Item>
				</Form>
			</Container>
		)
	}
}

export default EditStringValue
