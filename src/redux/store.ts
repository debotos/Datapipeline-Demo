import { configureStore, combineReducers } from '@reduxjs/toolkit'

import tableBulkAddSlice from './slices/tableBulkAddSlice'

const rootReducer = combineReducers({
	tableBulkAddRows: tableBulkAddSlice,
})

export const store = configureStore({ reducer: rootReducer })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
