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
	var _eventObj = {};
	
	var _workingDate = null;
	var _daysInMonth = 0;
	var _firstOfMonth = null;
	var _lastOfMonth = null;
	var _gridOffset = 0;
	var _totalDates = 0;
	var _gridRows = 0;
	var _totalBoxes = 0;
	var _dateRange = { startDate: null, endDate: null };
	
	
	var calendarEvents = [];
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
				t:'Today',
				showMore: 'Show More'
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
		_eventObj = {};
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
		_gridOffset = _firstOfMonth.getDay() - defaults.firstDayOfWeek;  //alert("offset: " + _gridOffset);
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
		now.clearTime();
		
		var today = defaults.calendarStartDate;
		
		ClearBoxes();
		
		InitDates(dateIn);
		var headerRow = InitHeaders();
		
		//properties
		var isCurrentMonth = (_workingDate.getMonth() == today.getMonth() && _workingDate.getFullYear() == today.getFullYear());
		var containerHeight = jQuery(defaults.containerId).outerHeight();
		var rowHeight = (containerHeight - defaults.headerHeight) / _gridRows;
		var row = null;

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
				defaults.onDayLinkClick(currentDate);
				e.stopPropagation();
			});
			
			var dateBox = jQuery("<td></td>").attr(atts).append(dateLink).dblclick(function(e) {
				defaults.onDayCellDblClick(currentDate);
				e.stopPropagation();
			}).click(function(e) {
				defaults.onDayCellClick(currentDate);
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
						defaults.onEventDropped(event, new Date($(this).attr("date")));
						return false;
					}
				});
			}
			
			_boxes.push(new CalendarBox(i, currentDate, dateBox, dateLink));
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
		
		if (calendarEvents && calendarEvents.length > 0) {
			var container = jQuery(defaults.containerId);			
			
			jQuery.each(calendarEvents, function(){
				var ev = this;
				
				var tempStartDT = ev.StartDateTime.clone().clearTime();
				var tempEndDT = ev.EndDateTime.clone().clearTime();
				
				var startI = new TimeSpan(tempStartDT - _dateRange.startDate).days;
				var endI = new TimeSpan(tempEndDT - _dateRange.startDate).days;
				//alert("start I: " + startI + " end I: " + endI);
				
				var istart = (startI < 0) ? 0 : startI;
				var iend = (endI > _boxes.length - 1) ? _boxes.length - 1 : endI;
				//alert("istart: " + istart + " iend: " + iend);
				
				
				for (var i = istart; i <= iend; i++) {
					var b = _boxes[i];

					var startBoxCompare = ev.StartDateTime.compareTo(b.date);
					var endBoxCompare = ev.EndDateTime.compareTo(b.date);
					
					var continueEvent = (i != 0 && startBoxCompare == -1 && endBoxCompare >= 0 && b.weekNumber != _boxes[i - 1].weekNumber);
					var toManyEvents = (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || 
										continueEvent || (startBoxCompare == -1 && endBoxCompare >= 0)) && b.vOffset >= (b.getCellBox().height() - 32); //todo: find height of boxes or more link.
					
					//alert(continueEvent);
					//alert(toManyEvents);
					
					if (toManyEvents) {
						if (!b.isTooManySet) {
							var moreDiv = jQuery('<div class="MoreEvents" id="ME_' + i + '">' + defaults.navLinks.showMore + '</div>');
							var pos = b.getCellPosition();

							moreDiv.css({ "top" : pos.top + b.getLabelHeight() + b.vOffset, "left" : pos.left, "width" : b.getLabelWidth() - 7 });
							
							//TODO: add click event handler in order to display events for the box (pass box event array) ?? display
							
							_eventObj[moreDiv.attr("id")] = moreDiv;
							b.isTooManySet = true;
						}						
						b.events.push(ev);
					} else if (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || continueEvent) {
						var block = _buildEventBlock(ev, b.weekNumber);						
						var pos = b.getCellPosition();
						
						block.css({ "top" : pos.top + b.getLabelHeight() + b.vOffset, "left" : pos.left, "width" : b.getLabelWidth() - 7});
						
						if (continueEvent) {
							block.prepend(jQuery('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-w"));
							
							var e = _eventObj['Event_' + ev.EventID + '_' + (b.weekNumber - 1)];
							if (e) { e.prepend(jQuery('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
						}
						
						_eventObj[block.attr("id")] = block;
						
						b.events.push(ev);
					} else if (startBoxCompare == -1 && endBoxCompare >= 0) {
						var e = _eventObj['Event_' + ev.EventID + '_' + b.weekNumber];
						if (e) {
							var w = e.css("width")
							e.css({ "width" : (parseInt(w) + b.getLabelWidth() + 1) });
							b.vOffset = e.vOffset
							b.events.push(ev);
						}
					}					
				}
			});
			
			for (var o in _eventObj) {
				_eventObj[o].hide();
				container.append(_eventObj[o]);
				_eventObj[o].fadeIn("normal");
			}
		}
	}
	
	var _buildEventBlock = function(event, weekNumber) {
		var block = jQuery('<div class="Event" id="Event_' + event.EventID + '_' + weekNumber + '"></div>');
		
		if(event.CssClass) { block.addClass(event.CssClass) }
		block.click(function(e) { defaults.onEventBlockClick(event); e.stopPropagation(); });
		block.hover(function() { defaults.onEventBlockOver(event); }, function() { defaults.onEventBlockOut(event); })
		if (defaults.dragableEvents) { block.draggable({ containment: '#CalendarBody' }); }
		
		var link = jQuery('<a href="' + event.URL + '">' + event.Title + '</a>');
		link.click(function(e) { defaults.onEventLinkClick(event); e.stopPropagation();	});
		
		block.append(link);
		
		return block;
	}	

	
	jQuery.J.ClearEventsOnCalendar = function() {
		ClearBoxes();
		jQuery(".Event", jQuery(defaults.containerId)).remove();
		jQuery(".MoreEvents", jQuery(defaults.containerId)).remove();
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


function CalendarBox(id, boxDate, cell, label) {
	this.id = id;
	this.date = boxDate;
	this.cell = cell;
	this.label = label;
	this.weekNumber = Math.floor(id / 7);
	this.events= [];
	this.isTooMannySet = false;
	this.vOffset = 0;
	
	this.echo = function() {
		alert("Date: " + this.date + " WeekNumber: " + this.weekNumber + " ID: " + this.id);
	}
	
	this.clear = function() {
		this.events = [];
		this.isTooMannySet = false;
	}
	
	this.getCellPosition = function() {
		if (this.cell) { 
			return this.cell.position();
		}
		return;
	}
	
	this.getCellBox = function() {
		if (this.cell) { 
			return this.cell;
		}
		return;
	}
	
	this.getLabelWidth = function() {
		if (this.label) {
			return this.label.innerWidth();
		}
		return;
	}
	
	this.getLabelHeight = function() {
		if (this.label) { 
			return this.label.height();
		}
		return;
	}
	
	this.getDate = function() {
		return this.date;
	}
}