import React, { Component, Suspense, useState, useRef, useContext, useEffect } from 'react'
import { Table, Drawer, Button, Empty, Spin, Form, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { clone } from 'ramda'

import AddForm from '../components/AddForm'
import { getEditFormsField } from '../utils/getFormFields'

type tableProps = { meta: any; data: any; pageSize?: number }
type tableState = {
	data: any
	drawer: boolean
	presentationDrawer: boolean
	presentationDrawerData: any
}

export class TableBVC extends Component<tableProps, tableState> {
	componentDidMount() {
		this.setState({ data: this.props.data })
	}

	constructor(props: tableProps) {
		super(props)
		this.state = {
			data: null,
			drawer: false,
			presentationDrawer: false,
			presentationDrawerData: null,
		}
	}

	openDrawer = () => this.setState({ drawer: true })
	closeDrawer = () => this.setState({ drawer: false })
	openPresentationDrawer = (record: any) =>
		this.setState({ presentationDrawer: true, presentationDrawerData: record })
	closePresentationDrawer = () =>
		this.setState({ presentationDrawer: false, presentationDrawerData: null })

	handleSave = (row: any) => {
		// console.log(row)
		const copy = clone(this.state.data)
		const update = copy.map((x: any) => {
			if (x.id === row.id) return row
			return x
		})
		this.setState({ data: update })
	}

	handleDelete = (key: string) => {
		const copy = clone(this.state.data)
		const update = copy.filter((x: any) => x.id !== key)
		this.setState({ data: update })
	}

	render() {
		const { data, presentationDrawerData } = this.state
		const { meta, pageSize } = this.props

		const { capabilities } = meta

		const columns = meta.columns.map((col: any) => {
			if (col.dataIndex === 'action') {
				return {
					...col,
					align: 'center',
					render: (_: any, record: any) => {
						return (
							<>
								{/* <Button type='link' size='small' onClick={() => this.openPresentationDrawer(record)}>
									View
								</Button> */}
								{capabilities.delete && (
									<Popconfirm
										title='Sure to delete?'
										onConfirm={() => this.handleDelete(record.key)}
									>
										<Button type='dashed' shape='circle' icon={<DeleteOutlined />} />
									</Popconfirm>
								)}
							</>
						)
					},
				}
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
					<div>{/* Filters, Settings, Search */}</div>
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
					pagination={{ defaultPageSize: pageSize || 16 }}
					bordered
					size='small'
					components={components}
					rowClassName={() => 'editable-row'}
					columns={columns}
					dataSource={data ? data.map((item: any) => ({ ...item, key: item.id })) : []}
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
