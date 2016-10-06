'use strict';

angular.module('foodDelivery', [
  'ngRoute',
  'firebase',
  'foodDelivery.register',
  'foodDelivery.login',
  'foodDelivery.home',
  'foodDelivery.admin',
  'foodDelivery.recovery'

])

  .service('FirebaseService', function () {
    var ref = new Firebase('https://chi-userbase.firebaseio.com/');
    var menuTable = new Firebase('https://chi-userbase.firebaseio.com/menu');
    var userTable = new Firebase('https://chi-userbase.firebaseio.com/user_map');

    this.getMyself = function (email) {
      return new Promise(function (resolve, reject) {
        ref.child('user_map').orderByChild('email').startAt(email).endAt(email).once('value', function(snap) {
          var userObject = snap.val() || false;

          if (userObject) {
            var key = Object.keys(userObject)[0];
            resolve(userObject[key])
          } else {
            reject()
          }

        });
      });
    };

    this.getMenu = function () {
      return new Promise(function (resolve, reject) {
        menuTable.on('value', function (snapshot) {
          resolve(snapshot.val());
        });
      });
    };

    this.getUsers = function () {
      return new Promise(function (resolve, reject) {
        userTable.on('value', function (snapshot) {
          if (snapshot) {
            resolve(snapshot.val());
          } else {
            reject()
          }
        });
      });
    };

    this.createUser = function (name, lastname, email, password) {
      return new Promise(function (resolve, reject) {
        ref.createUser({
          name: name,
          lastname: lastname,
          email: email,
          password: password
        }, function (error, userData) {
          if (error) {
            reject(JSON.stringify(error));
          } else {
            resolve(userData.uid);

          }
        });
      });
    };

    this.userMapForming = function (name, lastName, email, uid, cb) {
      ref.child('user_map').push({
        name: name,
        lastName: lastName,
        email: email,
        uid: uid
      }, function () {
        cb();
      });
    };

    this.updateUserOrder = function (email, order) {
      return new Promise(function (resolve, reject) {
        ref.child('user_map').orderByChild('email').startAt(email).endAt(email).once('value', function (snap) {
          var key = Object.keys(snap.val())[0];
          ref.child('user_map').child(key).update({order: order}, function (err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        });
      });
    };

    this.clearOrders = function () {
      return new Promise(function (resolve, reject) {
        userTable.on('value', function (snapshot) {
          var userKeys = Object.keys(snapshot.val());
          userKeys.forEach(function (value, index) {
            userTable.child(value).child('order').remove(function (err) {
              if (err) {
                reject(err);
              } else {
                if (index == userKeys.length - 1) {
                  resolve();
                }
              }
            });
          });
        });
      });
    };

    this.logIn = function (email, password) {
      return new Promise(function (resolve, reject) {
        ref.authWithPassword({
          email: email,
          password: password
        }, function (error, authData) {
          if (error) {
            reject(JSON.stringify(error));
          } else {
            resolve(authData);
          }
        });
      });
    };

    this.passRecovery = function (email, old_pass, new_pass) {
      return new Promise(function (resolve, reject) {
        ref.changePassword({
          email: email,
          oldPassword: old_pass,
          newPassword: new_pass
        }, function(error) {
          if (error) {
            switch (error.code) {
              case "INVALID_PASSWORD":
               reject("The specified user account password is incorrect.");
                break;
              case "INVALID_USER":
                reject("The specified user account does not exist.");
                break;
              default:
                reject("Error changing password:", error);
            }
          } else {
            resolve("User password changed successfully!");
          }
        });
      });
    };

    this.isLogged = function () {
      var data = ref.getAuth();
      if (data) {
        return data;
      } else {
        return false;
      }
    };

    this.logOut = function () {
      ref.unauth();
    };

    this.addDishToMenu = function (day, dishName, dishPrice) {
      return new Promise(function (resolve, reject) {
        ref.child('menu').child(day).push({dish: dishName, price: dishPrice}, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      });
    };

    this.removeDishFromMenu = function (day, index) {
      return new Promise(function (resolve, reject) {
        ref.child('menu').child(day).once('value', function (snap) {
          var list = snap.val();
          var needed = Object.keys(list)[index];
          ref.child('menu').child(day).child(needed).remove(function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    }

  })

  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $routeProvider.otherwise({
      redirectTo: '/home'
    });

    $locationProvider.html5Mode(true);
  }]);


