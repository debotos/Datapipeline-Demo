import React, { CSSProperties } from 'react'
import moment from 'moment'
import { Form, Input, Radio, Select, Checkbox, Switch, InputNumber } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import shortid from 'shortid'

export const getFormField = (
	from: 'add' | 'edit' | 'inline-add' | 'inline-edit',
	info: any,
	form: any,
	initialValues: any,
	isLastField: boolean,
	inputRef?: any, // Only for inline editing form
	save?: () => void, // Only for inline editing form
	toggleEdit?: () => void // Only for inline editing form
) => {
	if (!info) return null

	const { headerName, dataIndex, field } = info
	const { type, placeholder, hasFeedback } = field

	const validations = field.validation || []
	const styles: CSSProperties = {}
	const otherFormItemProps: Record<string, any> = { key: dataIndex }
	const otherInputFieldProps: Record<string, any> = { autoComplete: 'nope' }

	if (from === 'inline-edit' || from === 'inline-add') {
		if (from === 'inline-add') {
			otherInputFieldProps.id = dataIndex + '_' + shortid.generate() // In bulk add to prevent same DOM id
		}

		if (type === 'date' && initialValues[dataIndex]) {
			// If value is not null and field type is date
			otherFormItemProps.initialValue = moment(initialValues[dataIndex]).format('YYYY-MM-DD')
		} else {
			otherFormItemProps.initialValue = initialValues[dataIndex]
		}

		styles.margin = 0
		styles.width = '100%'

		if (
			type === 'boolean' || // means input = switch | checkbox
			type === 'radio' ||
			type === 'select' ||
			type === 'lookup' ||
			type === 'date'
		) {
			otherInputFieldProps.onChange = save
		}

		if (type === 'checkbox') {
			// means checkbox group
			// For 'inline-edit' the 'save' will happen through window listener
			if (from === 'inline-add') {
				// For 'inline-add'
				otherInputFieldProps.onChange = save
			}
		}

		if (
			type === 'email' ||
			type === 'number' ||
			type === 'select' ||
			type === 'lookup' ||
			type === 'textarea' ||
			type === 'text' ||
			type === 'date'
		) {
			otherInputFieldProps.onBlur = save
		}

		if (type === 'email' || type === 'number' || type === 'textarea' || type === 'text') {
			otherInputFieldProps.onPressEnter = save
		}
	} else {
		otherFormItemProps.label = headerName
		styles.marginBottom = 2
		if (type === 'text' || type === 'data' || type === 'textarea') {
			otherInputFieldProps.allowClear = true
		}
	}

	switch (type) {
		case 'boolean': {
			const { input } = field
			return (
				<Form.Item
					name={dataIndex}
					validateFirst
					valuePropName={'checked'}
					rules={[...validations]}
					style={{ ...styles }}
					{...otherFormItemProps}
				>
					{input === 'checkbox' ? (
						<Checkbox ref={inputRef} {...otherInputFieldProps} />
					) : (
						<Switch
							checkedChildren={<CheckOutlined />}
							unCheckedChildren={<CloseOutlined />}
							ref={inputRef}
							{...otherInputFieldProps}
						/>
					)}
				</Form.Item>
			)
		}

		case 'checkbox': {
			// means checkbox group, single checkbox categorized under 'boolean'
			const { options } = field
			return (
				<React.Fragment key={dataIndex}>
					<Form.Item
						name={dataIndex}
						validateFirst
						rules={[...validations]}
						style={{ ...styles }}
						labelCol={{ span: 24 }}
						{...otherFormItemProps}
					>
						<Checkbox.Group options={options} ref={inputRef} {...otherInputFieldProps} />
					</Form.Item>
					{/* {(from === 'inline-edit' || from === 'inline-add') && (
						<Row justify='center'>
							<Form.Item style={{ marginBottom: 0 }}>
								<Button size='small' type='primary' ghost onClick={save}>
									Okay
								</Button>
							</Form.Item>
						</Row>
					)} */}
				</React.Fragment>
			)
		}

		case 'radio': {
			const { options } = field
			return (
				<Form.Item
					name={dataIndex}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
					labelCol={{ span: 24 }}
					{...otherFormItemProps}
				>
					<Radio.Group options={options} ref={inputRef} {...otherInputFieldProps} />
				</Form.Item>
			)
		}

		case 'select': {
			const { placeholder, options } = field
			return (
				<Form.Item
					name={dataIndex}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
					{...otherFormItemProps}
				>
					<Select
						placeholder={placeholder}
						showSearch
						filterOption={(input: string, option: any) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
						ref={inputRef}
						{...otherInputFieldProps}
					>
						{options.map((option: any, index: number) => {
							const { label, value, disabled } = option
							return (
								<Select.Option key={index} value={value} disabled={disabled}>
									{label}
								</Select.Option>
							)
						})}
					</Select>
				</Form.Item>
			)
		}

		case 'textarea': {
			return (
				<Form.Item
					name={dataIndex}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
					{...otherFormItemProps}
				>
					<Input.TextArea
						placeholder={placeholder}
						rows={from.includes('inline-') ? 1 : field.rows || 4}
						ref={inputRef}
						{...otherInputFieldProps}
					/>
				</Form.Item>
			)
		}

		case 'number': {
			return (
				<Form.Item
					name={dataIndex}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
					{...otherFormItemProps}
				>
					<InputNumber placeholder={placeholder} ref={inputRef} {...otherInputFieldProps} />
				</Form.Item>
			)
		}

		default: {
			return (
				<Form.Item
					name={dataIndex}
					labelCol={{ span: 24 }}
					rules={[...validations]}
					hasFeedback={hasFeedback}
					validateFirst
					style={{ ...styles }}
					{...otherFormItemProps}
				>
					<Input placeholder={placeholder} type={type} ref={inputRef} {...otherInputFieldProps} />
				</Form.Item>
			)
		}
	}
}
