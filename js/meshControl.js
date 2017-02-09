function MeshControl(meshes, rendererElement, options){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   settings = {
     mouseSpeedFactor: .7,
     touchSpeedFactor: 15
   }
   
   this.meshes = meshes;
   
   //INTERNALS 
   
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var initMouseY = 0;
   
   var mouseDeltaX = 0;
   var mouseDeltaY = 0;
   
   var mouseDown = false;
   var mouseIn = false;
   var touchStartTime;
   var lastTimeStamp;
      
   var self = this;
   
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   function init(){
     $.extend(settings, options);
    
    registerControls(); 
   }
   
  function registerControls(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     rendererElement.mouseenter(onMouseIn);
     rendererElement.mouseleave(onMouseOut);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
  }
  
  function unbindControls(){
     rendererElement.off('mousedown', onMouseDown);
     rendererElement.off('mouseup', onMouseUp);
     rendererElement.off('mousemove', onMouseMove);
     
     rendererElement[0].removeEventListener('touchmove', onTouchMove);
  }
   
  function onMouseMove(event) {
     updateMouseMoveDelta(event);
     if (Math.abs(mouseDeltaX) > Math.abs(mouseDeltaY)){
       mouseDeltaX = ControlUtils.clamp(mouseDeltaX, -30, 30);
       var angle = (mouseDeltaX * Math.PI / 180) * settings.mouseSpeedFactor;
       rotateTo(angle);
     }
   }
   
   function onMouseDown(event) {
     mouseDown = true;
   }
   
   function onMouseUp(event) {
     mouseDown = false;
   }
   
   function onMouseIn(event) {
      mouseIn = true;
   }
   
   function onMouseOut(event){
     mouseIn = false;
     mouseDown = false;
   }
   
   function onTouchMove(event){
     if (event.touches.length == 1){
       if (touchTracker.axis == "HORIZONTAL"){
          event.preventDefault();
          var angle = (touchTracker.speedX * Math.PI / 180) * settings.touchSpeedFactor;
          rotateTo(angle); 
        }
     }
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       meshes[i].rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function updateMouseMoveDelta(event) {
        mouseDeltaX = 0;
        mouseDeltaY = 0;
        
        if (mouseIn && mouseDown) {
          mouseDeltaX = mouseX - event.pageX;
          mouseDeltaY = mouseY - event.pageY;
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
   } 
   
   this.registerControls = registerControls;
   this.unbindControls = unbindControls;
   
   return this;

}