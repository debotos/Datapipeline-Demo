import React, { useState, useEffect } from 'react'
import { Form, Button } from 'antd'

import getAddFormsField from '../utils/getFormFields'

type CProps = { metadata: any; initialValues: any; handleSave(row: any): void; closeDrawer(): void }

export default function EditForm(props: CProps) {
	const [form] = Form.useForm()
	const [, forceUpdate] = useState()

	// To disable submit button at the beginning.
	useEffect(() => forceUpdate({}), [])

	const { metadata, initialValues } = props
	const { columnDefs, capabilities } = metadata
	const { label } = capabilities.edit

	const onFinish = (values: any) => {
		console.log('Finish:', values)
		props.handleSave({ ...initialValues, ...values })
		props.closeDrawer()
	}

	const fields = columnDefs
		.map((x: any) => {
			if (x.editable) return x.field
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
				const info = columnDefs.find((x: any) => x.field === field)
				if (!info) return null
				return getAddFormsField(info, form, initialValues, index + 1 === fields.length)
			})}
			<Form.Item shouldUpdate={true} style={{ marginTop: 20 }}>
				{() => {
					const haveFieldsError = !!form.getFieldsError().filter(({ errors }) => errors.length)
						.length
					// console.log({ haveFieldsError })
					return (
						<>
							<Button
								type='primary'
								htmlType='submit'
								disabled={haveFieldsError}
								style={{ marginRight: 10 }}
								shape='round'
							>
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
