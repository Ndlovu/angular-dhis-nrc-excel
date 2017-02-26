import angular from 'angular';

class Data {
    constructor(Restangular) {
        this.Restangular = Restangular;
    }

    getMany(collection, params) {
        if (typeof params === 'undefined') params = {};
        return this.Restangular.all(collection).getList(params);
    }

    getOne(collection, id, params) {
        if (typeof params === 'undefined') params = {};
        return this.Restangular.one(collection, id).get(params);
    }

    post(collection, data, params) {
        if (typeof params === 'undefined') params = {};
        return this.Restangular.all(collection).post(data, params);
    }

    update(collection, model, data) {
        let id = null;
        if (angular.isString(model)) {
            id = model;
        } else if (angular.isObject(model)) {
            id = model.id;
        }
        return this.Restangular.one(collection, id).patch(data);
    }

    deleteOne(collection, id) {
        return this.Restangular.one(collection, id).remove();
    }
}

Data.$inject = ['Restangular', 'localStorageService', '$q'];


export default angular.module('services.data', [])
    .service('Data', Data)
    .name;