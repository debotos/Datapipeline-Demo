import React from 'react'
import { Form, Input, Radio, Select, Tooltip, Checkbox } from 'antd'
import { ClearOutlined } from '@ant-design/icons'

export const getAddFormsField = (info: any, form: any, isLastField: boolean) => {
	if (!info) return null
	const { title, dataIndex, field } = info
	const { type, placeholder, hasFeedback } = field

	const validations = field.validation || []
	const styles = { marginBottom: 5 }

	switch (type) {
		case 'checkbox': {
			const { options } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={title}
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
					label={title}
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
					label={title}
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
					label={title}
					validateFirst
					rules={[...validations]}
					labelCol={{ span: 24 }}
					style={{ ...styles }}
				>
					<Input.TextArea allowClear placeholder={placeholder} rows={field.rows || 4} />
				</Form.Item>
			)
		}
		default: {
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={title}
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

export const getEditFormsField = (
	dataIndex: string,
	record: any,
	field: any,
	form: any,
	inputRef: any,
	save: (e: any) => {},
	resetBtn: boolean,
	setResetBtn: any
) => {
	const { type, placeholder } = field

	const styles = { margin: 0 }
	const validations = field.validation || []

	switch (type) {
		case 'checkbox': {
			const { options } = field
			return (
				<Form.Item
					style={{ ...styles }}
					name={dataIndex}
					initialValue={record[dataIndex]}
					rules={[...validations]}
					validateFirst
				>
					<Checkbox.Group ref={inputRef} onChange={save} options={options} />
				</Form.Item>
			)
		}
		case 'radio': {
			const { options } = field
			return (
				<Form.Item
					style={{ ...styles }}
					name={dataIndex}
					initialValue={record[dataIndex]}
					rules={[...validations]}
					validateFirst
				>
					<Radio.Group ref={inputRef} onChange={save} options={options} />
				</Form.Item>
			)
		}
		case 'select': {
			const { placeholder, options } = field
			return (
				<Form.Item
					name={dataIndex}
					initialValue={record[dataIndex]}
					validateFirst
					rules={[...validations]}
					style={{ ...styles }}
				>
					<Select
						ref={inputRef}
						placeholder={placeholder}
						allowClear
						showSearch
						onBlur={save}
						onChange={save}
						filterOption={(input: string, option: any) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
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
					style={{ ...styles }}
					name={dataIndex}
					initialValue={record[dataIndex]}
					rules={[...validations]}
					hasFeedback={field.hasFeedback}
					validateFirst
				>
					<Input.TextArea
						ref={inputRef}
						onPressEnter={save}
						onBlur={save}
						allowClear
						placeholder={placeholder}
						rows={field.rows || 4}
					/>
				</Form.Item>
			)
		}
		default: {
			return (
				<Form.Item
					style={{ ...styles }}
					name={dataIndex}
					initialValue={record[dataIndex]}
					rules={[...validations]}
					hasFeedback={field.hasFeedback}
					validateFirst
				>
					<Input
						placeholder={placeholder}
						type={type}
						ref={inputRef}
						onPressEnter={save}
						onBlur={save}
						onChange={(e: any) => {
							const value = e.target.value
							if (value !== record[dataIndex]) {
								setResetBtn(true)
							} else {
								setResetBtn(false)
							}
						}}
						suffix={
							resetBtn ? (
								<Tooltip title='Revert back to previous value!'>
									<ClearOutlined
										style={{ color: 'rgba(0,0,0,.45)', cursor: 'pointer' }}
										onMouseDown={(e) => {
											e.preventDefault()
											form.setFieldsValue({ [dataIndex]: record[dataIndex] })
											setResetBtn(false)
										}}
									/>
								</Tooltip>
							) : (
								<span /> // https://ant.design/components/input/#FAQ
							)
						}
					/>
				</Form.Item>
			)
		}
	}
}
