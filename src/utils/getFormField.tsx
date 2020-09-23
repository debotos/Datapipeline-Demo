import React from 'react'
import { Form, Input, Radio, Select, Checkbox, Switch, InputNumber } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

export const getFormField = (info: any, form: any, initialValues: any, isLastField: boolean) => {
	if (!info) return null
	const { headerName, dataIndex, field } = info
	const { type, placeholder, hasFeedback } = field

	const validations = field.validation || []
	const styles = { marginBottom: 5 }

	switch (type) {
		case 'boolean': {
			const { input } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					valuePropName={'checked'}
					rules={[...validations]}
					style={{ ...styles }}
				>
					{input === 'checkbox' ? (
						<Checkbox />
					) : (
						<Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
					)}
				</Form.Item>
			)
		}
		case 'checkbox': {
			const { options } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
					labelCol={{ span: 24 }}
				>
					<Checkbox.Group options={options} />
				</Form.Item>
			)
		}
		case 'radio': {
			const { options } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
					labelCol={{ span: 24 }}
				>
					<Radio.Group options={options} />
				</Form.Item>
			)
		}
		case 'select': {
			const { placeholder, options } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
				>
					<Select
						placeholder={placeholder}
						allowClear
						showSearch
						filterOption={(input: string, option: any) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
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
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
				>
					<Input.TextArea allowClear placeholder={placeholder} rows={field.rows || 4} />
				</Form.Item>
			)
		}

		case 'number': {
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
				>
					<InputNumber placeholder={placeholder} />
				</Form.Item>
			)
		}

		default: {
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={headerName}
					labelCol={{ span: 24 }}
					rules={[...validations]}
					hasFeedback={hasFeedback}
					validateFirst
					style={{ ...styles }}
				>
					<Input placeholder={placeholder} type={type} allowClear />
				</Form.Item>
			)
		}
	}
}
