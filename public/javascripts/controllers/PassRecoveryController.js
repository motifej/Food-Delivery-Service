'use strict';

angular.module('foodDelivery.recovery', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/pass-recovery', {
        templateUrl: 'templates/pass-recovery.html',
        controller: 'PassRecoveryController'
      });
  }])

  .controller('PassRecoveryController', ['$scope' ,'FirebaseService', '$location', function($scope, FirebaseService, $location) {

    $scope.passRecovery = function (email, old_password, new_password) {
      if(email && old_password && new_password) {

        FirebaseService.passRecovery(email, old_password, new_password)
          .then(
            resolve => {
              $scope.$apply(function() {
                if(resolve.uid === '680b08ac-d1a4-4f75-a830-0678619d0445') {
                  $location.path('/admin');
                } else {
                  $location.path('/');
                }
              });
            }
          )
          .catch(
            err => {
              $scope.$apply(function() {
                $scope.result = err;
              });
            }
          )
      }
    };

  }]);