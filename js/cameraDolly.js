/**
  Animate a camera for zooming in and out
  @param {Object} camera - THREE.js Camera Object
  @param {Object} rendererElement - HTML element selected by jQuery
  @param {Object} options - options object
  @return {CameraDollyControl}
  @constructor
*/
function CameraDollyControl(camera, rendererElement, options) {

  /** @private */
  var settings = {
  
    minZoom: 12,
    maxZoom: 50,
    minCameraHeight: 2.5,
    maxCameraHeight: 14.5,
    animationSpeed: .04,
    touchPanSpeedFactor: .3,
    mousePanSpeedFactor: .015,
    zoomSpeedFactor: .2,
    
  };
  
  var self = this;
  
  /** @member {number} */
  this.panLockAt;

  var touchTracker = new TouchTracker(rendererElement);
  
  var lastTouchTime;
  
  var zoomThreshold;
  
  var totalZoomDist;
  
  var scrollDelta;
  
  var initHeight = camera.position.y;
  
  var cameraHeight = camera.position.y;
  
  var cameraDist = camera.position.z;
  
  var lastPosition = {x: 0, y: 0};

  var mouseIn = false;
  
  var mouseDown = false;
  
  var isAnimating = false;
  
  var zoomingOut = false;
  
  var progress = 0;
  
  var self = this;

  init();

  /** @private */
  function init() {

    $.extend(settings, options);
    
    self.panLockAt = Math.abs(settings.maxZoom) - 3;
    
    totalZoomDist = Math.abs(settings.minZoom - settings.maxZoom);
      
    zoomThreshold = Math.abs(settings.maxZoom - settings.minZoom / 2);
    
    rendererElement.dblclick(onDblClick);
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    window.addEventListener('wheel', onMouseWheel);
    
    rendererElement[0].addEventListener('touchmove', onTouchMove, false);
    rendererElement[0].addEventListener('touchend', onTouchEnd, false);
    
  }

  function updateZoom(){

    self.panLockAt = Math.abs(settings.maxZoom) - 3;
    zoomThreshold = Math.abs(settings.maxZoom - settings.minZoom / 2);
  }
  
  /** @private */
  function initControls() {
  
    rendererElement.dblclick(onDblClick);
    
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    window.addEventListener('wheel', onMouseWheel);
    
    rendererElement[0].addEventListener('touchmove', onTouchMove, false);
    rendererElement[0].addEventListener('touchend', onTouchEnd, false);
    
  }
  
  /** @private */
  function unbindControls() {
  
    rendererElement.off('dblclick', onDblClick);
    rendererElement.off('mousemove', onMouseMove);
    rendererElement.off('mousedown', onMouseDown);
    rendererElement.off('mouseup', onMouseUp);
    rendererElement.off('hover', onHoverIn, onHoverOut);
    
    window.removeEventListener('wheel', onMouseWheel);
    
    rendererElement[0].removeEventListener('touchmove', onTouchMove);
    rendererElement[0].removeEventListener('touchend', onTouchEnd);
    
  }
  
  /** @private */
  function onDblClick() {
  
    autoZoom();
    
  }
  
  /**
  @private
  @param {event} event - touch/pointer event
  */
  function onTouchEnd(event) {
  
     var delay = 300;
     
     var delta = lastTouchTime ? event.timeStamp - lastTouchTime : 0;
     
     if (event.changedTouches.length == 1) {
     
       if (delta < delay && delta > 100) {
       
         event.preventDefault();
         autoZoom();
         
       }
       
     }
     
     lastTouchTime = event.timeStamp;
     
  }
  
  /** @private */
  function autoZoom() {
  
    isAnimating = true;

    if (Math.abs(camera.position.z) > zoomThreshold) {
    
      if (progress == 0) {
      
        zoomingOut = false;
        
      }
      
    } else {
    
      if (progress == 0) {
       
        zoomingOut = true;
        
      }
      
    }
    
  }
  
  /** @private */
  function onMouseDown() {
  
    mouseDown = true;
    
  }
  
  /** @private */
  function onMouseUp() {
  
    mouseDown = false;
    
  }
  
  /** @private */
  function onHoverIn() {
  
    mouseIn = true;
    
  }
  
  /** @private */
  function onHoverOut() {
  
    mouseIn = false;
    
  }
  
  /**
    @private
    @param {event} event - mouse/pointer event
  */
  function onMouseMove(event) {
  
    if (Math.abs(cameraDist) < self.panLockAt) {
    
      var delta = getMouseMoveDelta(event);
      
      if (Math.abs(delta[1]) > Math.abs(delta[0])) {
      
        pan(delta[1], settings.mousePanSpeedFactor);
        
      }
      
    }
    
  }
  
  /**
    @private
    @param {event} event - touch/pointer event
  */
  function onMouseWheel(event) {

    if (mouseIn) {

      isAnimating = false;
      event.preventDefault();
      scrollDelta = ControlUtils.clamp(event.deltaY, -100, 100);
      interactiveZoom(scrollDelta, settings.zoomSpeedFactor);
  
    }

  }
   
   /**
    @private
    @param {event} event - touch/pointer event
  */
   function onTouchMove(event) {

     if (event.touches.length == 1) {

        if (Math.abs(cameraDist) < self.panLockAt) {

          event.preventDefault();

          if (touchTracker.axis == 'VERTICAL') {

            pan(touchTracker.speedY, settings.touchPanSpeedFactor);

          }

        }

     } else if (event.touches.length == 2) {

        event.preventDefault();
        isAnimating = false;
        interactiveZoom(touchTracker.deltaDistance, settings.zoomSpeedFactor);
        
     }
     
   }
  
  /**
    @private
    @param {number} speed
    @param {number} factor - adjust speed
  */
  function interactiveZoom(speed, factor) {

    cameraDist -= speed * factor;
    constrainZoom(settings.minZoom, settings.maxZoom);
    camera.position.z = cameraDist;
    centerCamera();

  }
  
  /**
    @private
    @param {number} speed
    @param {number} factor - adjust speed
  */
  function pan(speed, factor) {
  
    cameraHeight -= speed * factor;
    constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));

  }
  
  /** @private */
  function centerCamera() {
  
    zoomLevel = Math.abs(cameraDist - settings.minZoom) / totalZoomDist;
    cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, zoomLevel);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));
    
  }
  
  /** @private 
  @param {THREE.MeshObject} object 
  */
  function centerOnObject(object) {
  
    object.geometry.computeBoundingBox();
    var boundingBox = object.geometry.boundingBox;
    var center = boundingBox.center().y * .13;
    
    initHeight = center;
    cameraHeight = center;
    
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
  }
  
  /**
    @private
    @param {number} step - step number (between 0 and 1) for incrementing a lerp
  */
  function animateZoom(step) {

    if (isAnimating) {

      progress += step;
      progress = ControlUtils.clamp(progress, 0, 1);
      
      cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, progress);
      
      if (zoomingOut) {
      
        cameraDist = ControlUtils.lerp(cameraDist, settings.maxZoom, progress);
        
      } else {
      
        cameraDist = ControlUtils.lerp(cameraDist, settings.minZoom, progress);
        
      }
      
      camera.position.y = cameraHeight;
      camera.position.z = cameraDist;
      camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));
    
    }
    
    if (progress >= 1) {
    
      isAnimating = false;
      progress = 0;
      
    }
     
  }

  /**
    @private
    @param {number} min
    @param {number} max
  */
  function constrainZoom(min, max) {

    if (Math.abs(cameraDist) < Math.abs(min)) {
 
      cameraDist = min;

    }
    
    if (Math.abs(cameraDist) > Math.abs(max)) {

      cameraDist = max;
 
    }

  }
   
  /**
    @private
    @param {number} min
    @param {number} max
  */
  function constrainVerticalPan(min, max) {

     cameraHeight = ControlUtils.clamp(cameraHeight, min, max);

  }
  
  /**
     @private
     @param {event} event - mouse/pointer event
     @return {Array} deltas - [deltaX, deltaY]
  */
  function getMouseMoveDelta(event) {
  
    var deltaX = 0;
    var deltaY = 0;
        
    if (mouseDown) {
    
      deltaX = lastPosition.x - event.pageX;
      deltaY = lastPosition.y - event.pageY;
      
    }
        
    lastPosition.x = event.pageX;
    lastPosition.y = event.pageY;
     
    return [deltaX, deltaY];
    
  }
  
  /**
  Animate the camera
  */
  this.animate = function() {

    animateZoom(settings.animationSpeed);

  };
   /**
   Register event listeners to the rendererElement
   @function
   */
  this.registerControls = initControls;
  
   /**
   Remove event listeners from the rendererElement
   @function
   */
  this.unbindControls = unbindControls;
  
  /** Position camera so that object fits the canvas
  @param {THREE.MeshObject} object - THREE Mesh Object 
  @function
  */
  this.focus = function(object) {
  
    centerOnObject(object);
    
    // fov in radians 
    var fov = camera.fov * (Math.PI / 180);
    
    object.geometry.computeBoundingBox();
        
    var bBox = object.geometry.boundingBox;
        
    var size = bBox.size();
    var center = bBox.center();
    
    var maxDimension = Math.max(size.x, size.y, size.z); 
            
    var distance = Math.abs(maxDimension / 4 * Math.tan( fov * 2 ));
        
    distance *= 1.33;
    
    camera.position.z = distance;
    
    cameraDist = distance;
    settings.maxZoom = distance;
    settings.maxCameraHeight = size.y * .11;

    updateZoom();
      
  }
  
  return this;

}
