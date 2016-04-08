'use strict';

angular.module('foodDelivery.register', ['ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/register', {
        templateUrl: 'templates/register.html',
        controller: 'RegisterController'
      });
  }])

  .controller('RegisterController', ['$scope', 'FirebaseService', function ($scope, FirebaseService) {

    $scope.result = null;

    $scope.register = function (name, lastname, email, password) {
      if (name && lastname && email && password) {

        FirebaseService.createUser(name, lastname, email, password)
          .then(
            uid => {
              return new Promise(function (resolve, reject) {
                FirebaseService.userMapForming(name, lastname, email, uid, function () {
                  resolve()
                })
              });
            }
          )
          .then(resolve => window.location = '/')
          .catch(
            err => {
              $scope.$apply(function () {
                $scope.result = err;
              });
            }
          );
      }
    };

  }]);