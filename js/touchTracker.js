function TouchTracker(element){   
   
  var posX = 0;
  var posY = 0;
   
  var startPosX = 0;
  var startPosY = 0;
  var startTime;
  var lastTimeStamp;
   
  this.deltaX = 0;
  this.deltaY = 0;
  this.speedX = 0;
  this.speedY = 0;
  this.direction = "HORIZONTAL";
  
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
     console.log("tracker", posX, posY);
     startTime = event.timeStamp;
     if (event.touches.length == 1){
       self.deltaX, self.deltaY = 0; 
       startPosX = event.touches[0].pageX;
       startPosY = event.touches[0].pageY;
     } else if (event.touches.length == 2){
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        detectDirection();
        self.speedX = self.deltaX / (event.timeStamp - startTime);
        self.speedY = self.deltaY / (event.timeStamp - startTime);
     } else if (event.touches.length == 2) {
        currentDistance = touchDistance(event);
        self.deltaDistance = currentDistance - lastDistance;
        lastDistance = currentDistance;
     }
   }
   
   function onTouchEnd(event){
     self.deltaX, self.deltaY = 0;
     self.deltaDistance = 0;
   }  
   
   function getTouchMoveDelta(event){
      self.deltaX = startPosX - posX;
      self.deltaY = startPosY - posY;
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
   }
   
   function touchDistance(event){
      var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	  var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY; 
	  
	  var distance = Math.sqrt( dx * dx + dy * dy );
	  return distance;
   }
   
   function detectDirection(){
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)){
       self.direction = "VERTICAL";
     } else {
       self.direction = "HORIZONTAL";
     }
   }
  
   this.getDeltas = function(event){
     getTouchMoveDelta(event);
     
     return { dx: deltaX,  dy: deltaY }
   }

   return this;
}