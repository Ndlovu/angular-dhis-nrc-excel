routing.$inject = ['$urlRouterProvider', '$locationProvider', 'RestangularProvider', '$windowProvider'];

export default function routing($urlRouterProvider, $locationProvider, RestangularProvider, $windowProvider) {
    $urlRouterProvider.otherwise('/');

    let $window = $windowProvider.$get();

    let urlArray = $window.location.pathname.split('/');
    let apiIndex = urlArray.indexOf('api');

    let url = '/dhis/api/';

    /*if (apiIndex > 1) {
        url = '/' + urlArray[apiIndex - 1] + '/api/';
    } else {
        url = '/api/';
    }*/
    RestangularProvider.setBaseUrl(url);
    RestangularProvider.setDefaultHeaders({
        "Content-Type": "application/json"
    });

    RestangularProvider.setResponseInterceptor(function (data, operation, what) {
        if (operation === 'getList') {
            var results = [];
            angular.forEach(data, function (value, key) {
                if (key !== 'pager') {
                    results = _.union(results, value);
                }
            });
            return results;
        }
        return data;
    });
    RestangularProvider.setDefaultHttpFields({
        cache: true
    });
}