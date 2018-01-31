'use strict';

const logBut = $('#leftHeaderButton'),
  logMod = $('#loginModal'),
  logSub = $('#loginSubmit'),
  sigBut = $('#rightHeaderButton'),
  sigMod = $('#signupModal'),
  sigSub = $('#signupSubmit'),
  ackMod = $('#ackModal'),
  pwdMod = $('#pwdModal'),
  pwdSub = $('#pwdSubmit'),
  sigInputHandlers = [],
  logInputs = $('#loginModal input');

let openedModal = null;

logBut.on('click', authPress.bind(logMod));
logMod.on('hide.bs.modal', () => {
  logBut.removeClass('pressed');
});

sigBut.on('click', authPress.bind(sigMod));
sigMod.on('hide.bs.modal', () => {
  sigBut.removeClass('pressed');
});

modalRefSwitcher(logMod, sigMod, '.signup-anchor');
modalRefSwitcher(sigMod, logMod, '.login-anchor');
modalRefSwitcher(logMod, pwdMod, '.reset-password-anchor');
modalRefSwitcher(pwdMod, logMod, '.login-anchor');

// have to use bootstrap 'handleUpdate' in case modal height changes while it's open
logMod.on('transitionend', updatePosition.bind(logMod));
sigMod.on('transitionend', updatePosition.bind(sigMod));
pwdMod.on('transitionend', updatePosition.bind(pwdMod));

openedModalSetter(logMod);
openedModalSetter(sigMod);
openedModalSetter(pwdMod);

sigMod.on('show.bs.modal', startHandleInput);
sigMod.on('hide.bs.modal', endHandleInput);

logMod.on('hide.bs.modal', defaultLogin);

pwdMod.on('hide.bs.modal', defaultPwd);

logSub.on('click', loginRequest);
sigSub.on('click', signupValidate);
pwdSub.on('click', pwdRequest);

$('#pwdForm').on('submit', (e) => {
  e.preventDefault();
});

class InputGroupHandler {
  constructor(input, addon, alert, ...checks) {
    this.inputField = input;
    this.addonField = addon;
    this.alertField = alert;
    this.checks = checks;
    this.errorCB = null;
    this.successCB = null;
    this.interval = null;

    input.on('input', this.startObserve.bind(this));
    input.on('blur', this.endObserve.bind(this));
  }

  startObserve() {
    if (this.interval) return;

    this.inputField.removeClass('invalid-submit');
    this.interval = setInterval(() => {
      this.checkInput();
    }, 100);
  }

  endObserve() {
    if (!this.interval) return;

    clearInterval(this.interval);
    this.interval = null;

    this.checkInput();
  }

  checkInput() {
    let checks = this.checks,
      i = checks.length;

    while (i--) {
      let alertMsg = checks[i](this.inputField.val());
      if (alertMsg) {
        this.error(alertMsg);
        return false;
      }
      if (!i) {
        this.success();
        return true;
      }
    }
  }

  error(msg) {
    let addon = this.addonField,
      alert = this.alertField,
      contents = alert.contents(),
      txtNode = contents[contents.length - 1];

    if (txtNode.nodeValue !== ' ' + msg)
      txtNode.nodeValue = ' ' + msg;

    alert.removeClass('input-alert-hidden');
    addon.removeClass('valid');
    addon.addClass('invalid');

    if (this.errorCB)
      this.errorCB(msg);
  }

  success() {
    let addon = this.addonField,
      alert = this.alertField;

    alert.addClass('input-alert-hidden');
    addon.addClass('valid');
    addon.removeClass('invalid');

    if (this.successCB)
      this.successCB();
  }

  destroy() {
    let input = this.inputField,
      addon = this.addonField,
      alert = this.alertField;

    input.off('input');       // possibility to off some listeners defined out of the class
    input.off('blur');        // possibility to off some listeners defined out of the class
    alert.addClass('input-alert-hidden');
    addon.removeClass('valid');
    addon.removeClass('invalid');
  }
}

function authPress(e) {
  let targ = e.currentTarget;
  if (!targ.classList.contains('pressed')) {
    targ.classList.add('pressed');
    this.modal({ backdrop: 'static'});
  }
}

function updatePosition(e) {
  if (!e.target.classList.contains('input-alert')) return;

  this.modal('handleUpdate');
}

function startHandleInput() {
  sigInputHandlers.push(...[
    new InputGroupHandler(
      sigMod.find('[name="username"]'),
      sigMod.find('.input-group-username .input-group-addon'),
      sigMod.find('.input-group-username ~ .input-alert'),
      (username) => {
        if (username.length > 24)
          return 'Username must be equal or less than 24 characters';
      },
      (username) => {
        if (username.length < 3)
          return 'Username must be at least 3 characters';
      },
      (username) => {
        if (username.search(/^[a-z0-9_]+$/i) === -1
          && username !== '')
          return 'Username must consist only of A-Z, a-z, 0-9 and _';
      }
    ),
    new InputGroupHandler(
      sigMod.find('[name="email"]'),
      sigMod.find('.input-group-email .input-group-addon'),
      sigMod.find('.input-group-email ~ .input-alert'),
      (email) => {
        if (email.search(
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ) === -1)
          return 'Enter a valid e-mail address';
      }
    ),
    new InputGroupHandler(
      sigMod.find('[name="password"]'),
      sigMod.find('.input-group-password .input-group-addon'),
      sigMod.find('.input-group-password ~ .input-alert'),
      (password) => {
        if (password.search(/[A-Z]+/) === -1
          || password.search(/[a-z]+/) === -1
          || password.search(/[0-9]+/) === -1)
          return 'For each of A-Z, a-z, 0-9 at least one character must be presented';
      },
      (password) => {
        if (password.length > 24)
          return 'Password must be equal or less than 24 characters';
      },
      (password) => {
        if (password.length < 6)
          return 'Password must be at least 6 characters';
      },
      (password) => {
        if (password.search(/^[A-Za-z0-9_-]+$/) === -1
          && password !== '')
          return 'Password must consist only of A-Z, a-z, 0-9, _ and -';
      }
    ),
    new InputGroupHandler(
      sigMod.find('[name="confpass"]'),
      sigMod.find('.input-group-confpass .input-group-addon'),
      sigMod.find('.input-group-confpass ~ .input-alert'),
      (confpass) => {
        if (confpass !== sigMod.find('[name="password"]').val())
          return 'Entered password does not match';
      }
    )
  ]);

  extendUsername();
  extendPassword();
}

function extendUsername() {
  let username = sigInputHandlers[0],
    input = username.inputField,
    addon = username.addonField,
    alert = username.alertField;

  username.checked = false;        // indicates whether a uniqueness check was passed

  username.checks.unshift(() => {
    if (username.checked) return;

    addon.addClass('warning');
    alert.addClass('warning');

    return 'Click on user icon to check if the username is unique';
  });

  username.errorCB = (msg) => {
    if (msg !== 'Click on user icon to check if the username is unique') {
      addon.removeClass('warning');
      alert.removeClass('warning');
    }
  };

  let contents = alert.contents(),
    txtNode = contents[contents.length - 1];

  addon.on('click', () => {
    if (txtNode.nodeValue !== ' Click on user icon to check if the username is unique')
      return;

    txtNode.nodeValue = ' Checking uniqueness...';
    reqUniqueness();
  });

  function reqUniqueness() {
    let actual = true;        // whether the input was not changed or submitted during request-response cycle

    input.one('input', expired);        // .destroy() will unbind this listener if necessary
    sigSub.one('click', expired);
    sigMod.one('hide.bs.modal', expired);

    $.ajax('/signup/unique', {
      data: input.serialize(),
      method: 'GET',
      complete: () => {
        sigSub.off('click', expired);
        sigMod.off('hide.bs.modal', expired);
      },
      statusCode: {
        200: () => {
          if (!actual) return;

          username.checked = true;
          addon.removeClass('warning');
          alert.removeClass('warning');
          username.success();        // used to apply 'valid' style
        },
        400: () => {
          if (!actual) return;

          txtNode.nodeValue = ' The username has already been used';
          addon.removeClass('warning');
          alert.removeClass('warning');
        },
        500: status500
      }
    });

    function expired() {
      actual = false;
      username.checked = false;

      sigSub.off('click', expired);       // in case modal window will be closed until response has come
    }
  }
}

function extendPassword() {
  let password = sigInputHandlers[2],
    confpass = sigInputHandlers[3],
    cInput = confpass.inputField,
    cAddon = confpass.addonField,
    cAlert = confpass.alertField,
    hasEvent = false;

  password.submitEvent = false;       // used in signupSubmit
  confpass.allowed = false;       // true if entered password is valid

  password.successCB = () =>
    confpass.allowed = true;

  password.errorCB = () =>
    confpass.allowed = false;

  confpass.checks.push(() => {
    if (confpass.allowed) return;
    return 'Type a valid password first';
  });

  confpass.errorCB = () => {
    if (confpass.allowed) return;
    cAddon.removeClass('invalid');
  };

  cInput.on('input', () => {       // .destroy() will delete this listener
    if (!confpass.allowed)
      cInput.val('');
  });

  cInput.on('blur', () => {       // .destroy() will delete these listeners
    if (hasEvent) return;

    hasEvent = true;
    password.inputField.one('input', () => {
      hasEvent = false;
      cInput.val('');
      cAddon.removeClass('valid');
      cAddon.removeClass('invalid');
      cAlert.addClass('input-alert-hidden');
    })
  })
}

function signupValidate() {
  let signupForm = $('#signupForm'),
    signupValid = true,
    sih = sigInputHandlers,
    i = sih.length;

  if (sigSub.hasClass('pressed'))
    return;

  while (i--) {
    let input = sih[i].inputField,
      addon = sih[i].addonField,
      alert = sih[i].alertField;

    if (sih[i].alertField.hasClass('warning'))
      continue;

    if (input.hasClass('invalid-submit')) {
      signupValid = false;
      continue;
    }

    if (sih[i].allowed === false) {       // for confpass
      let contents = sih[i].alertField.contents(),
        txtNode = contents[contents.length - 1];

      txtNode.nodeValue = ' Enter a valid password to allow confirmation';
      input.addClass('invalid-submit');
      addon.addClass('invalid');
      alert.removeClass('input-alert-hidden');
      signupValid = false;
      continue;
    }

    if (sih[i].checkInput())
      continue;

    input.addClass('invalid-submit');
    signupValid = false;
  }

  if (!sih[2].submitEvent) {
    sih[2].submitEvent = true;
    sih[2].inputField.one('input', () => {
      sih[2].submitEvent = false;
      sih[3].inputField.removeClass('invalid-submit');
      sih[3].addonField.removeClass('invalid');
      sih[3].alertField.addClass('input-alert-hidden');
    });
  }

  if (!signupValid) return;

  signupSubmit();
}

function signupSubmit() {
  let signupForm = $('#signupForm'),
    actual = true;        // whether the modal was not closed during the request-response cycle

  sigMod.one('hide.bs.modal', expired);

  $.ajax('/signup', {
    data: signupForm.serialize(),
    method: 'POST',
    complete: () => {
      if (actual)
        sigMod.off('hide.bs.modal', expired);

      sigInputHandlers.forEach((sih) => {
        let input = sih.inputField;

        input.prop('disabled', false);
      });

      sigSub.removeClass('pressed');
    },
    statusCode: {
      201: () => {        // 201: resource created
        // swap (if exists) current modal to success modal
        // if no modals are opened just establish success message modal
        if (openedModal) {
          let opMod = openedModal;

          if (openedModal.hasClass('show')) {
            openedModal.removeClass('fade');
            ackMod.removeClass('fade');

            openedModal.one('hidden.bs.modal', () => {
              ackMod.modal({backdrop: 'static'});
            });

            ackMod.one('shown.bs.modal', () => {
              opMod.addClass('fade');
              ackMod.addClass('fade');
              $('div.modal-backdrop').addClass('fade');       // non-documented: use to prevent black drop after fading
            });

            openedModal.modal('toggle');

            return;
          }
          if (!$('body').hasClass('modal-open')) {        // modal opening animation
            openedModal.one('shown.bs.modal', () => {
              openedModal.modal('toggle');
            })
          }
          openedModal.one('hidden.bs.modal', () => {        // modal closing animation
            ackMod.modal('toggle');
          });

          return;
        }
        ackMod.modal('toggle');
      },
      400: (jqXHR) => {        // 400: bad request - syntax error
        // if modal has been closed do nothing
        // if modal is actual enable inputs and handle response signup error object
        if (!actual) return;

        let errors = jqXHR.responseJSON;

        for (let field in errors) {
          let input = sigMod.find(`[name=${field}]`),
            addon = sigMod.find(`.input-group-${field} .input-group-addon`),
            alert = sigMod.find(`.input-group-${field} ~ .input-alert`);

          input.addClass('invalid-submit');

          addon.removeClass('warning');
          addon.removeClass('valid');
          addon.addClass('invalid');

          alert.removeClass('warning');
          alert.removeClass('input-alert-hidden');

          let contents = alert.contents(),
            txtNode = contents[contents.length - 1];

          if (txtNode.nodeValue !== ' ' + errors[field])
            txtNode.nodeValue = ' ' + errors[field];
        }
      },
      500: status500
    }
  });

  sigInputHandlers.forEach((sih) => {
    let input = sih.inputField;

    input.prop('disabled', true);
  });

  sigSub.addClass('pressed');

  function expired() {
    actual = false;
  }
}

function endHandleInput() {
  sigInputHandlers.forEach((sih) => {
    let input = sih.inputField;

    sih.destroy();
    input.prop('disabled', false);
    input.val('');
    input.removeClass('invalid-submit');
  });
  let un = sigInputHandlers[0],
    unAddon = un.addonField,
    unAlert = un.alertField;

  unAddon.removeClass('warning');
  unAlert.removeClass('warning');
  unAddon.off('click');

  sigSub.removeClass('pressed');

  sigInputHandlers.length = 0;
}

function loginRequest() {
  let loginValid = true,
    invalidFields = [];

  if (logSub.hasClass('pressed'))
    return;

  if (logInputs.eq(0).val().trim() === '') {
    logInputs.eq(0).val('');
    invalidFields.push(logInputs.eq(0));
    loginValid = false;
  }
  if (logInputs.eq(1).val() === '') {
    invalidFields.push(logInputs.eq(1));
    loginValid = false;
  }

  if (!loginValid) {
    invalidLogin('Both fields must be filled', invalidFields, 'client');
    return;
  }
  loginSubmit();
}

function invalidLogin(msg, fields, side) {
  let alert = logMod.find('.input-alert'),
    contents = alert.contents(),
    txtNode = contents[contents.length - 1];

  txtNode.nodeValue = ' ' + msg;

  alert.removeClass('input-alert-hidden');
  fields.forEach((field) => {
    field.addClass('invalid-submit');
    field.next().addClass('invalid');

    if (side === 'client')
      field.one('input', () => {
        field.removeClass('invalid-submit');
        field.next().removeClass('invalid');

        if (!logInputs.hasClass('invalid-submit'))
          alert.addClass('input-alert-hidden');
      });
    if (side === 'server') {
      fields.forEach((field, i) => {
        field.one('input', () => {
          fields[0].removeClass('invalid-submit');
          fields[1].removeClass('invalid-submit');

          fields[0].next().removeClass('invalid');
          fields[1].next().removeClass('invalid');

          alert.addClass('input-alert-hidden');

          fields[+!i].off('input');
        });
      });
    }
  });
}

function loginSubmit() {
  let loginForm = $('#loginForm'),
    actual = true;

  logMod.one('hide.bs.modal', expired);

  $.ajax('/login', {
    data: loginForm.serialize(),
    method: 'POST',
    complete: () => {
      logMod.off('hide.bs.modal', expired);
      logInputs.prop('disabled', false);
      logSub.removeClass('pressed');
    },
    statusCode: {
      200: () => window.location.href = '/',
      401: () => {
        if (!actual) return;

        invalidLogin('Username/password is not correct',
            [logInputs.eq(0), logInputs.eq(1)],
            'server');
      },
      500: status500
    }
  });

  logInputs.prop('disabled', true);
  logSub.addClass('pressed');

  function expired() {
    actual = false;
  }
}

function defaultLogin() {
  let alert = logMod.find('.input-alert');

  alert.addClass('input-alert-hidden');

  logInputs.prop('disabled', false);
  logInputs.removeClass('invalid-submit');
  logInputs.next().removeClass('invalid');
  logInputs.off('input');
  logInputs.val('');

  logSub.removeClass('pressed');
}

function modalRefSwitcher(curModal, nextModal, ref) {
  curModal.find(ref).on('click', () => {
    curModal.removeClass('fade');
    nextModal.removeClass('fade');
    curModal.one('hidden.bs.modal', () => {
      nextModal.modal({ backdrop: 'static'});
    });
    nextModal.one('shown.bs.modal', () => {
      curModal.addClass('fade');
      nextModal.addClass('fade');
      $('div.modal-backdrop').addClass('fade');       // non-documented: use to prevent black drop after fading
    });
    curModal.modal('toggle');
  });
}

function openedModalSetter(modal) {
  modal.on('show.bs.modal', () => { openedModal = modal });
  modal.on('hidden.bs.modal', () => { openedModal = null });
}

function pwdRequest() {
  if (pwdSub.hasClass('pressed'))
    return;

  let filled = true,
    input = pwdMod.find('input[type="text"]');

  if (input.val().trim() === '') {
    input.val('');
    filled = false;
  }

  if (!filled) {
    invalidPwdRequest('Field must be filled', input);
    return;
  }
  pwdSubmit();
}

function invalidPwdRequest(msg, input) {
  let alert = pwdMod.find('.input-alert'),
    contents = alert.contents(),
    txtNode = contents[contents.length - 1];

  txtNode.nodeValue = ' ' + msg;

  alert.removeClass('input-alert-hidden');
  input.addClass('invalid-submit');
  input.next().addClass('invalid');

  input.one('input', () => {
    input.removeClass('invalid-submit');
    input.next().removeClass('invalid');
    alert.addClass('input-alert-hidden');
  });
}

function pwdSubmit() {
  let pwdForm = $('#pwdForm'),
    input = pwdMod.find('input[type="text"]'),
    actual = true;

  pwdMod.one('hide.bs.modal', expired);

  $.ajax('/reset-password', {
    data: pwdForm.serialize(),
    method: 'POST',
    complete: () => {
      pwdMod.off('hide.bs.modal', expired);
      input.prop('disabled', false);
      pwdSub.removeClass('pressed');
    },
    statusCode: {
      200: () => window.location.href = '/',
      401: () => {
        if (!actual) return;

        invalidPwdRequest('Username/e-mail is not correct', input);
      },
      500: status500
    }
  });

  input.prop('disabled', true);
  pwdSub.addClass('pressed');

  function expired() {
    actual = false;
  }
}

function defaultPwd() {
  let alert = pwdMod.find('.input-alert'),
    input = pwdMod.find('input[type="text"]');

  alert.addClass('input-alert-hidden');

  input.prop('disabled', false);
  input.removeClass('invalid-submit');
  input.next().removeClass('invalid');
  input.off('input');
  input.val('');

  pwdSub.removeClass('pressed');
}

function status500() {
  window.location.href = '/error';
}