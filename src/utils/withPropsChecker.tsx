import React from 'react'
import deep_diff from 'deep-diff'

export const withPropsChecker = (WrappedComponent: any) => {
	return (props: any) => {
		const prevProps = React.useRef<any>(props)
		React.useEffect(() => {
			const diff = deep_diff.diff(prevProps.current, props)
			if (diff) {
				console.log(diff)
			}
			prevProps.current = props
		})
		return <WrappedComponent {...props} />
	}
}
