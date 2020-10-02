import React, { Component, Suspense } from 'react'
import { clone } from 'ramda'
import shortid from 'shortid'
import { Input, Drawer, Button, Empty, Spin, Modal, Divider, Checkbox, Row, Col, message, Tooltip } from 'antd'
import {
	PlusOutlined,
	SearchOutlined,
	DownloadOutlined,
	FilterOutlined,
	SettingOutlined,
	SyncOutlined,
	SaveOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import debounce from 'lodash/debounce'
import { unionBy } from 'lodash'
import matchSorter from 'match-sorter'

import './table.scss'
import generateExcel from '../../utils/generateExcel'
import EditForm from '../../components/EditForm'
import AddForm from '../../components/AddForm'
import { sleep, isEmpty } from '../../utils/helpers'
import ReactTable from './ReactTable'
import BulkAddTable from './BulkAddTable'

type tableProps = { meta: any; data: any }
type tableState = {
	data: any
	dataBackup: any
	localItemsToUpdate: Record<string, any>
	loadingData: boolean
	updatingData: boolean
	working: boolean
	globalSearchText: string
	globalSearchResults: any
	globalSearchLoading: boolean
	localSearchText: string
	searchedColumn: string
	addFormDrawer: boolean
	editFormDrawer: boolean
	editingItemIndex?: number
	editingItemData: any
	presentationDrawer: boolean
	presentationDrawerData: any
	showSearchBox: boolean
	filterModal: boolean
	masterFilterCriteria: any
	settingModal: boolean
	tableSettings: any
	tableReRenderer?: string
	bulkAddModal: boolean
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
		this.setState(
			{
				data: data || [],
				dataBackup: data || [],
				tableSettings: setting.props,
			},
			() => this.setState({ loadingData: false })
		)
	}

	componentWillUnmount() {
		this.performGlobalSearch.cancel()
	}

	constructor(props: tableProps) {
		super(props)
		this.state = {
			data: [], // For view/edit purpose
			dataBackup: [], // For reset purpose
			localItemsToUpdate: {}, // For inline bulk edit
			loadingData: true,
			updatingData: false,
			working: false,
			globalSearchText: '',
			globalSearchResults: [],
			globalSearchLoading: false,
			localSearchText: '',
			searchedColumn: '',
			addFormDrawer: false,
			editFormDrawer: false,
			editingItemIndex: null,
			editingItemData: null,
			presentationDrawer: false,
			presentationDrawerData: null,
			showSearchBox: false,
			filterModal: false,
			masterFilterCriteria: null,
			settingModal: false,
			bulkAddModal: false,
			tableSettings: null,
			tableReRenderer: shortid.generate(),
		}
	}

	openFilterModal = () => this.setState({ filterModal: true })
	closeFilterModal = () => this.setState({ filterModal: false })
	openSettingModal = () => this.setState({ settingModal: true })
	closeSettingModal = () => this.setState({ settingModal: false })
	openAddFormDrawer = () => this.setState({ addFormDrawer: true })
	closeAddFormDrawer = () => this.setState({ addFormDrawer: false })
	openEditFormDrawer = (rowIndex: number, record: any) =>
		this.setState({ editingItemIndex: rowIndex, editingItemData: record, editFormDrawer: true })
	closeEditFormDrawer = () => this.setState({ editingItemIndex: null, editFormDrawer: false, editingItemData: null })
	openPresentationDrawer = (record: any) => this.setState({ presentationDrawerData: record, presentationDrawer: true })
	closePresentationDrawer = () => this.setState({ presentationDrawer: false, presentationDrawerData: null })

	handleCommitInlineChanges = async (e: any) => {
		e.persist()
		e.stopPropagation()
		const hide = message.loading('Action in progress...', 0)
		this.setState({ updatingData: true })

		const rows = clone(this.state.localItemsToUpdate)
		const ids = Object.keys(rows)
		const postData = []

		for (let index = 0; index < ids.length; index++) {
			const id = ids[index]
			const row = rows[id]
			delete row.__dirtyLocalCells
			delete row.__dirtyLocalValues
			postData.push(row)
		}

		const updatedData = unionBy(postData, this.state.data, 'id') // Ref: https://stackoverflow.com/a/39127782/8465770

		// Now all set. Make ajax call with postData to save
		console.log('PostData to commit changes:', postData)
		await sleep(3000)
		this.setState({ localItemsToUpdate: {}, data: updatedData, dataBackup: updatedData, tableReRenderer: null }, () => {
			this.setState({ tableReRenderer: shortid.generate(), updatingData: false }, this.performGlobalSearchAgain)
			hide()
			message.success('Changes save successfully!')
		})
	}

	handleSingleUpdate = async (rowIndex: number, updates: any) => {
		// From side drawer
		// console.log(rowIndex, updates)
		const hide = message.loading('Update action in progress...', 0)
		this.setState({ working: true })

		// Ajax req to update
		await sleep(500)

		this.setState(
			(prevState) => {
				const data = prevState.data
				data[rowIndex] = { ...data[rowIndex], ...updates, __dirtyLocalCells: [], __dirtyLocalValues: {} }

				const dataBackup = prevState.dataBackup
				dataBackup[rowIndex] = { ...dataBackup[rowIndex], ...updates, __dirtyLocalCells: [], __dirtyLocalValues: {} }

				return { data: [...data], dataBackup: [...dataBackup], tableReRenderer: null }
			},
			() => {
				const { localItemsToUpdate } = this.state
				const rowID = updates.id
				if (localItemsToUpdate && localItemsToUpdate.hasOwnProperty(rowID)) {
					this.setState((prevState) => {
						const localItems = prevState.localItemsToUpdate
						delete localItems[rowID]
						return { localItemsToUpdate: localItems }
					})
				}
				this.setState({ tableReRenderer: shortid.generate() }, () => {
					this.performGlobalSearchAgain()
					this.setState({ working: false })
					hide()
					message.info('Successfully updated the record!', 1.5)
				})
			}
		)
	}

	handleInlineUpdate = (rowIndex: number, updates: any) => {
		// console.log(rowIndex, updates)
		const localItemsChanges: Record<string, any> = {}
		this.setState(
			(prevState) => {
				const data = prevState.data
				const originalRowData = data[rowIndex]
				localItemsChanges[updates.id] = { ...originalRowData, ...updates }
				data[rowIndex] = { ...originalRowData, ...updates }
				console.log('handleInlineUpdate() => ', { ...originalRowData, ...updates })
				return { data: [...data] }
			},
			() => {
				this.setState({ localItemsToUpdate: { ...this.state.localItemsToUpdate, ...localItemsChanges } })
				this.performGlobalSearchAgain()
				message.info('Changes staged for commit!', 1.5)
			}
		)
	}

	handleAddSingleRecord = async (row: any) => {
		// console.log(row)
		const hide = message.loading('Add action in progress...', 0)
		this.setState({ working: true })

		// Ajax call here
		await sleep(500)

		const { data, dataBackup } = this.state
		this.setState({ data: [row, ...data], dataBackup: [row, ...dataBackup], tableReRenderer: null }, () => {
			this.setState({ tableReRenderer: shortid.generate() }, () => {
				this.performGlobalSearchAgain()
				hide()
				message.success('Successfully added the record!', 1.5)
			})
		})
	}

	handleAddNewRecords = (newRecords: any[]) => {
		if (isEmpty(newRecords)) return
		const updatedData = newRecords.concat(this.state.data)
		this.setState({ data: updatedData, dataBackup: updatedData, tableReRenderer: null }, () => {
			this.setState({ tableReRenderer: shortid.generate() }, this.performGlobalSearchAgain)
			message.success('Successfully added the records!')
		})
	}

	handleDelete = async (rowIndex: number, row: any) => {
		const hide = message.loading('Delete action in progress...', 0)
		this.setState({ working: true })

		// Ajax req to delete here
		await sleep(500)

		this.setState(
			(prevState) => {
				const data = prevState.data
				data.splice(rowIndex, 1)

				const dataBackup = prevState.dataBackup
				dataBackup.splice(rowIndex, 1)

				return { data: [...data], dataBackup: [...dataBackup], tableReRenderer: null }
			},
			() => {
				const { localItemsToUpdate } = this.state
				if (localItemsToUpdate && localItemsToUpdate.hasOwnProperty(row.id)) {
					this.setState((prevState) => {
						const localItems = prevState.localItemsToUpdate
						delete localItems[row.id]
						return { localItemsToUpdate: localItems }
					})
				}
				this.setState({ tableReRenderer: shortid.generate() }, () => {
					this.performGlobalSearchAgain()
					this.setState({ working: false })
					hide()
					message.info('Successfully deleted the record!', 1.5)
				})
			}
		)
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
			{
				tableReRenderer: null,
				data: this.state.dataBackup,
				globalSearchResults: [],
				localItemsToUpdate: {},
				globalSearchText: '',
				showSearchBox: false,
				masterFilterCriteria: null,
			},
			() => {
				this.setState({ tableReRenderer: shortid.generate(), loadingData: false })
				hide()
			}
		)
	}

	render() {
		const {
			presentationDrawerData,
			showSearchBox,
			globalSearchLoading,
			masterFilterCriteria,
			tableSettings,
			loadingData,
			updatingData,
			working,
			localItemsToUpdate,
		} = this.state

		const { meta } = this.props
		const { capabilities } = meta
		const actionInProgress = globalSearchLoading || loadingData || updatingData || working
		const commonDisableCase = false // Put logical calculation
		const commonDisableCaseAsStr = commonDisableCase.toString()
		const tableData = this.getData()
		let BVCComponent

		if (presentationDrawerData?.bvc) {
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
						<Button type='dashed' size='small' onClick={this.openAddFormDrawer} disabled={commonDisableCase}>
							<PlusOutlined /> {capabilities.add.label}
						</Button>
					</div>
				)}
				<Container>
					<h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
						{meta.heading}

						{capabilities.add?.bulk?.enable && (
							<>
								<Tooltip placement='top' title={capabilities.add?.bulk?.label || 'Add multiple records'}>
									<Button
										type='dashed'
										shape='circle'
										icon={<PlusOutlined />}
										style={{ marginLeft: 10 }}
										onClick={() => this.setState({ bulkAddModal: true })}
									/>
								</Tooltip>
								<Modal
									title={capabilities.add?.bulk?.label || 'Add multiple records'}
									visible={this.state.bulkAddModal}
									footer={null}
									onCancel={() => this.setState({ bulkAddModal: false })}
									destroyOnClose={true}
									closable={true}
									maskClosable={false}
									keyboard={false}
									centered={true}
									width={'95vw'}
									bodyStyle={{ height: '83vh', overflowY: 'scroll' }}
								>
									<BulkAddTable
										meta={meta}
										handleAddNewRecords={this.handleAddNewRecords}
										closeModal={() => this.setState({ bulkAddModal: false })}
									/>
								</Modal>
							</>
						)}

						{!isEmpty(localItemsToUpdate) && (
							<CommitChangesBtn
								id='table-bvc-commit-inline-changes-btn'
								style={{ pointerEvents: updatingData ? 'none' : 'auto' }}
								onClick={this.handleCommitInlineChanges}
							>
								<Button style={{ zIndex: -1 }} type='dashed' icon={<SaveOutlined />} loading={updatingData}>
									Commit changes
								</Button>
							</CommitChangesBtn>
						)}
					</h1>
					{/* Search, Download, Filters, Settings, Refresh */}
					<CapabilitiesContainer isDisabled={commonDisableCaseAsStr}>
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
						{capabilities.refresh && <SyncOutlined className='icon-btn' spin={loadingData} onClick={this.handleRefresh} />}
					</CapabilitiesContainer>
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
					<AddForm metadata={meta} handleAdd={this.handleAddSingleRecord} closeDrawer={this.closeAddFormDrawer} />
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
							editingItemIndex={this.state.editingItemIndex}
							initialValues={this.state.editingItemData}
							handleSave={this.handleSingleUpdate}
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
					this.state.tableReRenderer && (
						<ReactTable
							meta={meta}
							data={tableData}
							tableSettings={tableSettings}
							openEditFormDrawer={this.openEditFormDrawer}
							handleDelete={this.handleDelete}
							handleSave={this.handleInlineUpdate}
						/>
					)
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
const CapabilitiesContainer: any = styled.div`
	display: flex;
	align-items: center;
	opacity: ${(props: any) => (props.isDisabled === 'true' ? 0.4 : 1)};
	pointer-events: ${(props: any) => (props.isDisabled === 'true' ? 'none' : 'auto')};
`
const SearchBox = styled(Input)`
	margin-right: 10px;
	transition: all 0.5s ease;
`
const CommitChangesBtn = styled.div`
	z-index: 10;
	cursor: pointer !important;
	margin-left: 20px;
	display: flex;
	align-items: center;
	&:hover button {
		color: blue;
		border-color: blue;
	}
`
