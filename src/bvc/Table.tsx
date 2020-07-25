import React, { Component, Suspense, useState, useRef, useContext, useEffect } from 'react'
import { Table, Drawer, Button, Empty, Spin, Form, Input } from 'antd'

type tableProps = { meta: any; data: any; pageSize?: number }
type tableState = { drawer: boolean; drawerData: any }

export class TableBVC extends Component<tableProps, tableState> {
	constructor(props: tableProps) {
		super(props)
		this.state = { drawer: false, drawerData: null }
	}

	openDrawer = (record: any) => this.setState({ drawer: true, drawerData: record })
	closeDrawer = () => this.setState({ drawer: false, drawerData: null })

	handleSave = (row: any) => {
		console.log(row)
	}

	render() {
		const { drawerData } = this.state
		const { meta, data, pageSize } = this.props

		const columns = meta.columns.map((col: any) => {
			if (col.dataIndex === 'action')
				return {
					...col,
					render: (_: any, record: any) => {
						return (
							<Button type='link' size='small' onClick={() => this.openDrawer(record)}>
								View
							</Button>
						)
					},
				}
			if (!col.field.editable) return col
			return {
				...col,
				onCell: (record: any) => ({
					record,
					editable: col.field.editable,
					dataIndex: col.dataIndex,
					title: col.title,
					handleSave: this.handleSave,
				}),
			}
		})

		let BVCComponent

		if (drawerData && drawerData.bvc) {
			BVCComponent = React.lazy(() =>
				import(`./${drawerData.bvc}`).catch(() => ({
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
				<Table
					pagination={{ defaultPageSize: pageSize || 16 }}
					bordered
					size='small'
					components={components}
					rowClassName={() => 'editable-row'}
					columns={columns}
					dataSource={data.map((item: any) => ({ ...item, key: item.id }))}
				/>
				<Drawer
					width={'80%'}
					closable={true}
					visible={this.state.drawer}
					onClose={this.closeDrawer}
				>
					{BVCComponent ? (
						<Suspense fallback={<Spin />}>
							<BVCComponent data={drawerData} metadata={meta} />
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

	let childNode = children

	if (editable) {
		childNode = editing ? (
			<Form.Item
				style={{ margin: 0 }}
				name={dataIndex}
				rules={[
					{
						required: true,
						message: `${title} is required.`,
					},
				]}
			>
				<Input ref={inputRef} onPressEnter={save} onBlur={save} />
			</Form.Item>
		) : (
			<div className='editable-cell-value-wrap' style={{ paddingRight: 24 }} onClick={toggleEdit}>
				{children}
			</div>
		)
	}

	return <td {...restProps}>{childNode}</td>
}

export default TableBVC
