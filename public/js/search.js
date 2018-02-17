'use strict';

const mobileSearchSettings = $('#mobileSearchHeaderSettings').parent(),
    desktopSearchSettings = $('#desktopSearchHeaderSettings').parent();

window.addEventListener("orientationchange", () => {
  hideDropdown(mobileSearchSettings);
  hideDropdown(desktopSearchSettings);
});

let searchFor = 'quotes',
  quotesNum = '25',
  topicsNum = '50';

mobileSearchSettings.on('hide.bs.dropdown', ddClose);
desktopSearchSettings.on('hide.bs.dropdown', ddClose);

mobileSearchSettings.find(':text').on('keypress', checkBlur);
desktopSearchSettings.find(':text').on('keypress', checkBlur);

mobileSearchSettings.find(':text').on('blur', onBlur);
desktopSearchSettings.find(':text').on('blur', onBlur);

let xhr, acOptions = {
  source: (text, suggest) => {
    try {
      xhr.abort();
    } catch(e) {}

    xhr = $.getJSON('/search/' + searchFor, { query: text, skip: 0, limit: 7, autocomplete: true })
      .done((data) => {
        suggest(data);
      });
  },
  minChars: 3,
  delay: 100,
  renderItem: (item, search) => {
    console.log(item);
    let suggestion = item[searchFor.slice(0, -1)];
    return '<div class="autocomplete-suggestion" data-val="' + suggestion + '">' + suggestion + '</div>';
  },
  onSelect: (e, text, renderedItem) => {
    console.log('Item "' + renderedItem.data('val') + '" selected by ' + (e.type === 'keydown' ? 'pressing enter' : 'mouse click'));
  }
};

$('#desktopSearch input').autoComplete(acOptions);

console.log();

function hideDropdown(menu) {
  if (!menu.hasClass('show'))
    return;

  menu.removeClass('show');
  menu.children('.dropdown-menu').removeClass('show');
  menu.children('button').attr('aria-expanded', 'false');

  ddClose(menu);
}

function ddClose(e) {
  let origin = e,
    obsolete = desktopSearchSettings;

  if (e.currentTarget)
    origin = $(e.currentTarget);
  if (origin === desktopSearchSettings)
    obsolete = mobileSearchSettings;

  saveSettingsFrom(origin);
  provideSettingsTo(obsolete);
  setPlaceholders();
}

function saveSettingsFrom(menu) {
  searchFor = menu.find(':checked').next().text();
  // quotesNum = menu.find('input[name="quotesPerPage"]').val();        onBlur saves quotesNum and topicsNum
  // topicsNum = menu.find('input[name="topicsPerPage"]').val();
}

function provideSettingsTo(menu) {
  menu.find(':checked').prop('checked', false);
  menu.find('input[id^="' + searchFor + '"]').prop('checked', true);

  menu.find('input[name="quotesPerPage"]').val(quotesNum);
  menu.find('input[name="topicsPerPage"]').val(topicsNum);
}

function setPlaceholders() {
  $('input[name="search"]').prop('placeholder', 'Search for ' + searchFor);
}

function checkBlur(e) {
  if (e.keyCode === 13)
    e.currentTarget.blur();
}

function onBlur(e) {
  let t = $(e.currentTarget);

  if (!Number.isInteger(+t.val())) {
    if (t.attr('name') === 'quotesPerPage')
      t.val(quotesNum);
    else
      t.val(topicsNum);
  } else {
    if (+t.val() < 1)
      t.val('1');
    if (+t.val() > 500)
      t.val('500');
  }

  t.val(t.val().trim());

  if (t.attr('name') === 'quotesPerPage')
    quotesNum = t.val();
  else
    topicsNum = t.val();
}
