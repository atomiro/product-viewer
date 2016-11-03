//
// Zoom with scroll wheel and vertical pan by clicking a dragging up and down
//
function CameraDollyControl(camera, rendererElement){
  this.minZoomDistance = -20;
  this.maxZoomDistance = -50;
  
  this.minCameraHeight = 2.5;
  this.maxCameraHeight = 14.5;
  
  this.panLockAt = Math.abs(this.maxZoomDistance) - 3;
  
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
  
  var obj = this; 
  
  init();
  
  function init(){
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    var debounce = _.debounce(onMouseWheel, 10, {leading: true});
    $(window).on('mousewheel', onMouseWheel);
    
     rendererElement[0].addEventListener('touchmove', 
     onTouchMove, false);
     
     rendererElement[0].addEventListener('touchend', 
     onTouchEnd, false);
     
     rendererElement[0].addEventListener('touchstart', 
     onTouchStart, false);
    
  }
  
  function onMouseMove(event){
    if (Math.abs(cameraDist) < obj.panLockAt) {
      var delta = getMouseMoveDelta(event);
      if (Math.abs(delta[1]) > Math.abs(delta[0])){
        cameraHeight -= delta[1] * .04;
        constrainVerticalPan(obj.minCameraHeight, obj.maxCameraHeight);
        camera.position.y = cameraHeight;
        camera.lookAt(new THREE.Vector3(0,(cameraHeight),0)); 
      }
    }
  }
  
  function onMouseWheel(event){
    if (mouseIn){
      event.preventDefault();
      var deltaY = ControlUtils.clamp(event.originalEvent.deltaY, -100, 100); 
      cameraDist -= deltaY * .2; 
      constrainZoom(obj.minZoomDistance, obj.maxZoomDistance);
      camera.position.x = cameraDist;
      centerCamera(); 
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
  
   function onTouchStart(event){
     touchStartTime = event.timeStamp;
     if (event.touches.length == 1){
       initMouseY = event.touches[0].pageY;
     }
     if (event.touches.length == 2){
        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
		  
        currentDist = Math.sqrt( dx * dx + dy * dy );
        lastDist = currentDist;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < obj.panLockAt) {
          
          var delta = getTouchMoveVertical(event);
          var speed = delta / (event.timeStamp - touchStartTime);
          cameraHeight -= speed * 5;
          constrainVerticalPan(obj.minCameraHeight, obj.maxCameraHeight);
          camera.position.y = cameraHeight;
          camera.lookAt(new THREE.Vector3(0, cameraHeight, 0)); 
        }
     }
     else if (event.touches.length == 2){
        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
		 
        currentDist = Math.sqrt( dx * dx + dy * dy );
        var distDelta = currentDist - lastDist;
        var speed = distDelta/(touchStartTime - event.timeStamp);
        lastDist = currentDist;
        distDelta = distDelta * .5;
        cameraDist += distDelta;
        constrainZoom(obj.minZoomDistance, obj.maxZoomDistance);
        camera.position.x = cameraDist;
        centerCamera(); 
     }
   }
   
   function onTouchEnd(event){
     initMouseY = mouseY;
   }
  
  function centerCamera(){
    var totalZoomDist = Math.abs(obj.minZoomDistance - obj.maxZoomDistance);
    var zoomLevel = Math.abs(cameraDist - obj.minZoomDistance) / totalZoomDist;
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
  
  function getTouchMoveVertical(event){
      mouseY = event.touches[0].pageY;
      var touchDelta = initMouseY - mouseY;
      initMouseY = mouseY;
      return touchDelta;
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
