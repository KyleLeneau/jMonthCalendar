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
	var _selectedDate;
	var _beginDate;
	var _endDate;
	var _boxes = [];
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
	
	
	
	
	
	jQuery.J.DrawCalendar = function(dateIn){
		var today = defaults.calendarStartDate;
		var d;
		
		if(dateIn == undefined) {
			//start from this month
			d = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			//start from the passed in date
			d = dateIn;
			d.setDate(1);
		}
		
		ClearBoxes();
		
		// Create Previous Month link for later
		var prevMonth = d.getMonth() == 0 ? new Date(d.getFullYear()-1, 11, 1) : new Date(d.getFullYear(), d.getMonth()-1, 1);
		var prevMLink = jQuery('<div class="MonthNavPrev"><a href="" class="link-prev">'+ defaults.navLinks.p +'</a></div>').click(function() {
			jQuery.J.ChangeMonth(prevMonth);
			return false;
		});
		
		//Create Next Month link for later
		var nextMonth = d.getMonth() == 11 ? new Date(d.getFullYear()+1, 0, 1) : new Date(d.getFullYear(), d.getMonth()+1, 1);
		var nextMLink = jQuery('<div class="MonthNavNext"><a href="" class="link-next">'+ defaults.navLinks.n +'</a></div>').click(function() {
			jQuery.J.ChangeMonth(nextMonth);
			return false;
		});
		
		//Create Previous Year link for later
		var prevYear = new Date(d.getFullYear()-1, d.getMonth(), d.getDate());
		var prevYLink;
		if(defaults.navLinks.enablePrevYear) {
			prevYLink = jQuery('<div class="YearNavPrev"><a href="">'+ prevYear.getFullYear() +'</a></div>').click(function() {
				jQuery.J.ChangeMonth(prevYear);
				return false;
			});
		}
		
		//Create Next Year link for later
		var nextYear = new Date(d.getFullYear()+1, d.getMonth(), d.getDate());
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

		monthNavHead.append(jQuery('<div class="MonthName"></div>').append(defaults.locale.months[d.getMonth()] + " " + d.getFullYear()));
		
		if(defaults.navLinks.enablePrevYear) { monthNavHead.append(prevYLink); }
		if(defaults.navLinks.enableNextYear) { monthNavHead.append(nextYLink); }
		
		
		//  Days
		var headRow = jQuery("<tr></tr>");		
		for (var i=defaults.firstDayOfWeek; i<defaults.firstDayOfWeek+7; i++) {
			var weekday = i%7;
			var wordday = defaults.locale.days[weekday];
			headRow.append('<th title="' + wordday + '" class="DateHeader' + (weekday == 0 || weekday == 6 ? ' Weekend' : '') + '"><span>' + wordday + '</span></th>');
		}
		
		headRow = jQuery("<thead id=\"CalendarHead\"></thead>").css({ "height" : defaults.headerHeight + "px" }).append(headRow);
		headRow = headRow.prepend(navRow);


		//Build up the Body
		var tBody = jQuery('<tbody id="CalendarBody"></tbody>');
		var isCurrentMonth = (d.getMonth() == today.getMonth() && d.getFullYear() == today.getFullYear());
		var maxDays = Date.getDaysInMonth(d.getFullYear(), d.getMonth());
		alert("maxDays: " + maxDays);
		
		//what is the current day #
		var curDay = defaults.firstDayOfWeek - d.getDay();
		if (curDay > 0) curDay -= 7
		//alert(curDay);
		
		var t = (maxDays + Math.abs(curDay));

		_beginDate = new Date(d.getFullYear(), d.getMonth(), curDay+1);
		_endDate = new Date(d.getFullYear(), d.getMonth()+1, (7-(t %= 7)) == 7 ? 0 : (7-(t %= 7)));
		var _currentDate = new Date(_beginDate.getFullYear(), _beginDate.getMonth(), _beginDate.getDate());

		
		// Render calendar
		var rowCount = 0;
		var containerHeight = jQuery(defaults.containerId).outerHeight();
		//alert("container height: " + containerHeight);		
		//alert("header height: " + defaults.headerHeight);
		
		var rowHeight = (containerHeight - defaults.headerHeight) / Math.ceil((maxDays + Math.abs(curDay)) / 7);
		//alert("rowHeight=" + rowHeight);


		do {
	  		var thisRow = jQuery("<tr></tr>");
			thisRow.css({
				"height" : rowHeight + "px"
			});
			
			for (var i=0; i<7; i++) {
				var weekday = (defaults.firstDayOfWeek + i) % 7;
				var atts = {'class':"DateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''),
							'date':_currentDate.toString("M/d/yyyy"),
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
				
				//DateBox Events
				var dateLink = jQuery('<div class="DateLabel"><a href="">' + _currentDate.getDate() + '</a></div>').click(function(e) {
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
				
				_boxes.push(new DateBox(getDateId(_currentDate), _currentDate.clone(), dateBox, dateLink));
				thisRow.append(dateBox);
				
				curDay++;
				_currentDate.addDays(1);
			}
			
			rowCount++;
			tBody.append(thisRow);
		} while (curDay < maxDays);


		var a = jQuery(defaults.containerId);//.css({ "width" : defaults.width + "px", "height" : defaults.height + "px" });
		var cal = jQuery('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>').append(headRow, tBody);
		
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
					if (sDt.between(_beginDate, _endDate)) {
					
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