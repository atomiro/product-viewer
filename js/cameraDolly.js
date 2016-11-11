//
// Zoom with scroll wheel and vertical pan by clicking a dragging up and down
//
function CameraDollyControl(camera, scene, rendererElement, options){
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
  
  var mouse = new THREE.Vector2();
  var raycaster;
  
  var lastDistance = 0;
  var currentDistance = 0;
  
  var touchPanSpeedFactor = .4;
  var mousePanSpeedFactor = .035;
  
  var self = this;
  
  var touchTracker = new TouchTracker(rendererElement); 
  
  var isAnimating = false;
  var progress = 0; 
  
  init();
  
  function init(){
    $.extend(settings, options);
    self.panLockAt = Math.abs(settings.maxZoomDistance) - 3;
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    rendererElement.dblclick(onDblClick);
    
    var debounce = _.debounce(onMouseWheel, 10, {leading: true});
    $(window).on('mousewheel', onMouseWheel);
    
     rendererElement[0].addEventListener('touchmove', onTouchMove, false); 
     
     raycaster = new THREE.Raycaster();
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
      isAnimating = false;
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
  
  function onDblClick(event){
    mouse.x = (event.offsetX) / rendererElement.width() * 2 - 1
    mouse.y = -(event.offsetY) / rendererElement.height() * 2 + 1
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children );
    console.log("dblclick", intersects);
    if (intersects.length > 0){
      // auto zoom in 
    } else {
      
    }
    isAnimating = true;
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
  
  function centerCameraOverTime(step){
    if (isAnimating){
      progress += step;
      progress = ControlUtils.clamp(progress, 0, 1); 
      cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, progress);
      cameraDist = ControlUtils.lerp(cameraDist, settings.maxZoomDistance, progress);
      camera.position.y = cameraHeight;
      camera.position.x = cameraDist;
      camera.lookAt(new THREE.Vector3(0,(cameraHeight),0));
      console.log(progress);
    }
    if (progress == 1){
      console.log("STOP");
      isAnimating = false;
      progress = 0;
    }  
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
  
  this.animate = function(step){
    centerCameraOverTime(step);
  }
  
  return this;

}
