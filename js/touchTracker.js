function TouchTracker(element){   
   
  var posX = 0;
  var posY = 0;
   
  var startPosX = 0;
  var startPosY = 0;
  var startTime;
  var lastTimeStamp;
   
  this.deltaX = 0;
  this.deltaY = 0;
  
  var self = this;
   
  init();

  function init(){
    console.log("tracker init");
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
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        var speed = self.deltaX / (event.timeStamp - startTime);
     }
     console.log("tracker", self.deltaX, self.deltaY);
   }
   
   function onTouchEnd(event){
     self.deltaX, self.deltaY = 0;
   }  
   
   function getTouchMoveDelta(event){
      self.deltaX = startPosX - posX;
      self.deltaY = startPosY - posY;
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
   }
  
   this.getDeltas = function(event){
     getTouchMoveDelta(event);
     
     return { dx: deltaX,  dy: deltaY }
   }

   return this;
}