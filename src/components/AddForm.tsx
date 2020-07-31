import React, { useState, useEffect } from 'react'
import { Form, Button } from 'antd'

import { getAddFormsField } from '../utils/getFormFields'

type CProps = { metadata: any }

export default function AddForm(props: CProps) {
	const [form] = Form.useForm()
	const [, forceUpdate] = useState()

	// To disable submit button at the beginning.
	useEffect(() => {
		forceUpdate({})
	}, [])

	const onFinish = (values: any) => {
		console.log('Finish:', values)
	}

	const { metadata } = props
	const { columns, capabilities } = metadata
	const { add } = capabilities
	const { label, fields, initialValues } = add

	const initialValuesArray = Object.keys(initialValues || {})

	return (
		<Form
			form={form}
			name={label.toLowerCase().split(' ').join('_')}
			layout='horizontal'
			onFinish={onFinish}
			initialValues={initialValues}
			scrollToFirstError={true}
		>
			{fields.map((field: string) => {
				const info = columns.find((x: any) => x.dataIndex === field)
				return getAddFormsField(info, form)
			})}
			<Form.Item shouldUpdate={true} style={{ marginTop: 20 }}>
				{() => (
					<>
						<Button
							type='primary'
							htmlType='submit'
							disabled={
								!form.isFieldsTouched(
									fields.filter((key: any) => !initialValuesArray.includes(key))
								) || !!form.getFieldsError().filter(({ errors }) => errors.length).length
							}
							style={{ marginRight: 10 }}
							shape='round'
						>
							Submit
						</Button>
						<Button type='link' htmlType='button' onClick={() => form.resetFields()}>
							Reset
						</Button>
					</>
				)}
			</Form.Item>
		</Form>
	)
}
