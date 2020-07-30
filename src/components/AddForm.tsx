import React, { useState, useEffect } from 'react'
import { Form } from 'antd'

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
	return (
		<Form
			form={form}
			name={label.toLowerCase().split(' ').join('_')}
			layout='horizontal'
			onFinish={onFinish}
			initialValues={initialValues}
		>
			{fields.map((field: string) => {
				const info = columns.find((x: any) => x.dataIndex === field)
				return getAddFormsField(info, form)
			})}
		</Form>
	)
}
