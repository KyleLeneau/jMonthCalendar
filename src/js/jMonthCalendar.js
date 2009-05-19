/*!
* Title:  jMonthCalendar @VERSION
* Dependencies:  jQuery 1.3.0 +
* Author:  Kyle LeNeau
* Email:  kyle.leneau@gmail.com
* Project Hompage:  http://www.bytecyclist.com/projects/jmonthcalendar
* Source:  http://code.google.com/p/jmonthcalendar
*
*/

(function($) {
	var _beginDate;
	var _endDate;
	var _boxes = [];
	
	var _workingDate = null;
	var _daysInMonth = 0;
	var _firstOfMonth = null;
	var _lastOfMonth = null;
	var _gridOffset = 0;
	var _totalDates = 0;
	var _gridRows = 0;
	var _totalBoxes = 0;
	var _dateRange = { startDate: null, endDate: null };
	
	
	var calendarEvents;
	var defaults = {
			containerId: "#jMonthCalendar",
			headerHeight: 50,
			firstDayOfWeek: 0,
			calendarStartDate:new Date(),
			dragableEvents: false,
			activeDroppableClass: false,
			hoverDroppableClass: false,
			navLinks: {
				enableToday: true,
				enableNextYear: true,
				enablePrevYear: true,
				p:'&lsaquo; Prev', 
				n:'Next &rsaquo;', 
				t:'Today'
			},
			onMonthChanging: function(dateIn) { return true; },
			onMonthChanged: function(dateIn) { return true; },
			onEventLinkClick: function(event) { return true; },
			onEventBlockClick: function(event) { return true; },
			onEventBlockOver: function(event) { return true; },
			onEventBlockOut: function(event) { return true; },
			onDayLinkClick: function(date) { return true; },
			onDayCellClick: function(date) { return true; },
			onDayCellDblClick: function(dateIn) { return true; },
			onEventDropped: function(event, newDate) { return true; },
			locale: {
				days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
				months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
				monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
				weekMin: 'wk'
			}
		};
		
	jQuery.jMonthCalendar = jQuery.J = function() {};
	
	var getDateFromId = function(dateIdString) {
		//c_01012009		
		return new Date(dateIdString.substring(6, 10), dateIdString.substring(2, 4)-1, dateIdString.substring(4, 6));
	};
	
	var getDateId = function(date) {
		var month = ((date.getMonth()+1)<10) ? "0" + (date.getMonth()+1) : (date.getMonth()+1);
		var day = (date.getDate() < 10) ? "0" + date.getDate() : date.getDate();
		return "c_" + month + day + date.getFullYear();
	};
	
	var GetJSONDate = function(jsonDateString) {
		//check conditions for different types of accepted dates
		var tDt, k;
		if (typeof jsonDateString == "string") {
			
			//  "2008-12-28T00:00:00.0000000"
			var isoRegPlus = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}).([0-9]{7})$/;
			
			//  "2008-12-28T00:00:00"
			var isoReg = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
		
			//"2008-12-28"
			var yyyyMMdd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
			
			//  "new Date(2009, 1, 1)"
			//  "new Date(1230444000000)
			var newReg = /^new/;
			
			//  "\/Date(1234418400000-0600)\/"
			var stdReg = /^\\\/Date\(([0-9]{13})-([0-9]{4})\)\\\/$/;
			
			if (k = jsonDateString.match(isoRegPlus)) {
				return new Date(k[1],k[2]-1,k[3]);
			} else if (k = jsonDateString.match(isoReg)) {
				return new Date(k[1],k[2]-1,k[3]);
			} else if (k = jsonDateString.match(yyyyMMdd)) {
				return new Date(k[1],k[2]-1,k[3]);
			}
			
			if (k = jsonDateString.match(stdReg)) {
				return new Date(k[1]);
			}
			
			if (k = jsonDateString.match(newReg)) {
				return eval('(' + jsonDateString + ')');
			}
			
			return tdt;
		}
	};
	
	//This function will clean the JSON array, primaryly the dates and put the correct ones in the object.  Intended to alwasy be called on event functions.
	var FilterEventCollection = function() {
		if (calendarEvents && calendarEvents.length > 0) {
			jQuery.each(calendarEvents, function(){
				var ev = this;
				//Date Parse the JSON to create a new Date to work with here				
				if(ev.StartDateTime) {
					if (typeof ev.StartDateTime == 'object' && ev.StartDateTime.getDate) { this.StartDateTime = ev.StartDateTime; }
					if (typeof ev.StartDateTime == 'string' && ev.StartDateTime.split) { this.StartDateTime = GetJSONDate(ev.StartDateTime); }
				} else if(ev.Date) { // DEPRECATED
					if (typeof ev.Date == 'object' && ev.Date.getDate) { this.StartDateTime = ev.Date; }
					if (typeof ev.Date == 'string' && ev.Date.split) { this.StartDateTime = GetJSONDate(ev.Date); }
				} else {
					return;  //no start date, or legacy date. no event.
				}
				
				if(ev.EndDateTime) {
					if (typeof ev.EndDateTime == 'object' && ev.EndDateTime.getDate) { this.EndDateTime = ev.EndDateTime; }
					if (typeof ev.EndDateTime == 'string' && ev.EndDateTime.split) { this.EndDateTime = GetJSONDate(ev.EndDateTime); }
				} else {
					this.EndDateTime = ev.StartDateTime;
				}
			});
		}
	};
	
	var ClearBoxes = function() {
		for (var i = 0; i < _boxes.length; i++) {
			_boxes[i].clear();
		}
		_boxes = [];
	};
	
	var InitDates = function(dateIn) {
		var today = defaults.calendarStartDate;
		if(dateIn == undefined) {
			//start from this month
			_workingDate = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			//start from the passed in date
			_workingDate = dateIn;
			_workingDate.setDate(1);
		}
		
		_daysInMonth = _workingDate.getDaysInMonth();  //alert("days in month: " + _daysInMonth);
		_firstOfMonth = _workingDate.clone().moveToFirstDayOfMonth();  //alert("first day of month: " + _firstOfMonth);
		_lastOfMonth = _workingDate.clone().moveToLastDayOfMonth();  //alert("last day of month: " + _lastOfMonth);
		_gridOffset = _firstOfMonth.getDay();  //alert("offset: " + _gridOffset);
		_totalDates = _gridOffset + _daysInMonth;  //alert("total dates: " + _totalDates);
		_gridRows = Math.ceil(_totalDates / 7);  //alert("grid rows: " + _gridRows);
		_totalBoxes = _gridRows * 7;  //alert("total boxes: " + _totalBoxes);
		
		_dateRange.startDate = _firstOfMonth.clone().addDays((-1) * _gridOffset);
		//alert("dateRange startdate: " + _dateRange.startDate);
		
		_dateRange.endDate = _lastOfMonth.clone().addDays(_totalBoxes - (_daysInMonth + _gridOffset));
		//alert("dateRange enddate: " + _dateRange.endDate);
	};
	
	var InitHeaders = function() {
		// Create Previous Month link for later
		var prevMonth = _workingDate.clone().addMonths(-1);
		var prevMLink = jQuery('<div class="MonthNavPrev"><a href="" class="link-prev">'+ defaults.navLinks.p +'</a></div>').click(function() {
			jQuery.J.ChangeMonth(prevMonth);
			return false;
		});
		
		//Create Next Month link for later
		var nextMonth = _workingDate.clone().addMonths(1);
		var nextMLink = jQuery('<div class="MonthNavNext"><a href="" class="link-next">'+ defaults.navLinks.n +'</a></div>').click(function() {
			jQuery.J.ChangeMonth(nextMonth);
			return false;
		});
		
		//Create Previous Year link for later
		var prevYear = _workingDate.clone().addYears(-1);
		var prevYLink;
		if(defaults.navLinks.enablePrevYear) {
			prevYLink = jQuery('<div class="YearNavPrev"><a href="">'+ prevYear.getFullYear() +'</a></div>').click(function() {
				jQuery.J.ChangeMonth(prevYear);
				return false;
			});
		}
		
		//Create Next Year link for later
		var nextYear = _workingDate.clone().addYears(1);
		var nextYLink;
		if(defaults.navLinks.enableNextYear) {
			nextYLink = jQuery('<div class="YearNavNext"><a href="">'+ nextYear.getFullYear() +'</a></div>').click(function() {
				jQuery.J.ChangeMonth(nextYear);
				return false;
			});
		}
		
		var todayLink;
		if(defaults.navLinks.enableToday) {
			//Create Today link for later
			todayLink = jQuery('<div class="TodayLink"><a href="" class="link-today">'+ defaults.navLinks.t +'</a></div>').click(function() {
				jQuery.J.ChangeMonth(new Date());
				return false;
			});
		}

		//Build up the Header first,  Navigation
		var navRow = jQuery('<tr><td colspan="7"><div class="FormHeader MonthNavigation"></div></td></tr>');
		var monthNavHead = jQuery('.MonthNavigation', navRow);
		
		monthNavHead.append(prevMLink, nextMLink);
		if(defaults.navLinks.enableToday) { monthNavHead.append(todayLink); }

		monthNavHead.append(jQuery('<div class="MonthName"></div>').append(defaults.locale.months[_workingDate.getMonth()] + " " + _workingDate.getFullYear()));
		
		if(defaults.navLinks.enablePrevYear) { monthNavHead.append(prevYLink); }
		if(defaults.navLinks.enableNextYear) { monthNavHead.append(nextYLink); }
		
		
		//  Days
		var headRow = jQuery("<tr></tr>");		
		for (var i = defaults.firstDayOfWeek; i < defaults.firstDayOfWeek+7; i++) {
			var weekday = i % 7;
			var wordday = defaults.locale.days[weekday];
			headRow.append('<th title="' + wordday + '" class="DateHeader' + (weekday == 0 || weekday == 6 ? ' Weekend' : '') + '"><span>' + wordday + '</span></th>');
		}
		
		headRow = jQuery("<thead id=\"CalendarHead\"></thead>").css({ "height" : defaults.headerHeight + "px" }).append(headRow);
		headRow = headRow.prepend(navRow);
		return headRow;
	};
	
	
	
	jQuery.J.DrawCalendar = function(dateIn){
		var now = new Date();
		now.setHours(0,0,0,0);
		
		var today = defaults.calendarStartDate;
		
		ClearBoxes();
		
		InitDates(dateIn);
		var headerRow = InitHeaders();
		
		//properties
		var isCurrentMonth = (_workingDate.getMonth() == today.getMonth() && _workingDate.getFullYear() == today.getFullYear());
		var containerHeight = jQuery(defaults.containerId).outerHeight();
		var rowHeight = (containerHeight - defaults.headerHeight) / _gridRows;
		var row = null;

		alert("container height: " + containerHeight);		
		alert("header height: " + defaults.headerHeight);
		alert("rowHeight=" + rowHeight);
		
		
		//Build up the Body
		var tBody = jQuery('<tbody id="CalendarBody"></tbody>');
		
		for (var i = 0; i < _totalBoxes; i++) {
			var currentDate = _dateRange.startDate.clone().addDays(i);
			if (i % 7 == 0 || i == 0) {
				row = jQuery("<tr></tr>");
				row.css({ "height" : rowHeight + "px" });
				tBody.append(row);
			}
			
			var weekday = (defaults.firstDayOfWeek + i) % 7;
			var atts = {'class':"DateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''),
						'date':currentDate.toString("M/d/yyyy"),
						'id': getDateId(currentDate)
			};
			
			//dates outside of month range.
			if (currentDate.compareTo(_firstOfMonth) == -1 || currentDate.compareTo(_lastOfMonth) == 1) {
				atts['class'] += ' Inactive';
			}
			
			//check to see if current date rendering is today
			if (currentDate.compareTo(now) == 0) { 
				atts['class'] += ' Today';
			}
			
			//DateBox Events
			var dateLink = jQuery('<div class="DateLabel"><a href="">' + currentDate.getDate() + '</a></div>').click(function(e) {
				defaults.onDayLinkClick(new Date($(this).parent().attr("date")));
				e.stopPropagation();
			});
			
			var dateBox = jQuery("<td></td>").attr(atts).append(dateLink).dblclick(function(e) {
				defaults.onDayCellDblClick(new Date($(this).attr("date")));
				e.stopPropagation();
			}).click(function(e) {
				defaults.onDayCellClick(new Date($(this).attr("date")));
				e.stopPropagation();
			});
			
			if (defaults.dragableEvents) {
				dateBox.droppable({
					hoverClass: defaults.hoverDroppableClass,
					activeClass: defaults.activeDroppableClass,
					drop: function(e, ui) {
						ui.draggable.attr("style", "position: relative; display: block;");
						$(this).append(ui.draggable);
						var event;
						$.each(calendarEvents, function() {
							if (this.EventID == ui.draggable.attr("id")) {
								event = this;
							}
						});
						defaults.onEventDropped(event, $(this).attr("date"));
						return false;
					}
				});
			}
			
			_boxes.push(new DateBox(i, currentDate, dateBox, dateLink));
			row.append(dateBox);
		}
		tBody.append(row);

		var a = jQuery(defaults.containerId);
		var cal = jQuery('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>').append(headerRow, tBody);
		
		a.hide();
		a.html(cal);
		a.fadeIn("normal");
		
		DrawEventsOnCalendar();
	}
	
	var DrawEventsOnCalendar = function() {
		//filter the JSON array for proper dates
		FilterEventCollection();
		
		//for(var i = 0; i < _boxes.length; i++) {
		//	_boxes[i].echo();
		//}
		
		if (calendarEvents && calendarEvents.length > 0) {
			var label = jQuery(".DateLabel:first", defaults.containerId);
			var container = jQuery(defaults.containerId);
			
			
			jQuery.each(calendarEvents, function(){
				var ev = this;				
				//Date Parse the JSON to create a new Date to work with here
				var sDt = ev.StartDateTime;
				var eDt = ev.EndDateTime;
				
				
				if(sDt) {
					if (sDt.between(_dateRange.startDate, _dateRange.endDate)) {
					
						var multi = false;
						var daysBetween = 0;
						//One Day in Milliseconds
						var oneDay = 1000 * 60 * 60 * 24;
						
						if (eDt.compareTo(sDt) == 1) {
							daysBetween = (eDt - sDt) / oneDay;
						}
						if (daysBetween >= 1) {
							multi = true;
							alert("multi day event: " + daysBetween);
							RenderMultiDayEvent(daysBetween, ev);
						} else {
							RenderSingleDayEvent(ev);
						}
					}
				}
			});
		}
	}
	
	var RenderSingleDayEvent = function(ev) {
		var container = jQuery(defaults.containerId);
		var label = jQuery(".DateLabel:first", defaults.containerId);
		
		var cell = jQuery("#" + getDateId(ev.StartDateTime), jQuery(defaults.containerId));
		var pos = cell.position();
		
		var event = jQuery('<div class="Event" id="Event_' + ev.EventID + '"></div>');		
		event.css({ "top" : pos.top + label.height(), "left" : pos.left, "width" : label.innerWidth() - 7 });		
		
		var link = jQuery('<a href="' + ev.URL + '">' + ev.Title + '</a>');
		link.click(function(e) {
			defaults.onEventLinkClick(ev);
			e.stopPropagation();
		});
		event.append(link);
		
		if(ev.CssClass) { event.addClass(ev.CssClass) }
		event.click(function(e) { 
			defaults.onEventBlockClick(ev); 
			e.stopPropagation(); 
		});
		event.hover(function() { defaults.onEventBlockOver(ev); }, function() { defaults.onEventBlockOut(ev); })
		
		if (defaults.dragableEvents) {
			event.draggable({ containment: '#CalendarBody' });
		}
		
		event.hide();
		container.append(event);
		event.fadeIn("normal");
	}
	
	var RenderMultiDayEvent = function(daysBetween, ev) {
		var container = jQuery(defaults.containerId);
		var label = jQuery(".DateLabel:first", defaults.containerId);
		
		var cell = jQuery("#" + getDateId(ev.StartDateTime), jQuery(defaults.containerId));
		var pos = cell.position();
		
		//get the position and width of the event
		var top = pos.top + label.height();
		var left = pos.left;
		var width = (label.innerWidth() * (daysBetween + 1)) - (7 - daysBetween);
	
	
		var event = jQuery('<div class="Event" id="Event_' + ev.EventID + '"></div>');		
		event.css({ "top" : top, "left" : left, "width" : width });
	
	
		var link = jQuery('<a href="' + ev.URL + '">' + ev.Title + '</a>');
		link.click(function(e) {
			defaults.onEventLinkClick(ev);
			e.stopPropagation();
		});
		event.append(link);
		
		if(ev.CssClass) { event.addClass(ev.CssClass) }
		event.click(function(e) { 
			defaults.onEventBlockClick(ev); 
			e.stopPropagation(); 
		});
		event.hover(function() { defaults.onEventBlockOver(ev); }, function() { defaults.onEventBlockOut(ev); })
		
		if (defaults.dragableEvents) {
			event.draggable({ containment: '#CalendarBody' });
		}
		
		event.hide();
		container.append(event);
		event.fadeIn("normal");
	}
	

	
	jQuery.J.ClearEventsOnCalendar = function() {
		ClearBoxes();
		jQuery(".Event", jQuery(defaults.containerId)).remove();
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
			jQuery.J.ClearEventsOnCalendar();
			DrawEventsOnCalendar();
		}
	}
	
	jQuery.J.ReplaceEventCollection = function(eventCollection) {
		if(eventCollection) {
			calendarEvents = eventCollection;
		}
	}
	
	jQuery.J.ChangeMonth = function(dateIn) {
		if (defaults.onMonthChanging(dateIn)) {
			jQuery.J.DrawCalendar(dateIn);
			defaults.onMonthChanged(dateIn);
		}
	}
	
	jQuery.J.Initialize = function(options, events) {
		var today = new Date();
		
		options = jQuery.extend(defaults, options);
		
		if (events) { calendarEvents = events; }
		
		jQuery.J.DrawCalendar();
	};
})(jQuery);


function DateBox(id, boxDate, cell, label) {
	this.id = id;
	this.date = boxDate;
	this.cell = cell;
	this.label = label;
	this.events= [];
	this.isTooMannySet = false;
	
	this.echo = function() {
		alert(this.date);
	}
	
	this.clear = function() {
		this.events = [];
		this.isTooMannySet = false;
	}
	
	this.getCellPosition = function() {
		if (!this.cell) { return this.cell.position(); }
		return;
	}
	
	this.getCellBox = function() {
		if (!this.cell) { return this.cell; }
		return;
	}
	
	this.getLabelHeight = function() {
		if (!this.label) { return this.label.height(); }
		return;
	}
	
	this.getDate = function() {
		return this.date;
	}
}