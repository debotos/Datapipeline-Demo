import React, { Component } from 'react'
import { Radio, Form, Select } from 'antd'
import { FormInstance } from 'antd/lib/form'

import { getElementSize } from '../../utils/helpers'
import { Container } from './EditArrayValue'

export class EditEnumValue extends Component<any, any> {
	private containerElement = React.createRef<any>()
	private formRef = React.createRef<FormInstance>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: '', // For refresh() & Ajax purpose only
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

		const style = { marginBottom: 3 }
		const initialValues = { [field]: value }

		return (
			<Container ref={this.containerElement} isPopup={isPopup}>
				<Form
					className='inline-edit-form'
					size='small'
					ref={this.formRef}
					name={`${field}-edit-form`}
					onFinish={this.onFinish}
					initialValues={initialValues}
				>
					{/* 'select' input inside popup doesn't work */}
					{fieldProps.type === 'radio' || fieldProps.popupEdit ? (
						<Form.Item
							name={field}
							rules={fieldProps.validation}
							validateFirst
							style={{ ...style }}
						>
							<Radio.Group
								onChange={(e: any) => {
									this.setState({ value: e.target.value })
									this.formRef.current.submit()
								}}
								options={fieldProps.options.array}
							/>
						</Form.Item>
					) : (
						<Form.Item
							name={field}
							rules={fieldProps.validation}
							validateFirst
							style={{ ...style, minWidth: 120 }}
						>
							<Select
								placeholder={fieldProps.placeholder}
								autoClearSearchValue
								autoFocus={true}
								showSearch={true}
								onChange={(value: any) => {
									this.setState({ value })
									this.formRef.current.submit()
								}}
								filterOption={(input: string, option: any) =>
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{fieldProps.options.array.map((option: any, index: number) => {
									const { label, value, disabled } = option
									return (
										<Select.Option key={index} value={value} disabled={disabled}>
											{label}
										</Select.Option>
									)
								})}
							</Select>
						</Form.Item>
					)}
				</Form>
			</Container>
		)
	}
}

export default EditEnumValue
