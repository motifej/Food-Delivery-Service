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

        let isLogged = FirebaseService.isLogged();

        if(isLogged) {
            $scope.email = isLogged.password.email;
            $scope.isLogged = true;
        }

        FirebaseService.getMenu()
            .then(
                resolve => {
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
                resolve => {
                $scope.$apply(function () {
                    let result = [];
                    for(let key in resolve) {
                        let handledUser = {};
                        handledUser.name = resolve[key].name;
                        handledUser.lastName = resolve[key].lastName;
                        handledUser.order = resolve[key].order || false;
                        result.push(handledUser)
                    }

                    $scope.users = result;
                });
            },
            () => console.log('Internal error - no users.')
        );

        $scope.logout = function () {
            FirebaseService.logOut();
            window.location = '/';
        };


        $scope.addDish = function () {
            let tabIndex = getActiveTabIndex();
            console.log(tabIndex);
            let template = ['mon', 'tue', 'wed', 'thu', 'fri'];
            if($scope.dishName && $scope.dishPrice) {

                if(!isNumeric($scope.dishPrice)) {
                    $scope.warning = 'Введите корректную цену';
                    return;
                }

                FirebaseService.addDishToMenu(template[tabIndex] ,$scope.dishName, $scope.dishPrice)
                    .then(
                        resolve => FirebaseService.getMenu()
                    )
                    .then(
                        resolve => {
                            $scope.$apply(function () {
                                $scope.data = resolve;
                                $scope.dishName = '';
                                $scope.dishPrice ='';
                                $scope.warning = '';
                            });
                        }
                    )
                    .catch(
                      err => {
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
            let tabIndex = getActiveTabIndex();
            let template = ['mon', 'tue', 'wed', 'thu', 'fri'];
            FirebaseService.removeDishFromMenu(template[tabIndex], index)
                .then(
                    resolve => FirebaseService.getMenu()
                )
                .then(
                    resolve => {
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
                  err => {
                    console.log(err)
                  }
                );
        };

        $scope.clearUserOrders = function () {
            FirebaseService.clearOrders()
              .then(
                () => {
                    $scope.$apply(function () {
                        $scope.success = 'Заказы успешно очищены';
                        $timeout(function () {
                            $scope.success = null;
                        }, 2000);
                    })
                }
            )
            .catch(
              err => {
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
            let template = {
                mon: 'Понедельник',
                tue: 'Вторник',
                wed: 'Среда',
                thu: 'Четверг',
                fri: 'Пятница'
            };
            return template[key];
        };

        $scope.getWeeklyPrice = function (userOrder) {
            let weeklyPrice = 0;
            for(let day in userOrder) {
                weeklyPrice += userOrder[day].priceForDay;
            }
            return weeklyPrice;
        };
        
        $scope.downloadExcel = function () {
            window.location = '/excel';
        };

        function getActiveTabIndex() {
            let activeTab = document.querySelector('li.active.mount');
            let link = activeTab.firstElementChild.getAttribute("href");
            return link[link.length-1];
        }

        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

    }]);