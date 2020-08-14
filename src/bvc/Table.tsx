import React, { Component } from 'react'
import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import TableCellViewArray from '../components/ViewTableCell/ViewArrayValue'
import TableCellEditArray from '../components/EditTableCell/EditArrayValue'
import TableCellEditString from '../components/EditTableCell/EditStringValue'

interface CProps {
	meta: any
	data: any
}

interface CState {
	columnDefs: any[]
	rowData: any[]
}

export class Table extends Component<CProps, CState> {
	private gridApi: any
	private gridColumnApi: any

	constructor(props: CProps) {
		super(props)
		this.state = {
			columnDefs: [],
			rowData: [],
		}
	}

	componentDidMount() {
		const { meta, data } = this.props
		this.setState({ columnDefs: meta.columnDefs, rowData: data })
	}

	getColumnDefs = () => {
		const { columnDefs } = this.state
		return columnDefs.map((column) => {
			return column
		})
	}

	onGridReady = (params: any) => {
		this.gridApi = params.api
		this.gridColumnApi = params.columnApi
	}

	onCellValueChanged = (params: any) => {
		console.log(params)
	}

	render() {
		return (
			<div className='ag-theme-alpine' style={{ height: '95vh', width: '100%' }}>
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
					}}
					enableCellChangeFlash={true}
					frameworkComponents={{
						arrayValueRenderer: TableCellViewArray,
						arrayValueEditor: TableCellEditArray,
						stringValueEditor: TableCellEditString,
					}}
					onGridReady={this.onGridReady}
					onCellValueChanged={this.onCellValueChanged}
					pagination={true}
					rowData={this.state.rowData}
					stopEditingWhenGridLosesFocus={true}
				></AgGridReact>
			</div>
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
