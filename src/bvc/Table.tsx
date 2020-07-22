import React, { Component, Suspense } from 'react'
import { Table, Drawer, Button, Empty, Spin } from 'antd'

type tableProps = { meta: any; data: any; pageSize?: number }
type tableState = { drawer: boolean; drawerData: any }

export class TableBVC extends Component<tableProps, tableState> {
	constructor(props: tableProps) {
		super(props)
		this.state = { drawer: false, drawerData: null }
	}

	openDrawer = (record: any) => this.setState({ drawer: true, drawerData: record })
	closeDrawer = () => this.setState({ drawer: false, drawerData: null })

	render() {
		const { drawerData } = this.state
		const { meta, data, pageSize } = this.props
		const columns = meta.map((col: any) => {
			if (col.dataIndex !== 'action') return col
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
		})

		let BVCComponent

		if (drawerData && drawerData.bvc) {
			BVCComponent = React.lazy(() =>
				import(`./${drawerData.bvc}`).catch(() => ({
					default: () => <NotFound />,
				}))
			)
		}

		return (
			<>
				<Table
					pagination={{ pageSize: pageSize || 16 }}
					bordered
					size='small'
					columns={columns}
					dataSource={data.map((item: any) => ({ ...item, key: item.id }))}
				/>
				<Drawer width={640} closable={true} visible={this.state.drawer} onClose={this.closeDrawer}>
					{BVCComponent ? (
						<Suspense fallback={<Spin />}>
							<BVCComponent data={drawerData} />
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

export default TableBVC
