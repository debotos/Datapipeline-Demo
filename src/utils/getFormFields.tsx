import React from 'react'
import { Form, Input, Radio, Select, Checkbox, Switch, InputNumber } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

export default function (info: any, form: any, initialValues: any, isLastField: boolean) {
	if (!info) return null
	const { headerName, field, fieldProps } = info
	const { type, placeholder, hasFeedback } = fieldProps

	const validations = fieldProps.validation || []
	const styles = { marginBottom: 5 }

	switch (type) {
		case 'boolean': {
			const { input } = fieldProps
			return (
				<Form.Item
					key={field}
					name={field}
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
			const { options } = fieldProps
			return (
				<Form.Item
					key={field}
					name={field}
					label={headerName}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
					labelCol={{ span: 24 }}
				>
					<Checkbox.Group options={options.array} />
				</Form.Item>
			)
		}
		case 'radio': {
			const { options } = fieldProps
			return (
				<Form.Item
					key={field}
					name={field}
					label={headerName}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
					labelCol={{ span: 24 }}
				>
					<Radio.Group options={options.array} />
				</Form.Item>
			)
		}
		case 'select': {
			const { placeholder, options } = fieldProps
			return (
				<Form.Item
					key={field}
					name={field}
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
						filterOption={(input: string, option: any) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
					>
						{options.map((option: any, index: number) => {
							const { label, value, disabled } = option.array
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
					key={field}
					name={field}
					label={headerName}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
				>
					<Input.TextArea allowClear placeholder={placeholder} rows={fieldProps.rows || 4} />
				</Form.Item>
			)
		}

		case 'number': {
			return (
				<Form.Item
					key={field}
					name={field}
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
					key={field}
					name={field}
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
