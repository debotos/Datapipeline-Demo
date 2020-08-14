export const getElementSize = (element: any) => {
	if (!element) return { height: 0, width: 0 }

	const style = getComputedStyle(element)
	const width = element.offsetWidth || 0
	const height = element.offsetHeight || 0
	const marginLeft = parseInt(style.marginLeft || '0')
	const marginRight = parseInt(style.marginRight || '0')
	const marginTop = parseInt(style.marginTop || '0')
	const marginBottom = parseInt(style.marginBottom || '0')

	return { height: height + marginTop + marginBottom, width: width + marginRight + marginLeft }
}
