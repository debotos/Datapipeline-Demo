import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import moment from 'moment'

export default (
	data: any,
	columns: any,
	dataIndexTitlePair: any,
	name: string,
	props: any = {},
	title: string,
	queries: any
) => {
	/* Data Adjustment(if needed) */

	/* Set Workbook Properties */
	const workbook = new Excel.Workbook()
	workbook.creator = 'Ezilm'
	workbook.lastModifiedBy = 'Ezilm'
	workbook.created = new Date()
	workbook.modified = new Date()
	/* Workbook Views */
	workbook.views = [
		{
			x: 0,
			y: 0,
			width: 10000,
			height: 20000,
			firstSheet: 0,
			activeTab: 1,
			visibility: 'visible',
		},
	]
	/* Add a Worksheet */
	/* create new sheet with pageSetup settings for A4 - landscape */
	const worksheet = workbook.addWorksheet(props.sheetName ? props.sheetName : 'Sheet1', {
		pageSetup: { paperSize: 9, orientation: 'landscape' },
	})

	/* TITLE */
	worksheet.mergeCells('A1', 'F1')
	worksheet.getCell('A1').value = props.note

	/* META Info */
	worksheet.getCell('A2').value = 'Title'
	worksheet.getCell('A2').font = { bold: true }
	worksheet.getCell('B2').value = title
	worksheet.getCell('B2').font = { color: { argb: 'FF0000' } }

	worksheet.getCell('A3').value = 'Date'
	worksheet.getCell('A3').font = { bold: true }
	worksheet.getCell('B3').value = moment().format('DD/MM/YYYY')
	worksheet.getCell('B3').font = { color: { argb: 'FF0000' } }

	let { searchText, filters } = queries
	let counter = 5

	if (searchText) {
		worksheet.getCell(`A${counter}`).value = 'Search Term'
		worksheet.getCell(`B${counter}`).value = searchText
		worksheet.getCell(`B${counter}`).font = { color: { argb: 'FF0000' } }
		worksheet.getCell(`A${counter}`).font = { bold: true }
		worksheet.getCell(`A${counter}`).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFF00' },
			bgColor: { argb: 'FF000000' },
		}
		counter += 2
	}

	filters = filters ? filters : {}
	const filterCount = Object.keys(filters).length

	if (filterCount !== 0) {
		worksheet.mergeCells(`A${counter}`, `B${counter}`)
		worksheet.getCell(`A${counter}`).value = 'Filters'
		worksheet.getCell(`A${counter}`).font = { bold: true }
		worksheet.getCell(`A${counter}`).alignment = { vertical: 'middle', horizontal: 'center' }
		worksheet.getCell(`A${counter}`).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFF00' },
			bgColor: { argb: 'FF000000' },
		}
		counter++
	}

	Object.keys(filters).forEach((filterKey: string) => {
		worksheet.getCell(`A${counter}`).value = filterKey
		worksheet.getCell(`A${counter}`).font = { bold: true, color: { argb: 'FF0000' } }
		worksheet.getCell(`B${counter}`).value = filters[filterKey].join(', ')
		worksheet.getCell(`B${counter}`).font = { color: { argb: 'FF0000' } }
		counter++
	})

	const dataStartPoint = filterCount + counter

	/* Column headers */
	worksheet.columns = columns.map((x: any) => ({ key: x, width: 23 }))
	worksheet.getRow(dataStartPoint).values = columns.map((x: any) => dataIndexTitlePair[x])
	worksheet.getRow(dataStartPoint).font = { bold: true }

	/* Add array of rows containing data */
	worksheet.addRows(data)

	workbook.xlsx.writeBuffer().then(function (data: any) {
		var blob = new Blob([data], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		})
		saveAs(blob, `${name}.xlsx`)
	})
}
