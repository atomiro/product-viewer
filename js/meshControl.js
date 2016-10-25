function MeshControl(meshes, rendererElement){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var touchDeltaX = 0;
   var initMouseY = 0;
   var touchDeltaY = 0;
   
   var mouseDown = false;
   var touchStartTime;
   this.meshes = meshes;
   this.rotationSpeed = 8;
   this.mouseSpeed = this.rotationSpeed/10;
   
   this.setRotationSpeed = function(speed){
     this.rotationSpeed = speed;
     this.mouseSpeed = speed/10;
   }
   
   //INTERNALS 
      
   var obj = this;
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     
     rendererElement[0].addEventListener('touchmove', 
     onTouchMove, false);
     
     rendererElement[0].addEventListener('touchend', 
     onTouchEnd, false);
     
     rendererElement[0].addEventListener('touchstart', 
     onTouchStart, false);
   }
   
  function onMouseMove(event) {
     var delta = getMouseMoveDelta(event);
     if (Math.abs(delta[0]) > Math.abs(delta[1])){
       var deltaX = ControlUtils.clamp(delta[0], -30, 30);
       var angle = (deltaX * Math.PI / 180) * obj.mouseSpeed;
       rotateTo(angle);
     }
   }
   
   function onMouseDown(event) {
     mouseDown = true;
   }
   
   function onMouseUp(event) {
     mouseDown = false;
   }
   
   function onTouchStart(event){
     touchStartTime = event.timeStamp;
     console.log(event);
     if (event.touches.length == 1){
       touchDeltaX, touchDeltaY = 0;
       initMouseX = event.touches[0].pageX;
       iniMouseY = event.touches[0].pagey;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        touchDeltaX = ControlUtils.clamp(touchDeltaX, -80, 80);
        var speed = touchDeltaX / (event.timeStamp - touchStartTime);
        angle = speed * .4;
        rotateTo(angle);  
     }
   }
   
   function onTouchEnd(event){
     touchDeltaX = 0;
     touchDeltaY = 0;
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       mesh = meshes[i];
       mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function getTouchMoveDelta(event){
      touchDeltaX = initMouseX - mouseX;
      touchDeltaY = initMouseY - mouseY;
      mouseX = event.touches[0].pageX;
      mouseY = event.touches[0].pageY;
   }
   
   function getMouseMoveDelta(event) {
        var deltaX = 0;
        var deltaY = 0;
        
        if (mouseDown) {
          deltaX = mouseX - event.pageX;
          deltaY = mouseY - event.pageY;
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
        return [deltaX, deltaY];
   } 
   
   return this;

}