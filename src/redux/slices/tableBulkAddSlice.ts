import { createSlice } from '@reduxjs/toolkit'

const initialState: any[] = []

/* Store tree data rows for table bvc bulk add */
const tableBulkAddSlice = createSlice({
	name: 'tableBulkAddRows',
	initialState,
	reducers: {
		setBulkAddRows(rows, { payload }) {
			return payload
		},
	},
})

export const { setBulkAddRows } = tableBulkAddSlice.actions

export default tableBulkAddSlice.reducer
