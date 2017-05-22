function CameraDollyControl(camera, rendererElement, options){

  var settings = {
    minZoomDistance: 12,
    maxZoomDistance: 50,
    minCameraHeight: 2.5,
    maxCameraHeight: 14.5,
    animationSpeed: .04,
    touchPanSpeedFactor: .3,
    mousePanSpeedFactor: .015,
    interactiveZoomSpeedFactor: .2
  };
  
  this.panLockAt;
  
  var zoomThreshold;
  var totalZoomDist;
  
  var touchTracker = new TouchTracker(rendererElement); 
  
  var initHeight = camera.position.y;
  var cameraHeight = camera.position.y;
  var cameraDist = camera.position.z;
  
  var mouse = {x: 0, y: 0};
  var mouseDown = false;
  var mouseIn = false;
  var initMouseY = 0;
  
  var scrollDelta;
  
  var touchStartTime;
  var lastTouchTime;
  
  var lastDistance = 0;
  var currentDistance = 0;
  
  var isAnimating = false;
  var zoomingOut = false;
  var progress = 0; 
  
  var self = this;
  
  init();
  
  function init(){
  
    $.extend(settings, options);
    
    self.panLockAt = Math.abs(settings.maxZoomDistance) - 3;
    
    totalZoomDist = Math.abs(settings.minZoomDistance - settings.maxZoomDistance);
    zoomThreshold = Math.abs(settings.maxZoomDistance - settings.minZoomDistance/ 2);
    
    rendererElement.dblclick(onDblClick);
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    window.addEventListener('wheel', onMouseWheel);
    
    rendererElement[0].addEventListener('touchmove', onTouchMove, false);
    rendererElement[0].addEventListener('touchend', onTouchEnd, false);
    
  }
  
  function initControls(){
    rendererElement.dblclick(onDblClick);
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    window.addEventListener('wheel', onMouseWheel);
    
    rendererElement[0].addEventListener('touchmove', onTouchMove, false);
    rendererElement[0].addEventListener('touchend', onTouchEnd, false);
  }
  
  function unbindControls(){
    rendererElement.off('dblclick', onDblClick);
    rendererElement.off('mousemove', onMouseMove);
    rendererElement.off('mousedown', onMouseDown);
    rendererElement.off('mouseup', onMouseUp);
    rendererElement.off('hover', onHoverIn, onHoverOut);
    
    window.removeEventListener('wheel', onMouseWheel);
    
    rendererElement[0].removeEventListener('touchmove', onTouchMove);
    rendererElement[0].removeEventListener('touchend', onTouchEnd);
  }
  
  function onDblClick(event){
    autoZoom();
  }
  
  function onTouchEnd(event){
     var delay = 300;
     
     var delta = lastTouchTime ? event.timeStamp - lastTouchTime : 0;
     
     if (event.changedTouches.length == 1){
       if (delta < delay && delta > 100){
         event.preventDefault();
         autoZoom();
       }
     }
     
     lastTouchTime = event.timeStamp;
  }
  
  function autoZoom(){
    isAnimating = true;
    
    if (Math.abs(camera.position.z) > zoomThreshold) {
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
        pan(delta[1], settings.mousePanSpeedFactor);
      }
    }
    
  }
  
  function onMouseWheel(event){
    if (mouseIn){
      isAnimating = false;
      event.preventDefault();
      scrollDelta = ControlUtils.clamp(event.deltaY, -100, 100); 
      interactiveZoom(scrollDelta, settings.interactiveZoomSpeedFactor);
    }  
  } 
   
   function onTouchMove(event){
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < self.panLockAt) {
          event.preventDefault();
          if (touchTracker.axis == "VERTICAL"){ 
            pan(touchTracker.speedY, settings.touchPanSpeedFactor);
          }
        }   
     }
     else if (event.touches.length == 2){
        event.preventDefault();
        isAnimating = false;
        interactiveZoom(touchTracker.deltaDistance, settings.interactiveZoomSpeedFactor);
     }
   }
  
  function interactiveZoom(speed, factor){
    //cameraDist += speed * factor;
    cameraDist -= speed * factor;
    constrainZoom(settings.minZoomDistance, settings.maxZoomDistance);
    camera.position.z = cameraDist;
    centerCamera(); 
  }
  
  function pan(speed, factor){
    cameraHeight -= speed * factor;
    constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0,(cameraHeight),0)); 
  }
  
  function centerCamera(){
    zoomLevel = Math.abs(cameraDist - settings.minZoomDistance) / totalZoomDist;
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
      camera.position.z = cameraDist;
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
  
  /*
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
  */
  
  this.animate = function(){
    animateZoom(settings.animationSpeed);
  }
  
  this.registerControls = initControls;
  this.unbindControls = unbindControls;
  
  return this;

}
