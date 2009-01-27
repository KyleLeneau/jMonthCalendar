/*
* Title:  jMonthCalendar 1.0.0
* Dependencies:  jQuery 1.3.0 +
* Author:  Kyle LeNeau
* Email:  kyle.leneau@gmail.com
* Project Hompage:  http://www.bytecyclist.com/projects/jmonthcalendar
*
* 1/15/2009
*/

(function($) {
	var ids = {
			container: "#jMonthCalendar",
			head: "#CalendarHead",
			body: "#CalendarBody"
	};
	var _selectedDate;
	var _beginDate;
	var _endDate;
	var calendarEvents;
	var defaults = {
			firstDayOfWeek: 0,
			navLinks: {
				p:'Prev', 
				n:'Next', 
				t:'Today'
			},
			onMonthChanging: function(dateIn) { return true; },
			onMonthChanged: function(dateIn) { return true; },
			onEventBlockClick: function(event) { return true; },
			onEventBlockOver: function(event) { return true; },
			onEventBlockOut: function(event) { return true; },
			locale: {
				days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
				months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
				monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
				weekMin: 'wk'
			}
		};
	var getDateFromId = function(dateIdString) {
		//c_01012009		
		return new Date(dateIdString.substring(6, 10), dateIdString.substring(2, 4)-1, dateIdString.substring(4, 6));
	};
	var getDateId = function(date) {
		var month = ((date.getMonth()+1)<10) ? "0" + (date.getMonth()+1) : (date.getMonth()+1);
		var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate();
		return "c_" + month + day + date.getFullYear();
	};
	jQuery.jMonthCalendar = jQuery.J = function() {};


			
		
	jQuery.J.ExtendDate = function(options) {
		if (Date.prototype.tempDate) {
			return;
		}
		Date.prototype.tempDate = null;
		Date.prototype.months = defaults.locale.months;
		Date.prototype.monthsShort = defaults.locale.monthsShort;
		Date.prototype.days = defaults.locale.days;
		Date.prototype.daysShort = defaults.locale.daysShort;
		Date.prototype.getMonthName = function(fullName) {
			return this[fullName ? 'months' : 'monthsShort'][this.getMonth()];
		};
		Date.prototype.getDayName = function(fullName) {
			return this[fullName ? 'days' : 'daysShort'][this.getDay()];
		};
		Date.prototype.toShortDateString = function() {
			return (this.getMonth()+1) + "/" + this.getDate() + "/" + this.getFullYear();
		};
		Date.prototype.addDays = function (n) {
			this.setDate(this.getDate() + n);
			this.tempDate = this.getDate();
		};
		Date.prototype.addMonths = function (n) {
			if (this.tempDate == null) {
				this.tempDate = this.getDate();
			}
			this.setDate(1);
			this.setMonth(this.getMonth() + n);
			this.setDate(Math.min(this.tempDate, this.getMaxDays()));
		};
		Date.prototype.addYears = function (n) {
			if (this.tempDate == null) {
				this.tempDate = this.getDate();
			}
			this.setDate(1);
			this.setFullYear(this.getFullYear() + n);
			this.setDate(Math.min(this.tempDate, this.getMaxDays()));
		};
		Date.prototype.getMaxDays = function() {
			var tmpDate = new Date(Date.parse(this)),
				d = 28, m;
			m = tmpDate.getMonth();
			d = 28;
			while (tmpDate.getMonth() == m) {
				d ++;
				tmpDate.setDate(d);
			}
			return d - 1;
		};
		Date.prototype.getFirstDay = function() {
			var tmpDate = new Date(Date.parse(this));
			tmpDate.setDate(1);
			return tmpDate.getDay();
		};
		Date.prototype.getWeekNumber = function() {
			var tempDate = new Date(this);
			tempDate.setDate(tempDate.getDate() - (tempDate.getDay() + 6) % 7 + 3);
			var dms = tempDate.valueOf();
			tempDate.setMonth(0);
			tempDate.setDate(4);
			return Math.round((dms - tempDate.valueOf()) / (604800000)) + 1;
		};
		Date.prototype.getDayOfYear = function() {
			var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
			var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
			var time = now - then;
			return Math.floor(time / 24*60*60*1000);
		};
		Date.prototype.GetJSONDate = function(jsonDateString) {
			//check conditions for different types of accepted dates
			
			//ISO
			
			//New constructor literal
			
			//Etc
			
			return this.tmpDate;
		};
	}
	
	jQuery.J.DrawCalendar = function(dateIn){
		var today = new Date();
		var d;
		
		if(dateIn == undefined) {
			//start from this month
			d = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			//start from the passed in date
			d = dateIn;
			d.setDate(1);
		}
		
		// Create Previous link for later
		var prevMonth = d.getMonth() == 0 ? new Date(d.getFullYear()-1, 11, 1) : new Date(d.getFullYear(), d.getMonth()-1, 1);
		var prevLink = jQuery('<div class="MonthNavPrev"><a href="" class="link-prev">&lsaquo; '+ defaults.navLinks.p +'</a></div>').click(function() {
			jQuery.J.ChangeMonth(prevMonth);
			return false;
		});
		
		//Create Next link for later
		var nextMonth = d.getMonth() == 11 ? new Date(d.getFullYear()+1, 0, 1) : new Date(d.getFullYear(), d.getMonth()+1, 1);
		var nextLink = jQuery('<div class="MonthNavNext"><a href="" class="link-next">'+ defaults.navLinks.n +' &rsaquo;</a></div>').click(function() {
			jQuery.J.ChangeMonth(nextMonth);
			return false;
		});
		
		var todayLink = jQuery('<a href="" class="link-today">'+ defaults.navLinks.t +'</a>').click(function() {
			jQuery.MonthCalendar.changeMonth(today, this);
			return false;
		});

		//Build up the Header first
		//  Navigation
		var navRow = jQuery('<tr><td colspan="7"><div class="FormHeader MonthNavigation"></div></td></tr>');
		jQuery('.MonthNavigation', navRow).append(nextLink);
		jQuery('.MonthNavigation', navRow).append(prevLink);
		jQuery('.MonthNavigation', navRow).append(jQuery('<div class="MonthName"></div>').append(defaults.locale.months[d.getMonth()] + " " + d.getFullYear()));
		
		//  Days
		var headRow = jQuery("<tr></tr>");
		for (var i=defaults.firstDayOfWeek; i<defaults.firstDayOfWeek+7; i++) {
			var weekday = i%7;
			var wordday = defaults.locale.days[weekday];
			headRow.append('<th title="' + wordday + '" class="DateHeader' + (weekday == 0 || weekday == 6 ? ' Weekend' : '') + '"><span>' + wordday + '</span></th>');
		}
		
		headRow = jQuery("<thead id=\"CalendarHead\"></thead>").append(headRow);
		headRow = headRow.prepend(navRow);


		//Build up the Body
		var tBody = jQuery('<tbody id="CalendarBody"></tbody>');
		var isCurrentMonth = (d.getMonth() == today.getMonth() && d.getFullYear() == today.getFullYear());
		var maxDays = d.getMaxDays();
		
		
		//what is the currect day #
		var curDay = defaults.firstDayOfWeek - d.getDay();
		if (curDay > 0) curDay -= 7
		//alert(curDay);
		
		var t = (maxDays + Math.abs(curDay));
		
		_beginDate = new Date(d.getFullYear(), d.getMonth(), curDay+1);
		_endDate = new Date(d.getFullYear(), d.getMonth()+1, (7-(t %= 7)) == 7 ? 0 : (7-(t %= 7)));
		var _currentDate = new Date(_beginDate.getFullYear(), _beginDate.getMonth(), _beginDate.getDate());

		
		// Render calendar
		//<td class=\"DateBox\"><div class=\"DateLabel\"><a href=\"#\">" + val + "</a></div></td>";
		var rowCount = 0;
		do {
	  		var thisRow = jQuery("<tr></tr>");
				
			for (var i=0; i<7; i++) {
				var weekday = (defaults.firstDayOfWeek + i) % 7;
				var atts = {'class':"DateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''),
							'date':_currentDate.toShortDateString(),
							'id': getDateId(_currentDate)
				};

				if (curDay < 0 || curDay >= maxDays) {
					atts['class'] += ' Inactive';
				} else {
					d.setDate(curDay+1);
				}
					
				if (isCurrentMonth && curDay+1 == today.getDate()) {
					dayStr = curDay+1;
					atts['class'] += ' Today';
				}
					
				thisRow.append(jQuery("<td></td>").attr(atts).append('<div class="DateLabel"><a href="#">' + _currentDate.getDate() + '</a></div>'));
					
				
				curDay++;
				rowCount++;
				_currentDate.addDays(1);
			}

			tBody.append(thisRow);
		} while (curDay < maxDays);


		var a = jQuery(ids.container);
		var cal = jQuery('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>');
		cal = cal.append(headRow, tBody);
		
		a.hide();
		a.html(cal);
		
		a.fadeIn("normal");
	}
	
	var DrawEventsOnCalendar = function() {	
		if (calendarEvents && calendarEvents.length > 0) {
			jQuery.each(calendarEvents, function(){
				//Get the events that are in the month displayed.
				var ev = this;
				//Date Parse the JSON to create a new Date to work with here
				
				
				if ((ev.Date >= _beginDate) && (ev.Date <= _endDate)) {
					var cell = jQuery("#" + getDateId(ev.Date), jQuery(ids.container));
					var event = jQuery('<div class="Event" id="Event_' + ev.EventID + '"></div>');
					
					if(ev.CssClass) { event.addClass(ev.CssClass) }
					
					event.click(function() { defaults.onEventBlockClick(ev); });
					event.hover(function() { defaults.onEventBlockOver(ev); }, function() { defaults.onEventBlockOut(ev); })
					
					var link = jQuery('<a href="' + ev.URL + '">' + ev.Title + '</a>');
					
					event.append(link);
					event.hide();
					cell.append(event);
					event.fadeIn("normal");
				}
				
			});
		}
	}
	
	var ClearEventsOnCalendar = function() {
		jQuery(".Event", jQuery(ids.container)).remove();
	}
	
	
	jQuery.J.AddEvents = function(eventCollection) {
		if(eventCollection) {
			if(eventCollection.length > 1) {
				jQuery.each(eventCollection, function() {
					calendarEvents.push(this);
				});
			} else {
				//add new single event to ed of array
				calendarEvents.push(eventCollection);
			}
			ClearEventsOnCalendar();
			DrawEventsOnCalendar();
		}
	}
	
	jQuery.J.ReplaceEventCollection = function(eventCollection) {
		if(eventCollection) {
			calendarEvents = eventCollection;
		}
	}
	
	jQuery.J.ChangeMonth = function(dateIn) {
		defaults.onMonthChanging(dateIn);
		jQuery.J.DrawCalendar(dateIn);
		defaults.onMonthChanged(dateIn);
		DrawEventsOnCalendar();
	}
	
	jQuery.J.Initialize = function(options, events) {
		var today = new Date();
		
		options = jQuery.extend(defaults, options);
		jQuery.J.ExtendDate(options);
		
		jQuery.J.DrawCalendar();
		
		if(events)
		{
			calendarEvents = events;
			//Load for the current month
			DrawEventsOnCalendar();
		}
	};
})(jQuery);