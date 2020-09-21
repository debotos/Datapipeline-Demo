export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const capitalize = (string: string = '') => string.trim().charAt(0).toUpperCase() + string.trim().slice(1)
export const truncate = (input: string = '', length: number = 5) =>
	input.length > length ? `${input.substring(0, length)}...` : input
