import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import utilsPagination from 'angular-utils-pagination';

import { Counts } from 'meteor/tmeasday:publish-counts';

import { SpendingPerTime } from '../../../api/spendingPerTime';
import { ClientSpendingPerTime } from '../../../api/clientSpendingPerTime';
import { SpendingOrganisations } from '../../../api/spendingOrganisations';
import { SpendingServices } from '../../../api/spendingServices';
import { SpendingCategories } from '../../../api/spendingCategories';

import { name as SpendingGroupedChart } from '../spendingGroupedChart/spendingGroupedChart';
import { name as SpendingPerformance } from '../spendingPerformance/spendingPerformance';

import template from './spendingPerTimePage.html';

class SpendingPerTimePage {
    constructor($scope, $reactive) {
        'ngInject';

        $reactive(this).attach($scope);

        var that = this;
        $scope.dataSource = [];
        $scope.date = {startDate: null, endDate: null};
        $scope.helpers({
            isLoggedIn: function () {
                return Meteor.userId() != null;
            },
            spendingPerTime: function () {
                return SpendingPerTime.find({});
            },
            clientSpendingPerTime: function () {
                return ClientSpendingPerTime.find({});
            },
            mergedSpendingPerTime: function () {
                // Prepare a joined collection with the percentage of client trade.
                // TODO: this is business logic, move it to an API function.
                var ps = SpendingPerTime.find({});
                var cs = ClientSpendingPerTime.find({});

                var merged = [];
                ps.forEach((spendThisPeriod) => {
                    let mergedItem = spendThisPeriod;
                    merged.push(mergedItem);

                    cs.forEach((clientSpendThisPeriod) => {
                        if (clientSpendThisPeriod._group.year == spendThisPeriod._group.year
                            && clientSpendThisPeriod._group[$scope.period] == spendThisPeriod._group[$scope.period]) {

                            mergedItem.client_amount_net = clientSpendThisPeriod.totalAmount;
                            mergedItem.client_amount_net_percent = clientSpendThisPeriod.totalAmount / spendThisPeriod.totalAmount * 100;
                        }
                    });

                });

                return merged;
            },
            spendingOrganisations: function () {
                return SpendingOrganisations.find({});
            },
            spendingServices: function () {
                return SpendingServices.find({
                    organisation_name: $scope.getReactively("selectedOrganisation"),
                });
            },
            spendingCategories: function () {
                return SpendingCategories.find({
                    organisation_name: $scope.getReactively("selectedOrganisation"),
                });
            },
            chartData: function () {
                var spendingPerTime = SpendingPerTime.find({}, {
                });

                var clientSpendingPerTime = ClientSpendingPerTime.find({}, {
                });

                var publicValues = [];
                // var clientValues = [];

                let i = 0;
                let sourceValues = [];
                spendingPerTime.forEach((spendThisPeriod) => {
                    let xLabel;
                    if ($scope.period == "quarter")
                        // "2016 Q2"
                        xLabel = spendThisPeriod._group.year + " Q" + spendThisPeriod._group.quarter;
                    else
                        // E.g. "2016-05" for May 2016
                        xLabel = spendThisPeriod._group.year + "-" + ("00" + spendThisPeriod._group.month).slice(-2);
                    let yVal = spendThisPeriod.totalAmount;
                    publicValues.push({ x: i, label: xLabel, y: yVal, source: spendThisPeriod });
                    sourceValues.push({ xAxis: xLabel, yAxis: yVal });

                    // Find corresponding item in client spending
                    // clientSpendingPerTime.forEach((clientSpendThisPeriod) => {
                    //     if (clientSpendThisPeriod._group.year == spendThisPeriod._group.year
                    //         && clientSpendThisPeriod._group[$scope.period] == spendThisPeriod._group[$scope.period]) {
                    //         clientValues.push({ x: i, label: xLabel, y: clientSpendThisPeriod.totalAmount, source: clientSpendThisPeriod });
                    //     }
                    // });

                    i++;
                });

                $scope.publicSpendingData = {
                    key: $scope.selectedOrganisation,
                    color: '#404040',
                    values: publicValues
                };

                $scope.$broadcast('chartRefresh', $scope.publicSpendingData);

                // let dataSeries = [$scope.publicSpendingData];

                // if (Meteor.userId()) {
                //     dataSeries.push(
                //         {
                //             key: 'YPO',
                //             color: '#543996',
                //             values: clientValues
                //         });
                // }

                const options =  
                {
                    dataSource: sourceValues,
                    series: {
                        argumentField: "xAxis",
                        valueField: "yAxis",
                        name: "Wakefield MDC",
                        type: "bar",
                        color: '#ffaa66'
                    },
                    valueAxis: [{
                        label: {
                            format: "largeNumber"
                        }
                    }],
                    legend: {
                        verticalAlignment: "bottom",
                        horizontalAlignment: "center"
                    }
                };

                return options;
            },
            /**
             * Filter fields to pass to the sub charts. This variable is bound by the sub chart
             * component in the template.
             */
            subChartFilters: () => {
                return {
                    organisation_name: $scope.getReactively("selectedOrganisation"),
                    procurement_classification_1: $scope.getReactively("category"),
                    sercop_service: $scope.getReactively("service")
                };
            }
        });

        // UX defaults on component open

        // Show details and drilldown by default. If we start them as collapsed, nvd3 initialises their
        // charts only several pixels wide and doesn't correct when uncollapsed.
        $scope.detailsVisible = true;
        $scope.drillDownVisible = true;
        $scope.performanceIndicatorsVisible = true;
        $scope.period = "quarter";

        // TODO: remove this hardcoded default option, just use the first item in the list
        $scope.selectedOrganisation = "Wakefield MDC";

        $scope.subscribe('spendingOrganisations');
        $scope.subscribe('spendingServices', function () {
            return [{
                organisation_name: $scope.getReactively("selectedOrganisation"),
            }];
        });
        $scope.subscribe('spendingCategories', function () {
            return [{
                organisation_name: $scope.getReactively("selectedOrganisation"),
            }];
        });

        $scope.subscribe('spendingPerTime', function () {
            return [{
                organisation_name: $scope.getReactively("selectedOrganisation"),
                procurement_classification_1: $scope.getReactively("category"),
                sercop_service: $scope.getReactively("service")
            },
            {
                period: $scope.getReactively("period")
            }];
        });

        $scope.subscribe('clientSpendingPerTime', function () {
            return [{
                client_id: "ypo.co.uk",
                organisation_name: $scope.getReactively("selectedOrganisation"),
                procurement_classification_1: $scope.getReactively("category"),
                sercop_service: $scope.getReactively("service")
            },
            {
                period: $scope.getReactively("period")
            }];
        });
    }
}

const name = 'spendingPerTimePage';

// create a module
export default angular.module(name, [
    angularMeteor,
    uiRouter,
    utilsPagination,
    SpendingGroupedChart,
    SpendingPerformance
]).component(name, {
    template,
    controllerAs: name,
    controller: SpendingPerTimePage
})
    .config(config);

function config($stateProvider) {
    'ngInject';
    $stateProvider
        .state('spending-per-time', {
            url: '/spending/time',
            template: '<spending-per-time-page></spending-per-time-page>'
        });
}
