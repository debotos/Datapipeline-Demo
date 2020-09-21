import React, { Component, Suspense, useState, useRef, useContext, useEffect } from 'react'
import { Input, Drawer, Button, Empty, Spin, Popconfirm, Space, Modal, Divider, Checkbox, Row, Col, message } from 'antd'
import styled from 'styled-components'
import { clone } from 'ramda'
import debounce from 'lodash/debounce'
import {
	EditOutlined,
	DeleteOutlined,
	PlusOutlined,
	SearchOutlined,
	DownloadOutlined,
	FilterOutlined,
	SettingOutlined,
	SyncOutlined,
} from '@ant-design/icons'

import './table.scss'
import generateExcel from '../../utils/generateExcel'
// import EditForm from '../components/EditForm'
// import AddForm from '../components/AddForm'
import { sleep } from '../../utils/helpers'

type tableProps = { meta: any; data: any }
type tableState = {
	data: any
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
		this.setState({ data: data, tableSettings: setting.props }, () => this.setState({ loadingData: false }))
	}

	componentWillUnmount() {
		this.performGlobalSearch.cancel()
	}

	constructor(props: tableProps) {
		super(props)
		this.state = {
			data: [], // For view purpose
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

	performGlobalSearchAgain = () => {
		const { globalSearchText } = this.state
		if (globalSearchText) {
			this.performGlobalSearch(globalSearchText)
		}
	}

	handleSave = (row: any) => {
		// console.log(row)
		const copy = clone(this.state.data)
		const update = copy.map((x: any) => {
			if (x.id === row.id) return row
			return x
		})
		this.setState({ data: update }, this.performGlobalSearchAgain)
		message.success('Successfully saved the record!', 1.5)
	}

	handleDelete = (key: string) => {
		const copy = clone(this.state.data)
		const update = copy.filter((x: any) => x.id !== key)
		this.setState({ data: update }, this.performGlobalSearchAgain)
		message.info('Successfully deleted the record!', 1.5)
	}

	downloadExcel = () => {
		const { enable, fields: columns } = this.props.meta.capabilities.download
		if (!enable || columns.length === 0) {
			message.error('Sorry, unable to generate excel file!')
			return
		}
		const hide = message.loading('Action in progress..', 0)
		const dataIndexTitlePair: any = {}
		this.props.meta.columns.forEach((x: any) => (dataIndexTitlePair[x.dataIndex] = x.title))

		generateExcel(
			this.getDataWithKey(),
			columns,
			dataIndexTitlePair,
			`${this.props.meta.heading} data on ${new Date().toDateString()}`,
			this.props.meta.capabilities.download?.props,
			this.props.meta.heading,
			{
				searchText: this.state.globalSearchText,
				filters: this.state.masterFilterCriteria,
			}
		)

		setTimeout(hide, 300)
	}

	performGlobalSearch = debounce((searchText: string) => {
		this.setState({ globalSearchText: searchText })

		const fields = this.props.meta.capabilities.search?.fields
		if (!fields) return

		this.setState({ globalSearchLoading: true })
		const results = clone(this.state.data).filter((item: any) => {
			const string = fields
				.map((key: string) => item[key])
				.filter((val: any) => !!val)
				.join(' ')
				.toLowerCase()

			return string.includes(searchText.trim().toLowerCase())
		})

		this.setState({ globalSearchResults: results, globalSearchLoading: false })
	}, 300)

	handleColumnSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
		confirm()
		this.setState({
			localSearchText: selectedKeys[0],
			searchedColumn: dataIndex,
		})
	}

	resetColumnSearch = (clearFilters: any) => {
		clearFilters()
		this.setState({ localSearchText: '' })
	}

	getColumnSearchProps = (dataIndex: string, title: string) => ({
		filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
			<div style={{ padding: 8 }}>
				<Input
					ref={(node: any) => {
						this.searchInput = node
					}}
					placeholder={`Search ${[title]}`}
					value={selectedKeys[0]}
					onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
					onPressEnter={() => this.handleColumnSearch(selectedKeys, confirm, dataIndex)}
					style={{ width: 188, marginBottom: 8, display: 'block' }}
				/>
				<Space>
					<Button
						type='primary'
						onClick={() => this.handleColumnSearch(selectedKeys, confirm, dataIndex)}
						icon={<SearchOutlined />}
						size='small'
						style={{ width: 90 }}
					>
						Search
					</Button>
					<Button onClick={() => this.resetColumnSearch(clearFilters)} size='small' style={{ width: 90 }}>
						Reset
					</Button>
				</Space>
			</div>
		),
		filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
		onFilter: (value: any, record: any) =>
			record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.trim().toLowerCase()) : '',
		onFilterDropdownVisibleChange: (visible: boolean) => {
			if (visible) {
				setTimeout(() => this.searchInput.select())
			}
		},
	})

	getDataWithKey = () => {
		const { data, globalSearchText, globalSearchResults, masterFilterCriteria } = this.state
		let finalData = data
		if (globalSearchText) {
			finalData = globalSearchResults
		}
		return finalData
			.filter((x: any) => {
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
			.map((item: any) => ({ ...item, key: item.id }))
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

	render() {
		const {
			presentationDrawerData,
			showSearchBox,
			globalSearchLoading,
			masterFilterCriteria,
			tableSettings,
			loadingData,
		} = this.state
		const { meta } = this.props

		const { capabilities } = meta
		const { pagination } = capabilities

		const columns = meta.columns
			.filter((col: any) => {
				if (!tableSettings || !tableSettings.hide) return true
				return !tableSettings.hide.includes(col.dataIndex)
			})
			.map((col: any) => {
				const { dataIndex } = col
				if (dataIndex === 'action') {
					return {
						align: 'center',
						...col,
						render: (_: any, record: any) => {
							return (
								<>
									{capabilities.edit?.enable && (
										<Button type='link' size='small' onClick={() => this.openEditFormDrawer(record)}>
											<EditOutlined />
										</Button>
									)}
									{capabilities.delete && (
										<Popconfirm title='Sure to delete?' placement='left' onConfirm={() => this.handleDelete(record.key)}>
											<Button type='link' size='small' style={{ color: 'tomato' }} icon={<DeleteOutlined />} />
										</Popconfirm>
									)}
								</>
							)
						},
					}
				}
				if (col.searchable) {
					col = { ...col, ...this.getColumnSearchProps(dataIndex, col.title) }
				}
				if (col.sorting?.enable) {
					const { type, sortingProps } = col.sorting
					col = {
						...col,
						sorter: (a: any, b: any) => {
							// number
							if (type === 'number') return a[dataIndex] - b[dataIndex]
							// string
							if (a[dataIndex] < b[dataIndex]) return -1
							if (a[dataIndex] > b[dataIndex]) return 1
							return 0
						},
						...sortingProps,
					}
				}
				if (col.filter) {
					if (col.field?.options) {
						const filters = col.field.options.map((x: any) => ({ text: x.label, value: x.value }))
						if (filters.length > 0) {
							col = {
								...col,
								filters,
								onFilter:
									col.field.type === 'checkbox'
										? (value: any, record: any) => record[dataIndex].join().includes(value)
										: (value: any, record: any) => record[dataIndex] === value,
							}
						}
					} else {
						console.warn(`Error! No options found at col.field.options for dataIndex:"${dataIndex}" to generate filter input.`)
					}
				}
				if (!col.field.editable) return col
				return {
					...col,
					onCell: (record: any) => ({
						record,
						field: col.field,
						editable: col.field.editable,
						dataIndex: dataIndex,
						title: col.title,
						handleSave: this.handleSave,
					}),
				}
			})

		let BVCComponent

		if (presentationDrawerData && presentationDrawerData.bvc) {
			BVCComponent = React.lazy(() =>
				import(`./${presentationDrawerData.bvc}`).catch(() => ({
					default: () => <NotFound />,
				}))
			)
		}

		return (
			<div style={{ pointerEvents: loadingData ? 'none' : 'auto', opacity: loadingData ? 0.5 : 1 }}>
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
							const { dataIndex, title } = column
							// Special case where value is not predictable
							const inputData = Array.from(new Set(this.state.data.map((x: any) => x[dataIndex])))
							if (!inputData || inputData.length === 0) return null

							return (
								<div key={fieldDataIndex}>
									<Divider plain style={{ marginTop: index === 0 && 0 }}>
										{title}
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
											<Checkbox value={col.dataIndex}>{col.title}</Checkbox>
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
					Add form is here
					{/* <AddForm metadata={meta} /> */}
				</Drawer>

				{/* Edit Form Drawer */}
				{capabilities.edit?.enable && (
					<Drawer
						title={capabilities.edit.label}
						width={'400px'}
						closable={true}
						visible={this.state.editFormDrawer}
						onClose={this.closeEditFormDrawer}
					>
						Edit form is here
						{/* <EditForm
							metadata={meta}
							initialValues={this.state.editingItemData}
							handleSave={this.handleSave}
							closeDrawer={this.closeEditFormDrawer}
						/> */}
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
				{columns.length > 0 && (
					<div className='table-container'>
						<table className='table is-bordered is-narrow is-hoverable is-fullwidth'>
							<thead>
								<tr>
									<th>
										<abbr title='Position'>Pos</abbr>
									</th>
									<th>Team</th>
									<th>
										<abbr title='Played'>Pld</abbr>
									</th>
									<th>
										<abbr title='Won'>W</abbr>
									</th>
									<th>
										<abbr title='Drawn'>D</abbr>
									</th>
									<th>
										<abbr title='Lost'>L</abbr>
									</th>
									<th>
										<abbr title='Goals for'>GF</abbr>
									</th>
									<th>
										<abbr title='Goals against'>GA</abbr>
									</th>
									<th>
										<abbr title='Goal difference'>GD</abbr>
									</th>
									<th>
										<abbr title='Points'>Pts</abbr>
									</th>
									<th>Qualification or relegation</th>
								</tr>
							</thead>

							<tbody>
								<tr>
									<th>1</th>
									<td>Leicester City</td>
									<td>38</td>
									<td>23</td>
									<td>12</td>
									<td>3</td>
									<td>68</td>
									<td>36</td>
									<td>+32</td>
									<td>81</td>
									<td>Champions League group stage</td>
								</tr>
							</tbody>
						</table>
					</div>
				)}
			</div>
		)
	}
}

const NotFound = () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

export default TableBVC

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
