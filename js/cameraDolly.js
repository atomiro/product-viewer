//
// Zoom with scroll wheel and vertical pan by clicking a dragging up and down
//
function CameraDollyControl(camera, meshes, rendererElement, options){
  var settings = {
    minZoomDistance: -12,
    maxZoomDistance: -50,
    minCameraHeight: 2.5,
    maxCameraHeight: 14.5,
    animationSpeed: .04
  };
  
  this.panLockAt;
  
  var initHeight = camera.position.y;
  var cameraHeight = camera.position.y;
  var cameraDist = camera.position.x;
  
  var mouse = {x: 0, y: 0};
  var mouseDown = false;
  var mouseIn = false;
  var initMouseY = 0;
  
  var touchStartTime;
  var lastTouchTime;
  
  var lastDistance = 0;
  var currentDistance = 0;
  
  var touchPanSpeedFactor = .4;
  var mousePanSpeedFactor = .035;
  
  var self = this;
  
  var touchTracker = new TouchTracker(rendererElement); 
  
  var isAnimating = false;
  var zoomingOut = false;
  var progress = 0; 
  
  init();
  
  function init(){
    $.extend(settings, options);
    self.panLockAt = Math.abs(settings.maxZoomDistance) - 3;
    
    rendererElement.dblclick(onDblClick);
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    var debounce = _.debounce(onMouseWheel, 10, {leading: true});
    $(window).on('mousewheel', onMouseWheel);
    
    rendererElement[0].addEventListener('touchmove', onTouchMove, false);
    rendererElement[0].addEventListener('touchend', onTouchEnd, false);
  }
  
  function onDblClick(event){
    autoZoom();
  }
  
  function onTouchEnd(event){
     var delay = 300;
     var delta = lastTouchTime ? event.timeStamp - lastTouchTime : 0;
     console.log(event.changedTouches);
     if (event.changedTouches.length == 1){
       if (delta < delay && delta > 30){
         event.preventDefault();
         autoZoom();
       }
     }
     lastTouchTime = event.timeStamp;
  }
  
  function autoZoom(){
    isAnimating = true;
    var zoomThreshold = Math.abs(settings.maxZoomDistance - settings.minZoomDistance / 2);
    if (Math.abs(camera.position.x) > zoomThreshold) {
      if (progress == 0) { zoomingOut = false; }
    } else {
      if (progress == 0) { zoomingOut = true; }
    }
  }
  
  function onMouseDown(event){ mouseDown = true; }
  
  function onMouseUp(event){ mouseDown = false;}
  
  function onHoverIn(event){  mouseIn = true; }
  
  function onHoverOut(event){ mouseIn = false; } 
  
  function onMouseMove(event){
    if (Math.abs(cameraDist) < self.panLockAt) {
      var delta = getMouseMoveDelta(event);
      if (Math.abs(delta[1]) > Math.abs(delta[0])){
        pan(delta[1], mousePanSpeedFactor);
      }
    }
  }
  
  function onMouseWheel(event){
    if (mouseIn){
      isAnimating = false;
      event.preventDefault();
      var deltaY = ControlUtils.clamp(event.originalEvent.deltaY, -100, 100); 
      interactiveZoom(deltaY, .2);
    }  
  } 
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < self.panLockAt) {
          if (touchTracker.direction == "VERTICAL"){ 
            pan(touchTracker.speedY, touchPanSpeedFactor);
          } 
        }
     }
     else if (event.touches.length == 2){
        isAnimating = false;
        interactiveZoom(touchTracker.deltaDistance, .5);
     }
   }
  
  function interactiveZoom(speed, factor){
    cameraDist += speed * factor;
    constrainZoom(settings.minZoomDistance, settings.maxZoomDistance);
    camera.position.x = cameraDist;
    centerCamera(); 
  }
  
  function pan(speed, factor){
    cameraHeight -= speed * factor;
    constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0,(cameraHeight),0)); 
  }
  
  function centerCamera(){
    var totalZoomDist = Math.abs(settings.minZoomDistance - settings.maxZoomDistance);
    var zoomLevel = Math.abs(cameraDist - settings.minZoomDistance) / totalZoomDist;
    
    cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, zoomLevel);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0,(cameraHeight),0));
  }
  
  function animateZoom(step){
    if (isAnimating){
      progress += step;
      progress = ControlUtils.clamp(progress, 0, 1); 
      
      cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, progress);
      
      if (zoomingOut) { 
        cameraDist = ControlUtils.lerp(cameraDist, settings.maxZoomDistance, progress);
      } else {
        cameraDist = ControlUtils.lerp(cameraDist, settings.minZoomDistance, progress);
      }
      
      camera.position.y = cameraHeight;
      camera.position.x = cameraDist;
      camera.lookAt(new THREE.Vector3(0,(cameraHeight),0));
    }
    if (progress >= 1){
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
      deltaX = mouse.x - event.pageX;
      deltaY = mouse.y - event.pageY;
    }
        
    mouse.x = event.pageX;
    mouse.y = event.pageY;  
    return [deltaX, deltaY];
  } 
  
  this.animate = function(){
    animateZoom(settings.animationSpeed);
  }
  
  return this;

}
