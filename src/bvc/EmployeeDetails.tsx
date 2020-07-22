import React from 'react'

export default function EmployeeDetails(props: any) {
	return (
		<div>
			{Object.keys(props.data).map((key, index) => (
				<div key={index}>{`${key} => ${props.data[key]}`}</div>
			))}
		</div>
	)
}
