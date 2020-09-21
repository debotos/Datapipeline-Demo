import React, { useState, useEffect } from 'react'
import { Form, Button } from 'antd'

import { getFormField } from '../utils/getFormField'

type CProps = { metadata: any; initialValues: any; handleSave(row: any): void; closeDrawer(): void }

export default function EditForm(props: CProps) {
	const [form] = Form.useForm()
	const [, forceUpdate] = useState<any>()

	// To disable submit button at the beginning.
	useEffect(() => forceUpdate({}), [])

	const { metadata, initialValues } = props
	const { columns, capabilities } = metadata
	const { label } = capabilities.edit

	const onFinish = (values: any) => {
		console.log('Finish:', values)
		props.handleSave({ ...initialValues, ...values })
		props.closeDrawer()
	}

	const fields = columns
		.map((x: any) => {
			if (x.field?.editable) return x.dataIndex
			return null
		})
		.filter((y: string) => !!y)

	return (
		<Form
			form={form}
			name={label.toLowerCase().split(' ').join('_')}
			layout='horizontal'
			onFinish={onFinish}
			initialValues={initialValues}
			scrollToFirstError={true}
		>
			{fields.map((field: string, index: number) => {
				const info = columns.find((x: any) => x.dataIndex === field)
				if (!info) return null
				return getFormField(info, form, initialValues, index + 1 === fields.length)
			})}
			<Form.Item shouldUpdate={true} style={{ marginTop: 20 }}>
				{() => {
					const haveFieldsError = !!form.getFieldsError().filter(({ errors }) => errors.length).length
					// console.log({ haveFieldsError })
					return (
						<>
							<Button type='primary' htmlType='submit' disabled={haveFieldsError} style={{ marginRight: 10 }} shape='round'>
								Submit
							</Button>
							<Button type='link' htmlType='button' onClick={() => form.resetFields()}>
								Reset
							</Button>
						</>
					)
				}}
			</Form.Item>
		</Form>
	)
}
