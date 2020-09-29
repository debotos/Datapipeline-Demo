import React from 'react'
import shortid from 'shortid'
import { Button, message, Row } from 'antd'

import { isEmpty, parseFields, sleep } from '../../utils/helpers'
import styled from 'styled-components'
import { PlusOutlined } from '@ant-design/icons'

type CProps = { meta: any }

const BulkAddTable = (props: CProps) => {
	const { meta } = props
	const { capabilities, columns } = meta
	const { add } = capabilities
	const { fields: fieldsValue, initialValues = {} } = add
	const fields: any[] = parseFields(columns, fieldsValue)
	const fieldsWithInfo = fields
		.map((key: any) => {
			return columns.find((col: any) => col.dataIndex === key)
		})
		.filter((field: any) => !!field)
	const [rows, setRows] = React.useState<any[]>([])
	const [saving, setSaving] = React.useState<boolean>(false)

	const handleSave = async () => {
		const requiredFields: any[] = fieldsWithInfo.filter((item: any) => !!item?.field?.required)
		const requiredFieldsKeyList: string[] = requiredFields.map((field: any) => field.dataIndex)
		const keyLabelMap: Record<string, string> = {}
		for (let index = 0; index < requiredFields.length; index++) {
			const field = requiredFields[index]
			keyLabelMap[field.dataIndex] = field.headerName
		}

		const postData = []
		let haveError = false
		let errorMsg = ''

		for (let index = 0; index < rows.length; index++) {
			const row = rows[index]
			// Make some adjustment for postData if needed
			postData.push(row)
			const rowKeys = Object.keys(row)

			for (let i = 0; i < rowKeys.length; i++) {
				const rowKey = rowKeys[i]
				const rowVal = row[rowKey]

				if (requiredFieldsKeyList.includes(rowKey) && isEmpty(rowVal)) {
					console.log('Error for:', { rowKey, rowVal })
					haveError = true
					errorMsg = `Required field '${keyLabelMap[rowKey]}' missing at row ${index + 1}.`
					break
				}
			}

			if (haveError) break
		}

		if (haveError) {
			message.error(errorMsg)
			return
		}

		// Now everything is good to execute an ajax req with postData to save
		// console.log(postData)
		setSaving(true)
		const hide = message.loading('Saving...', 0)
		await sleep(4000)
		setSaving(false)
		hide()
	}

	const handleAdd = (event: any) => {
		event.stopPropagation()

		const row: Record<string, any> = { id: shortid.generate() }
		for (let index = 0; index < fields.length; index++) {
			const field: string = fields[index]
			row[field] = initialValues[field]
		}

		const newRows = [row, ...rows]
		console.log(newRows)
		setRows(newRows)
	}

	return (
		<Container>
			<Row justify='end' style={{ marginBottom: 20 }}>
				<Button type='dashed' size='small' onClick={handleAdd} disabled={saving}>
					<PlusOutlined /> Add new row
				</Button>
			</Row>
			<div style={{ marginBottom: 20 }}>
				<table className='table is-bordered is-narrow is-hoverable is-fullwidth'>
					<thead>
						<tr>
							{fieldsWithInfo.map((field: any) => (
								<th key={field.dataIndex}>{field.headerName}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row: any, index: number) => {
							return (
								<tr key={`row_${index}`}>
									{fieldsWithInfo.map((field: any) => {
										const key: string = field.dataIndex
										const value = row[key]
										console.log(value)
										return (
											<td key={`row_${index}_${key}`}>
												<Cell value={value} />
											</td>
										)
									})}
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</Container>
	)
}

const Container = styled.div`
	width: 100%;
	height: 100%;
`

export default React.memo(BulkAddTable)

interface CellProps {
	value: any
}

const Cell = React.memo((props: CellProps) => {
	const { value } = props
	return <div style={{ padding: '0.25em 0.5em' }}>{value}</div>
})
