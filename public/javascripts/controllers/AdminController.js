'use strict';

angular.module('foodDelivery.admin', ['ngRoute'])

    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/admin', {
                templateUrl: 'templates/admin.html',
                controller: 'AdminController'
            });
        $locationProvider.html5Mode(true);
    }])

    .controller('AdminController', ['$scope', 'FirebaseService', '$timeout', '$filter', function ($scope, FirebaseService, $timeout, $filter) {

        $scope.dishName = null;
        $scope.dishPrice = null;
        $scope.warning = null;
        $scope.success = null;
        $scope.fail = null;
        $scope.isLogged = false;

        var isLogged = FirebaseService.isLogged();

        if(isLogged) {
            $scope.email = isLogged.password.email;
            $scope.isLogged = true;
        }

        FirebaseService.getMenu()
            .then(
                function(resolve) {
                    $scope.$apply(function () {
                        if(isLogged) {
                            $scope.email = isLogged.password.email;
                            $scope.isLogged = true;
                        }
                        $scope.data = resolve;
                    });
                }
        );

        FirebaseService.getUsers()
            .then(
                function(resolve) {
                    $scope.$apply(function () {
                        var result = [];
                        for(var key in resolve) {
                            var handledUser = {};
                            handledUser.name = resolve[key].name;
                            handledUser.lastName = resolve[key].lastName;
                            handledUser.order = resolve[key].order || false;
                            result.push(handledUser)
                        }

                        $scope.users = result;
                    });
            },
            function() { console.log('Internal error - no users.') }
        );

        $scope.logout = function () {
            FirebaseService.logOut();
            window.location = '/';
        };


        $scope.addDish = function () {
            var tabIndex = getActiveTabIndex();
            console.log(tabIndex);
            var template = ['mon', 'tue', 'wed', 'thu', 'fri'];
            if($scope.dishName && $scope.dishPrice) {

                if(!isNumeric($scope.dishPrice)) {
                    $scope.warning = 'Введите корректную цену';
                    return;
                }

                FirebaseService.addDishToMenu(template[tabIndex] ,$scope.dishName, $scope.dishPrice)
                    .then(
                        function(resolve){ FirebaseService.getMenu()}
                    )
                    .then(
                        function(resolve) {
                            $scope.$apply(function () {
                                $scope.data = resolve;
                                $scope.dishName = '';
                                $scope.dishPrice ='';
                                $scope.warning = '';
                            });
                        }
                    )
                    .catch(
                      function(err) {
                          console.log(err)
                      }
                    );
            } else {
                if(!$scope.dishName) {
                    $scope.warning = 'Введите название блюда';
                } else {
                    $scope.warning = 'Введите цену';
                }
            }
        };

        $scope.removeDish = function(index) {
            var tabIndex = getActiveTabIndex();
            var template = ['mon', 'tue', 'wed', 'thu', 'fri'];
            FirebaseService.removeDishFromMenu(template[tabIndex], index)
                .then(
                    function(resolve){ FirebaseService.getMenu()}
                )
                .then(
                    function(resolve) {
                        $scope.$apply(function () {
                            if(isLogged) {
                                $scope.email = isLogged.password.email;
                                $scope.isLogged = true;
                            }
                            $scope.data = resolve;
                        });
                    }
                )
                .catch(
                  function(err) {
                    console.log(err)
                  }
                );
        };

        $scope.clearUserOrders = function () {
            FirebaseService.clearOrders()
              .then(
                function () {
                    $scope.$apply(function () {
                        $scope.success = 'Заказы успешно очищены';
                        $timeout(function () {
                            $scope.success = null;
                        }, 2000);
                    })
                }
            )
            .catch(
              function(err) {
                $scope.$apply(function () {
                  $scope.fail = err;
                  $timeout(function () {
                    $scope.fail = null;
                  }, 2000);
                })
              }
            );
        };

        $scope.getDishName = function (key, index) {
            return $scope.data[key][Object.keys($scope.data[key])[index]];
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

        $scope.getWeeklyPrice = function (userOrder) {
            var weeklyPrice = 0;
            for(var day in userOrder) {
                weeklyPrice += userOrder[day].priceForDay;
            }
            return weeklyPrice;
        };
        
        $scope.downloadExcel = function () {
            window.location = '/excel';
        };

        function getActiveTabIndex() {
            var activeTab = document.querySelector('li.active.mount');
            var link = activeTab.firstElementChild.getAttribute("href");
            return link[link.length-1];
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

    }]);