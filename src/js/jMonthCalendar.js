/*!
* Title:  jMonthCalendar @VERSION
* Dependencies:  jQuery 1.3.0 +
* Author:  Kyle LeNeau
* Email:  kyle.leneau@gmail.com
* Project Hompage:  http://www.bytecyclist.com/projects/jmonthcalendar
* Source:  http://github.com/KyleLeneau/jMonthCalendar
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
	
	
	var cEvents = [];
	var def = {
			containerId: "#jMonthCalendar",
			headerHeight: 50,
			firstDayOfWeek: 0,
			calendarStartDate:new Date(),
			dragableEvents: true,
			dragHoverClass: 'DateBoxOver',
			navLinks: {
				enableToday: true,
				enableNextYear: true,
				enablePrevYear: true,
				p:'&lsaquo; Prev', 
				n:'Next &rsaquo;', 
				t:'Today',
				showMore: 'Show More'
			},
			onMonthChanging: function() {},
			onMonthChanged: function() {},
			onEventLinkClick: function() {},
			onEventBlockClick: function() {},
			onEventBlockOver: function() {},
			onEventBlockOut: function() {},
			onDayLinkClick: function() {},
			onDayCellClick: function() {},
			onDayCellDblClick: function() {},
			onEventDropped: function() {},
			onShowMoreClick: function() {}
		};
		
	$.jMonthCalendar = $.J = function() {};
	
	var _getJSONDate = function(dateStr) {
		//check conditions for different types of accepted dates
		var tDt, k;
		if (typeof dateStr == "string") {
			
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
			
			if (k = dateStr.match(isoRegPlus)) {
				return new Date(k[1],k[2]-1,k[3],k[4],k[5],k[6]);
			} else if (k = dateStr.match(isoReg)) {
				return new Date(k[1],k[2]-1,k[3],k[4],k[5],k[6]);
			} else if (k = dateStr.match(yyyyMMdd)) {
				return new Date(k[1],k[2]-1,k[3]);
			}
			
			if (k = dateStr.match(stdReg)) {
				return new Date(k[1]);
			}
			
			if (k = dateStr.match(newReg)) {
				return eval('(' + dateStr + ')');
			}
			
			return tDt;
		}
	};
	
	//This function will clean the JSON array, primaryly the dates and put the correct ones in the object.  Intended to alwasy be called on event functions.
	var _filterEventCollection = function() {
		if (cEvents && cEvents.length > 0) {
			var multi = [];
			var single = [];
			
			//Update and parse all the dates
			$.each(cEvents, function(){
				var ev = this;
				//Date Parse the JSON to create a new Date to work with here				
				if(ev.StartDateTime) {
					if (typeof ev.StartDateTime == 'object' && ev.StartDateTime.getDate) { this.StartDateTime = ev.StartDateTime; }
					if (typeof ev.StartDateTime == 'string' && ev.StartDateTime.split) { this.StartDateTime = _getJSONDate(ev.StartDateTime); }
				} else if(ev.Date) { // DEPRECATED
					if (typeof ev.Date == 'object' && ev.Date.getDate) { this.StartDateTime = ev.Date; }
					if (typeof ev.Date == 'string' && ev.Date.split) { this.StartDateTime = _getJSONDate(ev.Date); }
				} else {
					return;  //no start date, or legacy date. no event.
				}
				
				if(ev.EndDateTime) {
					if (typeof ev.EndDateTime == 'object' && ev.EndDateTime.getDate) { this.EndDateTime = ev.EndDateTime; }
					if (typeof ev.EndDateTime == 'string' && ev.EndDateTime.split) { this.EndDateTime = _getJSONDate(ev.EndDateTime); }
				} else {
					this.EndDateTime = this.StartDateTime.clone();
				}
				
				if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == 0) {
					single.push(this);
				} else if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == -1) {
					multi.push(this);
				}
			});
			
			multi.sort(_eventSort);
			single.sort(_eventSort);
			cEvents = [];
			$.merge(cEvents, multi);
			$.merge(cEvents, single);
		}
	};
	
	var _eventSort = function(a, b) {
		return a.StartDateTime.compareTo(b.StartDateTime);
	};
	
	var _clearBoxes = function() {
		_clearBoxEvents();
		_boxes = [];
	};
	
	var _clearBoxEvents = function() {
		for (var i = 0; i < _boxes.length; i++) {
			_boxes[i].clear();
		}
		_eventObj = {};
	};
	
	var _initDates = function(dateIn) {
		var today = def.calendarStartDate;
		if(dateIn == undefined) {
			_workingDate = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			_workingDate = dateIn;
			_workingDate.setDate(1);
		}
		
		_daysInMonth = _workingDate.getDaysInMonth();
		_firstOfMonth = _workingDate.clone().moveToFirstDayOfMonth();
		_lastOfMonth = _workingDate.clone().moveToLastDayOfMonth();
		_gridOffset = _firstOfMonth.getDay() - def.firstDayOfWeek;
		_totalDates = _gridOffset + _daysInMonth;
		_gridRows = Math.ceil(_totalDates / 7);
		_totalBoxes = _gridRows * 7;
		
		_dateRange.startDate = _firstOfMonth.clone().addDays((-1) * _gridOffset);
		
		_dateRange.endDate = _lastOfMonth.clone().addDays(_totalBoxes - (_daysInMonth + _gridOffset));
	};
	
	var _initHeaders = function() {
		// Create Previous Month link for later
		var prevMonth = _workingDate.clone().addMonths(-1);
		var prevMLink = $('<div class="MonthNavPrev"><a class="link-prev">'+ def.navLinks.p +'</a></div>').click(function() {
			$.J.ChangeMonth(prevMonth);
			return false;
		});
		
		//Create Next Month link for later
		var nextMonth = _workingDate.clone().addMonths(1);
		var nextMLink = $('<div class="MonthNavNext"><a class="link-next">'+ def.navLinks.n +'</a></div>').click(function() {
			$.J.ChangeMonth(nextMonth);
			return false;
		});
		
		//Create Previous Year link for later
		var prevYear = _workingDate.clone().addYears(-1);
		var prevYLink;
		if(def.navLinks.enablePrevYear) {
			prevYLink = $('<div class="YearNavPrev"><a>'+ prevYear.getFullYear() +'</a></div>').click(function() {
				$.J.ChangeMonth(prevYear);
				return false;
			});
		}
		
		//Create Next Year link for later
		var nextYear = _workingDate.clone().addYears(1);
		var nextYLink;
		if(def.navLinks.enableNextYear) {
			nextYLink = $('<div class="YearNavNext"><a>'+ nextYear.getFullYear() +'</a></div>').click(function() {
				$.J.ChangeMonth(nextYear);
				return false;
			});
		}
		
		var todayLink;
		if(def.navLinks.enableToday) {
			//Create Today link for later
			todayLink = $('<div class="TodayLink"><a class="link-today">'+ def.navLinks.t +'</a></div>').click(function() {
				$.J.ChangeMonth(new Date());
				return false;
			});
		}

		//Build up the Header first,  Navigation
		var navRow = $('<tr><td colspan="7"><div class="FormHeader MonthNavigation"></div></td></tr>');
		var navHead = $('.MonthNavigation', navRow);
		
		navHead.append(prevMLink, nextMLink);
		if(def.navLinks.enableToday) { navHead.append(todayLink); }

		navHead.append($('<div class="MonthName"></div>').append(Date.CultureInfo.monthNames[_workingDate.getMonth()] + " " + _workingDate.getFullYear()));
		
		if(def.navLinks.enablePrevYear) { navHead.append(prevYLink); }
		if(def.navLinks.enableNextYear) { navHead.append(nextYLink); }
		
		
		//  Days
		var headRow = $("<tr></tr>");		
		for (var i = def.firstDayOfWeek; i < def.firstDayOfWeek+7; i++) {
			var weekday = i % 7;
			var wordday = Date.CultureInfo.dayNames[weekday];
			headRow.append('<th title="' + wordday + '" class="DateHeader' + (weekday == 0 || weekday == 6 ? ' Weekend' : '') + '"><span>' + wordday + '</span></th>');
		}
		
		headRow = $("<thead id=\"CalendarHead\"></thead>").css({ "height" : def.headerHeight + "px" }).append(headRow);
		headRow = headRow.prepend(navRow);
		return headRow;
	};
	
	
	
	$.J.DrawCalendar = function(dateIn){
		var now = new Date();
		now.clearTime();
		
		var today = def.calendarStartDate;
		
		_clearBoxes();
		
		_initDates(dateIn);
		var headerRow = _initHeaders();
		
		//properties
		var isCurrentMonth = (_workingDate.getMonth() == today.getMonth() && _workingDate.getFullYear() == today.getFullYear());
		var containerHeight = $(def.containerId).outerHeight();
		var rowHeight = (containerHeight - def.headerHeight) / _gridRows;
		var row = null;

		//Build up the Body
		var tBody = $('<tbody id="CalendarBody"></tbody>');
		
		for (var i = 0; i < _totalBoxes; i++) {
			var currentDate = _dateRange.startDate.clone().addDays(i);
			if (i % 7 == 0 || i == 0) {
				row = $("<tr></tr>");
				row.css({ "height" : rowHeight + "px" });
				tBody.append(row);
			}
			
			var weekday = (def.firstDayOfWeek + i) % 7;
			var atts = {'class':"DateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''),
						'date':currentDate.toString("M/d/yyyy")
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
			var dateLink = $('<div class="DateLabel"><a>' + currentDate.getDate() + '</a></div>');
			dateLink.bind('click', { Date: currentDate.clone() }, def.onDayLinkClick);
			
			var dateBox = $("<td></td>").attr(atts).append(dateLink);
			dateBox.bind('dblclick', { Date: currentDate.clone() }, def.onDayCellDblClick);
			dateBox.bind('click', { Date: currentDate.clone() }, def.onDayCellClick);
			
			if (def.dragableEvents) {
				dateBox.droppable({
					hoverClass: def.dragHoverClass,
					tolerance: 'pointer',
					drop: function(ev, ui) {
						var eventId = ui.draggable.attr("eventid")
						var newDate = new Date($(this).attr("date")).clearTime();
						
						var event;
						$.each(cEvents, function() {
							if (this.EventID == eventId) {
								var days = new TimeSpan(newDate - this.StartDateTime).days;
								
								this.StartDateTime.addDays(days);
								this.EndDateTime.addDays(days);
																
								event = this;
							}
						});
						
						$.J.ClearEventsOnCalendar();
						_drawEventsOnCalendar();
						
						def.onEventDropped.call(this, event, newDate);
					}
				});
			}
			
			_boxes.push(new CalendarBox(i, currentDate, dateBox, dateLink));
			row.append(dateBox);
		}
		tBody.append(row);

		var a = $(def.containerId);
		var cal = $('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>').append(headerRow, tBody);
		
		a.hide();
		a.html(cal);
		a.fadeIn("normal");
		
		_drawEventsOnCalendar();
	}
	
	var _drawEventsOnCalendar = function() {
		//filter the JSON array for proper dates
		_filterEventCollection();
		_clearBoxEvents();
		
		if (cEvents && cEvents.length > 0) {
			var container = $(def.containerId);			
			
			$.each(cEvents, function(){
				var ev = this;
				//alert("eventID: " + ev.EventID + ", start: " + ev.StartDateTime + ",end: " + ev.EndDateTime);
				
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

					var startBoxCompare = tempStartDT.compareTo(b.date);
					var endBoxCompare = tempEndDT.compareTo(b.date);

					var continueEvent = ((i != 0 && startBoxCompare == -1 && endBoxCompare >= 0 && b.weekNumber != _boxes[i - 1].weekNumber) || (i == 0 && startBoxCompare == -1));
					var toManyEvents = (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || 
										continueEvent || (startBoxCompare == -1 && endBoxCompare >= 0)) && b.vOffset >= (b.getCellBox().height() - b.getLabelHeight() - 32);
					
					//alert("b.vOffset: " + b.vOffset + ", cell height: " + (b.getCellBox().height() - b.getLabelHeight() - 32));
					//alert(continueEvent);
					//alert(toManyEvents);
					
					if (toManyEvents) {
						if (!b.isTooManySet) {
							var moreDiv = $('<div class="MoreEvents" id="ME_' + i + '">' + def.navLinks.showMore + '</div>');
							var pos = b.getCellPosition();
							var index = i;

							moreDiv.css({ 
								"top" : (pos.top + (b.getCellBox().height() - b.getLabelHeight())), 
								"left" : pos.left, 
								"width" : (b.getLabelWidth() - 7),
								"position" : "absolute" });
							
							moreDiv.click(function(e) { _showMoreClick(e, index); });
							
							_eventObj[moreDiv.attr("id")] = moreDiv;
							b.isTooManySet = true;
						} //else update the +more to show??
						b.events.push(ev);
					} else if (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || continueEvent) {
						var block = _buildEventBlock(ev, b.weekNumber);						
						var pos = b.getCellPosition();
						
						block.css({ 
							"top" : (pos.top + b.getLabelHeight() + b.vOffset), 
							"left" : pos.left, 
							"width" : (b.getLabelWidth() - 7), 
							"position" : "absolute" });
						
						b.vOffset += 19;
						
						if (continueEvent) {
							block.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-w"));
							
							var e = _eventObj['Event_' + ev.EventID + '_' + (b.weekNumber - 1)];
							if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
						}
						
						_eventObj[block.attr("id")] = block;
						
						b.events.push(ev);
					} else if (startBoxCompare == -1 && endBoxCompare >= 0) {
						var e = _eventObj['Event_' + ev.EventID + '_' + b.weekNumber];
						if (e) {
							var w = e.css("width")
							e.css({ "width" : (parseInt(w) + b.getLabelWidth() + 1) });
							b.vOffset += 19;
							b.events.push(ev);
						}
					}
					
					//end of month continue
					if (i == iend && endBoxCompare > 0) {
						var e = _eventObj['Event_' + ev.EventID + '_' + b.weekNumber];
						if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
					}
				}
			});
			
			for (var o in _eventObj) {
				_eventObj[o].hide();
				container.append(_eventObj[o]);
				_eventObj[o].show();
			}
		}
	}
	
	var _buildEventBlock = function(ev, weekNumber) {
		var block = $('<div class="Event" id="Event_' + ev.EventID + '_' + weekNumber + '" eventid="' + ev.EventID +'"></div>');
		
		if(ev.CssClass) { block.addClass(ev.CssClass) }
		block.bind('click', { Event: ev }, def.onEventBlockClick);
		block.bind('mouseover', { Event: ev }, def.onEventBlockOver);
		block.bind('mouseout', { Event: ev }, def.onEventBlockOut);
		
		if (def.dragableEvents) {
			_dragableEvent(ev, block, weekNumber);
		}
		
		var link;
		if (ev.URL && ev.URL.length > 0) {
			link = $('<a href="' + ev.URL + '">' + ev.Title + '</a>');
		} else {
			link = $('<a>' + ev.Title + '</a>');
		}
		link.bind('click', { Event: ev }, def.onEventLinkClick);
		
		block.append(link);
		
		return block;
	}	

	var _dragableEvent = function(event, block, weekNumber) {
		block.draggable({
			zIndex: 4,
			delay: 50,
			opacity: 0.5,
			revertDuration: 1000,
			cursorAt: { left: 5 },
			start: function(ev, ui) {
				//hide any additional event parts
				for (var i = 0; i <= _gridRows; i++) {
					if (i == weekNumber) {
						continue;
					}
					
					var e = _eventObj['Event_' + event.EventID + '_' + i];
					if (e) { e.hide(); }
				}
			}
		});
	}
	
	var _showMoreClick = function(e, boxIndex) {
		var box = _boxes[boxIndex];
		def.onShowMoreClick.call(this, box.events);
		
		e.stopPropagation();
	}
	
	
	$.J.ClearEventsOnCalendar = function() {
		_clearBoxEvents();
		$(".Event", $(def.containerId)).remove();
		$(".MoreEvents", $(def.containerId)).remove();
	}
	
	$.J.AddEvents = function(eventCollection) {
		if(eventCollection) {
			if(eventCollection.length > 0) {
				$.merge(cEvents, eventCollection);
			} else {
				cEvents.push(eventCollection);
			}
			$.J.ClearEventsOnCalendar();
			_drawEventsOnCalendar();
		}
	}
	
	$.J.ReplaceEventCollection = function(eventCollection) {
		if(eventCollection) {
			cEvents = []
			cEvents = eventCollection;
		}
		
		$.J.ClearEventsOnCalendar();
		_drawEventsOnCalendar();
	}
	
	$.J.ChangeMonth = function(dateIn) {
		var returned = def.onMonthChanging.call(this, dateIn);
		if (!returned) {
			$.J.DrawCalendar(dateIn);
			def.onMonthChanged.call(this, dateIn);
		}
	}
	
	$.J.Initialize = function(options, events) {
		var today = new Date();
		
		options = $.extend(def, options);
		
		if (events) { 
			$.J.ClearEventsOnCalendar();
			cEvents = events;
		}
		
		$.J.DrawCalendar();
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
		this.vOffset = 0;
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