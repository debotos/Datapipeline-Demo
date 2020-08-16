import React, { Component } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { Button } from 'antd'
import * as R from 'ramda'

import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import TableCellViewArray from '../components/ViewTableCell/ViewArrayValue'
import TableCellEditArray from '../components/EditTableCell/EditArrayValue'
import TableCellEditString from '../components/EditTableCell/EditStringValue'
import TableCellEditNumber from '../components/EditTableCell/EditNumberValue'
import TableCellViewEnum from '../components/ViewTableCell/ViewEnumValue'
import TableCellEditEnum from '../components/EditTableCell/EditEnumValue'
import TableCellViewBoolean from '../components/ViewTableCell/ViewBooleanValue'
import TableCellEditBoolean from '../components/EditTableCell/EditBooleanValue'

interface CProps {
	meta: any
	data: any
}

interface CState {
	columnDefs: any[]
	rowData: any[]
	dirtyFields: any[]
}

export class Table extends Component<CProps, CState> {
	private gridApi: any
	private gridColumnApi: any

	constructor(props: CProps) {
		super(props)
		this.state = {
			columnDefs: [],
			rowData: [],
			dirtyFields: [],
		}
	}

	componentDidMount() {
		const { meta, data } = this.props
		this.setState({ columnDefs: meta.columnDefs, rowData: data })
	}

	getColumnDefs = () => {
		const { columnDefs } = this.state
		return columnDefs.map((column) => {
			const { fieldProps } = column
			if (!fieldProps?.type) return column
			switch (fieldProps.type) {
				case 'checkbox':
					return { ...column, cellRenderer: 'arrayValueRenderer', cellEditor: 'arrayValueEditor' }
				case 'radio':
				case 'select':
					return { ...column, cellRenderer: 'enumValueRenderer', cellEditor: 'enumValueEditor' }
				case 'boolean':
					return { ...column, cellRenderer: 'boolValueRenderer', cellEditor: 'boolValueEditor' }
				case 'number':
					return { ...column, cellEditor: 'numberValueEditor' }
				default:
					return column
			}
		})
	}

	getCellStyle = (params: any) => {}

	onGridReady = (params: any) => {
		this.gridApi = params.api
		this.gridColumnApi = params.columnApi
	}

	onCellValueChanged = (params: any) => {
		const { oldValue, newValue, colDef, node } = params
		this.gridApi.flashCells({
			rowNodes: [node],
			columns: [colDef.field],
			flashDelay: 1000,
			fadeDelay: 500,
		})
		if (!R.equals(oldValue, newValue)) {
			this.setState({ dirtyFields: [...this.state.dirtyFields, params] })
		}
	}

	onCommitChanges = () => {
		const { dirtyFields } = this.state
		const updates = dirtyFields.map((field: any) => {
			const { colDef, oldValue, data } = field
			return {
				new: data,
				old: { ...data, [colDef.field]: oldValue },
				fieldChanged: colDef.field,
			}
		})

		console.log(updates)
		// Save via ajax
		// onSuccess->reset
		this.setState({ dirtyFields: [], columnDefs: this.props.meta.columnDefs }, () => {
			// this.gridApi.destroy()
		})
	}

	render() {
		const { dirtyFields } = this.state
		return (
			<>
				{dirtyFields && dirtyFields.length > 0 && (
					<>
						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Button shape='round' size='small' type='dashed' onClick={this.onCommitChanges}>
								Commit Changes
							</Button>
						</div>
						<br />
					</>
				)}
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
							enableCellChangeFlash: true,
							cellStyle: this.getCellStyle,
						}}
						frameworkComponents={{
							arrayValueRenderer: TableCellViewArray,
							arrayValueEditor: TableCellEditArray,
							enumValueRenderer: TableCellViewEnum,
							enumValueEditor: TableCellEditEnum,
							boolValueRenderer: TableCellViewBoolean,
							boolValueEditor: TableCellEditBoolean,
							stringValueEditor: TableCellEditString,
							numberValueEditor: TableCellEditNumber,
						}}
						onGridReady={this.onGridReady}
						onCellValueChanged={this.onCellValueChanged}
						pagination={true}
						rowData={this.state.rowData}
						stopEditingWhenGridLosesFocus={true}
					></AgGridReact>
				</div>
			</>
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
