'use strict';
angular.module('AlchemyData', ['ngMap', 'ngRoute']);

var map;
var infoWindow = null;

function DataHolderFactory() {

    return {
        docs: null,
        lat: 33.7294,
        lng: 73.0931,
        geoCode: geoCode
    };

    function geoCode(latLng, callback) {

        var result = null;
        var geoCoder = new google.maps.Geocoder;

        geoCoder.geocode({'location': latLng}, function (results, status) {
            if (status === 'OK') {
                if (results[1]) {

                    if (infoWindow == null) {
                        infoWindow = new google.maps.InfoWindow;
                    }
                    infoWindow.setContent(results[1].formatted_address);
                    infoWindow.open(map, map.markers[0]);

                    callback(results);

                } else {
                    console.log('No results found');
                    result = 'No results found';
                }//end of if-else
            } else {
                console.error('GeoCoder failed due to: ' + status);
                result = 'GeoCoder failed due to: ' + status;
            }//end of if-else
        });
    }
}

AlchemyApiFactory.$inject = ['$http'];
function AlchemyApiFactory($http) {
    return {
        getNews: getNews,
        getNewsDetail: getNewsDetail
    };

    function getNews(dataHolderFactory, result) {
        return $http
            .get('/api/alchemydata/news/', {
                params: {
                    lat: dataHolderFactory.lat,
                    lng: dataHolderFactory.lng,
                    result: JSON.stringify(result)
                }
            })
            .then(function (response) {
                var responseData = response.data;
                if (responseData.status == 'OK') {
                    return responseData.result;
                } else {
                    console.error(responseData);
                    return null;
                }
            }, function (response) {
                //Second error handler
                return "Something went wrong";
            });
    }

    function getNewsDetail(id) {
        return $http
            .get('/api/alchemydata/news/' + id)
            .then(function (response) {
                var responseData = response.data;
                if (responseData.status == 'OK') {
                    return responseData.result;
                } else {
                    console.error(responseData);
                    return null;
                }
            }, function (response) {
                //Second error handler
                return "Something went wrong";
            });
    }
}//end of AlchemyApiFactory

function MainController($scope) {

}//end of MainController

ProcessController.$inject = ['$scope', 'NgMap', '$DataHolderFactory', '$AlchemyApi'];
function MapController($scope, NgMap, $DataHolderFactory, $AlchemyApi) {

    $scope.latlng = [$DataHolderFactory.lat, $DataHolderFactory.lng];
    $scope.zoom = 11;
    NgMap.getMap().then(function (evtMap) {
        map = evtMap;
    });

    $scope.processMap = function (event) {
        map = this;
        var markers = map.markers;
        var marker = markers[0];
        $DataHolderFactory.lat = event.latLng.lat();
        $DataHolderFactory.lng = event.latLng.lng();
        marker.setPosition($DataHolderFactory);
        $DataHolderFactory.geoCode($DataHolderFactory, function (results) {

            $AlchemyApi.getNews($DataHolderFactory, results)
                .then(function (data) {
                    $DataHolderFactory.docs = data;
                    $scope.docs = $DataHolderFactory;
                });
        });


    };

    $scope.markerDragEnd = function (event) {
        $DataHolderFactory.lat = event.latLng.lat();
        $DataHolderFactory.lng = event.latLng.lng();
        $DataHolderFactory.geoCode($DataHolderFactory, function (results) {

            $AlchemyApi.getNews($DataHolderFactory, results)
                .then(function (data) {
                    $DataHolderFactory.docs = data;
                    $scope.docs = $DataHolderFactory;
                });
        });

    }

}//end of MapController

ListController.$inject = ['$scope', '$AlchemyApi', '$DataHolderFactory'];
function ListController($scope, $AlchemyApi, $DataHolderFactory) {

    $AlchemyApi.getNews($DataHolderFactory)
        .then(function (data) {
            $DataHolderFactory.docs = data;
            $scope.docs = $DataHolderFactory;
        });
}//end of ListController

DetailController.$inject = ['$scope', '$AlchemyApi', '$routeParams'];
function DetailController($scope, $AlchemyApi, $routeParams) {
    $scope.hello = 'Hello world!';

    $AlchemyApi.getNewsDetail($routeParams.id)
        .then(function (data) {
            $scope.doc = data;
        });

}//end of DetailController

ProcessController.$inject = ['$scope', '$AlchemyApi', '$DataHolderFactory'];
function ProcessController($scope, $AlchemyApi, $DataHolderFactory) {

    $scope.query = $DataHolderFactory;

    $scope.processQuery = function () {

        $DataHolderFactory = $scope.query;
        $DataHolderFactory.geoCode($DataHolderFactory, function (results) {

            $AlchemyApi.getNews($DataHolderFactory, results)
                .then(function (data) {
                    $DataHolderFactory = data;
                    $scope.docs = $DataHolderFactory;
                });
        });


    };

}//end of ProcessController

angular.module('AlchemyData').factory('$DataHolderFactory', DataHolderFactory);
angular.module('AlchemyData').factory('$AlchemyApi', AlchemyApiFactory);
angular.module('AlchemyData').controller('MainController', MainController);
angular.module('AlchemyData').controller('MapController', MapController);
angular.module('AlchemyData').controller('ProcessController', ProcessController);
angular.module('AlchemyData').controller('ListController', ListController);
angular.module('AlchemyData').controller('DetailController', DetailController);
