/**
* @version: 1.1
* @author: Dan Grossman http://www.dangrossman.info/
* @date: 2013-03-04
* @copyright: Copyright (c) 2012 Dan Grossman. All rights reserved.
* @license: Licensed under Apache License v2.0. See http://www.apache.org/licenses/LICENSE-2.0
* @website: http://www.improvely.com/
*/
!function ($) {

    var DateRangePicker = function (element, options, cb) {
        var hasOptions = typeof options == 'object';
        var today = moment().startOf('day');
        var localeObject;

        daysOfWeek = [];
        monthNames = [];
        for (var i = 0; i < 7; i++) {
            daysOfWeek.push(moment().day(i).format('dd'));
        }
        for (var i = 0; i < 12; i++) {
            monthNames.push(moment().month(i).format('MMMM'));
        }

        //state
        this.startDate = today;
        this.endDate = today;
        this.minDate = false;
        this.maxDate = false;
        this.changed = false;
        this.cleared = false;
        this.showDropdowns = true;
        this.ranges = {
            'Last 7 days': [moment().subtract({ days: 6 }), moment()],
            'This Month': [moment().startOf('month'), moment()],
            'Last Month': [moment().startOf('month').subtract({ months: 1 }), moment().startOf('month').subtract({ days: 1 })],
            'Year To Date': [moment().startOf('year'), moment()]
        };
        this.dateLimit = false;
        this.opens = 'left';
        this.cb = function () { };
        this.format = 'YYYY/MM/DD';
        this.separator = ' - ';
        this.showWeekNumbers = false;
        this.buttonClasses = [];
        this.applyClass = 'btn btn-success';
        this.clearClass = 'btn btn-default';
        this.locale = {
            applyLabel: 'Apply',
            clearLabel: "Clear",
            fromLabel: 'From',
            toLabel: 'To',
            weekLabel: 'W',
            customRangeLabel: 'Custom Range',
            daysOfWeek: daysOfWeek,
            monthNames: monthNames,
            firstDay: 1
        };

        localeObject = this.locale;

        this.leftCalendar = {
            month:  moment().startOf('day').day(1).month(this.startDate.month()).year(this.startDate.year()),
            calendar: []
        };

        this.rightCalendar = {
            month: moment().startOf('day').day(1).month(this.endDate.month()).year(this.endDate.year()),
            calendar: []
        };

        //element that triggered the date range picker
        this.element = $(element);

        if (this.element.hasClass('pull-right'))
            this.opens = 'left';

        if (this.element.is('input')) {
            this.element.on({
                click: $.proxy(this.show, this),
                focus: $.proxy(this.show, this)
            });
        } else {
            this.element.on('click', $.proxy(this.show, this));
        }

        if (hasOptions) {
            if (typeof options.locale == 'object') {
                $.each(localeObject, function (property, value) {
                    localeObject[property] = options.locale[property] || value;
                });
            }

            if (options.applyClass) {
                this.applyClass = options.applyClass;
            }

            if (options.clearClass) {
                this.clearClass = options.clearClass;
            }
        }

        var DRPTemplate = '<div class="daterangepicker dropdown-menu">' +
                '<div class="calendar left"></div>' +
                '<div class="calendar right"></div>' +
                '<div class="ranges">' +
                  '<div class="range_inputs">' +
                    '<div class="daterangepicker_start_input" style="float: left">' +
                      '<label for="daterangepicker_start">' + this.locale.fromLabel + '</label>' +
                      '<input class="form-control input-sm" type="text" name="daterangepicker_start" value="" disabled="disabled" />' +
                    '</div>' +
                    '<div class="daterangepicker_end_input" style="float: left; margin-bottom: 5px;">' +
                      '<label for="daterangepicker_end">' + this.locale.toLabel + '</label>' +
                      '<input class="form-control input-sm" type="text" name="daterangepicker_end" value="" disabled="disabled" />' +
                    '</div>' +
                    '<div class="form-group">' +
                    '<div class="btn-group btn-group-sm">' +
                      '<button class="' + this.applyClass + ' applyBtn" disabled="disabled">' + this.locale.applyLabel + '</button>&nbsp;' +
                      '<button class="' + this.clearClass + ' clearBtn">' + this.locale.clearLabel + '</button>' +
                    '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';

        this.container = $(DRPTemplate).appendTo('body');

        if (hasOptions) {

            if (typeof options.format == 'string')
                this.format = options.format;

            if (typeof options.separator == 'string')
                this.separator = options.separator;

            if (typeof options.startDate == 'string')
                this.startDate = moment(options.startDate, this.format);

            if (typeof options.endDate == 'string')
                this.endDate = moment(options.endDate, this.format);

            if (typeof options.minDate == 'string')
                this.minDate = moment(options.minDate, this.format);

            if (typeof options.maxDate == 'string')
                this.maxDate = moment(options.maxDate, this.format);

            if (typeof options.startDate == 'object')
                this.startDate = options.startDate;

            if (typeof options.endDate == 'object')
                this.endDate = options.endDate;

            if (typeof options.minDate == 'object')
                this.minDate = options.minDate;

            if (typeof options.maxDate == 'object')
                this.maxDate = options.maxDate;

            if (typeof options.ranges == 'object') {
                this.ranges = options.ranges;
            }
            if (typeof this.ranges == 'object') {
                for (var range in this.ranges) {

                    var start = this.ranges[range][0];
                    var end = this.ranges[range][1];

                    if (typeof start == 'string')
                        start = moment(start);

                    if (typeof end == 'string')
                        end = moment(end);

                    // If we have a min/max date set, bound this range
                    // to it, but only if it would otherwise fall
                    // outside of the min/max.
                    if (this.minDate && start.isBefore(this.minDate))
                        start = this.minDate;

                    if (this.maxDate && end.isAfter(this.maxDate))
                        end = this.maxDate;

                    // If the end of the range is before the minimum (if min is set) OR
                    // the start of the range is after the max (also if set) don't display this
                    // range option.
                    if ((this.minDate && end.isBefore(this.minDate)) || (this.maxDate && start.isAfter(this.maxDate))) {
                        continue;
                    }

                    this.ranges[range] = [start.startOf('day'), end.startOf('day')];
                }

                var list = '<ul>';
                for (var range in this.ranges) {
                    list += '<li>' + range + '</li>';
                }
                list += '<li>' + this.locale.customRangeLabel + '</li>';
                list += '</ul>';
                this.container.find('.ranges').prepend(list);
            }

            if (typeof options.dateLimit == 'object')
                this.dateLimit = options.dateLimit;

            // update day names order to firstDay
            if (typeof options.locale == 'object') {
                if (typeof options.locale.firstDay == 'number') {
                    this.locale.firstDay = options.locale.firstDay;
                    var iterator = options.locale.firstDay;
                    while (iterator > 0) {
                        this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
                        iterator--;
                    }
                }
            }

            if (typeof options.opens == 'string')
                this.opens = options.opens;

            if (typeof options.showWeekNumbers == 'boolean') {
                this.showWeekNumbers = options.showWeekNumbers;
            }

            if (typeof options.buttonClasses == 'string') {
                this.buttonClasses = [options.buttonClasses];
            }

            if (typeof options.buttonClasses == 'object') {
                this.buttonClasses = options.buttonClasses;
            }

            if (typeof options.showDropdowns == 'boolean') {
                this.showDropdowns = options.showDropdowns;
            }

        }

        //apply CSS classes to buttons
        var c = this.container;
        $.each(this.buttonClasses, function (idx, val) {
            c.find('button').addClass(val);
        });

        if (this.opens == 'right') {
            //swap calendar positions
            var left = this.container.find('.calendar.left');
            var right = this.container.find('.calendar.right');
            left.removeClass('left').addClass('right');
            right.removeClass('right').addClass('left');
        }

        //if (typeof options == 'undefined' || typeof options.ranges == 'undefined')
        this.container.find('.calendar').show();

        if (typeof cb == 'function')
            this.cb = cb;

        this.container.addClass('opens' + this.opens);

        //try parse date if in text input
        if (!hasOptions || (typeof options.startDate == 'undefined' && typeof options.endDate == 'undefined')) {
            if ($(this.element).is('input[type=text]')) {
                var val = $(this.element).val();
                var split = val.split(this.separator);

                if (split.length == 2) {
                    this.startDate = moment(split[0], this.format);
                    this.endDate = moment(split[1], this.format);
                }
            }
        }

        //event listeners
        this.container.on('mousedown', $.proxy(this.mousedown, this));
        this.container.find('.calendar').on('click', '.prev', $.proxy(this.clickPrev, this));
        this.container.find('.calendar').on('click', '.next', $.proxy(this.clickNext, this));
        this.container.find('.ranges').on('click', 'button.applyBtn', $.proxy(this.clickApply, this));
        this.container.find('.ranges').on('click', 'button.clearBtn', $.proxy(this.clickClear, this));

        this.container.find('.calendar').on('click', 'td.available', $.proxy(this.clickDate, this));
        this.container.find('.calendar').on('mouseenter', 'td.available', $.proxy(this.enterDate, this));
        this.container.find('.calendar').on('mouseleave', 'td.available', $.proxy(this.updateView, this));

        this.container.find('.ranges').on('click', 'li', $.proxy(this.clickRange, this));
        this.container.find('.ranges').on('mouseenter', 'li', $.proxy(this.enterRange, this));
        this.container.find('.ranges').on('mouseleave', 'li', $.proxy(this.updateView, this));

        this.container.find('.calendar').on('change', 'select.yearselect', $.proxy(this.updateYear, this));
        this.container.find('.calendar').on('change', 'select.monthselect', $.proxy(this.updateMonth, this));

        this.element.on('keyup', $.proxy(this.updateFromControl, this));

        this.updateView();
        this.updateCalendars();

    };

    DateRangePicker.prototype = {

        constructor: DateRangePicker,

        mousedown: function (e) {
            e.stopPropagation();

            //allow select list to function normally
            if (!this.showDropdowns || $(e.target).not('select').length)
                e.preventDefault();
        },

        updateView: function () {
            this.leftCalendar.month.month(this.startDate.month()).year(this.startDate.year());
            this.rightCalendar.month.month(this.endDate.month()).year(this.endDate.year());

            this.container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.format));
            this.container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.format));

            if (this.startDate.isSame(this.endDate) || this.startDate.isBefore(this.endDate)) {
                this.container.find('button.applyBtn').removeAttr('disabled');
            } else {
                this.container.find('button.applyBtn').attr('disabled', 'disabled');
            }
        },

        updateFromControl: function () {
            if (!this.element.is('input')) return;

            var dateString = this.element.val().split(this.separator);
            var start = moment(dateString[0], this.format);
            var end = moment(dateString[1], this.format);

            if (!start.isValid() || !end.isValid()) return;
            if (end.isBefore(start)) return;

            this.startDate = start;
            this.endDate = end;

            this.updateView();
            this.cb(this.startDate, this.endDate);
            this.updateCalendars();
        },

        notify: function () {
            if (!this.cleared) {
                this.updateView();
            }

            if (this.element.is('input')) {
                this.element.val(this.cleared ? '' : this.startDate.format(this.format) + this.separator + this.endDate.format(this.format));
            }
            var arg1 = (this.cleared ? null : this.startDate),
                arg2 = (this.cleared ? null : this.endDate);
            this.cleared = false;
            this.cb(arg1, arg2);
        },

        move: function () {
            if (this.opens == 'left') {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight(),
                    right: $(window).width() - this.element.offset().left - this.element.outerWidth(),
                    left: 'auto'
                });
            } else {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight(),
                    left: this.element.offset().left,
                    right: 'auto'
                });
            }
        },

        show: function (e) {
            this.container.show();
            this.move();

            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }

            this.changed = false;

            this.element.trigger('shown', { target: e.target, picker: this });

            $(document).on('mousedown', $.proxy(this.hide, this));
        },

        hide: function (e) {
            this.container.hide();
            $(document).off('mousedown', this.hide);

            if (this.changed) {
                this.changed = false;
                this.notify();
            }
        },

        enterRange: function (e) {
            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.updateView();
            } else {
                var dates = this.ranges[label];
                this.container.find('input[name=daterangepicker_start]').val(dates[0].format(this.format));
                this.container.find('input[name=daterangepicker_end]').val(dates[1].format(this.format));
            }
        },

        clickRange: function (e) {
            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.container.find('.calendar').show();
                this.container.find('.ranges li').removeClass('active');
                this.container.find('.ranges li:last').addClass('active');
            } else {
                var dates = this.ranges[label];

                this.startDate = moment(dates[0]);
                this.endDate = moment(dates[1]);

                this.leftCalendar.month.month(this.startDate.month()).year(this.startDate.year());
                this.rightCalendar.month.month(this.endDate.month()).year(this.endDate.year());
                this.updateCalendars();

                this.changed = true;

                //this.container.find('.calendar').hide();
                //this.hide();
            }
        },

        clickPrev: function (e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add({ months: -1 });
            } else {
                this.rightCalendar.month.add({ months: -1 });
            }
            this.updateCalendars();
        },

        clickNext: function (e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add({ months: 1 });
            } else {
                this.rightCalendar.month.add({ months: 1 });
            }
            this.updateCalendars();
        },

        enterDate: function (e) {

            var title = $(e.target).attr('title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');

            if (cal.hasClass('left')) {
                this.container.find('input[name=daterangepicker_start]').val(this.leftCalendar.calendar[row][col].format(this.format));
            } else {
                this.container.find('input[name=daterangepicker_end]').val(this.rightCalendar.calendar[row][col].format(this.format));
            }

        },

        clickDate: function (e) {
            var title = $(e.target).attr('title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');

            if (cal.hasClass('left')) {
                startDate = moment(this.leftCalendar.calendar[row][col]);
                endDate = this.endDate;
                if (typeof this.dateLimit == 'object') {
                    var maxDate = startDate.add(this.dateLimit);
                    if (endDate.isAfter(maxDate)) {
                        endDate = maxDate;
                    }
                }
                this.element.trigger('clicked', {
                    dir: 'left',
                    picker: this
                });
            } else {
                startDate = this.startDate;
                endDate = moment(this.rightCalendar.calendar[row][col]);
                if (typeof this.dateLimit == 'object') {
                    var negConfig = {
                        days: 0 - this.dateLimit.days,
                        months: 0 - this.dateLimit.months,
                        years: 0 - this.dateLimit.years
                    };
                    var minDate = endDate.add(negConfig);
                    if (startDate.isBefore(minDate)) {
                        startDate = minDate;
                    }
                }
                this.element.trigger('clicked', {
                    dir: 'right',
                    picker: this
                });
            }

            cal.find('td').removeClass('active');

            if (startDate.isSame(endDate) || startDate.isBefore(endDate)) {
                $(e.target).addClass('active');
                if (!startDate.isSame(this.startDate) || !endDate.isSame(this.endDate))
                    this.changed = true;
                this.startDate = startDate;
                this.endDate = endDate;
            } else if (startDate.isAfter(endDate)) {
                $(e.target).addClass('active');
                this.changed = true;
                this.startDate = startDate;
                this.endDate = startDate.clone().add("days", 1);
            }

            this.leftCalendar.month.month(this.startDate.month()).year(this.startDate.year());
            this.rightCalendar.month.month(this.endDate.month()).year(this.endDate.year());
            this.updateCalendars();
        },

        clickApply: function (e) {
            this.changed = true;
            this.hide();
        },

        clickClear: function (e) {
            this.changed = true;
            this.cleared = true;
            this.hide();
        },

        updateYear: function (e) {
            var year = parseInt($(e.target).val(), 10);
            var isLeft = $(e.target).closest('.calendar').hasClass('left');

            if (isLeft) {
                this.leftCalendar.month.month(this.startDate.month()).year(year);
            } else {
                this.rightCalendar.month.month(this.endDate.month()).year(year);
            }

            this.updateCalendars();
        },

        updateMonth: function (e) {
            var month = parseInt($(e.target).val(), 10);
            var isLeft = $(e.target).closest('.calendar').hasClass('left');

            if (isLeft) {
                this.leftCalendar.month.month(month).year(this.startDate.year());
            } else {
                this.rightCalendar.month.month(month).year(this.endDate.year());
            }

            this.updateCalendars();
        },

        updateCalendars: function () {
            this.leftCalendar.calendar = this.buildCalendar(this.leftCalendar.month.month(), this.leftCalendar.month.year());
            this.rightCalendar.calendar = this.buildCalendar(this.rightCalendar.month.month(), this.rightCalendar.month.year());
            this.container.find('.calendar.left').html(this.renderCalendar(this.leftCalendar.calendar, this.startDate, this.minDate, this.maxDate));
            this.container.find('.calendar.right').html(this.renderCalendar(this.rightCalendar.calendar, this.endDate, this.startDate, this.maxDate));

            this.container.find('.ranges li').removeClass('active');
            var customRange = true;
            var i = 0;
            for (var range in this.ranges) {
                if (this.startDate.isSame(this.ranges[range][0]) && this.endDate.isSame(this.ranges[range][1])) {
                    customRange = false;
                    this.container.find('.ranges li:eq(' + i + ')').addClass('active');
                }
                i++;
            }
            if (customRange)
                this.container.find('.ranges li:last').addClass('active');

            this.element.trigger('updated', this);
        },

        buildCalendar: function (month, year) {

            var firstDay = moment(new Date(year, month));
            var lastMonth = moment(firstDay).subtract('days', 1).month();
            var lastYear = moment(firstDay).subtract('days', 1).year();

            var daysInMonth = firstDay.daysInMonth();
            var daysInLastMonth = moment(new Date(lastYear, lastMonth)).daysInMonth();

            var dayOfWeek = firstDay.day();

            //initialize a 6 rows x 7 columns array for the calendar
            var calendar = Array();
            for (var i = 0; i < 6; i++) {
                calendar[i] = Array();
            }

            //populate the calendar with date objects
            var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
            if (startDay > daysInLastMonth)
                startDay -= 7;

            if (dayOfWeek == this.locale.firstDay)
                startDay = daysInLastMonth - 6;

            var curDate = moment(new Date(lastYear, lastMonth, startDay));
            for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = curDate.clone().add("days", 1)) {
                if (i > 0 && col % 7 == 0) {
                    col = 0;
                    row++;
                }
                calendar[row][col] = curDate;
            }

            return calendar;

        },

        renderDropdowns: function (selected, minDate, maxDate) {
            var currentMonth = selected.month();
            var monthHtml = '<select class="monthselect" style="max-width: 90px;">';
            var inMinYear = false;
            var inMaxYear = false;

            for (var m = 0; m < 12; m++) {
                if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
                    monthHtml += "<option value='" + m + "'" +
                        (m === currentMonth ? " selected='selected'" : "") +
                        ">" + this.locale.monthNames[m] + "</option>";
                }
            }
            monthHtml += "</select>";

            var currentYear = selected.year();
            var maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
            var minYear = (minDate && minDate.year()) || (currentYear - 50);
            var yearHtml = '<select class="yearselect">';

            for (var y = minYear; y <= maxYear; y++) {
                yearHtml += '<option value="' + y + '"' +
                    (y === currentYear ? ' selected="selected"' : '') +
                    '>' + y + '</option>';
            }

            yearHtml += '</select>';

            return monthHtml + yearHtml;
        },

        renderCalendar: function (calendar, selected, minDate, maxDate) {
            var html = '<table class="table-condensed">';
            html += '<thead>';
            html += '<tr>';

            // add empty cell for week number
            if (this.showWeekNumbers)
                html += '<th></th>';

            if (!minDate || minDate < calendar[1][1]) {
                html += '<th class="prev available"><i class="glyphicon glyphicon-arrow-left"></i></th>';
            } else {
                html += '<th></th>';
            }

            var dateHtml = this.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(" YYYY");

            if (this.showDropdowns) {
                dateHtml = this.renderDropdowns(calendar[1][1], minDate, maxDate);
            }

            html += '<th colspan="5" style="width: auto">' + dateHtml + '</th>';
            if (!maxDate || maxDate > calendar[1][1]) {
                html += '<th class="next available"><i class="glyphicon glyphicon-arrow-right"></i></th>';
            } else {
                html += '<th></th>';
            }

            html += '</tr>';
            html += '<tr>';

            // add week number label
            if (this.showWeekNumbers)
                html += '<th class="week">' + this.locale.weekLabel + '</th>';

            $.each(this.locale.daysOfWeek, function (index, dayOfWeek) {
                html += '<th>' + dayOfWeek + '</th>';
            });

            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            for (var row = 0; row < 6; row++) {
                html += '<tr>';

                // add week number
                if (this.showWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].week() + '</td>';

                for (var col = 0; col < 7; col++) {
                    var cname = 'available ';
                    cname += (calendar[row][col].month() == calendar[1][1].month()) ? '' : 'off';

                    // Normalise the time so the comparison won't fail
                    selected.hours(0);

                    if ((minDate && calendar[row][col].isBefore(minDate)) || (maxDate && calendar[row][col].isAfter(maxDate))) {
                        cname = ' off disabled ';
                    } else if (calendar[row][col].isSame(selected)) {
                        cname += ' active ';
                        if (calendar[row][col].isSame(this.startDate)) { cname += ' start-date '; }
                        if (calendar[row][col].isSame(this.endDate)) { cname += ' end-date '; }
                    } else if ((calendar[row][col].isAfter(this.startDate) || calendar[row][col].isSame(this.startDate)) &&
                                (calendar[row][col].isBefore(this.endDate)) || calendar[row][col].isSame(this.endDate)) {
                        cname += ' in-range ';
                        if (calendar[row][col].isSame(this.startDate)) { cname += ' start-date '; }
                        if (calendar[row][col].isSame(this.endDate)) { cname += ' end-date '; }
                    }

                    var title = 'r' + row + 'c' + col;
                    html += '<td class="' + cname.replace(/\s+/g, ' ').replace(/^\s?(.*?)\s?$/, '$1') + '" title="' + title + '">' + calendar[row][col].date() + '</td>';
                }
                html += '</tr>';
            }

            html += '</tbody>';
            html += '</table>';

            return html;

        }

    };

    $.fn.daterangepicker = function (options, cb) {
        this.each(function () {
            var el = $(this);
            if (!el.data('daterangepicker'))
                el.data('daterangepicker', new DateRangePicker(el, options, cb));
        });
        return this;
    };

}(window.jQuery);
