//
// Zoom with scroll wheel and vertical pan by clicking a dragging up and down
//
function CameraDollyControl(camera, rendererElement, options){
  var settings = {
    minZoomDistance: -12,
    maxZoomDistance: -50,
    minCameraHeight: 2.5,
    maxCameraHeight: 14.5
  };
  
  this.panLockAt;
  
  var initHeight = camera.position.y;
  var cameraHeight = camera.position.y;
  var cameraDist = camera.position.x;
  var mouseDown = false;
  var mouseIn = false;
  var mouseX = 0;
  var initMouseY = 0;
  var mouseY = 0;
  var touchStartTime;
  
  var lastDistance = 0;
  var currentDistance = 0;
  
  var touchPanSpeedFactor = .4;
  var mousePanSpeedFactor = .035;
  
  var self = this;
  
  var touchTracker = new TouchTracker(rendererElement); 
  
  init();
  
  function init(){
    $.extend(settings, options);
    self.panLockAt = Math.abs(settings.maxZoomDistance) - 3;
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    var debounce = _.debounce(onMouseWheel, 10, {leading: true});
    $(window).on('mousewheel', onMouseWheel);
    
     rendererElement[0].addEventListener('touchmove', onTouchMove, false); 
  }
  
  function onMouseMove(event){
    if (Math.abs(cameraDist) < self.panLockAt) {
      var delta = getMouseMoveDelta(event);
      if (Math.abs(delta[1]) > Math.abs(delta[0])){
        cameraHeight -= delta[1] * mousePanSpeedFactor;
        constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
        camera.position.y = cameraHeight;
        camera.lookAt(new THREE.Vector3(0,(cameraHeight),0)); 
        console.log(camera.position);
      }
    }
  }
  
  function onMouseWheel(event){
    if (mouseIn){
      event.preventDefault();
      var deltaY = ControlUtils.clamp(event.originalEvent.deltaY, -100, 100); 
      cameraDist -= deltaY * .2; 
      constrainZoom(settings.minZoomDistance, settings.maxZoomDistance);
      camera.position.x = cameraDist;
      centerCamera();
      console.log(camera.position); 
    }  
  }
  
  function onMouseDown(event){
     mouseDown = true;
  }
  
  function onMouseUp(event){
     mouseDown = false;
  }
  
  function onHoverIn(event){
    mouseIn = true;
  }
  
  function onHoverOut(event){
    mouseIn = false
  }  
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < self.panLockAt) {
          if (touchTracker.direction == "VERTICAL"){ 
            cameraHeight -= touchTracker.speedY * touchPanSpeedFactor;
            constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
            camera.position.y = cameraHeight;
            camera.lookAt(new THREE.Vector3(0, cameraHeight, 0)); 
          } 
        }
     }
     else if (event.touches.length == 2){
        cameraDist += touchTracker.deltaDistance * .5;
        constrainZoom(settings.minZoomDistance, settings.maxZoomDistance);
        camera.position.x = cameraDist;
        centerCamera(); 
     }
   }
  
  function centerCamera(){
    var totalZoomDist = Math.abs(settings.minZoomDistance - settings.maxZoomDistance);
    var zoomLevel = Math.abs(cameraDist - settings.minZoomDistance) / totalZoomDist;
    cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, zoomLevel);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0,(cameraHeight),0));
  }

  function constrainZoom(min, max){
    if (Math.abs(cameraDist) < Math.abs(min)) { cameraDist = min }
    if (Math.abs(cameraDist) > Math.abs(max)) { cameraDist = max }
  }
      
  function constrainVerticalPan(min, max){
     cameraHeight = ControlUtils.clamp(cameraHeight, min, max);
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
