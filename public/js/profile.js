'use strict';

const profileBut = $('#leftHeaderButton'),
  logoutBut = $('#rightHeaderButton');

logoutBut.on('click', () => {
  window.location.href = '/logout'
});

profileBut.on('click', () => {
  window.location.href = '/profile'
});
