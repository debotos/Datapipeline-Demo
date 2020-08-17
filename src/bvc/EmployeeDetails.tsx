import React, { Component } from 'react'
import { Button, Input } from 'antd'
import { EditOutlined } from '@ant-design/icons'

type CProps = { metadata: any; data: any }
type CState = { editMode: boolean }

export class EmployeeDetails extends Component<CProps, CState> {
	constructor(props: CProps) {
		super(props)
		this.state = { editMode: false }
	}

	render() {
		const { editMode } = this.state
		const { data, metadata } = this.props
		const { capabilities, columns } = metadata

		const fields = columns
			.map((x: any) => {
				if (x.field.editable) {
					return { ...x, ...x.field }
				} else {
					return null
				}
			})
			.filter((y: any) => !!y)

		console.log(fields, data, metadata)

		return (
			<div>
				{capabilities.edit && (
					<Button
						type='primary'
						shape='circle'
						icon={<EditOutlined />}
						onClick={() => this.setState({ editMode: !editMode })}
					/>
				)}

				{editMode ? (
					<>
						{fields.map((field: any) => {
							const { dataIndex, type, placeholder } = field
							let input

							switch (type) {
								case 'radio':
									input = 'Radio input have to implement'
									break
								default:
									input = (
										<Input placeholder={placeholder} type={type} defaultValue={data[dataIndex]} />
									)
									break
							}

							return <React.Fragment key={dataIndex}>{input}</React.Fragment>
						})}
					</>
				) : (
					<>
						{Object.keys(data).map((key, index) => (
							<div key={index}>{`${key} => ${data[key]}`}</div>
						))}
					</>
				)}
			</div>
		)
	}
}

export default EmployeeDetails
