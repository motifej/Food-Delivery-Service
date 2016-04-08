'use strict';

angular.module('foodDelivery.login', ['ngRoute'])

	.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'templates/login.html',
				controller: 'LogInController'
			});
	}])

	.controller('LogInController', ['$scope' ,'FirebaseService', '$location', function($scope, FirebaseService, $location) {

		$scope.login = function (email, password) {
			if(email && password) {
				FirebaseService.logIn(email, password)
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
					);
			}
		};

	}]);