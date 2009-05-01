##### Change Log #####
* Current
      - Dynamic ID for calendar, now in defaults.
      - Absolute position events, calendar size flexible (CSS)
* 1.2.2
      - Dragable Events support using jQuery UI (Optional usage).
      - Add ability to enable or disable calendar links (today link, next year, and previous year).
      - Default Next and Previous link text changed.
      - Added onDayCellDblClick event that passes the date you are double clicking.
      - Added onEventDropped event that passes the event object and the new date being dropped into.
      - Removed my custom Date extensions and replaced it with <a href="http://www.datejs.com/">Datejs</a>, more on this below.
      - Complete Build Process to build, pack and minify the source.
* 3/24/2009 Release 1.2.1
      - New Project Home: http://code.google.com/p/jmonthcalendar/
      - Bug fixes for UTC Date Parsing
      - Stop Event Propogation
      - ANT Build Process
      - Fix Day Cell click and Day click
* 2/12/2009 Release 1.2.0
      - New extension points for working with the day cells or links
      - Changed navigation header layout
      - Added year navigation, works the same as month navigation
      - Added a today link to return to today’s date
      - Date formatting the parsing JSON improvements
      - Updated sample for AJAX call, should happen onMonthChanging
* 2/12/2009 Minor Release 1.1.1
      - Events are drawn immediately after month is drawn.
      - Fixed configurable height and width in options
      - Fixed configurable height of headers in options
      - JSON Date formatting/parsing (ISO, new Date literal, UTC)
      - EndDate property added to event object
      - Date is now deprecated, replace by StartDate
      - Event in calendar has new ID of ‘Event_’ + EventID, allow styling of specific events
* 1/29/2009 Minor Release 1.1.0
      - Event onHover Extension Point added.
      - Extend event object to include description and escape JSON.
      - Extend the event object to accept “class” css class.
      - Minor bug fixes to placement of events.
* 1/20/2009 Patch Release 1.0.1
      - Event loading (isArray is not a function)
      - Month Name not displayed in IE
      - Configurable first day of week (0 for Sunday, 1 for Monday, etc)
* 1/18/2009 Initial Release
