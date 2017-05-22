function TouchTracker(element){   
   
  var posX = 0;
  var posY = 0;
   
  var startPosX = 0;
  var startPosY = 0;
  var startTime;
  var lastTouchTime;
   
  this.deltaX = 0;
  this.deltaY = 0;
  this.speedX = 0;
  this.speedY = 0;
  this.axis = "HORIZONTAL";
  
  var lastPosition = {x: 0, y: 0}
  var lastDistance = 0;
  var currentDistance = 0;
  
  this.deltaDistance = 0;
  
  var self = this;
   
  init();

  function init(){
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false); 
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
  } 
    
  function onTouchStart(event){
     startTime = event.timeStamp;
     lastTouchTime = event.timeStamp;
     if (event.touches.length == 1){
       self.deltaX = 0; 
       self.deltaY = 0;
       startPosX = event.touches[0].pageX;
       posX = startPosX;
       startPosY = event.touches[0].pageY;
       posY = startPosY;
       lastPosition.x = event.touches[0].pageX;
       lastPosition.y = event.touches[0].pageY;
     } else if (event.touches.length == 2){
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
     }
   }
   
   function onTouchMove(event){
       if (event.touches.length == 1){
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
   
   function onTouchEnd(event){
     self.deltaX = 0;
     self.deltaY = 0;
     self.deltaDistance = 0;
   }  
   
   function getTouchMoveDelta(event){
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
        
      self.deltaX = lastPosition.x - event.touches[0].pageX;
      self.deltaY = lastPosition.y - event.touches[0].pageY;
      lastPosition.x = event.touches[0].pageX; 
      lastPosition.y = event.touches[0].pageY; 
   }
   
   function touchDistance(event){
     var dx = Math.abs(event.touches[ 0 ].pageX - event.touches[ 1 ].pageX);
	   var dy = Math.abs(event.touches[ 0 ].pageY - event.touches[ 1 ].pageY);
	   console.log('dx', dx, 'dy', dy); 
	   
	   var distance = Math.sqrt( dx * dx + dy * dy );
	   console.log('distance', distance); 
	   return distance;
   }
   
   function detectAxis(){
     var axisDiff = Math.abs(self.deltaY - self.deltaX);
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)){
       if (axisDiff > 2) {
         self.axis = "VERTICAL";
       }  
     } else {
       if (axisDiff > 2) {
         self.axis = "HORIZONTAL";
       }  
     }
   }
  
   this.getDeltas = function(event){
     getTouchMoveDelta(event);
     
     return { dx: deltaX,  dy: deltaY }
   }

   return this;
}