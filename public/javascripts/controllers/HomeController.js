'use strict';

angular.module('foodDelivery.home', ['ngRoute'])

    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'templates/home.html',
                controller: 'HomeController'
            });
        $locationProvider.html5Mode(true);
    }])

    .controller('HomeController', ['$scope', 'FirebaseService', '$timeout', '$location', function ($scope, FirebaseService, $timeout, $location) {

        $scope.totalCost = 0;
        $scope.count =  0;
        $scope.data = null;
        $scope.email = null;
        $scope.success = null;
        $scope.fail = null;
        $scope.isLogged = false;
        $scope.dataAboutMe = null;


        var isLogged = FirebaseService.isLogged();

        if(isLogged.uid === '680b08ac-d1a4-4f75-a830-0678619d0445') {
            $location.path('/admin');
            return;
        }

        if(isLogged) {
            $scope.email = isLogged.password.email;
            $scope.isLogged = true;
        }

        FirebaseService.getMenu()
            .then(
                function(resolve) {
                    $scope.$apply(function () {
                        $scope.data = resolve;
                    });
                }
        );

        $scope.logout = function () {
            FirebaseService.logOut();
            window.location = '/';
        };


        var orderStorage = [[],[],[],[],[]];
        $scope.models = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        $scope.totalCostUpdate = function (value, index, tab) {

            var total = 0;
            orderStorage[tab][index] = value;

            $scope.models[tab] = orderStorage[tab].reduce(function(previousValue, currentValue, currentIndex, array) {
                return (previousValue || 0) + (currentValue || 0);
            });

            for(var i = 0; i < orderStorage.length; i++) {
                for(var j = 0; j < orderStorage[i].length; j++) {
                    if(orderStorage[i][j]) total += orderStorage[i][j];
                }
                total += addBoxesToCost(orderStorage[i]);
            }

            $scope.totalCost = total;
        };

        $scope.sendSelected = function () {

            var prepareArray = [$scope.data.mon, $scope.data.tue, $scope.data.wed, $scope.data.thu, $scope.data.fri];
            var emptyOrder = true;

            var result = {
                mon: {priceForDay: +$scope.models[0] + addBoxesToCost(orderStorage[0]), order: []},
                tue: {priceForDay: +$scope.models[1] + addBoxesToCost(orderStorage[1]), order: []},
                wed: {priceForDay: +$scope.models[2] + addBoxesToCost(orderStorage[2]), order: []},
                thu: {priceForDay: +$scope.models[3] + addBoxesToCost(orderStorage[3]), order: []},
                fri: {priceForDay: +$scope.models[4] + addBoxesToCost(orderStorage[4]), order: []}
            };
            var keys = Object.keys(result);

            for(var i = 0; i < orderStorage.length; i++) {
                for(var j = 0; j < orderStorage[i].length; j++) {
                    if(orderStorage[i][j]) {
                        emptyOrder = false;
                        var localKeys = Object.keys(prepareArray[i]);
                        var orderUnit = prepareArray[i][localKeys[j]];
                        result[keys[i]].order.push({dishIndex: j, count: orderStorage[i][j]/orderUnit.price});
                    }
                }
            }

            if(!emptyOrder) {
                FirebaseService.updateUserOrder($scope.email, result).then(
                        function () {
                            $scope.$apply(function () {
                                $scope.success = 'Ваш заказ успешно доставлен';
                                $timeout(function () {
                                    $scope.success = null;
                                }, 2000);
                            })
                        },
                        function (reject) {
                            $scope.$apply(function () {
                                $scope.fail = reject;
                                $timeout(function () {
                                    $scope.fail = null;
                                }, 2000);
                            })
                        }
                );
            } else {
                $scope.fail = 'Заказ не может быть пустым';
                $timeout(function () {
                    $scope.fail = '';
                }, 2000);
            }
        };

      $scope.getRussianName = function (key) {
        var template = {
          mon: 'Понедельник',
          tue: 'Вторник',
          wed: 'Среда',
          thu: 'Четверг',
          fri: 'Пятница'
        };
        return template[key];
      };

      FirebaseService.getMyself($scope.email)
        .then(
          function(resolve) {
            $scope.$apply(function () {
              $scope.dataAboutMe = resolve;
            })
          },
          function(reject){ console.log('Can not load my menu')}
        );

        $scope.getDishName = function (key, index) {
          return $scope.data[key][Object.keys($scope.data[key])[index]];
        };

        function addBoxesToCost(array) {
          return array.filter(function (item) {
            return !!item;
          }).length;
        }
        
    }]);