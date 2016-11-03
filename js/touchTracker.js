function TouchTracker(element){   
   
  var posX = 0;
  var posY = 0;
   
  var startPosX = 0;
  var startPosY = 0;
  var startTime;
  var lastTimeStamp;
   
  this.deltaX = 0;
  this.deltaY = 0;
   
  init();

  function init(){
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false); 
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
  } 
    
  function onTouchStart(event){
     startTime = event.timeStamp;
     if (event.touches.length == 1){
       deltaX, deltaY = 0; 
       startPosX = event.touches[0].pageX;
       startPosY = event.touches[0].pageY;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        var speed = deltaX / (event.timeStamp - startTime);
     }
   }
   
   function onTouchEnd(event){
     deltaX, deltaY = 0;
   }  
   
   function getTouchMoveDelta(event){
      deltaX = startPosX - posX;
      deltaY = startPosY - posY;
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
   }
  
   this.getDeltas = function(event){
     getTouchMoveDelta(event);
     
     return { dx: deltaX,  dy: deltaY }
   }

   return this;
}