import React, { Component } from 'react'
import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import TableCellViewArray from '../components/ViewTableCell/ViewArrayValue'
import TableCellEditArray from '../components/EditTableCell/EditArrayValue'

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

	onGridReady = (params: any) => {
		this.gridApi = params.api
		this.gridColumnApi = params.columnApi
	}

	render() {
		return (
			<div className='ag-theme-alpine' style={{ height: '95vh', width: '100%' }}>
				<AgGridReact
					columnDefs={this.state.columnDefs}
					// a default column definition with properties that get applied to every column
					defaultColDef={{
						// make every column resizable
						resizable: true,
						// every column will have floating filter
						floatingFilter: true,
					}}
					frameworkComponents={{
						arrayValueRenderer: TableCellViewArray,
						arrayValueEditor: TableCellEditArray,
					}}
					onGridReady={this.onGridReady}
					pagination={true}
					rowData={this.state.rowData}
				></AgGridReact>
			</div>
		)
	}
}

export default Table
