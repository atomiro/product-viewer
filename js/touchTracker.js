/**
  TouchTracker distills touch events on an element into speed
  and direction of swipe. Calculates distance and changes in distance
  between multitouch points. 
  
  @param {Object} element - HTML element selected by jQuery
  @return {TouchTracker}
  @constructor
*/
function TouchTracker(element) {
  
  var currentDistance = 0;
  
  var lastPosition = {x: 0, y: 0};
  var lastTouchTime;
  var lastDistance = 0;
   
  /** @member {number} */
  this.deltaX = 0;
  
  /** @member {number} */
  this.deltaY = 0;
  
  /** @member {number} */
  this.deltaDistance = 0;
  
  /** @member */
  this.speedX = 0;
  
  /** @member {number} */
  this.speedY = 0;
  
  /** @member {string} */
  this.axis = 'HORIZONTAL';
  
  var self = this;
   
  init();
  
   /**
     @private
   */
  function init() {
  
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false);
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
    
  }
  
   /**
     @private
     @param {event} event - touch/pointer event
   */
  function onTouchStart(event) {
  
     startTime = event.timeStamp;
     lastTouchTime = event.timeStamp;
     
     if (event.touches.length == 1) {
     
       self.deltaX = 0;
       self.deltaY = 0;
       
       lastPosition.x = event.touches[0].pageX;
       lastPosition.y = event.touches[0].pageY;
       
     } else if (event.touches.length == 2) {
     
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
       
     }
     
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
   */
   function onTouchMove(event) {
   
       if (event.touches.length == 1) {
       
         getTouchMoveDelta(event);
         detectAxis();
         self.speedX = self.deltaX / (event.timeStamp - lastTouchTime);
         self.speedY = self.deltaY / (event.timeStamp - lastTouchTime);
         lastTouchTime = event.timeStamp;
          
       } else if (event.touches.length == 2) {
       
         currentDistance = touchDistance(event);
         self.deltaDistance = currentDistance - lastDistance;
         console.log('delta', self.deltaDistance);
         lastDistance = currentDistance;
         
       }
       
   }
   
    /**
     @private
   */
   function onTouchEnd() {
   
     self.deltaX = 0;
     self.deltaY = 0;
     self.deltaDistance = 0;
     
   }
   
    /**
     @private
     @param {event} event - touch/pointer event
   */
   function getTouchMoveDelta(event) {
        
     self.deltaX = lastPosition.x - event.touches[0].pageX;
     self.deltaY = lastPosition.y - event.touches[0].pageY;
     lastPosition.x = event.touches[0].pageX;
     lastPosition.y = event.touches[0].pageY;
      
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
     @return {number} distance - distance between touch points
   */
   function touchDistance(event) {
   
     var dx = Math.abs(event.touches[0].pageX - event.touches[1].pageX);
     var dy = Math.abs(event.touches[0].pageY - event.touches[1].pageY);
     
     var distance = Math.sqrt(dx * dx + dy * dy);
     
     return distance;
     
   }
   
   /**
     @private
   */
   function detectAxis() {
   
     var axisDiff = Math.abs(self.deltaY - self.deltaX);
     
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)) {
     
       if (axisDiff > 2) {
      
         self.axis = 'VERTICAL';
         
       }
       
     } else {
     
       if (axisDiff > 2) {
       
         self.axis = 'HORIZONTAL';
         
       }
         
     }
     
   }
   
   /**
     @function
     @param {event} event - touch/pointer event object
     @return {Object} deltas - {dx:deltaX, dy:deltaY}
   */
   this.getDeltas = function(event) {
   
     getTouchMoveDelta(event);
     
     return {dx: deltaX, dy: deltaY};
     
   };

   return this;
   
}
