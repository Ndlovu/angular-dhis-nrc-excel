import * as xlsx from 'xlsx-style';
import saveAs from 'save-as'
export default class HomeController {
    constructor($scope, Data, Restangular, localStorageService, Filters, Utils, $uibModal, user, dataSets, categoryOptions) {

        /* Check if the letiables are in the local storage */

        this.filters = Filters;
        this.utils = Utils;
        this.uimodal = $uibModal;
        let d = new Date();
        this.yearValue = d.getFullYear();
        this.periodType = "Quarterly";

        this.data = Data;

        this.restagular = Restangular;

        this.dataSets = Restangular.stripRestangular(dataSets);

        this.form = null;
        this.categoryOptions = Restangular.stripRestangular(categoryOptions);
        this.userGroups = _.map(user.userGroups, 'id');

        this.selectedDataset = null;
        this.selectedDatasetCategories = null;
        this.selectedPeriod = null;
        this.selectedDatasetCategories = null;
        this.selectedOrganisationUnit = null;
        this.table = null;
        this.showDatasetCategories = false;
        this.datasetCategories = null;
        this.form = null;
        this.excel = null;

        this.maximumLength = 0;

        if (!this.dataSets) {
            let modalInstance = this.uimodal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                template: require('./alert-modal.html'),
                controller: 'ModalController',
                controllerAs: 'alert',
                size: 'sm',
                backdrop: false,
                resolve: {
                    items: function () {
                        return "You have not been assigned any datasets, contact system administrator";
                    }
                }
            });
            modalInstance.result.then(() => {
            }, ()=> {
            });
        }

        this.panelStyling = {
            "fill": {
                "fgColor": {
                    "rgb": "3c3c3c"
                }
            },
            "font": {
                "name": "Times New Roman",
                bold: true,
                italic: true,
                outline: true,
                shadow: true,
                vertAlign: "superscript",
                "sz": 24,
                "color": {
                    "rgb": "FFFF00"
                }
            }
        };

        this.dataElementStyling = {
            "alignment": {
                "horizontal": "left",
                "vertical": "center",
                "wrapText": 1
            }
        };


        this.dataEntryStyling = {
            "border": {
                "left": {
                    "style": "thin",
                    "color": {
                        "auto": 1
                    }
                },
                "right": {
                    "style": "thin",
                    "color": {
                        "auto": 1
                    }
                },
                "top": {
                    "style": "thin",
                    "color": {
                        "auto": 1
                    }
                },
                "bottom": {
                    "style": "thin",
                    "color": {
                        "auto": 1
                    }
                }
            }
        };

        this.headersStyling = {
            "alignment": {
                "horizontal": "center",
                "vertical": "center",
                "wrapText": 1
            },
            "fill": {
                "fgColor": {
                    "rgb": "eaf7fb"
                }
            }
        };

        this.monthNames = [
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
            "November", "December"
        ];

        $scope.$watch(() => this.excel, (newVal) => {
            if (newVal) {
                this.wb = xlsx.read(newVal.base64, {
                    type: 'base64',
                    WTF: false
                });


                let work_sheet = this.wb.Sheets["Main"];

                let unprocessedDataCells = this.wb["Custprops"];
                let cellsGot = [];
                let dataElementsFound = [];
                let categoryOptionCombosFound = [];
                let otherCellValues = [];

                let otherEntryCells = angular.fromJson(unprocessedDataCells["otherEntryCells"]);
                _.forEach(otherEntryCells, (otherEntryCell)=> {
                    let workSheet = this.wb.Sheets[otherEntryCell.name];
                    let workSheetData = xlsx.utils.sheet_to_row_object_array(workSheet);

                    let desired_cell = work_sheet[otherEntryCell.cell];
                    /* Get the value */
                    let desired_value = desired_cell.v;

                    if (otherEntryCell.name === "Periods") {
                        this.importedPeriod = _.find(workSheetData, {name: desired_value});
                        if (!this.importedPeriod) {
                            let dt = xlsx.SSF.parse_date_code(desired_value, {
                                date1904: false
                            });

                            let p = dt.m < 10 ? dt.y + '0' + dt.m : dt.y + '' + dt.m;

                            this.importedPeriod = {
                                id: p,
                                name: this.monthNames[dt.m - 1] + " " + dt.y
                            }
                        }
                    } else if (otherEntryCell.name === "Organizations") {
                        this.importedOrganisationUnit = _.find(workSheetData, {name: desired_value});
                    } else {

                        let foundOtherCell = _.find(workSheetData, {name: desired_value});
                        otherCellValues.push(foundOtherCell.id);
                    }
                });

                this.selectedDatasetCategories = otherCellValues.join(",");
                this.importedDataset = unprocessedDataCells["dataset"].split(',')[1];
                this.importedDatasetId = unprocessedDataCells["dataset"].split(',')[0];
                this.dataSetCategoryCombo = unprocessedDataCells["dataSetCategoryCombo"]

                _.forEach(unprocessedDataCells, (dataCell, index) => {
                    if (index.indexOf("cells") !== -1) {
                        let cells = angular.fromJson(dataCell);

                        _.forEach(cells, (cell) => {
                            cellsGot.push({
                                cell: cell.cell,
                                dataElement: cell.dataElement,
                                categoryOptionCombo: cell.categoryOptionCombo,
                                cellValue: work_sheet[cell.cell]
                            });
                            dataElementsFound.push(cell.dataElement);
                            categoryOptionCombosFound.push(cell.categoryOptionCombo);
                        });
                    }
                });

                this.cellsGot = cellsGot;

                Data.getMany('dataElements', {
                    filter: 'id:in:[' + dataElementsFound.join(',') + ']'
                }).then((des) => {
                    this.dataElementsFound = _.groupBy(Restangular.stripRestangular(des), 'id');
                });


                Data.getMany('categoryOptionCombos', {
                    filter: 'id:in:[' + categoryOptionCombosFound.join(',') + ']'
                }).then((coo)=> {
                    this.categoryOptionCombosFound = _.groupBy(Restangular.stripRestangular(coo), 'id');
                });
            }
        });

        let filteredCategoryOptions = [];

        _.forEach(this.categoryOptions, (catOption) => {
            let userGroupAccesses = _.map(catOption.userGroupAccesses, 'id');
            if (this.userGroups.length > 0 && userGroupAccesses.length > 0 && (_.intersection(this.userGroups, userGroupAccesses)).length > 0) {
                filteredCategoryOptions.push(catOption.id)
            }
        });

        this.filteredCategoryOptions = filteredCategoryOptions;
    }

    Workbook() {
        this.SheetNames = [];
        this.Sheets = {};
        this.Custprops = {};
    }

    open(insertedRecords) {
        let modalInstance = this.uimodal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            template: require('./modal.html'),
            controller: 'ModalController',
            controllerAs: 'alert',
            size: 'sm',
            backdrop: false,
            resolve: {
                items: function () {
                    return insertedRecords;
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
        });
    }

    showOrganizationUnits() {

        this.selectedPeriod = null;
        this.selectedDatasetCategories = null;
        this.selectedOrganisationUnit = null;
        this.table = null;
        this.showDatasetCategories = false;
        this.datasetCategories = null;
        this.form = null;
        this.periodType = this.selectedDataset.periodType;

        console.log(this.selectedDataset);

        if (this.selectedDataset.organisationUnits.length == 0) {
            let modalInstance = this.uimodal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                template: require('./alert-modal.html'),
                controller: 'ModalController',
                controllerAs: 'alert',
                size: 'sm',
                backdrop: false,
                resolve: {
                    items: function () {
                        return "You have either not been assigned organization unit of this dataset or the dataset has not been assigned organization units, contact system administrator";
                    }
                }
            });
            modalInstance.result.then(() => {
            }, function () {
            });
        } else {
            this.data.getOne('dataSets/' + this.selectedDataset.id, 'form', {
                ou: this.selectedDataset.organisationUnits[0].id,
                metaData: true
            }).then((form) => {
                this.form = this.restagular.stripRestangular(form);
            });
        }
    }

    showPeriods() {
        this.selectedDatasetCategories = null;
        this.table = null;
        this.showDatasetCategories = false;
        this.datasetCategories = null;
        this.selectedPeriod = null;
        this.getPeriodArray();
    }

    getPeriodArray() {
        this.dataPeriods = this.filters.getPeriods(this.periodType, this.yearValue);
    }

    nextYear() {
        this.yearValue = parseInt(this.yearValue) + 1;
        this.getPeriodArray();
    }

    previousYear() {
        this.yearValue = parseInt(this.yearValue) - 1;
        this.getPeriodArray();
    }

    showOthers() {
        if (this.form.categoryCombo) {

            _.forEach(this.form.categoryCombo.categories, (category) => {
                if (category.label === 'Project') {
                    let options = _.remove(category.categoryOptions, (co) => {
                        return _.indexOf(this.filteredCategoryOptions, co.id) !== -1;
                    });
                    category.categoryOptions = options;
                }
            });

            this.datasetCategories = this.form.categoryCombo.categories;
            this.showDatasetCategories = true;
            this.selectedDatasetCategories = null;
            this.table = null;

        } else {
            this.showDataSets();
        }
    }

    showDataSets() {

        let tableRows = [];

        let fields = [];

        _.forEach(this.form.groups, (group) => {
            _.forEach(group.fields, (field) => {
                fields.push(field);
            });
        });

        this.fields = _.groupBy(fields, 'dataElement');

        this.selectedDataset.dataElements = _.filter(this.selectedDataset.dataElements, (dataElement) => {
            return _.has(this.fields, dataElement.id)
        });


        let maximumLength = 0;

        _.forEach(this.fields, (field) => {
            if (field.length > maximumLength) {
                maximumLength = field.length;
            }
        });

        this.maximumLength = maximumLength;

        tableRows.push(this.utils.createTableRow([{
            name: 'This is an automatically created template.  Do not edit or change the layout',
            colSpan: maximumLength + 1,
            panelCell: true
        }]));

        tableRows.push(this.utils.createTableRow([{name: 'Dataset', css: ''}, {
            name: this.selectedDataset.displayName,
            colSpan: maximumLength,
            dataElementCell: true
        }]));
        tableRows.push(this.utils.createTableRow([
            {
                name: 'Organization',
                css: ''
            }, {
                name: this.selectedOrganisationUnit.name,
                colSpan: maximumLength - 1,
                dataEntryCell: true
            }, {
                name: '',
                colSpan: 1,
                dataElementCell: true,
                formulaCell: true,
                sheetName: 'Organizations',
                rows: this.selectedDataset.organisationUnits.length + 1
            }
        ]));
        if (this.selectedPeriod) {
            tableRows.push(this.utils.createTableRow([
                {
                    name: 'Period',
                    css: ''
                },
                {
                    name: this.selectedPeriod.name,
                    colSpan: maximumLength - 1,
                    dataEntryCell: true
                }, {
                    name: '',
                    colSpan: 1,
                    dataElementCell: true,
                    formulaCell: true,
                    sheetName: 'Periods',
                    rows: this.dataPeriods.length + 1
                }
            ]));
        }
        if (this.datasetCategories) {
            _.forEach(this.datasetCategories, (val) => {
                let label = this.selectedDatasetCategories[val.label].label;
                tableRows.push(this.utils.createTableRow([
                    {
                        name: val.label
                    },
                    {
                        name: ((label.split("(")[0]).split(":")[0]).trim(),
                        colSpan: maximumLength - 1,
                        dataEntryCell: true
                    },
                    {
                        name: '',
                        colSpan: 1,
                        dataElementCell: true,
                        formulaCell: true,
                        sheetName: val.label,
                        rows: val.categoryOptions.length + 1
                    }
                ]));
            });
        }

        // Group DataElements based the CategoryComboId
        let categoryCombos = _.groupBy(this.selectedDataset.dataElements, 'categoryCombo.id');
        // Loop through the grouped DataElements
        _.forEach(categoryCombos, (dataElements) => {

            let cats = this.processCategories(dataElements[0].categoryCombo.categories)

            _.forEach(cats, (category) => {
                const opts = category.categoryOptions;
                console.log(opts)

                let total = _.reduce(opts, (sum, n) => {
                    if (!n.colSpan) {
                        n.colSpan = 1;
                    }
                    return sum + n.colSpan;
                }, 0);
                tableRows.push(_.concat(this.utils.createTableRow([{
                    name: '',
                    colSpan: (maximumLength - total) + 1
                }]), this.utils.createTableRow(category.categoryOptions)));
            });

            _.forEach(dataElements, (dataElement) => {
                let dataValueCells = this.fields[dataElement.id];
                dataElement.colSpan = (maximumLength - dataValueCells.length) + 1;
                dataElement.dataElementCell = true;
                dataElement.name = dataElement.displayName;

                _.forEach(dataValueCells, (dataValueCell) => {
                    dataValueCell.dataEntryCell = true;
                    dataValueCell.name = '';
                });

                const anotherArray = _.concat([dataElement], dataValueCells);
                tableRows.push(this.utils.createTableRow(anotherArray));
            });
        });

        _.forEach(tableRows, (row) => {
            row[0].css = 'nrcindicatorName';
            row[0].dataElementCell = true;
            row[0].dataEntryCell = false;
        });

        let tableRows1 = _.cloneDeep(tableRows);
        this.merges = this.utils.findMerges(tableRows);
        this.table = tableRows;
        this.table2 = this.utils.convertToUnmerged(tableRows1);

        if (this.datasetCategories) {
            this.rowToRemove = 4 + (this.datasetCategories.length || 0);

        } else {
            this.rowToRemove = 4;
        }
        this.totalRows = tableRows.length;
    }

    displayData(last) {
        if (last) {
            this.showDataSets();
        }
    }

    processCategories(categories) {

        let boys = [];
        for (let i = 0; i < categories.length; i++) {
            if (i <= 0) {
                boys = [...categories]
            } else {
                let currentOptions = categories[i].categoryOptions;
                let previousOptions = categories[i - 1].categoryOptions;
                let currentLength = currentOptions.length;
                let previousLength = previousOptions.length;
                let current = [];
                for (let j = 0; j < previousLength; j++) {
                    let prev = previousOptions[j];

                    for (let k = 0; k < currentLength; k++) {
                        let id;
                        if (prev.combo) {
                            id = prev.combo + ',' + prev.id;
                        } else {
                            id = prev.id
                        }
                        current = [...current, _.merge({combo: id}, currentOptions[k])];
                    }
                }

                let element = categories[i];

                let newObj = Object.assign({}, element, {categoryOptions: current})

                boys = [...categories.slice(0, i), newObj, ...categories.slice(i + 1)]

            }
            if (boys[i + 1]) {
                let cats = [];
                _.forEach(boys[i].categoryOptions, (opt) => {
                    opt.colSpan = boys[i + 1].categoryOptions.length;
                    cats.push(opt);
                });
                boys[i].categoryOptions = cats;
            }
        }
        return boys;
    }

    download() {
        let dataSetCategoryCombo = "";
        if (this.form.categoryCombo) {
            dataSetCategoryCombo = this.form.categoryCombo.id;
        }

        let data = this.table2;

        let defaultCellStyle = {
            font: {name: "Verdana", sz: 11, color: "FF00FF88"},
            fill: {fgColor: {rgb: "FFFFAA00"}}
        };

        let wb = {
            SheetNames: [],
            Sheets: {},
            Custprops: {}
        }

        // let wb = {};

        /*Custom Properties to written in the excel file*/
        wb.Custprops = {
            "dataset": this.selectedDataset.id + "," + this.selectedDataset.displayName,
            "dataSetCategoryCombo": dataSetCategoryCombo
        };

        let dataCells = [];
        let otherEntryCells = [];
        let styling = {};

        /*Sheet Names*/
        let mainSheetName = "Main";
        let organizations = "Organizations";
        let periods = "Periods";

        /*Empty Sheets*/
        let mainSheet = {};
        let organizationSheet = {};
        let periodSheet = {};

        let mainSheetRange = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
        let organizationSheetRange = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
        let periodSheetRange = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};

        wb.SheetNames.push(mainSheetName);

        for (let i = 0; i < data.length; i++) {
            let cols = data[i];
            // console.log(data[i]);
            for (let j = 0; j < cols.length; j++) {
                /*Switch Styling Based on the Cell Type*/
                if (cols[j].panelCell) {
                    styling = this.panelStyling;
                } else if (cols[j].dataElementCell == true) {
                    styling = this.dataElementStyling;
                } else if (cols[j].dataEntryCell == true) {
                    styling = this.dataEntryStyling;
                } else if (!cols[j].dataEntryCell && !cols[j].dataElementCell) {
                    styling = this.headersStyling;
                }
                /*Push Data Cells into Array so that they can be inserted in the excel as custom properties*/
                if (cols[j].categoryOptionCombo && cols[j].dataElement) {
                    dataCells.push({
                        "cell": xlsx.utils.encode_cell({c: j, r: i}),
                        "dataElement": cols[j].dataElement,
                        "categoryOptionCombo": cols[j].categoryOptionCombo
                    });
                }
                /*Insert formula to cell if the cell is a formula cell*/
                if (cols[j].formulaCell) {
                    let cellBefore = xlsx.utils.encode_cell({c: 1, r: i});
                    this.utils.addCell(mainSheetRange, mainSheet, cols[j].colData, "s", i, j, styling, 'IF(COUNTIF(' + '\'' + cols[j].sheetName + '\'!A2:A' + cols[j].rows + ',' + cellBefore + ')>0,"\u2713","\u2612")');
                    otherEntryCells.push({name: cols[j].sheetName, cell: cellBefore});
                } else {
                    this.utils.addCell(mainSheetRange, mainSheet, cols[j].colData, "s", i, j, styling);
                }
            }
        }

        let wscols = [
            {wch: 80}
        ];

        let otherWorkSheets = [];

        mainSheet["!ref"] = xlsx.utils.encode_range(mainSheetRange);
        mainSheet["!cols"] = wscols;
        mainSheet["!merges"] = this.merges;

        wb["Sheets"][mainSheetName] = mainSheet;

        /*Add Data Cells to Custom Properties*/
        let arrays = _.chunk(dataCells, 2);
        _.forEach(arrays, (a, index)=> {
            wb["Custprops"]["cells" + index] = angular.toJson(a);
        });

        wb["Custprops"]["otherEntryCells"] = angular.toJson(otherEntryCells);

        wb.SheetNames.push(organizations);

        /*Write Organization Units Cell Values*/
        this.utils.addCell(organizationSheetRange, organizationSheet, 'name', "s", 0, 0, {});
        this.utils.addCell(organizationSheetRange, organizationSheet, 'id', "s", 0, 1, {});
        let index = 1;
        for (let orgUnit of this.selectedDataset.organisationUnits) {
            this.utils.addCell(organizationSheetRange, organizationSheet, orgUnit.displayName, "s", index + 1, 0, {});
            this.utils.addCell(organizationSheetRange, organizationSheet, orgUnit.id, "s", index + 1, 1, {});

            index = index + 1;
        }

        organizationSheet["!ref"] = xlsx.utils.encode_range(organizationSheetRange);
        wb["Sheets"][organizations] = organizationSheet;

        wb.SheetNames.push(periods);

        /*Write Period Cell Values*/
        index = 1;
        this.utils.addCell(periodSheetRange, periodSheet, "name", "s", 0, 0, {})
        this.utils.addCell(periodSheetRange, periodSheet, "id", "s", 0, 1, {})
        for (let d of this.dataPeriods) {
            this.utils.addCell(periodSheetRange, periodSheet, d.name, "s", index + 1, 0, {});
            this.utils.addCell(periodSheetRange, periodSheet, d.id, "s", index + 1, 1, {});
            index = index + 1;
        }

        periodSheet["!ref"] = xlsx.utils.encode_range(periodSheetRange);
        wb["Sheets"][periods] = periodSheet;

        /*Process Dataset Category Combo and Create Sheet for each Category Option*/
        if (this.datasetCategories) {
            for (let datasetCategory of this.datasetCategories) {
                wb.SheetNames.push(datasetCategory.label);
                otherWorkSheets.push(datasetCategory.label);
                let currentWorkSheet = {};
                let currentWorkSheetRange = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};
                this.utils.addCell(currentWorkSheetRange, currentWorkSheet, "name", "s", 0, 0, {});
                this.utils.addCell(currentWorkSheetRange, currentWorkSheet, "id", "s", 0, 1, {});

                let i = 1;
                for (let catagoryOption of datasetCategory.categoryOptions) {
                    let label = catagoryOption.label;
                    this.utils.addCell(currentWorkSheetRange, currentWorkSheet, ((label.split("(")[0]).split(":")[0]).trim(), "s", i + 1, 0, {});
                    this.utils.addCell(currentWorkSheetRange, currentWorkSheet, catagoryOption.id, "s", i + 1, 1, {});
                    this.utils.addCell(currentWorkSheetRange, currentWorkSheet, label, "s", i + 1, 2, {});
                    i = i + 1;
                }
                currentWorkSheet["!ref"] = xlsx.utils.encode_range(currentWorkSheetRange);
                wb["Sheets"][datasetCategory.label] = currentWorkSheet;
            }
        }

        wb["Custprops"]["otherWorkSheets"] = angular.toJson(otherWorkSheets);

        let wbout = xlsx.write(wb, {
            bookType: 'xlsx',
            /*bookSST: true,*/
            type: 'binary',
            defaultCellStyle: defaultCellStyle
        });

        saveAs(new Blob([this.utils.s2ab(wbout)], {type: "application/octet-stream"}), this.selectedDataset.displayName + ".xlsx");

        this.selectedDataset = {};
        this.selectedOrganisationUnit = {};
        this.selectedPeriod = {};
        this.selectedDatasetCategories = {}
    }

    onSubmit() {

        let date = new Date();
        let day = date.getDate();
        let monthIndex = date.getMonth();
        let year = date.getFullYear();

        let per = year + '-' + (monthIndex + 1) <= 9 ? '0' + (monthIndex + 1) : (monthIndex + 1) + '-' + day <= 9 ? '0' + day : day;
        let data = [];

        _.forEach(this.cellsGot, (cell) => {
            if (cell.categoryOptionCombo && cell.dataElement && cell.cellValue) {
                let ele = {
                    dataElement: cell.dataElement,
                    categoryOptionCombo: cell.categoryOptionCombo,
                    value: cell.cellValue.v
                };
                data.push(ele);
            }
        });
        if (data.length > 0) {
            let catOptions = this.selectedDatasetCategories.split(',');
            if (this.selectedDatasetCategories !== "") {
                this.data.getMany('categoryCombos', {
                    filter: 'id:in:[' + this.dataSetCategoryCombo + ']',
                    fields: 'categoryOptionCombos[id,categoryOptions[id,name]]'
                }).then((categoryCombos) => {
                    let dataCombos = this.restagular.stripRestangular(categoryCombos);
                    let categoryOptionCombos = _.flatten(_.map(dataCombos, 'categoryOptionCombos'));
                    for (let i = 0; i < categoryOptionCombos.length; i++) {
                        let opt = _.map(categoryOptionCombos[i]['categoryOptions'], function (o) {
                            return o.id
                        });
                        if (_.every(opt, (val) => {
                                return catOptions.indexOf(val) >= 0;
                            }) && catOptions.length == opt.length) {
                            let processedData = {
                                dataSet: this.importedDatasetId,
                                completeDate: this.utils.dateToYMD(new Date()),
                                period: this.importedPeriod.id,
                                orgUnit: this.importedOrganisationUnit.id,
                                attributeOptionCombo: categoryOptionCombos[i].id
                            };
                            processedData.dataValues = data;
                            this.data.post('dataValueSets', angular.toJson(processedData)).then((insertedRecords) => {
                                this.open(this.restagular.stripRestangular(insertedRecords));
                            });
                            break;
                        }
                    }
                });
            } else {
                let processedData = {
                    dataSet: this.importedDatasetId,
                    completeDate: this.utils.dateToYMD(new Date()),
                    period: this.importedPeriod.id,
                    orgUnit: this.importedOrganisationUnit.id
                };
                processedData.dataValues = data;
                this.data.post('dataValueSets', angular.toJson(processedData)).then((insertedRecords) => {
                    this.open(this.restagular.stripRestangular(insertedRecords));
                });
            }
        } else {
            this.message = 'No Data';
        }
        this.excel = null;
        this.cellsGot = [];

    };
}

HomeController.$inject = ['$scope', 'Data', 'Restangular', 'localStorageService', 'Filters', 'Utils', '$uibModal', 'user', 'dataSets', 'categoryOptions'];
