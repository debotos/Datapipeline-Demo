import React, { Component, Suspense, useState, useRef, useContext, useEffect } from 'react'
import { Table, Drawer, Button, Empty, Spin, Form, Input, Radio, Tooltip } from 'antd'
import { ClearOutlined } from '@ant-design/icons'
import { clone } from 'ramda'

type tableProps = { meta: any; data: any; pageSize?: number }
type tableState = { data: any; drawer: boolean; drawerData: any }

export class TableBVC extends Component<tableProps, tableState> {
	componentDidMount() {
		this.setState({ data: this.props.data })
	}

	constructor(props: tableProps) {
		super(props)
		this.state = { data: null, drawer: false, drawerData: null }
	}

	openDrawer = (record: any) => this.setState({ drawer: true, drawerData: record })
	closeDrawer = () => this.setState({ drawer: false, drawerData: null })

	handleSave = (row: any) => {
		// console.log(row)
		const copy = clone(this.state.data)
		const update = copy.map((x: any) => {
			if (x.id === row.id) return row
			return x
		})
		this.setState({ data: update })
	}

	render() {
		const { data, drawerData } = this.state
		const { meta, pageSize } = this.props

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
					field: col.field,
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
					dataSource={data ? data.map((item: any) => ({ ...item, key: item.id })) : []}
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

		const { type, placeholder } = field

		switch (type) {
			case 'radio': {
				const { options } = field
				return (
					<Form.Item style={{ margin: 0 }} name={dataIndex} initialValue={record[dataIndex]}>
						<Radio.Group ref={inputRef} onChange={save} options={options} />
					</Form.Item>
				)
			}
			default: {
				const validations = field.validation || []
				return (
					<Form.Item
						style={{ margin: 0 }}
						name={dataIndex}
						initialValue={record[dataIndex]}
						rules={[...validations]}
						hasFeedback={field.hasFeedback}
					>
						<Input
							placeholder={placeholder}
							type={type}
							ref={inputRef}
							onPressEnter={save}
							onBlur={save}
							suffix={
								<Tooltip title='Revert back to previous value!'>
									<ClearOutlined
										style={{ color: 'rgba(0,0,0,.45)', cursor: 'pointer' }}
										onMouseDown={(e) => {
											e.preventDefault()
											form.setFieldsValue({ [dataIndex]: record[dataIndex] })
										}}
									/>
								</Tooltip>
							}
						/>
					</Form.Item>
				)
			}
		}
	}

	return <td {...restProps}>{getChildNode()}</td>
}

export default TableBVC
