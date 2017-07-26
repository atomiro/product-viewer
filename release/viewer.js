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
    
      console.log('pos animation', camera.position);
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
  
  this.centerOnObject = function(object) {
  
    object.geometry.computeBoundingBox();
    var boundingBox = object.geometry.boundingBox;
    var center = boundingBox.center().y * .13;
    
    initHeight = center;
    cameraHeight = center;
    
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
  }
  
  this.focus = function(object) {
  
    // canvas dimensions
    //var displayWidth = 500;
    //var displayHeight = 625;
    
    // fov in radians 
    var fov = camera.fov * (Math.PI / 180);
    //var near = camera.near;
    //var far = camera.far;
    
    //var objLoc = object.getWorldPosition();
    //var camLoc = camera.getWorldPosition(); 
    
    object.geometry.computeBoundingBox();
    
    console.log("Object", object.name);
    
    var bBox = object.geometry.boundingBox;
    
    console.log("bounding box", bBox);
    
    var center = bBox.center();
    var size = bBox.size();
    
    var maxDimension = Math.max(size.x, size.y, size.z); 
    
    console.log("max dimension", maxDimension);
    
    console.log("center", center);
    console.log("size", size);
    
    var distance = Math.abs(maxDimension / 4 * Math.tan( fov * 2 ));
    
    console.log("FOCUS", distance);
    
    distance *= 1.3;
    
    camera.position.z = distance;
    cameraDist = camera.position.z;
      
  }
  
  return this;

}
;Number.isInteger = Number.isInteger || function(value) {

  return typeof value === 'number' &&
    isFinite(value) &&
    Math.floor(value) === value;
    
};
;/**
  Rotate multiple meshes using mouse or touch controls.
  @param {Array} meshes - Array of THREE.js Mesh Objects
  @param {Object} rendererElement - HTML element selected with jQuery
  @param {Object} options - options object
  @return {MeshControl}
  @constructor
*/
function MeshControl(meshes, rendererElement, options) {
   
   settings = {
   
     mouseSpeedFactor: .7,
     touchSpeedFactor: 15,
     
   };
   
   this.meshes = meshes;
   
   // INTERNALS
   
   var mouseX = 0;
   var mouseY = 0;
   
   var mouseDeltaX = 0;
   var mouseDeltaY = 0;
   
   var mouseDown = false;
   var mouseIn = false;
      
   
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   /**
     @private
   */
   function init() {
   
     $.extend(settings, options);
    
     registerControls();
     
   }
  
   /**
     @private
   */
   function registerControls() {
  
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     rendererElement.mouseenter(onMouseIn);
     rendererElement.mouseleave(onMouseOut);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
     
   }
   
   /**
     @private
   */
   function unbindControls() {
  
     rendererElement.off('mousedown', onMouseDown);
     rendererElement.off('mouseup', onMouseUp);
     rendererElement.off('mousemove', onMouseMove);
     
     rendererElement[0].removeEventListener('touchmove', onTouchMove);
     
   }
   
   /**
     @private
     @param {event} event - mouse/pointer event
   */
   function onMouseMove(event) {
  
     updateMouseMoveDelta(event);
     
     if (Math.abs(mouseDeltaX) > Math.abs(mouseDeltaY)) {
     
       mouseDeltaX = ControlUtils.clamp(mouseDeltaX, -30, 30);
       var angle = (mouseDeltaX * Math.PI / 180) * settings.mouseSpeedFactor;
       rotateTo(angle);
       
     }
     
   }
   
   /**
     @private
   */
   function onMouseDown() {
   
     mouseDown = true;
     
   }
   
   /**
     @private
   */
   function onMouseUp() {
   
     mouseDown = false;
     
   }
   
   /**
     @private
   */
   function onMouseIn() {
   
      mouseIn = true;
      
   }
   
   /**
     @private
   */
   function onMouseOut() {
   
     mouseIn = false;
     mouseDown = false;
     
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
   */
   function onTouchMove(event) {
   
     if (event.touches.length == 1) {
     
       if (touchTracker.axis == 'HORIZONTAL') {
       
          event.preventDefault();
          
          var angle = (touchTracker.speedX * Math.PI / 180)
            * settings.touchSpeedFactor;
            
          rotateTo(angle);
          
        }
        
     }
     
   }
   
   /**
     @private
     @param {number} angle - in radians
   */
   function rotateTo(angle) {
     
     var axisOfRotation = new THREE.Vector3(0, 1, 0);
     
     for (var i = 0; i < meshes.length; i++) {
     
       meshes[i].rotateOnAxis(axisOfRotation, -angle);
       
     }
     
   }
   
   /**
     @private
     @param {event} event - mouse/pointer event
   */
   function updateMouseMoveDelta(event) {
   
        mouseDeltaX = 0;
        mouseDeltaY = 0;
        
        if (mouseIn && mouseDown) {
        
          mouseDeltaX = mouseX - event.pageX;
          mouseDeltaY = mouseY - event.pageY;
          
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
   }
   
   /**
   Register event listeners to the rendererElement
   @function
   */
   this.registerControls = registerControls;
   
   /**
   Remove event listeners from the rendererElement
   @function
   */
   this.unbindControls = unbindControls;
   
   return this;

}
;/**
  TouchTracker distills touch events on an element into speed
  and direction of swipe.
  Also allows access to distance deltas for axes and
  distance between touch points.
  
  @param {Object} element - HTML element selected by jQuery
  @return {TouchTracker}
  @constructor
*/
function TouchTracker(element) {
  
  var currentDistance = 0;
  
  var lastPosition = {x: 0, y: 0};
  var lastTouchTime;
  var lastDistance = 0;
   
  /** @member {number} */
  this.deltaX = 0;
  
  /** @member {number} */
  this.deltaY = 0;
  
  /** @member {number} */
  this.deltaDistance = 0;
  
  /** @member */
  this.speedX = 0;
  
  /** @member {number} */
  this.speedY = 0;
  
  /** @member {string} */
  this.axis = 'HORIZONTAL';
  
  var self = this;
   
  init();
  
   /**
     @private
   */
  function init() {
  
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false);
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
    
  }
  
   /**
     @private
     @param {event} event - touch/pointer event
   */
  function onTouchStart(event) {
  
     startTime = event.timeStamp;
     lastTouchTime = event.timeStamp;
     
     if (event.touches.length == 1) {
     
       self.deltaX = 0;
       self.deltaY = 0;
       
       lastPosition.x = event.touches[0].pageX;
       lastPosition.y = event.touches[0].pageY;
       
     } else if (event.touches.length == 2) {
     
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
       
     }
     
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
   */
   function onTouchMove(event) {
   
       if (event.touches.length == 1) {
       
         getTouchMoveDelta(event);
         detectAxis();
         self.speedX = self.deltaX / (event.timeStamp - lastTouchTime);
         self.speedY = self.deltaY / (event.timeStamp - lastTouchTime);
         lastTouchTime = event.timeStamp;
          
       } else if (event.touches.length == 2) {
       
         currentDistance = touchDistance(event);
         self.deltaDistance = currentDistance - lastDistance;
         console.log('delta', self.deltaDistance);
         lastDistance = currentDistance;
         
       }
       
   }
   
    /**
     @private
   */
   function onTouchEnd() {
   
     self.deltaX = 0;
     self.deltaY = 0;
     self.deltaDistance = 0;
     
   }
   
    /**
     @private
     @param {event} event - touch/pointer event
   */
   function getTouchMoveDelta(event) {
        
     self.deltaX = lastPosition.x - event.touches[0].pageX;
     self.deltaY = lastPosition.y - event.touches[0].pageY;
     lastPosition.x = event.touches[0].pageX;
     lastPosition.y = event.touches[0].pageY;
      
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
     @return {number} distance - distance between touch points
   */
   function touchDistance(event) {
   
     var dx = Math.abs(event.touches[0].pageX - event.touches[1].pageX);
     var dy = Math.abs(event.touches[0].pageY - event.touches[1].pageY);
     
     var distance = Math.sqrt(dx * dx + dy * dy);
     
     return distance;
     
   }
   
   /**
     @private
   */
   function detectAxis() {
   
     var axisDiff = Math.abs(self.deltaY - self.deltaX);
     
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)) {
     
       if (axisDiff > 2) {
      
         self.axis = 'VERTICAL';
         
       }
       
     } else {
     
       if (axisDiff > 2) {
       
         self.axis = 'HORIZONTAL';
         
       }
         
     }
     
   }
   
   /**
     @function
     @param {event} event - touch/pointer event object
     @return {Object} deltas - {dx:deltaX, dy:deltaY}
   */
   this.getDeltas = function(event) {
   
     getTouchMoveDelta(event);
     
     return {dx: deltaX, dy: deltaY};
     
   };

   return this;
   
}
;/**
  Animation utility functions
  @namespace
*/
var ControlUtils = {
 /**
  constrain a value between min and max
  @function  ControlUtils~clamp
  @param {Number} value
  @param {Number} min
  @param {Number} max
  @return {Number}
  */
 clamp: function(value, min, max) {
 
    var clampedValue = (value > max) ? max : (value < min) ? min : value;
    return clampedValue;
    
  },
  /**
  "lerp" stands for Linear Interpolation
  @function ControlUtils~lerp
  @param {Number} p0 - starting postion
  (you may also think of it as current postion)
  @param {Number} p1 - ending position
  @param {Number} progress - expressed in a fraction between 0 and 1
  @return {Number}
  */
 lerp: function(p0, p1, progress) {
 
    ControlUtils.clamp(progress, 0, 1);
    var pu = p0 + (p1 - p0) * progress;
    return pu;
    
  },

};
;/**
  Viewer creates a 3D render using an initial texture with an html element
  @param {string} initTexture - path to a texture to initialize with
  @param {Object} element - HTML element selected with JQuery
  @param {Object} options - options object
  @return {Viewer} Viewer
  @constructor
*/
function Viewer(initTexture, element, options) {

  var settings = {
  
    sceneFile: 'models_scene.json',
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: 35,
    cameraYPosition: 11.5,
    initialRotation: 20,
    sceneBackgroundColor: 'transparent',
    normalXS: 'assets/maps/viewer_XS_2k_normal.jpg',
    normal3XL: 'assets/maps/viewer_3XL_2k_normal.jpg',
    specularXS: 'assets/maps/viewer_XS_2k_specular.jpg',
    specular3XL: 'assets/maps/viewer_3XL_2k_specular.jpg',
    lightSpecColor: 0x202020,
    darkSpecColor: 0xa5a4a6,
    
  };
  
  // INTERNALS
  
  var requestFrame = true;
  var initialized = false;
  
  var scene;
  var camera;
  var renderer;
  
  var cameraControl;
  
  var meshes = [];
  var meshControl;
    
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  
  var canvasWidth = rendererElement.width();
  var canvasHeight = canvasWidth / settings.aspectRatio;
  
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ?
    window.devicePixelRatio : 1;
  
  var CAM_FAR_PLANE = 500;
  var CAM_NEAR_PLANE = 0.1;
  
  var self = this;
  
  /**
    @private
    load scene created with the THREE.js Scene Editor
  */
  function loadScene() {
      
    var file = settings.sceneFile;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(file,
      init,
      function(xhr) {
      
        var partialPercent = Math.round(xhr.loaded / xhr.total * 75);
        
        triggerEvent('viewer.progress', {'percent': partialPercent});
        
      },
      function(xhr) {
      
        console.log(xhr);
        
      });
    
  }
  
  /**
    @private
    @param {Object} file - THREE.js Scene json object
  */
  function init(file) {
  
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO);
    renderer.setSize(canvasWidth, canvasHeight);
    
    rendererElement.append(renderer.domElement);
    
    if (settings.sceneBackgroundColor == 'transparent') {
    
      renderer.setClearColor(0x000000, 0);
      
    } else {
    
      var bgcolor = new THREE.Color(settings.sceneBackgroundColor);
      
      if (bgcolor) {
      
        file.background = bgcolor;
        
      } else {
      
        file.background = new THREE.Color(0x000000);
        
      }
       
    }
      
    scene = file;
    
    initManager = new THREE.LoadingManager();
    
    initManager.onLoad = function() {
    
      initScene();
      
    };
    
    initManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
      console.log('INIT Loading file: ' + url +
        '.\nLoaded ' + itemsLoaded +
        ' of ' + itemsTotal + ' files.');
      
    };
    
    textureManager = new THREE.LoadingManager();
    
    textureManager.onError = function(event) {
    
      console.log('manager error');
      console.log(event);
      
    };
    
    textureManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
      console.log('Loading file: ' + url +
       '.\nLoaded ' + itemsLoaded + ' of '
       + itemsTotal + ' files.');
     
    };
    
    textureManager.onLoad = function() {
    
       // console.log("texture added");
       
    };
    
    loadTexture(initTexture, initManager);
    
    loadTexture(settings.normalXS, initManager, 'XS_Normal');
    loadTexture(settings.specularXS, initManager, 'XS_Specular');
    loadTexture(settings.normal3XL, initManager, '3XL_Normal');
    loadTexture(settings.specular3XL, initManager, '3XL_Specular');

  }
  
  /** @private */
  function initScene() {
  
    if (initialized == false) {
    
        initMeshes();
        initCamera();
        
        useLighting('mid');
        
        render();
        
        triggerEvent('viewer.loaded');
      
        initialized = true;
        
      }
      
  }
  
  /** @private */
  function initCamera() {
  
    camera = new THREE.PerspectiveCamera(settings.fov,
      settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    
    camera.position.z = settings.cameraXPosition;
    
    var cameraSettings = {
    
      maxZoom: settings.cameraXPosition,
      maxCameraHeight: meshes[1].geometry.boundingBox.size().y * .115,
      
    };
    
    cameraControl = new CameraDollyControl(camera,
      rendererElement, cameraSettings);
      
    cameraControl.centerOnObject(meshes[0]); 
    
    cameraControl.focus(meshes[0]);
    
  }
  
  /** @private */
  function initMeshes() {
    
    for (var i = 0; i < scene.children.length; i++) {
    
        object = scene.children[i];
        
        if (object.type == 'Mesh') {
        
          meshes.push(object);
          object.material.map = getTextureByName(initTexture);
          
          if (object.name == 'artemix3XLMesh.js') {
          
            object.material.normalMap = getTextureByName('3XL_Normal');
            object.material.specularMap = getTextureByName('3XL_Specular');
            
          } else {
          
            object.material.normalMap = getTextureByName('XS_Normal');
            object.material.specularMap = getTextureByName('XS_Specular');
            
          }
          
          object.geometry.computeBoundingBox();
          object.rotation.y = radians(settings.initialRotation);
          
        }
        
      }
      
    meshes[1].visible = false;
    meshes[0].visible = true;
      
    meshControl = new MeshControl(meshes, rendererElement);
    
  }
  
  /**
    @private
    @param {string} style - "Light", "Dark" or "Mid"
  */
  function useLighting(style) {
  
    // light or dark style
    
    style = style.toLowerCase();
    
    if (style == 'dark') {
    
      specularColor = new THREE.Color(settings.darkSpecColor);
      
      for (i=0; i < meshes.length; i++) {
      
        meshes[i].material.specular = specularColor;
        
      }
      
      scene.getObjectByName('DarkDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('MidDesignLights').visible = false;
      
    } else if (style == 'light') {
    
      specularColor = new THREE.Color(settings.lightSpecColor);
      
      for (i=0; i < meshes.length; i++) {
      
        meshes[i].material.specular = specularColor;
        
      }
      
      scene.getObjectByName('BrightDesignLights').visible = true;
      scene.getObjectByName('DarkDesignLights').visible = false;
      scene.getObjectByName('MidDesignLights').visible = false;
      
    } else if (style == 'mid') {
    
      scene.getObjectByName('MidDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('DarkDesignLights').visible = false;
      
    } else {
    
      scene.getObjectByName('MidDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('DarkDesignLights').visible = false;
      
    }
      
  }
  
  /**
    @private
    @param {string} name - name texture was saved with
    @return {THREE.Texture}
  */
  function getTextureByName(name) {
  
    var texture;
    
    for (var i = 0; i < textures.length; i++) {
    
      if (textures[i].name == name) {
      
        texture = textures[i];
        
      }
      
    }
    
    return texture;
    
  }
  
  /**
    @private
    @param {string} name - name of mesh objects in scene file
    @return {THREE.Mesh}
  */
  function getMeshByName(name) {
  
    var mesh;
    
    for (var i = 0; i < meshes.length; i++) {
    
      if (meshes[i].name == name) {
      
        mesh = meshes[i];
        
      }
      
    }
    
    return mesh;
    
  }
  
  /**
    @private
    @param {Array|string} paths - Array of file paths
  */
  function loadTextures(paths) {
  
    for (var i = 0; i < paths.length; i++) {
    
        loadTexture(paths[i], textureManager);
        
     }
     
  }
  
  /**
    @private
    @param {string} path - file path to texture
    @param {THREE.LoadingManager} manager - THREE.js loading manager
    @param {string} name - override current file name when
    saving it as a texture
  */
  function loadTexture(path, manager, name) {
  
    textureLoader = new THREE.TextureLoader(manager);
    
    textureLoader.load(
      path,
      function(texture) {
      
         if (name) {
         
            storeTexture(texture, name);
            
          } else {
          
            storeTexture(texture, path);
            
          }
          
      },
      function(xhr) {
         
         var percentage = Math.round(xhr.loaded / xhr.total * 100);
         console.log('Texture ' + path + ' ' + percentage + '%');
           
         partialPercent = Math.round(percentage * .25) + 75;
         triggerEvent('viewer.progress', {'percent': partialPercent});
         
      },
      function(xhr) {
      
        console.log('loader error');
        console.log(xhr);
        
      });
    
  }
  
  /**
    @private
    @param {THREE.Texture} texture - THREE.js texture object
    @param {string} name - name to save the texture with
  */
  function storeTexture(texture, name) {
  
    texture.name = name;
    textures.push(texture);
    
  }
  
  /**
    @private
    @param {THREE.Texture} texture - THREE.js texture object
    @param {THREE.Mesh} mesh - THREE.js mesh object
  */
  function renderTexture(texture) {
  
    for (var i = 0; i < meshes.length; i++) {
    
      var mesh = meshes[i];
      texture.needsUpdate = true;
      mesh.material.map = texture;
      
    }
    
  }
  
  /**
    @private
    @param {Object} element - HTML element selected with jQuery
  */
  function debounceResize(element) {
  
    var debounce = _.debounce(resizeRenderer, 200, {leading: true});
    debounce(element);
    
  }
  
  /**
    @private
    @param {Object} element - HTML element selected with jQuery
  */
  function resizeRenderer(element) {
  
     canvasWidth = element.width();
     canvasHeight = canvasWidth / settings.aspectRatio;
     renderer.setSize(canvasWidth, canvasHeight);
     camera.updateProjectionMatrix();
     
  }
  
  /** @private */
  function render() {
  
    if (requestFrame) {
    
      requestAnimationFrame(render);
      cameraControl.animate();
      renderer.render(scene, camera);
      
    }
    
  }
  
  /** @private */
  function restart() {
  
    requestFrame = true;
    render();
    
  }
  
  /** @private */
  function halt() {
  
    requestFrame = false;
    
  }
  
  /** @private */
  function onMouseDown() {
  
     element.addClass('viewer-interacting');
     element.removeClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseUp() {
   
     mouseDown = false;
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseOut() {
   
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }
  
  /**
    @private
    @param {string} eventName - name the event
    @param {Object} detail - data object to be passed to the listener
  */
  function triggerEvent(eventName, detail) {
  
    try {
    
      event = $.Event(eventName);
      
      if (detail) {
      
        event.detail = detail;
        
      }
      
      rendererElement.trigger(event);
      
    } catch (e) {
    
      console.warn('Event API not supported', e);
      
      var event = document.createEvent('Event');
      
      event.initEvent(eventName, true, true);
    
      var elementClass = rendererElement.attr('class');
      
      eventElement = document.getElementsByClassName(elementClass)[0];
      
      eventElement.dispatchEvent(event);
      
    }
    
  }
  
  /**
    @private
    @param {number} deg - degrees
    @return {number} radians
  */
  function radians(deg) {
  
    var rad = deg * (Math.PI/180);
    return rad;
    
  }
  
  /** private */
  function mouseFeedbackListeners() {
  
    element.addClass('viewer-interact');
   
    element.mousedown(onMouseDown);
    element.mouseup(onMouseUp);
    element.mouseleave(onMouseOut);
    
  }
   
  /**
   create a Viewer
   @function
   */
  this.create = function() {
  
    $.extend(settings, options);
    
    loadScene();
    
    $(window).resize(function() {
     
      debounceResize(element);
      
    });
    
    mouseFeedbackListeners();
    
  };
  
  /**
   Display a saved texture using the name it was saved with.
   @function
   @param {string} name - name the texture was saved with
   */
  this.displayTexture = function(name) {
  
    renderTexture(getTextureByName(name));
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  /**
   Create and save a texture using an HTML image or canvas element, then
   display that texture on the current model.
   @function
   @param {Object} image - HTML image or canvas element
   @param {string} name - name to save the texture as
   */
  this.displayImageAsTexture = function(image, name) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, name);
    self.displayTexture(name);
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  /**
   Create and save a texture using an HTML image or canvas element.
   @function
   @param {Object} image - HTML image or canvas element
   @param {string} name - name to save the texture as
   */
  this.addTextureFromImage = function(image, name) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, name);
    
  };
  
  /**
    Display a model by size name, "XS" or "3XL"
    @function
    @param {string} size - accepts "XS" or "3XL"
  */
  this.displayModel = function(size) {
    
    var plusModel = getMeshByName('artemix3XLMesh.js');
    var straightModel = getMeshByName('artemixXSMesh.js');
    
    if (size == 'XS') {
    
      straightModel.visible = true;
      plusModel.visible = false;
      
    } else if (size == '3XL') {
    
      plusModel.visible = true;
      straightModel.visible = false;
      
    }
    
    triggerEvent('viewer.togglemodel');
    
  };
  
  /**
    Bind listeners for the mouse and touch controls
    @function
  */
  this.createControls = function() {
  
    cameraControl.registerControls();
    meshControl.registerControls();
    
  };
  
  /**
    Remove listeners for the mouse and touch controls
    @function
  */
  this.unbindControls = function() {
  
    cameraControl.unbindControls();
    meshControl.unbindControls();
    
  };
  
  /**
    Start render and bind controls
    @function
  */
  this.start = function() {
  
    restart();
    self.createControls();
    
  };
  
  /**
    Stop render and remove controls
    @function
  */
  this.stop = function() {
  
    halt();
    self.unbindControls();
    
  };
  
  /**
    Add an array of textures
    @function
  */
  this.addTextures = loadTextures;
  
  /**
    Change lighting set
    @function
  */
  this.useLighting = useLighting;
  
  this.create();
  
  return this;

}
