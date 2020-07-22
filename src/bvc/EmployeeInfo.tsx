import React from 'react'
import { Tag, List } from 'antd'

export default function EmployeeInfo(props: any) {
	const items = Object.keys(props.data).map((key, index) => (
		<>
			<Tag color='#f50'>{key}</Tag> <Tag color='#108ee9'>{props.data[key]}</Tag>
		</>
	))

	return (
		<List
			itemLayout='horizontal'
			dataSource={items}
			renderItem={(item) => <List.Item>{item}</List.Item>}
		/>
	)
}
