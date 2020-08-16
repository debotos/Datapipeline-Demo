import React, { Component } from 'react'
import { Form, Switch, Checkbox } from 'antd'
import { FormInstance } from 'antd/lib/form'

import { getElementSize } from '../../utils/helpers'
import { Container } from './EditArrayValue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

export class EditEnumValue extends Component<any, any> {
	private containerElement = React.createRef<any>()
	private formRef = React.createRef<FormInstance>()

	constructor(props: any) {
		super(props)
		this.state = {
			value: false, // For refresh() & Ajax purpose only
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
					<Form.Item
						name={field}
						rules={fieldProps.validation}
						validateFirst
						valuePropName='checked'
						style={{ ...style, marginLeft: '1.2rem' }}
					>
						{fieldProps.input === 'checkbox' ? (
							<Checkbox
								onChange={(e: any) => {
									this.setState({ value: e.target.checked })
									this.formRef.current.submit()
								}}
							/>
						) : (
							<Switch
								onChange={(value) => {
									this.setState({ value })
									this.formRef.current.submit()
								}}
								checkedChildren={<CheckOutlined />}
								unCheckedChildren={<CloseOutlined />}
							/>
						)}
					</Form.Item>
				</Form>
			</Container>
		)
	}
}

export default EditEnumValue
