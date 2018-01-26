'use strict';

const laBtn = $('#btnAccLeft'),
  raBtn = $('#btnAccRight'),
  uInput = $('input[name="username"]'),
  uTip = $('.username-tip'),
  eInput = $('input[name="email"]'),
  underlines = $('.underline'),
  passObjects = [],
  rpBtn = $('#btnPassRight'),
  lpBtn = $('#btnPassLeft');

let initUsername = uInput.val(),
  initEmail = eInput.val(),
  credReqState = false,
  passReqState = false;

laBtn.on('click', () => {
  if (credReqState) return;

  if (laBtn.hasClass('btn-acc-change'))
    makeEditable();
  else
    makeInitial();
});

raBtn.on('click', () => {
  if (raBtn.hasClass('btn-acc-save-disabled')
      || credReqState)
    return;

  credReqState = true;
  raBtn.addClass('saving');

  $.ajax(`/profile/${initUsername}/update-credentials`, {
    data: $('#userData').serialize(),
    method: 'POST',
    complete: () => {
      credReqState = false;
      raBtn.removeClass('saving');
    },
    statusCode: {
      200: () => {
        uInput.prop('disabled', false);
        eInput.prop('disabled', false);

        initUsername = uInput.val();
        initEmail = eInput.val();

        makeInitial();
      },
      406: (jqXHR) => {
        let res = jqXHR.responseJSON,
          uAlert = uTip.find('.username-alert'),
          eAlert = $('.email-alert'),
          blockedByU = false,
          blockedByE = false;

        raBtn.addClass('btn-acc-save-disabled');

        if (res.username) {
          let contents = uAlert.contents(),
            txtNode = contents[contents.length - 1];

          blockedByU = true;

          txtNode.nodeValue = res.username;
          underlines.eq(0).addClass('error');
          uAlert.css('height', uTip.find('p').css('height'));

          uInput.one('input', () => {
            underlines.eq(0).removeClass('error');
            uAlert.css('height', '0');
            blockedByU = false;

            if (!blockedByE)
              raBtn.removeClass('btn-acc-save-disabled');
          })
        }

        if (res.email) {
          let contents = eAlert.contents(),
            txtNode = contents[contents.length - 1];

          blockedByE = true;

          txtNode.nodeValue = res.email;
          underlines.eq(1).addClass('error');

          eAlert.css('height', calcHeight() + 'px');

          eInput.one('input', () => {
            underlines.eq(1).removeClass('error');
            eAlert.css('height', '0');
            blockedByE = false;

            if (!blockedByU)
              raBtn.removeClass('btn-acc-save-disabled');
          });
        }

        uInput.prop('disabled', false);
        eInput.prop('disabled', false);

        function calcHeight() {
          let tw = $('.email-alert .error-message-width'),
            ew = $('.email-alert').width(),
            contents = tw.contents(),
            txt = contents[contents.length - 1];

          tw.css('width', ew + 'px');
          txt.nodeValue = res.email;

          return tw.height();
        }
      }
      // TODO: make 500 status handler
    }
  });

  uInput.prop('disabled', true);
  eInput.prop('disabled', true);
});

//---change-password-----------------------------------

class PassObject {
  constructor(alert, input, text, underline) {
    this.alert = alert;
    this.input = input;
    this.text = text;
    this.underline = underline;
    this.correct = true;
  }

  showError(message) {
    let contents = this.alert.contents(),
      txt = contents[contents.length - 1];

    txt.nodeValue = message;
    this.input.trigger('focus');
    this.correct = false;

    this.underline.addClass('error');
    this.text.addClass('error');
    this.alert.css('height', calcHeight.call(this));

    function calcHeight() {
      let consBlock = this.alert.find('div'),
        acceptWidth = this.alert.width(),
        contents = consBlock.contents(),
        txt = contents[contents.length - 1];

      consBlock.css('width', acceptWidth + 'px');
      txt.nodeValue = message;

      return consBlock.height();
    }
  }

  hideError() {
    this.correct = true;

    this.underline.removeClass('error');
    this.text.removeClass('error');
    this.alert.css('height', '0');
  }
}

let passAlerts = $('.alert-pass'),
  passInputs = $('#passwordData').find('input[type="password"]'),
  passTexts = $('.text-pass'),
  passUnderlines = $('.underline-pass'),
  idx = -1;

while (++idx < 3) {
  passObjects.push(
    new PassObject(
      passAlerts.eq(idx),
      passInputs.eq(idx),
      passTexts.eq(idx),
      passUnderlines.eq(idx),
    ),
  )
}

lpBtn.on('click', () => {
  let text = lpBtn.text(),
    type = 'password';

  if (text === 'SHOW') {
    lpBtn.text('HIDE');
    type = 'text';
  }
  else
    lpBtn.text('SHOW');

  passObjects.forEach((po) => {
    po.input.attr('type', type);
  });
});

rpBtn.on('click', () => {
  if (rpBtn.hasClass('btn-acc-save-disabled')
    || passReqState)
    return;

  let successMsg = $('.save-pass-message');

  passReqState = true;
  rpBtn.addClass('saving');

  $.ajax(`/profile/${initUsername}/update-password`, {
    data: $('#passwordData').serialize(),
    method: 'POST',
    complete: () => {
      passReqState = false;
      rpBtn.removeClass('saving');

      passObjects.forEach((po) => {
        po.input.prop('disabled', false);
      });
    },
    statusCode: {
      200: () => {
        successMsg.addClass('showed');
        successMsg.addClass('just-showed');
        setTimeout(() => {
          successMsg.removeClass('just-showed');
        }, 400);
      },
      406: (jqXHR) => {
        let errors = jqXHR.responseJSON;

        rpBtn.addClass('btn-acc-save-disabled');
        successMsg.removeClass('showed');

        if (errors['oldpass']) {
          let p = passObjects[0];

          p.correct = false;
          p.showError(errors['oldpass']);
          p.input.one('input', handler.bind(p));
        }

        if (errors['newpass']) {
          let p = passObjects[1];

          p.correct = false;
          p.showError(errors['newpass']);
          p.input.one('input', handler.bind(p));
        }

        if (errors['confpass']) {
          let p = passObjects[2];

          p.correct = false;
          p.showError(errors['confpass']);
          p.input.one('input', handler.bind(p));

          passObjects[1].input.one('input', handler.bind(p));
        }

        function handler() {
          this.hideError();

          if (errorCheck())
            rpBtn.removeClass('btn-acc-save-disabled')
        }

        function errorCheck() {
          let res = true;

          passObjects.forEach((po) => {
            if (!po.correct)
              res = false;
          });

          return res;
        }
      }
      // TODO: make 500 status code handler
    }
  });

  passObjects.forEach((po) => {
    po.input.off('input');
    po.input.prop('disabled', true);
  });
});

function makeEditable() {
  uTip.css('height', uTip.find('p').css('height'));

  makeEditableStyle();
}

function makeInitial() {
  uInput.val(initUsername);
  eInput.val(initEmail);

  uInput.off('input');
  eInput.off('input');

  uTip.css('height', '0');

  makeInitialStyle();
  makeInitialInputStyle();
}

function makeEditableStyle() {
  laBtn.removeClass('btn-acc-change');
  laBtn.addClass('btn-acc-cancel');

  laBtn.text('CANCEL');

  raBtn.removeClass('btn-acc-save-disabled');

  uInput.prop('disabled', false);
  eInput.prop('disabled', false);

  uInput.trigger('focus');

  underlines.addClass('revealed');
}

function makeInitialStyle() {
  laBtn.removeClass('btn-acc-cancel');
  laBtn.addClass('btn-acc-change');

  laBtn.text('CHANGE');

  raBtn.addClass('btn-acc-save-disabled');

  uInput.prop('disabled', true);
  eInput.prop('disabled', true);

  underlines.removeClass('revealed');
}

function makeInitialInputStyle() {
  let uAlert = uTip.find('.username-alert'),
    eAlert = $('.email-alert');

  underlines.removeClass('error');
  eAlert.css('height', '0');
  uAlert.css('height', '0');
}