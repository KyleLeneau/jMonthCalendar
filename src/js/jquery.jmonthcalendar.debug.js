$.fn.jMonthCalendar.debug = true;


if($.fn.jMonthCalendar.debug)
{
   // Create new debug constants
   $.fn.jMonthCalendar.constants =
   {
      /* Error messages */      

      /* Event messages */
      
   };

   // Define qTip log object
   $.fn.jMonthCalendar.log = {
      /* CONSOLE REPORTING MASK
         To use this functionality you need a console installed, such as firebug:
            http://getfirebug.com

         This mask determines what errors are reported to the console. Possible values are:
            7 = Errors, warnings and messages
            6 = Errors and warnings
            5 = Errors and messages
            4 = Errors only
            3 = Warnings and messages
            2 = Warnings only
            1 = Messages only
      */
      report: 7,

      /* DO NOT ALTER ANYTHING BELOW HERE! */
      calendars: [],
      messages: [],
      errors: [],

      /* Error handler function */
      error: function(type, message, method)
      {
         var self = this;

         // Format type string
         switch(type)
         {
            case 1:
               var typeString = 'info';
               var addTo = 'messages';
               break;

            case 2:
               var typeString = 'warn';
               var addTo = 'messages';
               break;

            default: case 4:
               var typeString = 'error';
               var addTo = 'errors';
               break;
         }

         // Format time
         var DateObj = new Date();
         var time = DateObj.getHours() + ':' +
                     DateObj.getMinutes() + ':' +
                     DateObj.getSeconds();

         // Log the error into the log array
         $.fn.jMonthCalendar.log[addTo].push({
            time: time,
            message: message,

            api: self,
            callee: self[method] || method || null
         });

         // If debug mode is enabled, display the error
         if($.fn.jMonthCalendar.log.report & type > 0)
         {
            var logMessage = 'qTip '
               + ((typeof self.id !== 'undefined') ? '['+self.id+']' : '')
               + ': ' + message;

            // Check console is present
            if(window.console) window.console[typeString](logMessage);

            // Check for Opera Dragonfly
            else if($.browser.opera && window.opera.postError) window.opera.postError(logMessage);
         }

         return self;
      }
   };
};