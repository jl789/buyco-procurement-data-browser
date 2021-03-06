import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import dx from '/node_modules/devextreme/dist/js/dx.viz.js';
import bootstrapdaterangepicker from '/node_modules/bootstrap-daterangepicker/daterangepicker.js';
import daterangepicker from '/node_modules/angular-daterangepicker/index.js';
import '/node_modules/angular-chosen-localytics/dist/angular-chosen.js';
import '/node_modules/angular-chosen-localytics/chosen-spinner.css';
import '/node_modules/chosen-js/chosen.jquery.js';
// import '/node_modules/chosen-js/chosen.css';

import '/node_modules/bootstrap/dist/css/bootstrap.css';
import '/node_modules/bootstrap-daterangepicker/daterangepicker.css';

import template from './procurementDataBrowser.html';
import { name as SpendingList } from '../spendingList/spendingList';
import { name as SpendingPerTimePage } from '../spendingPerTimePage/spendingPerTimePage';
import { name as SpendingInsightPage } from '../spendingInsightPage/spendingInsightPage';
import { name as Importer } from '../importer/importer';
import { name as Navigation } from '../navigation/navigation';

class ProcurementDataBrowser {}

const name = 'procurementDataBrowser';

// create a module
export default angular.module(name, [
    angularMeteor,
    uiRouter,
    SpendingList,
    SpendingPerTimePage,
    SpendingInsightPage,
    Importer,
    Navigation,
    daterangepicker,
    'accounts.ui',
    'dx',
    'localytics.directives'
]).component(name, {
  template,
  controllerAs: name,
  controller: ProcurementDataBrowser
})
  .config(config)
  .run(run);

function config($locationProvider, $urlRouterProvider, $qProvider) {
  'ngInject';

  $locationProvider.html5Mode(true);

  $urlRouterProvider.otherwise('/spending/time');

  $qProvider.errorOnUnhandledRejections(false);
}

function run($rootScope, $state) {
  'ngInject';

  $rootScope.$on('$stateChangeError',
    (event, toState, toParams, fromState, fromParams, error) => {
      if (error === 'AUTH_REQUIRED') {
        $state.go('spending');
      }
    }
  );
}
