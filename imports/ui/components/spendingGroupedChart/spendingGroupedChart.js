import angular from 'angular';
import angularMeteor from 'angular-meteor';
// import angularNvd3 from 'angular-nvd3';
import uiRouter from 'angular-ui-router';

import template from './spendingGroupedChart.html';

import { SpendingGrouped } from '../../../api/spendingGrouped';
import { ClientSpendingPerTime } from '../../../api/clientSpendingPerTime';
import { MetaDataHelper } from '../../../utils';

class SpendingGroupedChart {
    constructor($scope, $reactive) {
        'ngInject';

        $reactive(this).attach($scope);

        $scope.dataSource = [];
        $scope.organisation_names = [];

        // The subscribe triggers calls to the spendingGroup collection when any of the bound values
        // change. On initialisation, the values are empty and a call is executed anyway. This is handled
        // on the server: if groupField is empty, no data will be returned.
        $scope.subscribe('spendingGrouped', () => {
            let filterOptions = {
                organisation_name: this.getReactively("filters.organisation_name"),
                procurement_classification_1: this.getReactively("filters.procurement_classification_1"),
                sercop_service: this.getReactively("filters.sercop_service")
            };

            if(this.getReactively('filterDate')) {
               filterOptions.payment_date = {$gt: this.getReactively("filterDate").startDate.toDate(), $lt: this.getReactively("filterDate").endDate.toDate()};
            }

            if(this.getReactively('selDate')) {
               filterOptions.payment_date = {$gt: this.getReactively("selDate").startDate.toDate(), $lt: this.getReactively("selDate").endDate.toDate()};
            }

            return [
                filterOptions,
            {
                groupField: this.getReactively("groupField")
            }];
        });

        // $scope.subscribe('clientSpendingPerTime', function () {
        //     let filterOptions = {
        //         client_id: $scope.getReactively("filters.client_id"),
        //         organisation_name: this.getReactively("filters.organisation_name"),
        //         procurement_classification_1: $scope.getReactively("filters.procurement_classification_1"),
        //         sercop_service: $scope.getReactively("filters.sercop_service")
        //     };

        //     if(this.getReactively('filterDate')) {
        //        filterOptions.payment_date = {$gt: this.getReactively("filterDate").startDate.toDate(), $lt: this.getReactively("filterDate").endDate.toDate()};
        //     }

        //     return [
        //         filterOptions,
        //     {
        //         period: $scope.getReactively("filters.period")
        //     }];
        // });

        // Subscriptions are per client session, so subscriptions between multiple sessions
        // won't overlap. However we open multiple subscriptions to the `spendingGrouped` collection
        // with a different group field and filters, which leads to different results.
        // The client is supplied with the complete result set and therefore must filter these
        // results through minimongo.
        // The filter fields are largely duplicated from the call to subscribe() above. De-duplicating
        // is left as an exercise to the reader; I couldn't get it to work reactively correctly when 
        // using a single filters object.
        this.spendingGrouped = () => {
            let filters = {
                organisation_name: this.getReactively("filters.organisation_name"),
                groupField: this.getReactively("groupField")
            };

            if(filters.organisation_name) {
                $scope.organisation_names = filters.organisation_name.$in;
            }

            // The filter values can be "" when the empty item is selected. If we apply that, no rows will be shown,
            // while all rows should be shown. Hence we only add them if they have a non-empty value.
            if (this.getReactively("filters.procurement_classification_1"))
                filters.procurement_classification_1 = this.getReactively("filters.procurement_classification_1");
            if (this.getReactively("filters.sercop_service"))
                filters.sercop_service = this.getReactively("filters.sercop_service");

            let temp = this.getReactively("filters.period");
            return SpendingGrouped.find(filters);
        };

        $scope.helpers({
            isLoggedIn: function () {
                return Meteor.userId() != null;
            },
            groupDisplayName: () => {
                return MetaDataHelper.getFieldDisplayName("public_spending", this.getReactively("groupField"));
            },
            spendingGrouped: () => {
                return this.spendingGrouped();
            },
            // clientSpendingPerTime: function () {
            //     let buffer = ClientSpendingPerTime.find({});
            //     console.log('========================');
            //     console.log(buffer);
            //     console.log('========================');
            //     return buffer;
            // },
            chartData: () => {
                let publicValues = [];

                let clientDataSource = [];
                let dataSeries = [];
                // let dataSource = [];
                $scope.dataSource = [];

                dataSeries.push({
                    valueField: "publicValue",
                    name: "Public spending",
                    showInLegend: false
                });

                $scope.organisation_names.forEach((organisation_name) => {
                    dataSeries.push({
                        valueField: 'zero',
                        type: 'scatter',
                        name: organisation_name,
                        color: getColor(organisation_name),
                        showInLegend: true,
                        point: {
                            color: 'none'
                        }
                    });
                });
                
                dataSeries.push({
                    // name: 'Public spending through Demo Company',
                    name: 'Demo Company',
                    valueField: 'clientValue',
                    color: '#543996'
                });

                dataSeries.push({
                    valueField: 'zero',
                    type: 'scatter',
                    point: {
                        color: 'none'
                    },
                    showInLegend: false,
                    label: {
                        visible: true,
                        font: {
                            color: 'gray'
                        },
                        backgroundColor: "rgba(224,224,224,0.6)",
                        customizeText: function(e) {
                            return e.argumentText;
                        }
                    }
                });

                // this.spendingGrouped().forEach((clientData) => {
                //     let tempObj = {
                //         organisationAndGroup: clientData._group,
                //         clientValue: clientData.totalAmount * 0.7,
                //     };
                //     // tempObj[clientData.organisation_name + '_clientData'] = clientData.totalAmount * 0.7;
                //     dataSource.push(tempObj);
                // });

                this.spendingGrouped().forEach((spendThisGroup) => {
                    console.log(spendThisGroup._group);
                    let tempObj = {
                        organisationAndGroup: spendThisGroup.organisation_name + '-' + spendThisGroup._group,
                        publicValue: spendThisGroup.totalAmount,
                        clientValue: spendThisGroup.totalAmount * 0.7,
                        organisationName: spendThisGroup.organisation_name
                    };
                    // tempObj[spendThisGroup.organisation_name + '_totalAmount'] = spendThisGroup.totalAmount;
                    $scope.dataSource.push(tempObj);
                });

                $scope.dataSource.sort(function (a, b) {
                    return a.publicValue - b.publicValue;
                });

                if($scope.dataSource.length > 10) {
                    $scope.chartSize = {
                        height: 700
                    }
                } else {
                    $scope.chartSize = {
                        height: 500
                    }
                }

                $scope.chartOptions = {
                    dataSource: $scope.dataSource.map(function(i){
                        i.zero = 0;
                        return i;
                    }),                
                    commonSeriesSettings: {
                        argumentField: "organisationAndGroup",
                        type: "bar"
                    },
                    argumentAxis: {            
                        label: {
                            visible: false,
                            format: "largeNumber"
                        }
                    },
                    rotated: true,
                    series: dataSeries,
                    legend: {
                        verticalAlignment: "bottom",
                        horizontalAlignment: "center"
                    },
                    title: "",
                    export: {
                        enabled: true
                    },
                    tooltip: {
                        enabled: true,
                        shared: true,
                        format: {
                            type: "largeNumber",
                            precision: 1
                        },
                        customizeTooltip: function (arg) {
                            let items = arg.points[0].valueText.split("\n"),
                                color = arg.point.getColor();
                            let tempItem = '';
                            tempItem += arg.argument + ' ';
                            tempItem += items;
                            $.each(items, function(index, item) {
                                if(item.indexOf(arg.points[0].valueText) === 0) {
                                    items[index] = $("<b>")
                                                    .text(tempItem)
                                                    .css("color", color)
                                                    .prop("outerHTML");
                                }
                            });
                            return { text: items.join("\n") };
                        }
                    },
                    valueAxis: [{
                        label: {
                            format: "largeNumber"
                        }
                    }],
                    size: $scope.chartSize,
                    customizePoint: function() {
                        if (this.series.name == "Public spending") {
                            let sourcePoint = $scope.dataSource[this.index];
                            return {
                                color: getColor(sourcePoint.organisationName)
                            };
                        }
                    }
                };
                return dataSeries;
            },
            filterPeriodName: () => {
                return this.getReactively("filterName");
            }
        });

        let stringToColour = function(str) {
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            var colour = '#';
            for (var i = 0; i < 3; i++) {
                var value = (hash >> (i * 8)) & 0xFF;
                colour += ('00' + value.toString(16)).substr(-2);
            }
            return colour;
        }
        /**
         * Return the color for an organisation series
         */
        let getColor = (organisationName) => {
            return stringToColour(organisationName);
        };
    }
}

const name = 'spendingGrouped';

// create a module
export default angular.module(name, [
    angularMeteor,
    uiRouter
]).component(name, {
    template,
    controllerAs: name,
    bindings: {
        // Filters should contain field names to match as equal.
        filters: '<',
        // The field to group by. Valid values: procurement_classification_1, supplier_name, sercop_service.
        groupField: '<',
        filterDate: '<',
        selDate: '<',
        filterName: '<'
    },
    controller: SpendingGroupedChart
});