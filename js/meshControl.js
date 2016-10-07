function MeshControl(meshes, rendererElement){
   var mouseDown = false;
   var mouseX = 0;
   var mouseY = 0; 
   var currentAngle = 0;
   this.meshes = meshes;
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
   }
   
  function onMouseMove(event) {
     var delta = getMouseMoveDelta(event);
     deltaX = clamp(delta[0], -30, 30);
     console.log(deltaX);
     var angle = (deltaX * Math.PI / 180) * .8;
     rotateTo(angle);
   }
   
   function onMouseDown(event) {
     mouseDown = true;
   }
   
   function onMouseUp(event) {
     mouseDown = false;
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       mesh = meshes[i];
       mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
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
   
  function clamp(value, min, max){
    var clampedValue = (value > max) ? max : (value < min) ? min : value; 
    return clampedValue;
  }
   
   return this;

}