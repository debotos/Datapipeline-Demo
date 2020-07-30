import React from 'react'
import { Form, Input, Radio, Tooltip } from 'antd'
import { ClearOutlined } from '@ant-design/icons'

export const getAddFormsField = (info: any, form: any) => {
	if (!info) return null
	const { title, dataIndex, field } = info
	const { type, placeholder, hasFeedback } = field

	switch (type) {
		case 'radio': {
			const { options } = field
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={title}
					validateFirst
					style={{ marginBottom: 10 }}
				>
					<Radio.Group options={options} />
				</Form.Item>
			)
		}
		default: {
			const validations = field.validation || []
			return (
				<Form.Item
					key={dataIndex}
					name={dataIndex}
					label={title}
					labelCol={{ span: 24 }}
					rules={[...validations]}
					hasFeedback={hasFeedback}
					validateFirst
					style={{ marginBottom: 10 }}
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
	save: (e: any) => {}
) => {
	const { type, placeholder } = field

	switch (type) {
		case 'radio': {
			const { options } = field
			return (
				<Form.Item style={{ margin: 0 }} name={dataIndex} initialValue={record[dataIndex]}>
					<Radio.Group ref={inputRef} onChange={save} options={options} />
				</Form.Item>
			)
		}
		default: {
			const validations = field.validation || []
			return (
				<Form.Item
					style={{ margin: 0 }}
					name={dataIndex}
					initialValue={record[dataIndex]}
					rules={[...validations]}
					hasFeedback={field.hasFeedback}
				>
					<Input
						placeholder={placeholder}
						type={type}
						ref={inputRef}
						onPressEnter={save}
						onBlur={save}
						suffix={
							<Tooltip title='Revert back to previous value!'>
								<ClearOutlined
									style={{ color: 'rgba(0,0,0,.45)', cursor: 'pointer' }}
									onMouseDown={(e) => {
										e.preventDefault()
										form.setFieldsValue({ [dataIndex]: record[dataIndex] })
									}}
								/>
							</Tooltip>
						}
					/>
				</Form.Item>
			)
		}
	}
}
