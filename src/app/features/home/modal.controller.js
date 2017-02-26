export default class ModalController {
    constructor($uibModalInstance, items) {
        this.$uibModalInstance = $uibModalInstance;
        this.items = items;
    }

    ok() {
        this.$uibModalInstance.close(this.items);
    }
}

ModalController.$inject = ['$uibModalInstance', 'items'];
