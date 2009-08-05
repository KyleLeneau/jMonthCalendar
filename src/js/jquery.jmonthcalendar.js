/*!
* Title:  jMonthCalendar @VERSION
* Dependencies:  jQuery 1.3.0 +
* Author:  Kyle LeNeau
* Email:  kyle.leneau@gmail.com
* Project Hompage:  http://www.bytecyclist.com/projects/jmonthcalendar
* Source:  http://github.com/KyleLeneau/jMonthCalendar
*
*/
(function($) 
{
	// Implementation
	$.fn.jMonthCalendar = function(options)
	{
		// Iterate each matched element
		return $(this).each(function() // Return original elements as per jQuery guidelines
	    {
			
		});
	};
	
	// Instantiator
	function jMonthCalendar(target, options, id)
	{
	    // Declare this reference
		var self = this;
	};
	
	// Define qTip API interfaces array
	$.fn.jMonthCalendar.interfaces = []

	// Define log and constant place holders
	$.fn.jMonthCalendar.log = { error: function(){ return this; } };
	$.fn.jMonthCalendar.constants = {};

	// Define configuration defaults
	$.fn.jMonthCalendar.defaults = {
		api: {
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
		}
	};
	
})(jQuery);