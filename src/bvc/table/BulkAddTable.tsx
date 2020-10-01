import React from 'react'
import shortid from 'shortid'
import styled from 'styled-components'
import { Button, Form, message, Popconfirm, Row, Tooltip } from 'antd'
import { CopyOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'

import { isEmpty, parseFields, sleep } from '../../utils/helpers'
import { getFormField } from '../../utils/getFormField'
import { checkIsIdentical } from './ReactTable'

type CProps = { meta: any; handleAddNewRecords: (newRecords: any[]) => void; closeModal: () => void }

const BulkAddTable = (props: CProps) => {
	const meta = React.useMemo(() => props.meta, [props.meta])
	const initialValues = React.useMemo(() => meta.capabilities.add.initialValues || {}, [meta.capabilities.add.initialValues])
	const addFormFields = React.useMemo(() => meta.capabilities.add.fields, [meta.capabilities.add.fields])
	const columns = React.useMemo(() => meta.columns, [meta.columns])
	const fields: any[] = React.useMemo(() => parseFields(columns, addFormFields), [addFormFields, columns])
	// fieldsWithInfo is actually columns
	const fieldsWithInfo = React.useMemo(
		() =>
			fields
				.map((key: any) => {
					return columns.find((col: any) => col.dataIndex === key)
				})
				.filter((field: any) => !!field),
		[fields, columns]
	)
	const [rows, setRows] = React.useState<any[]>([])
	const [saving, setSaving] = React.useState<boolean>(false)
	const [adding, setAdding] = React.useState<boolean>(false)

	React.useEffect(() => {
		handleAdd() // By default there will be one row
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleSave = async () => {
		// console.log('Final save call -> ', rows)
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

		setSaving(true)
		const hide = message.loading('Saving...', 0)
		// Now everything is good to execute an ajax req with postData to save
		console.log({ postData })
		await sleep(3000) // simulating ajax
		hide()
		props.handleAddNewRecords(postData)
		await sleep(300) // So that table update happen at background
		setSaving(false)
		props.closeModal()
	}

	const handleAdd = async () => {
		setAdding(true)
		const row: Record<string, any> = { id: shortid.generate() }
		for (let index = 0; index < fields.length; index++) {
			const field: string = fields[index]
			row[field] = initialValues[field]
		}

		setRows((prevRows: any[]) => {
			return [...prevRows, row]
		})

		await sleep(500)
		setAdding(false)
	}

	const handleUpdate = React.useCallback((updates: any, rowIndex: number) => {
		// console.log('Field update called ->', updates)
		setRows((prevRows: any[]) => {
			// console.log('Working on Rows:->', prevRows)
			prevRows[rowIndex] = { ...prevRows[rowIndex], ...updates }
			// console.log('Finished Row Update:->', prevRows)
			return [...prevRows]
		})
	}, [])

	const handleDelete = (rowIndex: number) => {
		setRows((prevRows: any[]) => {
			prevRows.splice(rowIndex, 1)
			return [...prevRows]
		})
	}

	const handleCopy = (rowIndex: number) => {
		setRows((prevRows: any[]) => {
			// console.log('Working on Rows:->', prevRows)
			const rowToCopy = { ...prevRows[rowIndex], id: shortid.generate() }
			prevRows.splice(prevRows.length, 0, rowToCopy)
			// console.log('Finished Row Copy:->', prevRows)
			return [...prevRows]
		})
	}

	return (
		<>
			<Row justify='space-between' style={{ marginBottom: 20 }}>
				<Button type='dashed' size='small' onClick={handleAdd} disabled={saving || adding}>
					<PlusOutlined /> Add new row
				</Button>
				<Button type='dashed' size='small' onClick={handleSave} loading={saving} disabled={saving || isEmpty(rows)}>
					<SaveOutlined /> Save
				</Button>
			</Row>
			{!isEmpty(rows) && (
				<div
					style={{ pointerEvents: saving ? 'none' : 'auto', opacity: saving && 0.5, marginBottom: 20, overflow: 'scroll' }}
					className='hide-native-scrollbar'
				>
					<table className='table is-bordered is-narrow is-hoverable is-fullwidth'>
						<thead>
							<tr>
								<th style={{ textAlign: 'center' }}>Row</th>
								{fieldsWithInfo.map((field: any) => (
									<th key={field.dataIndex}>{field.headerName}</th>
								))}
								<th style={{ textAlign: 'center' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row: any, index: number) => {
								return (
									<tr key={`row_${row.id}`}>
										<td style={{ textAlign: 'center' }}>{index + 1}</td>
										{fieldsWithInfo.map((column: any) => {
											const { width, dataIndex } = column
											const value = row[dataIndex]
											return (
												<td key={`row_${row.id}_${dataIndex}`} style={{ minWidth: width || 150 }}>
													<Cell value={value} rowIndex={index} row={row} column={column} handleUpdate={handleUpdate} />
												</td>
											)
										})}
										<td style={{ textAlign: 'center', minWidth: 90 }}>
											<Popconfirm title='Sure to delete?' placement='left' onConfirm={() => handleDelete(index)}>
												<Button type='link' size='small' style={{ color: 'tomato', marginTop: 15 }} icon={<DeleteOutlined />} />
											</Popconfirm>
											<Tooltip title='Copy this row' placement='left'>
												<Button
													type='link'
													size='small'
													style={{ color: '#1890ff', marginTop: 15 }}
													icon={<CopyOutlined />}
													onClick={() => handleCopy(index)}
												/>
											</Tooltip>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</>
	)
}

export default BulkAddTable

interface CellProps {
	value: any
	rowIndex: number
	column: any
	row: any
	handleUpdate: (updates: any, rowIndex: number) => void
}

const Cell = React.memo(
	(props: CellProps) => {
		const { value, column, row, rowIndex } = props
		const { dataIndex } = column
		const [form] = Form.useForm()
		const inputRef = React.useRef<any>()

		// If form has no error then this function will trigger
		const onFinish = async (values: any) => {
			const newValue = values[dataIndex]
			const identical = checkIsIdentical(value, newValue, column)
			if (identical) return

			const { id } = row
			const updates: Record<string, any> = { id, [dataIndex]: newValue }
			props.handleUpdate(updates, rowIndex)
		}

		const save = () => form.submit()

		const initialValues = { [dataIndex]: value }

		return (
			<TableCellFrom>
				<Form form={form} component={false} onFinish={onFinish}>
					{getFormField('inline-add', column, form, initialValues, true, inputRef, save)}
				</Form>
			</TableCellFrom>
		)
	},
	(prevProps: CellProps, nextProps: CellProps) => {
		const { id: prevRowID } = prevProps.row
		const { id: nextRowID } = nextProps.row

		const { dataIndex: prevDataIndex } = prevProps.column
		const { dataIndex: nextDataIndex } = nextProps.column

		const { value: prevValue } = prevProps
		const { value: nextValue } = nextProps

		// true -> props are equal
		// false -> props are not equal -> update the component
		const propsAreSame = prevRowID === nextRowID && prevDataIndex === nextDataIndex && prevValue === nextValue
		// if (!propsAreSame) {
		// 	console.log('Re-rendering bulk add cell!')
		// }

		return propsAreSame
	}
)

const TableCellFrom = styled.div`
	min-width: 100%;
	min-height: 100%;
	padding: 0.25em 0.5em;
	.ant-input-number {
		width: 100%;
	}
`
