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
			{fields.map((field: string, index: number) => {
				const info = columns.find((x: any) => x.dataIndex === field)
				if (!info) return null
				return getAddFormsField(info, form, index + 1 === fields.length)
			})}
			<Form.Item shouldUpdate={true} style={{ marginTop: 20 }}>
				{() => {
					const isFieldsTouched = !form.isFieldsTouched(
						fields.filter((key: any) => !initialValuesArray.includes(key))
					)
					const haveFieldsError = !!form.getFieldsError().filter(({ errors }) => errors.length)
						.length
					const disabled = isFieldsTouched || haveFieldsError
					// console.log({ isFieldsTouched, haveFieldsError })
					/*
						Input type checkbox, select, radio have to have initialValue
						At least there have to be an entry of their dataIndex inside initialValues object
						Neither submit button disable logic will not work properly
					*/
					return (
						<>
							<Button
								type='primary'
								htmlType='submit'
								disabled={disabled}
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
