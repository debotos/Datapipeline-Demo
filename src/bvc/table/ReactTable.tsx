import React, { useEffect } from 'react'
import moment from 'moment'
import { isArray } from 'lodash'
import styled from 'styled-components'
import { useSticky } from 'react-table-sticky'
import { Form, Button, Pagination, Popconfirm, Row, Tooltip } from 'antd'
import { useTable, usePagination, useSortBy, useBlockLayout, useResizeColumns } from 'react-table'
import { DeleteOutlined, EditOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons'

import { isEmpty, sleep } from '../../utils/helpers'
import { getFormField } from '../../utils/getFormField'

function ReactTable(props: any) {
	const { meta, data, tableSettings, handleSave } = props
	const { capabilities } = meta
	const { pagination } = capabilities

	const getColumnsDef = () => {
		const { openEditFormDrawer, handleDelete } = props
		console.log('Get column definition func is running!')
		return meta.columns
			.filter((col: any) => {
				if (!tableSettings || !tableSettings.hide) return true
				return !tableSettings.hide.includes(col.dataIndex)
			})
			.map((col: any) => {
				const { dataIndex } = col
				col = { ...col, Header: transformHeaderToDisplay(col, col.headerName), accessor: dataIndex }

				if (dataIndex === 'action') {
					return {
						...col,
						className: 'sticky',
						headerClassName: 'sticky',
						Cell: (args: any) => {
							const { row } = args
							return (
								<ActionContainer>
									{capabilities.edit?.enable && (
										<Button type='link' size='small' onClick={() => openEditFormDrawer(row.original)}>
											<EditOutlined />
										</Button>
									)}
									{capabilities.delete && (
										<Popconfirm title='Sure to delete?' placement='left' onConfirm={() => handleDelete(row.original.id)}>
											<Button type='link' size='small' style={{ color: 'tomato' }} icon={<DeleteOutlined />} />
										</Popconfirm>
									)}
								</ActionContainer>
							)
						},
					}
				}

				return col
			})
	}

	const transformHeaderToDisplay = (column: any, value: any) => {
		const { dataIndex, sortable } = column

		if (dataIndex === 'action') {
			return <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{value}</span>
		}

		if (sortable) {
			return <>{value}&nbsp;</>
		}

		return value
	}

	// Set our editable cell renderer as the default Cell renderer
	const defaultColumn = { minWidth: 100, maxWidth: 400, Cell: EditableCell }
	const columns = React.useMemo(getColumnsDef, [tableSettings?.hide])
	const tableInstance = useTable(
		{ columns, data, defaultColumn, handleSave },
		useBlockLayout,
		useSticky,
		useResizeColumns,
		useSortBy,
		usePagination
	)
	const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } = tableInstance
	const {
		gotoPage,
		setPageSize,
		state: { pageIndex },
	} = tableInstance // For pagination

	return (
		// apply the table props
		<>
			<div className='table-container hide-native-scrollbar'>
				<table {...getTableProps()} className='table is-bordered is-narrow is-hoverable is-fullwidth'>
					<thead>
						{
							// Loop over the header rows
							headerGroups.map((headerGroup) => (
								// Apply the header row props
								<tr {...headerGroup.getHeaderGroupProps()}>
									{
										// Loop over the headers in each row
										headerGroup.headers.map((column, index) => {
											const { sortable, resizable, isSorted, isSortedDesc } = column as any
											const sortingProps = sortable ? column.getSortByToggleProps() : {}
											const tableHeaderElement = ( // Apply the header cell props
												<th {...column.getHeaderProps()} title=''>
													<HeadContent {...sortingProps}>
														{/* Render the header */}
														{column.render('Header')}
														{/* Sort direction indicator */}
														{sortable && (
															<span>
																{isSorted ? (
																	isSortedDesc ? (
																		<SortDescendingOutlined style={{ fontSize: 15 }} />
																	) : (
																		<SortAscendingOutlined style={{ fontSize: 15 }} />
																	)
																) : (
																	''
																)}
															</span>
														)}
													</HeadContent>
													{/* Use column.getResizerProps to hook up the events correctly */}
													{resizable && (
														<ResizingElement
															{...column.getResizerProps()}
															className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
														/>
													)}
												</th>
											)

											let tooltip = ''
											if (isSortedDesc === false) {
												tooltip = 'Click sort by descend'
											} else {
												tooltip = 'Click sort by ascend'
												if (isSortedDesc === true) {
													tooltip = 'Click to cancel sort'
												}
											}

											return sortable ? (
												<Tooltip key={index} placement='top' title={tooltip}>
													{tableHeaderElement}
												</Tooltip>
											) : (
												tableHeaderElement
											)
										})
									}
								</tr>
							))
						}
					</thead>
					{/* Apply the table body props */}
					<tbody {...getTableBodyProps()}>
						{
							// Loop over the table rows
							page.map((row) => {
								// Prepare the row for display
								prepareRow(row)
								return (
									// Apply the row props
									<tr {...row.getRowProps()}>
										{
											// Loop over the rows cells
											row.cells.map((cell) => {
												const cellContent = cell.render('Cell') // Render the cell contents
												const cellElement = <td {...cell.getCellProps()}>{cellContent}</td> // Apply the cell props
												return cellElement
											})
										}
									</tr>
								)
							})
						}
					</tbody>
				</table>
			</div>
			{pagination && pagination.enable && (
				<Row justify='end'>
					<div className='table-bvc-pagination'>
						<Pagination
							total={data.length}
							showSizeChanger
							showQuickJumper
							current={pageIndex + 1}
							onChange={(page) => gotoPage(page - 1)}
							onShowSizeChange={(current, size) => {
								setPageSize(size)
								gotoPage(current)
							}}
							showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
							{...pagination}
						/>
					</div>
				</Row>
			)}
		</>
	)
}

export default ReactTable

const ActionContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: flex-start;
	width: 100%;
	height: 100%;
`
const HeadContent = styled.div`
	display: flex;
	align-items: center;
	& .anticon {
		vertical-align: middle;
	}
`
const ResizingElement = styled.span`
	display: inline-block;
	/* background: blue; */
	width: 10px;
	height: 100%;
	position: absolute;
	right: 0;
	top: 0;
	transform: translateX(50%);
	z-index: 1;
	touch-action: none; /* prevents from scrolling while dragging on touch devices */
	&.isResizing {
		/* background: red; */
	}
`

// Create an editable cell renderer
const EditableCell = (cellProps: any) => {
	// 'handleSave' is the custom function that we supplied to our table instance
	const { value, row, column, handleSave } = cellProps
	const { dataIndex, field } = column
	// We need to keep and update the state of the cell
	const [editing, setEditing] = React.useState(false)
	const [form] = Form.useForm()
	const inputRef = React.useRef<any>()
	const _isMounted = React.useRef(false)
	let tableCellFormElement: any

	useEffect(() => {
		_isMounted.current = true
		return () => {
			_isMounted.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleCellLeave = (e: any) => {
		if (!tableCellFormElement || !field) return
		const { type, editable } = field
		var isInsideClick = tableCellFormElement.contains(e.target)
		if (!isInsideClick) {
			// Click occurred outside the 'cell from element', so do something
			if (editable && (type === 'radio' || type === 'checkbox' || type === 'boolean')) {
				save()
			}
		}
	}

	React.useEffect(() => {
		if (editing) {
			inputRef?.current?.focus?.()
		}
		// Subscribe to listen 'click' event
		document.addEventListener('click', handleCellLeave)
		return () => {
			// Unsubscribe event
			document.removeEventListener('click', handleCellLeave)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editing])

	const handleCellClick = () => {
		_isMounted.current && setEditing(true)
	}

	const checkFieldsError = () => !!form.getFieldsError().filter(({ errors }) => errors.length).length
	const toggleEdit = () => _isMounted.current && setEditing(!editing)

	// We'll only update the external data when the input is blurred
	const onFinish = async (values: any) => {
		console.log('Cell edit finished: ', values)
		const newValue = values[dataIndex]
		const identical = checkIsIdentical(value, newValue, column)
		if (identical) return toggleEdit()
		const { id } = row.original
		handleSave({ id, [dataIndex]: newValue })
		await sleep(300) // Just for visual
		_isMounted.current && setEditing(false)
	}

	const save = () => {
		form.submit()
	}

	const initialValues = { [dataIndex]: value }

	return editing ? (
		<TableCellFrom ref={(el) => (tableCellFormElement = el)}>
			<Form form={form} component={false} onFinish={onFinish}>
				{getFormField('inline-edit', column, form, initialValues, true, inputRef, save, toggleEdit)}
			</Form>
		</TableCellFrom>
	) : (
		<TableCellData onClick={handleCellClick}>{transformValueToDisplay(cellProps)}</TableCellData>
	)
}

const TableCellData = styled.div`
	min-width: 100%;
	min-height: 100%;
	padding: 0.25em 0.5em;
	/* Truncate */
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	/* End truncate */
`
const TableCellFrom = styled.div`
	min-width: 100%;
	min-height: 100%;
	padding: 0.25em 0.5em;
	.ant-input-number {
		width: 100%;
	}
`

const checkIsIdentical = (newVal: any, oldVal: any, column: any) => {
	const { type } = column.field
	if (type === 'date' && oldVal) {
		// If value is not null and field type is date
		oldVal = moment(oldVal).format('YYYY-MM-DD')
	}
	if (newVal !== oldVal) {
		return false // Something changed
	}
	return true
}

const transformValueToDisplay = (cell: any) => {
	const { column, value = '' } = cell
	const { field } = column
	const { type, options } = field

	if (!type) return value

	switch (type) {
		case 'boolean': {
			return value === true ? 'Yes' : 'No'
		}

		case 'radio': {
			const option = options.find((x: any) => x.value === value)
			if (option) {
				return option.label
			} else {
				return value
			}
		}

		case 'checkbox': {
			if (isEmpty(value)) return ''
			if (!isArray(value)) {
				const option = options.find((x: any) => x.value === value)
				if (option) {
					return option.label
				} else {
					return value
				}
			}
			const val = []
			for (let index = 0; index < value.length; index++) {
				const element = value[index]
				const option = options.find((x: any) => x.value === element)
				if (option) {
					val.push(option.label)
				} else {
					val.push(element)
				}
			}
			return val.join(', ')
		}

		default:
			return value
	}
}
