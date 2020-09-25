import React, { Component, Suspense } from 'react'
import { clone } from 'ramda'
import shortid from 'shortid'
import { isArray } from 'lodash'
import { Input, Drawer, Button, Empty, Spin, Modal, Divider, Checkbox, Row, Col, message, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined, DownloadOutlined, FilterOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import debounce from 'lodash/debounce'
import matchSorter from 'match-sorter'

import './table.scss'
import generateExcel from '../../utils/generateExcel'
import EditForm from '../../components/EditForm'
import AddForm from '../../components/AddForm'
import { sleep, isEmpty } from '../../utils/helpers'
import ReactTable from './ReactTable'

type tableProps = { meta: any; data: any }
type tableState = {
	data: any
	localItemsToAdd: any[]
	loadingData: boolean
	globalSearchText: string
	globalSearchResults: any
	globalSearchLoading: boolean
	localSearchText: string
	searchedColumn: string
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

export class TableBVC extends Component<tableProps, tableState> {
	private globalSearchInput = React.createRef<any>()
	searchInput: any

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

	componentDidMount() {
		const { data, meta } = this.props
		const { capabilities } = meta
		const { setting } = capabilities
		this.setState({ data: data || [], tableSettings: setting.props }, () => this.setState({ loadingData: false }))
	}

	componentWillUnmount() {
		this.performGlobalSearch.cancel()
	}

	constructor(props: tableProps) {
		super(props)
		this.state = {
			data: [], // For view purpose
			localItemsToAdd: [], // For inline bulk add
			loadingData: true,
			globalSearchText: '',
			globalSearchResults: [],
			globalSearchLoading: false,
			localSearchText: '',
			searchedColumn: '',
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

	openFilterModal = () => this.setState({ filterModal: true })
	closeFilterModal = () => this.setState({ filterModal: false })
	openSettingModal = () => this.setState({ settingModal: true })
	closeSettingModal = () => this.setState({ settingModal: false })
	openAddFormDrawer = () => this.setState({ addFormDrawer: true })
	closeAddFormDrawer = () => this.setState({ addFormDrawer: false })
	openEditFormDrawer = (record: any) => this.setState({ editingItemData: record, editFormDrawer: true })
	closeEditFormDrawer = () => this.setState({ editFormDrawer: false, editingItemData: null })
	openPresentationDrawer = (record: any) => this.setState({ presentationDrawerData: record, presentationDrawer: true })
	closePresentationDrawer = () => this.setState({ presentationDrawer: false, presentationDrawerData: null })

	handleSave = (row: any) => {
		// console.log(row)
		/* If it is local */
		if (row.__isItLocalTableRow) {
			const update = this.state.localItemsToAdd.map((x: any) => {
				if (x.id === row.id) return { ...x, ...row }
				return x
			})
			this.setState({ localItemsToAdd: update })
			return
		}
		/* If it is not local */
		const update = this.state.data.map((x: any) => {
			if (x.id === row.id) return { ...x, ...row }
			return x
		})
		this.setState({ data: update }, this.performGlobalSearchAgain)
		// message.success('Successfully saved the record!', 1.5)
	}

	handleAdd = (row: any) => {
		// console.log(row)
		this.setState({ data: [row, ...this.state.data] }, this.performGlobalSearchAgain)
		message.success('Successfully added the record!', 1.5)
	}

	handleDelete = (row: any) => {
		const { __isItLocalTableRow, id } = row
		if (__isItLocalTableRow) {
			/* If it is local */
			const update = this.state.localItemsToAdd.filter((x: any) => x.id !== id)
			this.setState({ localItemsToAdd: update })
			return
		}
		/* If it is not local */
		const update = this.state.data.filter((x: any) => x.id !== id)
		this.setState({ data: update }, this.performGlobalSearchAgain)
		message.info('Successfully deleted the record!', 1.5)
	}

	downloadExcel = () => {
		const { enable, fields: columns } = this.props.meta.capabilities.download
		if (!enable || columns.length === 0) {
			return message.error('Sorry, unable to generate excel file!')
		}
		const hide = message.loading('Action in progress..', 0)
		const dataIndexTitlePair: any = {}
		this.props.meta.columns.forEach((x: any) => (dataIndexTitlePair[x.dataIndex] = x.title))
		const { globalSearchText, masterFilterCriteria } = this.state
		generateExcel(
			this.getData(),
			columns,
			dataIndexTitlePair,
			`${this.props.meta.heading} data on ${new Date().toDateString()}`,
			this.props.meta.capabilities.download?.props,
			this.props.meta.heading,
			{ searchText: globalSearchText, filters: masterFilterCriteria }
		)

		setTimeout(hide, 300)
	}

	performGlobalSearch = debounce((searchText: string) => {
		this.setState({ globalSearchText: searchText })

		const fields = this.props.meta.capabilities.search?.fields
		if (!fields) return

		this.setState({ globalSearchLoading: true })

		const results = matchSorter(this.state.data, searchText.trim().toLowerCase(), {
			threshold: matchSorter.rankings.CONTAINS,
			keys: fields,
		})

		this.setState({ globalSearchResults: results, globalSearchLoading: false })
	}, 300)

	performGlobalSearchAgain = () => {
		const { globalSearchText } = this.state
		if (globalSearchText) {
			this.performGlobalSearch(globalSearchText)
		}
	}

	getData = () => {
		const { data, globalSearchText, globalSearchResults, masterFilterCriteria } = this.state
		let finalData = data
		if (globalSearchText) {
			finalData = globalSearchResults
		}

		if (!masterFilterCriteria) return finalData
		const masterFilterKeys = Object.keys(masterFilterCriteria)
		if (masterFilterKeys.length === 0) return finalData

		const resultData = []

		for (let index = 0; index < finalData.length; index++) {
			const data = finalData[index]

			const result = new Set(
				masterFilterKeys.map((key: any) => {
					const values = masterFilterCriteria[key]
					if (values.includes(data[key])) return true
					return false
				})
			)

			if (!result.has(false)) {
				resultData.push(data)
			}
		}

		return resultData
	}

	handleRefresh = async (e: any) => {
		e.persist()
		// Mainly call the api service again to get the data
		this.setState({ loadingData: true })
		const hide = message.loading('Refreshing...', 0)
		await sleep(2000)
		const node = this.globalSearchInput.current
		node && node.handleReset(e)
		this.setState(
			{ data: this.props.data, globalSearchResults: [], globalSearchText: '', showSearchBox: false, masterFilterCriteria: null },
			() => {
				this.setState({ loadingData: false })
				hide()
			}
		)
	}

	handleInlineAdd = () => {
		const { capabilities, columns } = this.props.meta
		const { add } = capabilities
		const { fields: fieldsValue, initialValues = {} } = add

		let fields: string[] = []
		if (typeof fieldsValue === 'string' && fieldsValue.toLowerCase() === 'all') {
			fields = columns.map((col: any) => col.dataIndex).filter((dataIndex: string) => dataIndex !== 'action')
		} else if (isArray(fieldsValue)) {
			fields = fieldsValue
		}

		const row: Record<string, any> = { id: shortid.generate(), __isItLocalTableRow: true }
		for (let index = 0; index < fields.length; index++) {
			const field: string = fields[index]
			row[field] = initialValues[field]
		}

		this.setState({ localItemsToAdd: [row, ...this.state.localItemsToAdd] })
	}

	render() {
		const {
			presentationDrawerData,
			showSearchBox,
			globalSearchLoading,
			masterFilterCriteria,
			tableSettings,
			loadingData,
			localItemsToAdd,
		} = this.state

		const { meta } = this.props
		const { capabilities } = meta
		const actionInProgress = globalSearchLoading || loadingData
		const tableData = this.getData()
		let BVCComponent

		if (presentationDrawerData && presentationDrawerData.bvc) {
			BVCComponent = React.lazy(() =>
				import(`./${presentationDrawerData.bvc}`).catch(() => ({
					default: () => <NotFound />,
				}))
			)
		}

		return (
			<Wrapper
				className='hide-native-scrollbar '
				style={{ pointerEvents: actionInProgress ? 'none' : 'auto', opacity: actionInProgress ? 0.5 : 1 }}
			>
				{capabilities.add.enable && (
					<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
						<Button type='dashed' size='small' onClick={this.openAddFormDrawer}>
							<PlusOutlined /> {capabilities.add.label}
						</Button>
					</div>
				)}
				<Container>
					<h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
						{meta.heading}
						<Tooltip placement='top' title={capabilities.add.label}>
							<Button
								type='dashed'
								shape='circle'
								icon={<PlusOutlined />}
								size='small'
								style={{ marginLeft: 10 }}
								onClick={this.handleInlineAdd}
							/>
						</Tooltip>
					</h1>
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
						{capabilities.download.enable && <DownloadOutlined className='icon-btn' onClick={this.downloadExcel} />}
						{capabilities.filter.enable && (
							<FilterOutlined
								className='icon-btn'
								onClick={this.openFilterModal}
								style={{
									color: masterFilterCriteria && Object.keys(masterFilterCriteria).length > 0 && '#3FA9FF',
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
						{capabilities.refresh && <SyncOutlined className='icon-btn' spin={actionInProgress} onClick={this.handleRefresh} />}
					</div>
				</Container>

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
						{capabilities.filter.fields.map((fieldDataIndex: string, index: number) => {
							const column = meta.columns.find((x: any) => x.dataIndex === fieldDataIndex)
							if (!column) return null
							const { dataIndex, headerName } = column
							// Special case where value is not predictable
							const inputData = Array.from(new Set(this.state.data.map((x: any) => x[dataIndex])))
							if (!inputData || inputData.length === 0) return null

							return (
								<div key={fieldDataIndex}>
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
												label: typeof item === 'boolean' ? (item.toString() === 'true' ? 'Yes' : 'No') : item,
												value: item,
											}))}
										value={masterFilterCriteria ? masterFilterCriteria[dataIndex] : []}
										onChange={(checkedValues: any) => {
											if (checkedValues.length > 0) {
												const update = { ...masterFilterCriteria, [dataIndex]: checkedValues }
												this.setState({ masterFilterCriteria: update })
											} else {
												const update = clone(masterFilterCriteria)
												delete update[dataIndex]
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
						{meta.columns.length > 0 && (
							<Checkbox.Group
								style={{ width: '100%' }}
								value={
									tableSettings && tableSettings.hide && tableSettings.hide.length > 0
										? meta.columns.map((x: any) => x.dataIndex).filter((y: any) => !tableSettings.hide.includes(y))
										: meta.columns.map((x: any) => x.dataIndex)
								}
								onChange={(checkedValues: any) => {
									const columnList = meta.columns.map((x: any) => x.dataIndex)
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
									{meta.columns.map((col: any) => (
										<Col span={8} key={col.dataIndex}>
											<Checkbox value={col.dataIndex}>{col.headerName}</Checkbox>
										</Col>
									))}
								</Row>
							</Checkbox.Group>
						)}
					</Modal>
				)}

				{/* Add Form Drawer */}
				<Drawer
					title={capabilities.add.label}
					width={'400px'}
					closable={true}
					visible={this.state.addFormDrawer}
					onClose={this.closeAddFormDrawer}
				>
					<AddForm metadata={meta} handleAdd={this.handleAdd} closeDrawer={this.closeAddFormDrawer} />
				</Drawer>

				{/* Edit Form Drawer */}
				{capabilities.edit?.enable && (
					<Drawer
						title={capabilities.edit.label}
						width={'400px'}
						closable={true}
						visible={this.state.editFormDrawer}
						onClose={this.closeEditFormDrawer}
						destroyOnClose
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
				<Drawer width={'80%'} closable={true} visible={this.state.presentationDrawer} onClose={this.closePresentationDrawer}>
					{BVCComponent ? (
						<Suspense fallback={<Spin />}>
							<BVCComponent data={presentationDrawerData} metadata={meta} />
						</Suspense>
					) : (
						<NotFound />
					)}
				</Drawer>

				{/* Actual Table */}
				{isEmpty(tableData) ? (
					<NotFound />
				) : (
					<ReactTable
						meta={meta}
						data={localItemsToAdd.concat(tableData)}
						tableSettings={tableSettings}
						openEditFormDrawer={this.openEditFormDrawer}
						handleDelete={this.handleDelete}
						handleSave={this.handleSave}
					/>
				)}
			</Wrapper>
		)
	}
}

const NotFound = () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

export default TableBVC

const Wrapper = styled.div`
	width: 100%;
	height: 100%;
	min-height: 100vh;
	padding: 20px;
	padding-bottom: 0;
`
const Container = styled.div`
	margin-bottom: 5px;
	border-bottom: 5px solid #000000a8;
	display: flex;
	justify-content: space-between;
	align-items: center;
`
const SearchBox = styled(Input)`
	margin-right: 10px;
	transition: all 0.5s ease;
`
