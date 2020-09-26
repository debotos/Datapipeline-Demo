import { isArray } from 'lodash'

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const capitalize = (string: string = '') => string.trim().charAt(0).toUpperCase() + string.trim().slice(1)

export const truncate = (input: string = '', length: number = 5) =>
	input.length > length ? `${input.substring(0, length)}...` : input

export const isEmpty = (value: any) =>
	value === undefined ||
	value === 'undefined' ||
	value === null ||
	value === 'null' ||
	(typeof value === 'object' && Object.keys(value).length === 0) ||
	(typeof value === 'string' && value.trim().length === 0)

export const getContainer = (node: any, property: string = 'parentElement'): HTMLElement => node[property] ?? document.body

export const parseFields = (columns: any, fieldsValue: any) => {
	let fields = []

	if (typeof fieldsValue === 'string' && fieldsValue.toLowerCase() === 'all') {
		fields = columns.map((col: any) => col.dataIndex).filter((dataIndex: string) => dataIndex !== 'action')
	} else if (isArray(fieldsValue)) {
		fields = fieldsValue
	}

	return fields
}
