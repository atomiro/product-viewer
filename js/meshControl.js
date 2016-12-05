function MeshControl(meshes, rendererElement){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   this.meshes = meshes;
   this.mouseSpeedFactor = .7;
   this.touchSpeedFactor = 15;
   
   //INTERNALS 
   
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var initMouseY = 0;
   
   var mouseDown = false;
   var touchStartTime;
   var lastTimeStamp;
      
   var self = this;
   
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
   }
   
  function onMouseMove(event) {
     var deltaX = getMouseMoveDelta("X", event);
     var deltaY = getMouseMoveDelta("Y", event);
     if (Math.abs(deltaX) > Math.abs(deltaY)){
       deltaX = ControlUtils.clamp(deltaX, -30, 30);
       var angle = (deltaX * Math.PI / 180) * self.mouseSpeedFactor;
       rotateTo(angle);
     }
   }
   
   function onMouseDown(event) {
     mouseDown = true;
   }
   
   function onMouseUp(event) {
     mouseDown = false;
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
       if (touchTracker.axis == "HORIZONTAL"){
          var angle = (touchTracker.speedX * Math.PI / 180) * self.touchSpeedFactor;
          rotateTo(angle); 
        }
     }
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       meshes[i].rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function getMouseMoveDelta(axis, event) {
        var deltaX = 0;
        var deltaY = 0;
        
        if (mouseDown) {
          deltaX = mouseX - event.pageX;
          deltaY = mouseY - event.pageY;
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
        if (axis.toLowerCase() == "x"){ 
          return deltaX;
        }
        else if (axis.toLowerCase() == "y"){
          return deltaY;
        }
        
   } 
   
   return this;

}