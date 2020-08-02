import React, { Component, Suspense, useState, useRef, useContext, useEffect } from 'react'
import { Table, Input, Drawer, Button, Empty, Spin, Form, Popconfirm, Space } from 'antd'
import Highlighter from 'react-highlight-words'
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

import AddForm from '../components/AddForm'
import { getEditFormsField } from '../utils/getFormFields'

type tableProps = { meta: any; data: any }
type tableState = {
	data: any
	globalSearchText: string
	globalSearchResults: any
	globalSearchLoading: boolean
	localSearchText: string
	searchedColumn: string
	drawer: boolean
	presentationDrawer: boolean
	presentationDrawerData: any
	showSearchBox: boolean
}

export class TableBVC extends Component<tableProps, tableState> {
	private globalSearchInput = React.createRef<any>()
	searchInput: any

	focusSearchInput() {
		const node = this.globalSearchInput.current
		if (node) {
			node.focus()
		}
	}

	handleSearchBtnClick = () => {
		const { showSearchBox } = this.state

		if (showSearchBox) {
			// Already showing
			this.setState({ globalSearchText: '' })
		} else {
			this.focusSearchInput()
		}
		this.setState((prevState) => ({ showSearchBox: !prevState.showSearchBox }))
	}

	componentDidMount() {
		const { data } = this.props
		this.setState({ data: data })
	}

	componentWillUnmount() {
		this.performGlobalSearch.cancel()
	}

	constructor(props: tableProps) {
		super(props)
		this.state = {
			data: [], // For view purpose
			globalSearchText: '',
			globalSearchResults: [],
			globalSearchLoading: false,
			localSearchText: '',
			searchedColumn: '',
			drawer: false,
			presentationDrawer: false,
			presentationDrawerData: null,
			showSearchBox: false,
		}
	}

	openDrawer = () => this.setState({ drawer: true })
	closeDrawer = () => this.setState({ drawer: false })
	openPresentationDrawer = (record: any) =>
		this.setState({ presentationDrawer: true, presentationDrawerData: record })
	closePresentationDrawer = () =>
		this.setState({ presentationDrawer: false, presentationDrawerData: null })

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
	}

	handleDelete = (key: string) => {
		const copy = clone(this.state.data)
		const update = copy.filter((x: any) => x.id !== key)
		this.setState({ data: update }, this.performGlobalSearchAgain)
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
					<Button
						onClick={() => this.resetColumnSearch(clearFilters)}
						size='small'
						style={{ width: 90 }}
					>
						Reset
					</Button>
				</Space>
			</div>
		),
		filterIcon: (filtered: boolean) => (
			<SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
		),
		onFilter: (value: any, record: any) =>
			record[dataIndex]
				? record[dataIndex].toString().toLowerCase().includes(value.trim().toLowerCase())
				: '',
		onFilterDropdownVisibleChange: (visible: boolean) => {
			if (visible) {
				setTimeout(() => this.searchInput.select())
			}
		},
		render: (text: any) => {
			const { globalSearchText } = this.state
			return this.state.searchedColumn === dataIndex || globalSearchText ? (
				<Highlighter
					highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
					searchWords={[this.state.localSearchText, globalSearchText]}
					autoEscape
					textToHighlight={text ? text.toString() : ''}
				/>
			) : (
				text
			)
		},
	})

	getDataWithKey = () => {
		const { data, globalSearchText, globalSearchResults } = this.state
		let finalData = data
		if (globalSearchText) {
			finalData = globalSearchResults
		}
		return finalData.map((item: any) => ({ ...item, key: item.id }))
	}

	render() {
		const { presentationDrawerData, showSearchBox, globalSearchLoading } = this.state
		const { meta } = this.props

		const { capabilities } = meta
		const { pagination } = capabilities

		const columns = meta.columns.map((col: any) => {
			if (col.dataIndex === 'action') {
				return {
					...col,
					align: 'center',
					render: (_: any, record: any) => {
						return (
							<>
								<Button
									type='link'
									size='small'
									onClick={() => this.openPresentationDrawer(record)}
								>
									<EditOutlined />
								</Button>
								{capabilities.delete && (
									<Popconfirm
										title='Sure to delete?'
										placement='left'
										onConfirm={() => this.handleDelete(record.key)}
									>
										<Button
											type='link'
											size='small'
											style={{ color: 'tomato' }}
											icon={<DeleteOutlined />}
										/>
									</Popconfirm>
								)}
							</>
						)
					},
				}
			}
			if (col.searchable) {
				col = { ...col, ...this.getColumnSearchProps(col.dataIndex, col.title) }
			}
			if (!col.field.editable) return col
			return {
				...col,
				onCell: (record: any) => ({
					record,
					field: col.field,
					editable: col.field.editable,
					dataIndex: col.dataIndex,
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

		const components = {
			body: {
				row: EditableRow,
				cell: EditableCell,
			},
		}

		return (
			<>
				<div>
					{capabilities.add.enable && (
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
							<Button type='primary' size='small' onClick={this.openDrawer}>
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
							{capabilities.download && <DownloadOutlined className='icon-btn' />}
							{capabilities.filter.enable && <FilterOutlined className='icon-btn' />}
							{capabilities.setting.enable && <SettingOutlined className='icon-btn' />}
							{capabilities.refresh && <SyncOutlined className='icon-btn' />}
						</div>
					</Container>
				</div>
				<Drawer
					title={capabilities.add.label}
					width={'400px'}
					closable={true}
					visible={this.state.drawer}
					onClose={this.closeDrawer}
				>
					<AddForm metadata={meta} />
				</Drawer>
				<Table
					pagination={
						pagination.enable
							? {
									position: pagination.position || ['bottomRight'],
									defaultPageSize: pagination.pageSize || 16,
									pageSizeOptions: pagination.pageSizeOptions,
									showSizeChanger: pagination.showSizeChanger,
									showQuickJumper: pagination.showQuickJumper,
									showTotal: (total: number, range: any) =>
										`${range[0]}-${range[1]} of ${total} items`,
							  }
							: false
					}
					bordered
					size='small'
					components={components}
					rowClassName={() => 'editable-row'}
					columns={columns}
					loading={globalSearchLoading}
					dataSource={this.getDataWithKey()}
				/>
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
			</>
		)
	}
}

const NotFound = () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />

// Editable Row
interface EditableRowProps {
	index: number
}

const EditableContext = React.createContext<any>({})

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
	const [form] = Form.useForm()
	return (
		<Form form={form} component={false}>
			<EditableContext.Provider value={form}>
				<tr {...props} />
			</EditableContext.Provider>
		</Form>
	)
}

// Editable Cell
const EditableCell: React.FC<any> = ({
	title,
	editable,
	children,
	dataIndex,
	record,
	field,
	handleSave,
	...restProps
}) => {
	const [editing, setEditing] = useState(false)
	const inputRef = useRef(null)
	const form = useContext(EditableContext)

	useEffect(() => {
		if (editing) {
			inputRef.current.focus()
		}
	}, [editing])

	const toggleEdit = () => {
		setEditing(!editing)
		form.setFieldsValue({ [dataIndex]: record[dataIndex] })
	}

	const save = async (e: any) => {
		try {
			const values = await form.validateFields()
			toggleEdit()
			handleSave({ ...record, ...values })
		} catch (errInfo) {
			console.log('Save failed:', errInfo)
		}
	}

	const getChildNode = () => {
		if (!editable) return children
		if (!editing) {
			return (
				<div className='editable-cell-value-wrap' style={{ paddingRight: 24 }} onClick={toggleEdit}>
					{children}
				</div>
			)
		}

		return getEditFormsField(dataIndex, record, field, form, inputRef, save)
	}

	return <td {...restProps}>{getChildNode()}</td>
}

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
