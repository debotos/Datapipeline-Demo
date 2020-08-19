import React from 'react'
import { Button, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

export default function RowActions(props: any) {
	const { capabilities, data, openEditFormDrawer, handleDelete } = props
	return (
		<div style={{ textAlign: 'center' }}>
			{capabilities.edit?.enable && (
				<Button type='link' size='small' onClick={() => openEditFormDrawer(data)}>
					<EditOutlined />
				</Button>
			)}
			{capabilities.delete && (
				<Popconfirm
					title='Sure to delete?'
					placement='left'
					onConfirm={() => handleDelete(data.id)}
				>
					<Button type='link' size='small' style={{ color: 'tomato' }} icon={<DeleteOutlined />} />
				</Popconfirm>
			)}
		</div>
	)
}
