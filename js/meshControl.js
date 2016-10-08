//
// Rotate multiple meshes by clicking and dragging side to side
//
function MeshControl(meshes, rendererElement){
   var mouseDown = false;
   var mouseX = 0;
   var mouseY = 0; 
   this.meshes = meshes;
   this.rotationSpeed = .8;
   
   this.setRotationSpeed = function(speed){
     this.rotationSpeed = ControlUtils.clamp(speed, 0, 1);
   }
   
   //INTERNALS 
      
   var obj = this;
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
   }
   
  function onMouseMove(event) {
     var delta = getMouseMoveDelta(event);
     var deltaX = ControlUtils.clamp(delta[0], -30, 30);
     var angle = (deltaX * Math.PI / 180) * obj.rotationSpeed;
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
   
   return this;

}