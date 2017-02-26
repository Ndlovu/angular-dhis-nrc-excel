import 'bootstrap/dist/css/bootstrap.css';
import angular from 'angular';
import uirouter from 'angular-ui-router';
import restangular from 'restangular';
import tabs from 'angular-ui-bootstrap/src/tabs';
import modal from 'angular-ui-bootstrap/src/modal'
import LocalStorageModule from 'angular-local-storage';
import naifbase64 from 'angular-base64-upload'
import uiselect from 'ui-select';
import 'angular-spinner';
import 'angular-loading-spinner'

import routing from './app.config';
import home from './features/home';


const MODULE_NAME = 'app';

angular.module(MODULE_NAME, [uirouter, tabs, modal, home, restangular, LocalStorageModule, naifbase64, uiselect, 'ngLoadingSpinner'])
    .config(routing);
export default MODULE_NAME;