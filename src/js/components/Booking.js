import { select, templates, classNames, settings } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';
import DatePicker from './DatePicker.js';
import utils from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.selectedTable = {};
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;
    const startDayParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);

    const endDayParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDayParam, endDayParam],
      eventsCurrent: [settings.db.notReapeatParam, startDayParam, endDayParam],
      eventsRepeat: [settings.db.repeatParam, endDayParam],
    };

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }
    thisBooking.updateDOM();
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableID = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableID)) {
        tableID = parseInt(tableID);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableID)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  render(element) {
    const thisBooking = this;

    const generateHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generateHTML;
    thisBooking.dom.peopleAmount = element.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = element.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = element.querySelector(
      select.widgets.hourPicker.wrapper
    );

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );

    thisBooking.dom.floorPlan = element.querySelector(select.containerOf.floor);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.starters = element.querySelectorAll(
      select.booking.starters
    );
    thisBooking.dom.form = element.querySelector(select.booking.form);
  }

  selectTable() {
    const thisBooking = this;

    if (thisBooking.clickedTable.classList.contains('table')) {
      if (
        !thisBooking.clickedTable.classList.contains(
          classNames.booking.tableBooked
        )
      ) {
        // Jest wolny

        if (
          thisBooking.clickedTable.classList.contains(
            classNames.booking.tableSelected
          )
        ) {
          thisBooking.resetTables();
        } else {
          thisBooking.resetTables();
          thisBooking.clickedTable.classList.add(
            classNames.booking.tableSelected
          );
          thisBooking.selectedTable = thisBooking.clickedTableId;
        }
      } else {
        alert('Stolik niedostępny');
      }
    }
  }

  resetTables() {
    const thisBooking = this;

    for (const table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.tableSelected);
      //thisBooking.selectedTable.shift();
    }
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.peopleAmount.addEventListener('click', function (e) {
      e.preventDefault();
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function (e) {
      e.preventDefault();
    });

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      thisBooking.resetTables();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.clickedTable = event.target;
      thisBooking.clickedTableId =
        thisBooking.clickedTable.getAttribute('data-table');
      thisBooking.selectTable();
    });
    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {};

    payload.date = thisBooking.datePicker.value;
    payload.hour = thisBooking.hourPicker.value;
    payload.table = parseInt(thisBooking.selectedTable);
    payload.duration = thisBooking.hoursAmount.value;
    payload.ppl = thisBooking.peopleAmount.value;
    payload.phone = thisBooking.dom.phone.value;
    payload.address = thisBooking.dom.address.value;
    payload.starters = [];

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
        thisBooking.resetTables();
        thisBooking.updateDOM(); // Odświeżamy widok za pomoca tej metody
      });
  }
}

export default Booking;
