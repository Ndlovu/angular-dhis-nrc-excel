import angular from 'angular';
import * as XLSX from 'xlsx-style';

class Utils {
    constructor() {
    }

    createTableData(props) {
        let obj = {};

        obj.colData = props['name'];

        if (props['colSpan']) {
            obj.colSpan = props['colSpan']
        } else {
            obj.colSpan = 1;
        }

        if (props['rowSpan']) {
            obj.rowSpan = props['rowSpan']
        } else {
            obj.rowSpan = 1;
        }

        if (props['dataElement']) {
            obj.dataElement = props['dataElement']
        } else {
            obj.dataElement = '';
        }

        if (props['categoryOptionCombo']) {
            obj.categoryOptionCombo = props['categoryOptionCombo']
        } else {
            obj.categoryOptionCombo = '';
        }
        if (props['dataElementCell']) {
            obj.dataElementCell = props['dataElementCell']
        } else {
            obj.dataElementCell = false;
        }

        if (props['dataEntryCell']) {
            obj.dataEntryCell = props['dataEntryCell']
        } else {
            obj.dataEntryCell = false;
        }

        if (props['panelCell']) {
            obj.panelCell = props['panelCell']
        } else {
            obj.panelCell = false;
        }

        if (props['formulaCell']) {
            obj.formulaCell = props['formulaCell']
        } else {
            obj.formulaCell = false;
        }

        if (props['sheetName']) {
            obj.sheetName = props['sheetName']
        } else {
            obj.sheetName = '';
        }

        if (props['rows']) {
            obj.rows = props['rows']
        } else {
            obj.rows = '';
        }

        return obj
    }

    createTableRow(rowData) {
        let tr = [];
        for (let i = 0; i < rowData.length; i++) {
            tr.push(this.createTableData(rowData[i]));
        }
        return tr;
    }

    createDataRows(number, val, isDataElement, isDataEntry, isPanel) {
        let data = [];

        for (let i = 0; i < number; i++) {
            data.push({
                colSpan: 1,
                colData: val,
                rowSpan: 1,
                dataElementCell: isDataElement,
                dataEntryCell: isDataEntry,
                panelCell: isPanel
            });
        }
        return data;
    }

    s2ab(s) {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (let i = 0; i != s.length; ++i) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }

    convertToUnmerged(rows) {
        let merged = [];

        const flatten = list => list.reduce(
            (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
        );

        for (let row of rows) {
            for (let index = 0; index < row.length; index++) {
                if (row[index].colSpan > 1) {
                    row[index] = this.createDataRows(row[index].colSpan, row[index].colData, row[index].dataElementCell, row[index].dataEntryCell, row[index].panelCell);
                }
            }

            merged.push(flatten(row));
        }
        return merged;
    }

    findMerges(data) {
        let merges = [];
        for (let i = 0; i < data.length; i++) {
            let cols = data[i];
            for (let j = 0; j < cols.length; j++) {
                if (parseInt(cols[j].colSpan) > 1) {
                    let prev = cols[j - 1];
                    let current = cols[j];
                    let obj;
                    current.row = i + 1;
                    if (prev && parseInt(prev.colSpan) > 1) {
                        current.begin = prev.end + 1;
                        current.end = prev.end + parseInt(current.colSpan);
                    } else {
                        current.begin = j;
                        current.end = j + parseInt(current.colSpan) - 1
                    }
                    obj = {
                        s: {c: current.begin, r: i},
                        e: {c: current.end, r: i}
                    };
                    merges.push(obj);
                }
            }
        }
        return merges;
    }

    updateRange(range, row, col) {
        if (range.s.r > row) {
            range.s.r = row;
        }
        if (range.s.c > col) {
            range.s.c = col;
        }
        if (range.e.r < row) {
            range.e.r = row;
        }
        if (range.e.c < col) {
            range.e.c = col;
        }
    }

    addCell(range, ws, value, type, row, col, styles, formula) {
        this.updateRange(range, row, col);
        let cell = {t: type, v: value, s: styles, f: formula};

        if (cell.t === 'd') {
            cell.t = 'n';
            cell.z = XLSX.SSF._table[14];
        }
        let cell_ref = XLSX.utils.encode_cell({c: col, r: row});
        ws[cell_ref] = cell;
    }

    searchArray(array, object) {
        return _.find(array, object);
    }

    dateToYMD(date) {
        let d = date.getDate();
        let m = date.getMonth() + 1;
        let y = date.getFullYear();
        return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    }

}


export default angular.module('services.utils', [])
    .service('Utils', Utils)
    .name;