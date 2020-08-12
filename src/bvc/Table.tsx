import React, { Component } from 'react'
import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

interface CProps {
	meta: any
	data: any
}

interface CState {
	columnDefs: any[]
	rowData: any[]
}

export class Table extends Component<CProps, CState> {
	componentDidMount() {
		const { meta, data } = this.props
		this.setState({ columnDefs: meta.columnDefs, rowData: data })
	}

	constructor(props: CProps) {
		super(props)
		this.state = {
			columnDefs: [],
			rowData: [],
		}
	}

	render() {
		return (
			<div className='ag-theme-alpine' style={{ height: '95vh', width: '100%' }}>
				<AgGridReact
					pagination={true}
					columnDefs={this.state.columnDefs}
					rowData={this.state.rowData}
					// a default column definition with properties that get applied to every column
					defaultColDef={{
						// make every column resizable
						resizable: true,
						// every column will have floating filter
						floatingFilter: true,
					}}
					// if we had column groups, we could provide default group items here
					// defaultColGroupDef={{}}
					// define a column type
					columnTypes={{
						nonEditableColumn: { editable: false },
						nonFilterableColumn: { filter: false },
						nonSortableColumn: { sortable: false },
					}}
				></AgGridReact>
			</div>
		)
	}
}

export default Table
