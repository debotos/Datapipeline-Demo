import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import moment from 'moment'

export default (
	data: any,
	columns: any,
	dataIndexTitlePair: any,
	name: string,
	props: any = {},
	title: string
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

	/* Column headers */
	worksheet.columns = columns.map((x: any) => ({ key: x, width: 23 }))
	worksheet.getRow(7).values = columns.map((x: any) => dataIndexTitlePair[x])

	/* Add array of rows containing data */
	worksheet.addRows(data)

	workbook.xlsx.writeBuffer().then(function (data: any) {
		var blob = new Blob([data], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		})
		saveAs(blob, `${name}.xlsx`)
	})
}
