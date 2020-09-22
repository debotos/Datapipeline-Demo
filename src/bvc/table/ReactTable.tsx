import React from 'react'
import { useTable, usePagination, useSortBy } from 'react-table'
import { DeleteOutlined, EditOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons'
import { Button, Pagination, Popconfirm } from 'antd'

function ReactTable(props: any) {
	const { meta, data, tableSettings } = props
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
				const { dataIndex, field } = col
				col = { ...col, Header: col.headerName, accessor: dataIndex }
				if (dataIndex === 'action') {
					return {
						...col,
						Cell: (args: any) => {
							const { row } = args
							return (
								<>
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
								</>
							)
						},
					}
				}
				if (field.type === 'boolean') {
					col = { ...col, Cell: ({ row }: any) => (row.original[dataIndex] === true ? 'Yes' : 'No') }
				}
				return col
			})
	}

	const columns = React.useMemo(getColumnsDef, [tableSettings?.hide])
	const tableInstance = useTable({ columns, data }, useSortBy, usePagination)
	const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } = tableInstance
	const {
		gotoPage,
		setPageSize,
		state: { pageIndex },
	} = tableInstance // For pagination

	return (
		// apply the table props
		<>
			<div className='table-container'>
				<table {...getTableProps()} className='table is-bordered is-narrow is-hoverable is-fullwidth'>
					<thead>
						{
							// Loop over the header rows
							headerGroups.map((headerGroup) => (
								// Apply the header row props
								<tr {...headerGroup.getHeaderGroupProps()}>
									{
										// Loop over the headers in each row
										headerGroup.headers.map((column) => {
											const { sortable } = column as any
											return (
												// Apply the header cell props
												<th {...column.getHeaderProps(sortable && column.getSortByToggleProps())}>
													{/* Render the header */}
													{column.render('Header')} &nbsp;
													{/* Sort direction indicator */}
													<span>
														{column.isSorted ? (
															column.isSortedDesc ? (
																<SortAscendingOutlined style={{ fontSize: 15 }} />
															) : (
																<SortDescendingOutlined style={{ fontSize: 15 }} />
															)
														) : (
															''
														)}
													</span>
												</th>
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
												// Apply the cell props
												return (
													<td {...cell.getCellProps()}>
														{
															// Render the cell contents
															cell.render('Cell')
														}
													</td>
												)
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
				<div className='pagination'>
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
			)}
		</>
	)
}

export default ReactTable
