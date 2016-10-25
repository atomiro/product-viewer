function MeshControl(meshes, rendererElement){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var touchDeltaX = 0;
   var mouseDown = false;
   this.meshes = meshes;
   this.rotationSpeed = 8;
   this.mouseSpeed = this.rotationSpeed/10;
   this.touchSpeed = this.rotationSpeed/100;
   
   this.setRotationSpeed = function(speed){
     this.rotationSpeed = speed;
     this.mouseSpeed = speed/10;
     this.touchSpeed = speed/100; 
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
     if (event.touches.length == 1){
       touchDeltaX = 0;
       initMouseX = event.touches[0].pageX;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        touchDeltaX = ControlUtils.clamp(touchDeltaX, -100, 100);
        var angle = (touchDeltaX * Math.PI / 180) * obj.touchSpeed;
        rotateTo(angle);
     }
   }
   
   function onTouchEnd(event){
     touchDeltaX = 0;
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       mesh = meshes[i];
       mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function getTouchMoveDelta(event){
      touchDeltaX = initMouseX - mouseX;
      mouseX = event.touches[0].pageX;
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