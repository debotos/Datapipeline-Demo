import React, { Component, Suspense } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { Button, message, Input, Empty, Divider, Checkbox, Row, Col, Drawer, Spin } from 'antd'
import styled from 'styled-components'
import { debounce } from 'lodash'
import { clone, equals } from 'ramda'
import { FilterOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons'
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import TableCellViewArray from '../components/ViewTableCell/ViewArrayValue'
import TableCellEditArray from '../components/EditTableCell/EditArrayValue'
import TableCellEditString from '../components/EditTableCell/EditStringValue'
import TableCellEditNumber from '../components/EditTableCell/EditNumberValue'
import TableCellViewEnum from '../components/ViewTableCell/ViewEnumValue'
import TableCellEditEnum from '../components/EditTableCell/EditEnumValue'
import TableCellViewBoolean from '../components/ViewTableCell/ViewBooleanValue'
import TableCellEditBoolean from '../components/EditTableCell/EditBooleanValue'

import RowActions from '../components/RowActions'
import AddForm from '../components/AddForm'
import EditForm from '../components/EditForm'
import generateExcel from '../utils/generateExcel'
import Modal from 'antd/lib/modal/Modal'

interface CProps {
	meta: any
	data: any
}

interface CState {
	columnDefs: any[]
	rowData: any[]
	dirtyFields: any[]
	loadingData: boolean
	globalSearchText: string
	addFormDrawer: boolean
	editFormDrawer: boolean
	editingItemData: any
	presentationDrawer: boolean
	presentationDrawerData: any
	showSearchBox: boolean
	filterModal: boolean
	masterFilterCriteria: any
	settingModal: boolean
	tableSettings: any
}

const NotFound = () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

export class Table extends Component<CProps, CState> {
	private globalSearchInput = React.createRef<any>()
	private gridApi: any
	private gridColumnApi: any

	constructor(props: CProps) {
		super(props)
		this.state = {
			columnDefs: [],
			rowData: [],
			dirtyFields: [],
			loadingData: true,
			globalSearchText: '',
			addFormDrawer: false,
			editFormDrawer: false,
			editingItemData: null,
			presentationDrawer: false,
			presentationDrawerData: null,
			showSearchBox: false,
			filterModal: false,
			masterFilterCriteria: null,
			settingModal: false,
			tableSettings: null,
		}
	}

	componentDidMount() {
		const { meta, data } = this.props
		const { capabilities } = meta
		const { setting } = capabilities
		this.setState(
			{ columnDefs: meta.columnDefs, rowData: data, tableSettings: setting.props },
			() => this.setState({ loadingData: false })
		)
	}

	componentWillUnmount() {
		this.performGlobalSearch.cancel()
	}

	downloadExcel = () => {
		const { enable, fields: columns } = this.props.meta.capabilities.download
		if (!enable || columns.length === 0) {
			message.error('Sorry, unable to generate excel file!')
			return
		}
		const hide = message.loading('Action in progress..', 0)
		const fieldTitlePair: any = {}
		this.props.meta.columnDefs.forEach((x: any) => (fieldTitlePair[x.field] = x.headerName))

		const { globalSearchText, masterFilterCriteria } = this.state

		generateExcel(
			this.getExcelData(),
			columns,
			fieldTitlePair,
			`${this.props.meta.heading} data on ${new Date().toDateString()}`,
			this.props.meta.capabilities.download?.props,
			this.props.meta.heading,
			{ searchText: globalSearchText, filters: masterFilterCriteria }
		)

		setTimeout(hide, 300)
	}

	openFilterModal = () => this.setState({ filterModal: true })
	closeFilterModal = () => this.setState({ filterModal: false })
	openSettingModal = () => this.setState({ settingModal: true })
	closeSettingModal = () => this.setState({ settingModal: false })
	openAddFormDrawer = () => this.setState({ addFormDrawer: true })
	closeAddFormDrawer = () => this.setState({ addFormDrawer: false })
	openEditFormDrawer = (record: any) =>
		this.setState({ editingItemData: record }, () => this.setState({ editFormDrawer: true }))
	closeEditFormDrawer = () => this.setState({ editFormDrawer: false, editingItemData: null })
	openPresentationDrawer = (record: any) =>
		this.setState({ presentationDrawerData: record }, () =>
			this.setState({ presentationDrawer: true })
		)
	closePresentationDrawer = () =>
		this.setState({ presentationDrawer: false, presentationDrawerData: null })

	getExcelData = () => {
		const { globalSearchText } = this.state

		if (globalSearchText) {
			const data: any[] = []
			this.gridApi.forEachNodeAfterFilter(function (rowNode: any) {
				data.push(rowNode.data)
			})
			return data
		} else {
			return this.state.rowData
		}
	}

	getData = () => {
		const { rowData, masterFilterCriteria } = this.state

		return rowData.filter((x: any) => {
			if (!masterFilterCriteria) return true
			const masterFilterKeys = Object.keys(masterFilterCriteria)
			if (masterFilterKeys.length === 0) return true
			const result = new Set(
				masterFilterKeys.map((key: any) => {
					const values = masterFilterCriteria[key]
					if (values.includes(x[key])) {
						return true
					}
					return false
				})
			)
			if (result.has(true)) return true
			return false
		})
	}

	getColumnDefs = () => {
		const { columnDefs, tableSettings } = this.state
		return columnDefs
			.filter((col: any) => {
				if (!tableSettings || !tableSettings.hide) return true
				return !tableSettings.hide.includes(col.field)
			})
			.map((column) => {
				if (column.field === 'action') {
					return {
						...column,
						cellRenderer: 'rowActions',
						cellRendererParams: {
							capabilities: this.props.meta.capabilities,
							openEditFormDrawer: this.openEditFormDrawer,
							handleDelete: this.handleDelete,
						},
					}
				}

				const { fieldProps } = column
				if (!fieldProps?.type) return column

				switch (fieldProps.type) {
					case 'checkbox':
						return { ...column, cellRenderer: 'arrayValueRenderer', cellEditor: 'arrayValueEditor' }
					case 'radio':
					case 'select':
						return { ...column, cellRenderer: 'enumValueRenderer', cellEditor: 'enumValueEditor' }
					case 'boolean':
						return { ...column, cellRenderer: 'boolValueRenderer', cellEditor: 'boolValueEditor' }
					case 'number':
						return { ...column, cellEditor: 'numberValueEditor' }
					default:
						return column
				}
			})
	}

	getCellStyle = (params: any) => {}

	handleSave = (row: any) => {
		// console.log(row)
		const copy = clone(this.state.rowData)
		const update = copy.map((x: any) => {
			if (x.id === row.id) return row
			return x
		})
		this.setState({ rowData: update }, this.performGlobalSearchAgain)
		message.success('Successfully saved the record!', 1.5)
	}

	handleDelete = (key: string) => {
		const copy = clone(this.state.rowData)
		const update = copy.filter((x: any) => x.id !== key)
		this.setState({ rowData: update }, this.performGlobalSearchAgain)
		message.info('Successfully deleted the record!', 1.5)
	}

	handleSearchBtnClick = (e: any) => {
		const { showSearchBox } = this.state
		const node = this.globalSearchInput.current

		if (showSearchBox) {
			// Already showing
			this.setState({ globalSearchText: '' })
			node && node.handleReset(e)
		} else {
			node && node.focus()
		}
		this.setState((prevState) => ({ showSearchBox: !prevState.showSearchBox }))
	}

	handleRefresh = (e: any) => {
		e.persist()
		// Mainly call the api service again to get the data
		this.setState({ loadingData: true })
		this.gridApi.showLoadingOverlay()
		const hide = message.loading('Refreshing...', 0)
		setTimeout(() => {
			const node = this.globalSearchInput.current
			node && node.handleReset(e)
			this.setState(
				{
					rowData: this.props.data,
					globalSearchText: '',
					showSearchBox: false,
					masterFilterCriteria: null,
				},
				() => {
					this.setState({ loadingData: false })
					hide()
					this.gridApi.hideOverlay()
				}
			)
		}, 3000)
	}

	onGridReady = (params: any) => {
		this.gridApi = params.api
		this.gridColumnApi = params.columnApi
	}

	onCellValueChanged = (params: any) => {
		const { oldValue, newValue, colDef, node } = params

		if (!equals(oldValue, newValue)) {
			this.gridApi.flashCells({
				rowNodes: [node],
				columns: [colDef.field],
				flashDelay: 1000,
				fadeDelay: 500,
			})
			this.setState({ dirtyFields: [...this.state.dirtyFields, params] })
		}
	}

	onCommitChanges = () => {
		const { dirtyFields } = this.state
		const updates = dirtyFields.map((field: any) => {
			const { colDef, oldValue, data } = field
			return {
				new: data,
				old: { ...data, [colDef.field]: oldValue },
				fieldChanged: colDef.field,
			}
		})

		console.log(updates)
		// Save via ajax
		// onSuccess->reset
		this.setState({ dirtyFields: [], columnDefs: this.props.meta.columnDefs }, () => {
			// this.gridApi.destroy()
		})
	}

	performGlobalSearch = debounce((searchText: string) => {
		this.setState({ globalSearchText: searchText })
		this.gridApi.setQuickFilter(searchText)
	}, 300)

	performGlobalSearchAgain = () => {
		const { globalSearchText } = this.state
		if (globalSearchText) {
			this.performGlobalSearch(globalSearchText)
		}
	}

	render() {
		const { dirtyFields, loadingData, showSearchBox, tableSettings } = this.state
		const { masterFilterCriteria, presentationDrawerData } = this.state
		const { meta } = this.props
		const { capabilities } = meta
		const { pagination } = capabilities

		let BVCComponent
		if (presentationDrawerData && presentationDrawerData.bvc) {
			BVCComponent = React.lazy(() =>
				import(`./${presentationDrawerData.bvc}`).catch(() => ({
					default: () => <NotFound />,
				}))
			)
		}

		return (
			<>
				<div
					style={{ pointerEvents: loadingData ? 'none' : 'auto', opacity: loadingData ? 0.5 : 1 }}
				>
					{dirtyFields && dirtyFields.length > 0 && (
						<>
							<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
								<Button shape='round' size='small' type='dashed' onClick={this.onCommitChanges}>
									Commit Changes
								</Button>
							</div>
							<br />
						</>
					)}
					{capabilities.add.enable && (
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
							<Button type='primary' size='small' onClick={this.openAddFormDrawer}>
								<PlusOutlined /> {capabilities.add.label}
							</Button>
						</div>
					)}
					<Container>
						<h1 style={{ margin: 0 }}>{meta.heading}</h1>
						{/* Search, Download, Filters, Settings, Refresh */}
						<div style={{ display: 'flex', alignItems: 'center' }}>
							{capabilities.search.enable && (
								<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
									<SearchBox
										allowClear
										ref={this.globalSearchInput}
										onChange={(e: any) => this.performGlobalSearch(e.target.value)}
										placeholder='Search'
										style={{ width: showSearchBox ? '100%' : '0%', opacity: showSearchBox ? 1 : 0 }}
									/>
									<SearchOutlined className='icon-btn' onClick={this.handleSearchBtnClick} />
								</div>
							)}
							{capabilities.download.enable && (
								<DownloadOutlined className='icon-btn' onClick={this.downloadExcel} />
							)}
							{capabilities.filter.enable && (
								<FilterOutlined
									className='icon-btn'
									onClick={this.openFilterModal}
									style={{
										color:
											masterFilterCriteria &&
											Object.keys(masterFilterCriteria).length > 0 &&
											'#3FA9FF',
									}}
								/>
							)}
							{capabilities.setting.enable && (
								<SettingOutlined
									className='icon-btn'
									onClick={this.openSettingModal}
									style={{
										color: tableSettings && Object.keys(tableSettings).length > 0 && '#3FA9FF',
									}}
								/>
							)}
							{capabilities.refresh && (
								<SyncOutlined
									className='icon-btn'
									spin={loadingData}
									onClick={this.handleRefresh}
								/>
							)}
						</div>
					</Container>
				</div>

				{capabilities.filter.enable && (
					<Modal
						title='Master Filter'
						visible={this.state.filterModal}
						onOk={this.closeFilterModal}
						onCancel={() => {
							this.setState({ masterFilterCriteria: null })
							this.closeFilterModal()
						}}
						destroyOnClose={true}
						closable={false}
						maskClosable={false}
						keyboard={false}
						style={{ top: 25 }}
						bodyStyle={{ height: '80vh', overflow: 'scroll' }}
					>
						{capabilities.filter.fields.map((field: string, index: number) => {
							const column = meta.columnDefs.find((x: any) => x.field === field)
							if (!column) return null
							const { headerName } = column

							// Special case where value is not predictable
							const inputData = Array.from(new Set(this.state.rowData.map((x: any) => x[field])))
							if (!inputData || inputData.length === 0) return null

							return (
								<div key={field}>
									<Divider plain style={{ marginTop: index === 0 && 0 }}>
										{headerName}
									</Divider>
									<Checkbox.Group
										options={inputData
											.sort((a: any, b: any) => {
												if (a < b) return -1
												if (a > b) return 1
												return 0
											})
											.map((item: any) => ({
												label:
													typeof item === 'boolean'
														? item.toString() === 'true'
															? 'Yes'
															: 'No'
														: item,
												value: item,
											}))}
										value={masterFilterCriteria ? masterFilterCriteria[field] : []}
										onChange={(checkedValues: any) => {
											if (checkedValues.length > 0) {
												const update = { ...masterFilterCriteria, [field]: checkedValues }
												this.setState({ masterFilterCriteria: update })
											} else {
												const update = clone(masterFilterCriteria)
												delete update[field]
												this.setState({ masterFilterCriteria: update })
											}
										}}
										className='table-bvc-master-filter-input-group'
									/>
								</div>
							)
						})}
					</Modal>
				)}
				{capabilities.setting.enable && (
					<Modal
						title='Settings'
						visible={this.state.settingModal}
						onOk={this.closeSettingModal}
						onCancel={this.closeSettingModal}
						destroyOnClose={true}
						style={{ top: 25 }}
						bodyStyle={{ height: '80vh', overflow: 'scroll' }}
					>
						<Divider plain style={{ marginTop: 0 }}>
							Hide/Show Column
						</Divider>
						{meta.columnDefs.length > 0 && (
							<Checkbox.Group
								style={{ width: '100%' }}
								value={
									tableSettings && tableSettings.hide && tableSettings.hide.length > 0
										? meta.columnDefs
												.map((x: any) => x.field)
												.filter((y: any) => !tableSettings.hide.includes(y))
										: meta.columnDefs.map((x: any) => x.field)
								}
								onChange={(checkedValues: any) => {
									const columnList = meta.columnDefs.map((x: any) => x.field)
									if (checkedValues.length > 0) {
										const hide = columnList.filter((y: any) => !checkedValues.includes(y))
										const update = { ...tableSettings, hide }
										this.setState({ tableSettings: update })
									} else {
										let update = clone(tableSettings)
										update.hide = columnList
										this.setState({ tableSettings: update })
									}
								}}
							>
								<Row>
									{meta.columnDefs.map((col: any) => (
										<Col span={8} key={col.field}>
											<Checkbox value={col.field}>{col.headerName}</Checkbox>
										</Col>
									))}
								</Row>
							</Checkbox.Group>
						)}
					</Modal>
				)}

				<Drawer
					title={capabilities.add.label}
					width={'400px'}
					closable={true}
					visible={this.state.addFormDrawer}
					onClose={this.closeAddFormDrawer}
				>
					<AddForm metadata={meta} />
				</Drawer>

				{/* Edit Form Drawer */}
				{capabilities.edit?.enable && (
					<Drawer
						title={capabilities.edit.label}
						width={'400px'}
						closable={true}
						visible={this.state.editFormDrawer}
						onClose={this.closeEditFormDrawer}
						destroyOnClose={true}
					>
						<EditForm
							metadata={meta}
							initialValues={this.state.editingItemData}
							handleSave={this.handleSave}
							closeDrawer={this.closeEditFormDrawer}
						/>
					</Drawer>
				)}

				{/* Presentation Drawer */}
				<Drawer
					width={'80%'}
					closable={true}
					visible={this.state.presentationDrawer}
					onClose={this.closePresentationDrawer}
				>
					{BVCComponent ? (
						<Suspense fallback={<Spin />}>
							<BVCComponent data={presentationDrawerData} metadata={meta} />
						</Suspense>
					) : (
						<NotFound />
					)}
				</Drawer>

				<div className='ag-theme-alpine' style={{ height: '85vh', width: '100%' }}>
					<AgGridReact
						columnDefs={this.getColumnDefs()}
						// a default column definition with properties that get applied to every column
						defaultColDef={{
							// String value editor
							cellEditor: 'stringValueEditor',
							// every column will have floating filter
							floatingFilter: true,
							// make every column resizable
							resizable: true,
							// When editing 'enter' key should not close editor without saving
							suppressKeyboardEvent: suppressEnter,
							enableCellChangeFlash: true,
							cellStyle: this.getCellStyle,
						}}
						frameworkComponents={{
							customLoadingOverlay: CustomLoadingOverlay,
							arrayValueRenderer: TableCellViewArray,
							arrayValueEditor: TableCellEditArray,
							boolValueRenderer: TableCellViewBoolean,
							boolValueEditor: TableCellEditBoolean,
							enumValueRenderer: TableCellViewEnum,
							enumValueEditor: TableCellEditEnum,
							numberValueEditor: TableCellEditNumber,
							stringValueEditor: TableCellEditString,
							rowActions: RowActions,
						}}
						loadingOverlayComponent='customLoadingOverlay'
						onGridReady={this.onGridReady}
						onCellValueChanged={this.onCellValueChanged}
						pagination={pagination.enable}
						paginationPageSize={pagination.pageSize}
						rowData={this.getData()}
						stopEditingWhenGridLosesFocus={true}
					></AgGridReact>
				</div>
			</>
		)
	}
}

export default Table

function suppressEnter(params: any) {
	if (!params.editing) return false
	var KEY_ENTER = 13
	var event = params.event
	var key = event.which
	var suppress = key === KEY_ENTER
	return suppress
}

const CustomLoadingOverlay = () => {
	return (
		<div>
			<img alt='Data Loading' src={require('../assets/loading.min.gif')} height='100' width='100' />
		</div>
	)
}

const Container = styled.div`
	margin-bottom: 10px;
	border-bottom: 5px solid #000000a8;
	display: flex;
	justify-content: space-between;
	align-items: center;
`
const SearchBox = styled(Input)`
	margin-right: 10px;
	transition: all 0.5s ease;
`
