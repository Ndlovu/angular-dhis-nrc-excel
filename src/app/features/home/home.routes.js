routes.$inject = ['$stateProvider'];

export default function routes($stateProvider) {
    $stateProvider
        .state('home', {
            url: '/',
            template: require('./home.html'),
            resolve: {
                dataSets: ['Restangular', 'Data', function (Restangular, Data) {
                    return Data.getOne('', 'me').then(function (user) {
                        var roles = _.map(user.userCredentials.userRoles, 'id');
                        return Data.getMany('userRoles', {
                            filter: 'id:in:[' + roles.join(',') + ']',
                            fields: ':all'
                        }).then(function (userRoles) {
                            var role_names = _.map(userRoles, 'name');
                            var dataSetIds = _.flattenDeep(_.map(userRoles, function (userRole) {
                                return _.map(userRole.dataSets, 'id');
                            }));

                            if (_.indexOf(role_names, 'Superuser') >= 0) {
                                return Data.getMany('dataSets', {
                                    /*fields: ':all'*/
                                    paging: false,
                                    fields: 'id,name,uuid,displayName,displayShortName,periodType,dataEntryForm[htmlCode],organisationUnits[id,name,displayName],dataElements[id,name,displayName,categoryCombo[id,name,uuid,displayName,categoryOptionCombos[id,name,displayName,categoryCombo[id,name,displayName],categoryOptions[id,name,displayName]],categories[id,name,displayName,categoryCombos[id,name,displayName],categoryOptions[id,name,uuid,displayName]]]]'
                                });
                            } else {
                                return Data.getMany('dataSets', {
                                    paging: false,
                                    filter: 'id:in:[' + dataSetIds.join(',') + ']',
                                    fields: 'id,name,uuid,displayName,displayShortName,periodType,dataEntryForm[htmlCode],organisationUnits[id,name,displayName],dataElements[id,name,displayName,categoryCombo[id,name,uuid,displayName,categoryOptionCombos[id,name,displayName,categoryCombo[id,name,displayName],categoryOptions[id,name,displayName]],categories[id,name,displayName,categoryCombos[id,name,displayName],categoryOptions[id,name,uuid,displayName]]]]'
                                    /*fields: 'id,name,uuid,displayName,displayShortName,periodType,categoryCombo[*],organisationUnits[*],dataElements[*]'*/
                                });
                            }

                        })
                    });
                }],
                user: ['Restangular', 'Data', function (Restangular, Data) {
                    return Data.getOne('', 'me').then(function (user) {
                        return Data.getOne('users', user.id);
                    });
                }],

                categoryOptions: ['Restangular', 'Data', function (Restangular, Data) {
                    return Data.getMany('categoryOptions', {paging: false, fields: 'id,name,userGroupAccesses'});
                }]
            },
            controller: 'HomeController',
            controllerAs: 'home'
        });
}