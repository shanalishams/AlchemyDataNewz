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
                    var marker = map.markers[0];
                    marker.setPosition(latLng);
                    infoWindow.setContent(results[1].formatted_address);
                    infoWindow.open(map, marker);

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
                    return responseData.result.docs[0].docs;
                } else if (responseData.statusCode == 400) {
                    alert("Backend API limit exceeded");
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

ProcessController.$inject = ['$scope', 'NgMap', '$DataHolderFactory', '$AlchemyApi', '$rootScope'];
function MapController($scope, NgMap, $DataHolderFactory, $AlchemyApi, $rootScope) {

    $scope.latlng = [$DataHolderFactory.lat, $DataHolderFactory.lng];
    $scope.zoom = 11;
    NgMap.getMap().then(function (evtMap) {
        map = evtMap;
    });

    $scope.processMap = function (event) {
        map = this;
        $rootScope.listLoader = 1;
        $DataHolderFactory.docs = [];
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
                    $rootScope.listLoader = 0;
                });
        });


    };

    $scope.markerDragEnd = function (event) {
        $rootScope.listLoader = 1;
        $DataHolderFactory.docs = [];
        $DataHolderFactory.lat = event.latLng.lat();
        $DataHolderFactory.lng = event.latLng.lng();
        $DataHolderFactory.geoCode($DataHolderFactory, function (results) {

            $AlchemyApi.getNews($DataHolderFactory, results)
                .then(function (data) {
                    $DataHolderFactory.docs = data;
                    $scope.docs = $DataHolderFactory;
                    $rootScope.listLoader = 0;
                });
        });

    }

}//end of MapController

ListController.$inject = ['$scope', '$AlchemyApi', '$DataHolderFactory', '$rootScope'];
function ListController($scope, $AlchemyApi, $DataHolderFactory, $rootScope) {

    $rootScope.listLoader = 1;
    $DataHolderFactory.docs = [];
    $AlchemyApi.getNews($DataHolderFactory)
        .then(function (data) {
            $DataHolderFactory.docs = data;
            $scope.docs = $DataHolderFactory;
            $rootScope.listLoader = 0;
        });
}//end of ListController

DetailController.$inject = ['$scope', '$AlchemyApi', '$routeParams'];
function DetailController($scope, $AlchemyApi, $routeParams) {
    $scope.detaiLoader = 1;
    $AlchemyApi.getNewsDetail($routeParams.id)
        .then(function (data) {
            $scope.doc = data;
            $scope.detaiLoader = 0;
        });

}//end of DetailController

ProcessController.$inject = ['$scope', '$AlchemyApi', '$DataHolderFactory', '$rootScope'];
function ProcessController($scope, $AlchemyApi, $DataHolderFactory, $rootScope) {
    $scope.detaiLoader = 1;
    $DataHolderFactory.docs = [];
    $scope.query = $DataHolderFactory;

    $scope.processQuery = function () {
        $rootScope.listLoader = 1;
        $DataHolderFactory.lat = parseFloat($scope.query.lat);
        $DataHolderFactory.lng = parseFloat($scope.query.lng);
        $DataHolderFactory.geoCode($DataHolderFactory, function (results) {

            $AlchemyApi.getNews($DataHolderFactory, results)
                .then(function (data) {
                    $DataHolderFactory.doc = data;
                    $scope.docs = $DataHolderFactory;
                    $scope.detaiLoader = 0;
                    $rootScope.listLoader = 0;
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
