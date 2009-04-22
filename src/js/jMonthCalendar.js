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
			height: 650,
			width: 980,
			navHeight: 25,
			labelHeight: 25,
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
	jQuery.jMonthCalendar = jQuery.J = function() {};
	
	
	
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
		var navRow = jQuery('<tr><td colspan="7"><div class="FormHeader MonthNavigation"></div></td></tr>').css({ "height" : defaults.navHeight });
		var monthNavHead = jQuery('.MonthNavigation', navRow);
		
		monthNavHead.append(prevMLink, nextMLink);
		if(defaults.navLinks.enableToday) { monthNavHead.append(todayLink); }

		monthNavHead.append(jQuery('<div class="MonthName"></div>').append(defaults.locale.months[d.getMonth()] + " " + d.getFullYear()));
		
		if(defaults.navLinks.enableNextYear) { monthNavHead.append(nextYLink); }
		if(defaults.navLinks.enablePrevYear) { monthNavHead.append(prevYLink); }
		
		
		//  Days
		var headRow = jQuery("<tr></tr>").css({ 
			"height" : defaults.labelHeight 
		});
		
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
		var maxDays = Date.getDaysInMonth(d.getFullYear(), d.getMonth());
		
		
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
		var rowHeight = (defaults.height - defaults.labelHeight - defaults.navHeight) / Math.ceil((maxDays + Math.abs(curDay)) / 7);
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
				
				thisRow.append(dateBox);
				
				curDay++;
				_currentDate.addDays(1);
			}
			
			rowCount++;
			tBody.append(thisRow);
		} while (curDay < maxDays);


		var a = jQuery(ids.container).css({ "width" : defaults.width + "px", "height" : defaults.height + "px" });
		var cal = jQuery('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>').append(headRow, tBody);
		
		a.hide();
		a.html(cal);		
		a.fadeIn("normal");
		
		DrawEventsOnCalendar();
	}
	
	var DrawEventsOnCalendar = function() {	
		if (calendarEvents && calendarEvents.length > 0) {
			var headHeight = defaults.labelHeight + defaults.navHeight;
			var dtLabelHeight = jQuery(".DateLabel:first", ids.container).outerHeight();
			
			
			jQuery.each(calendarEvents, function(){
				var ev = this;				
				//Date Parse the JSON to create a new Date to work with here
				var sDt, eDt;
				
				if(ev.StartDateTime) {
					if (typeof ev.StartDateTime == 'object' && ev.StartDateTime.getDate) { sDt = ev.StartDateTime; }
					if (typeof ev.StartDateTime == 'string' && ev.StartDateTime.split) { sDt = GetJSONDate(ev.StartDateTime); }
				} else if(ev.Date) { // DEPRECATED
					if (typeof ev.Date == 'object' && ev.Date.getDate) { sDt = ev.Date; }
					if (typeof ev.Date == 'string' && ev.Date.split) { sDt = GetJSONDate(ev.Date); }
				} else {
					return;  //no start date, or legacy date. no event.
				}
				
				if(ev.EndDateTime) {
					if (typeof ev.EndDateTime == 'object' && ev.EndDateTime.getDate) { eDt = ev.EndDateTime; }
					if (typeof ev.EndDateTime == 'string' && ev.EndDateTime.split) { eDt = GetJSONDate(ev.EndDateTime); }
				}
				
				
				//is the start date in range, put it on the calendar?			
				//handle multi day range first
					
				
				if(sDt) {
					if ((sDt >= _beginDate) && (sDt <= _endDate)) {			
						var cell = jQuery("#" + getDateId(sDt), jQuery(ids.container));
						var label = jQuery(".DateLabel", cell);
						
						var link = jQuery('<a href="' + ev.URL + '">' + ev.Title + '</a>');
						link.click(function(e) {
							defaults.onEventLinkClick(ev);
							e.stopPropagation();
						});
						var event = jQuery('<div class="Event" id="Event_' + ev.EventID + '"></div>').append(link);
						
						
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
						cell.append(event);
						event.fadeIn("normal");
					}
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
		if (defaults.onMonthChanging(dateIn)) {
			jQuery.J.DrawCalendar(dateIn);
			defaults.onMonthChanged(dateIn);
		}
	}
	
	jQuery.J.Initialize = function(options, events) {
		var today = new Date();
		
		options = jQuery.extend(defaults, options);
		
		jQuery.J.DrawCalendar();
		
		if(events)
		{
			calendarEvents = events;
			//Load for the current month
			DrawEventsOnCalendar();
		}
	};
})(jQuery);
