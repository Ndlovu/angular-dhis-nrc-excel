import './home.css';
import 'ui-select/dist/select.css'

import angular from 'angular';
import uirouter from 'angular-ui-router';

import routing from './home.routes';
import ModalController  from './modal.controller'
import HomeController from './home.controller';
import Data from '../../services/data.service';
import Filters from '../../services/filters.service';
import Utils from '../../services/utils.service'


export default angular.module('app.home', [uirouter, Data, Filters, Utils])
    .config(routing)
    .controller('ModalController', ModalController)
    .controller('HomeController', HomeController)
    .name;