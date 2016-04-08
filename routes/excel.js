'use strict';
const express = require('express');
const firebase = require('firebase');
const excelBuilder = require('msexcel-builder');
const router = express.Router();

const ref = new Firebase('https://chi-userbase.firebaseio.com/');

router.get('/', function (req, res) {

  let template = {
    mon: 'Понедельник',
    tue: 'Вторник',
    wed: 'Среда',
    thu: 'Четверг',
    fri: 'Пятница'
  };

  let workbook = excelBuilder.createWorkbook('/tmp', 'menu.xlsx');

  Promise.all([getMenu(), getUsers()])
    .then(
      results => {
        let menu = results[0];
        let users = results[1];
        formTable(menu, users)
      }
    )
    .catch(
      err => console.log(err)
    );

  function formTable(menu, users) {

    users = resolve.val();
    let userKeys = Object.keys(users);
    let rows = userKeys.length;
    let priceForWeek = new Array(userKeys.length);
    priceForWeek.fill(0);

    for (let key in template) {
      let menuKeys = Object.keys(menu[key]);
      let cols = menuKeys.length;
      let sheet = createSheet(template[key], cols, rows);
      let missed = 0;

      for (let i = 0; i < rows; i++) { // set Users

        if (users[userKeys[i]].hasOwnProperty('order')) {
          let userFullName = `${users[userKeys[i]].name} ${users[userKeys[i]].lastName}`;
          setData(1, i + 2 - missed, userFullName, sheet);

          let order = users[userKeys[i]].order[key].order;
          let priceForDay = users[userKeys[i]].order[key].priceForDay;

          if (order) {
            for (let j = 0; j < order.length; j++) { // set Order for each user separately
              let dishIndex = order[j].dishIndex;
              let count = order[j].count;

              setData(dishIndex + 2, i + 2 - missed, count, sheet);

              if (j === order.length - 1) {
                priceForWeek[i] = priceForWeek[i] + priceForDay;
                setData(cols + 2, i + 2 - missed, priceForDay, sheet);
              }
              if (key === 'fri') {
                setData(cols + 3, i + 2 - missed, priceForWeek[i], sheet);
              }
            }
          } else if (key === 'fri') {
            setData(cols + 3, i + 2 - missed, priceForWeek[i], sheet);
          }
        } else {
          missed++;
        }
      }

      for (let i = 0; i < cols; i++) { // set Dishes
        let dish = menu[key][menuKeys[i]].dish;
        setData(i + 2, 1, dish, sheet);

        if (i === cols - 1) {
          setData(cols + 2, 1, 'Сумма за день', sheet);
        }

        if (key === 'fri') {
          setData(cols + 3, 1, 'Сумма за неделю', sheet);
        }
      }
    }

    workbook.save(function () {
      console.log('congratulations, your workbook created');
      res.download('/tmp/menu.xlsx')
    });

  }

  function getMenu() {
    return new Promise(function (resolve, reject) {
      ref.child('menu')
        .once('value', (menu) => {
          if (menu) {
            resolve(menu.val())
          } else {
            reject('No data');
          }
        })
    })
  }

  function getUsers() {
    return new Promise(function (resolve, reject) {
      ref.child('user_map').once('value', function (users) {
        if (users) {
          resolve(users.val())
        } else {
          reject('No data');
        }
      })
    })
  }

  function createSheet(name, cols, rows) {
    return workbook.createSheet(name, cols + 3, rows + 1);
  }

  function setData(col, row, str, sheet) {
    sheet.set(col, row, str);

    if (col === 1) {
      sheet.width(col, 20);
    } else {
      sheet.width(col, 5);
    }

  }

});

module.exports = router;