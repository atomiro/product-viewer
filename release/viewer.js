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

  var scaleFactor = .07;
  
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

    var center = boundingBox.center().y * object.scale.y;
    
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

    object.geometry.computeBoundingBox();
    var boundingBox = object.geometry.boundingBox;

    var objHeight = boundingBox.size().y;

    var fovRadians = ControlUtils.radians(camera.fov);

    var distance = objHeight * 0.5 / Math.tan(fovRadians * 0.5);

    //back the camera up a little bit
    distance += 4;

    camera.position.z = distance;
    cameraDist = distance;

    settings.maxZoom = distance;

    settings.maxCameraHeight = objHeight - 1.5;

    updateZoom();

    centerOnObject(object);
      
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
     idleSpeed: 0.006
     
   };
   
   this.meshes = meshes;
   
   // INTERNALS
   
   var mouseX = 0;
   var mouseY = 0;
   
   var mouseDeltaX = 0;
   var mouseDeltaY = 0;
   
   var mouseDown = false;
   var mouseIn = false;
   
   var idling = true;
      
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
   
     if (idling){
       idling = false;
     }
     
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
       
         if (idling){
           idling = false;
         }
          
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
   Idle animation - call within main render loop 
   @function 
   */
   this.animate = function(){
     
     if (idling){
     
       for (var i = 0; i < meshes.length; i++) {
         meshes[i].rotation.y += settings.idleSpeed
       }
     
     }
     
   }
   
   this.idle = function() {
   
     idling = true;
   
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
;(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));
;/**
  TouchTracker distills touch events on an element into speed
  and direction of swipe. Calculates distance and changes in distance
  between multitouch points. 
  
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

    var elementClass =  element.attr('class');
    var domElement = document.getElementsByClassName(elementClass)[0];

    domElement.addEventListener('touchstart', onTouchStart, false);
    domElement.addEventListener('touchmove', onTouchMove, false);
    domElement.addEventListener('touchend', onTouchEnd, false);
    
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

  radians: function(deg) {
  
    var rad = deg * (Math.PI/180);
    return rad;
    
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
function Viewer(options, sceneSettings) {

  // camera position doesn't really make sense

  var settings = {
    container: $('.viewer'),
    fov: 23,
    aspectRatio: 4/5,
    camHorizontalPosition: 35,
    camVerticalPosition: 0,
    idleSpeed: 0.006,
    debug: false,
    requestRender: false
  };
  
  // INTERNALS
  var initialized = false;
  var loading = true;    
  
  var requestFrame = true;
  
  var scene;
  var camera;
  var renderer;
  var rendererElement;

  var canvasWidth;
  var canvasHeight;
  
  var cameraControl;
  var meshControl;
    
  var textureManager;
  var initManager;
  
  var sceneSettings = sceneSettings;

  var currentModel;
  var currentLighting;

  var meshes = [];
  var models = []
  var textures = []
  
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ?
    window.devicePixelRatio : 1;
  
  var CAM_FAR_PLANE = 40;
  var CAM_NEAR_PLANE = 5;
  
  var self = this;
  
  /**
    @private
    load scene created with the THREE.js Scene Editor
  */
  function loadScene() {

    var sceneFile = sceneSettings.scene_path;

    var objLoader = new THREE.ObjectLoader();

    if ( settings.debug ){ console.log("load scene", sceneFile); }

    var loadingPromise = new Promise(function(resolve, reject){

      objLoader.load(sceneFile,
      resolve,
      function(xhr) {
      
        var percent = xhr.loaded / xhr.total;
        
        triggerEvent('viewer.progress', {'percent': percent});
        
      },
      reject);
      
    });
    
    return loadingPromise;

  }
  
  /**
    @private
    @param {Object} file - THREE.js Scene json object
  */
  function init(file) {
    scene = file;
  
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO);

    canvasWidth = rendererElement.width();
    canvasHeight = canvasWidth / settings.aspectRatio;
    renderer.setSize(canvasWidth, canvasHeight);
    
    rendererElement.append(renderer.domElement);
    
    if (settings.sceneBackgroundColor == 'transparent') {
    
      renderer.setClearColor(0x000000, 0);
      
    } else {
    
      var bgcolor = new THREE.Color(settings.sceneBackgroundColor);
      
      if (bgcolor) {
      
        scene.background = bgcolor;
        
      } else {
      
        scene.background = new THREE.Color(0x000000);
        
      }
       
    }
    
    bindElementControls(rendererElement);
    
    initMeshControl();
    initCamera();
    triggerEvent('viewer.initialized');
    initialized = true;

    if (settings.requestRender == false){ 
      restart(); 
    };
  }

  function initMeshControl(){

    var options = { idleSpeed: settings.idleSpeed }

    for (var i = 0; i < scene.children.length; i++) {
    
        object = scene.children[i];
        
        if (object.type == 'Mesh') {
        
          meshes.push(object);

        }  
    }    

    meshControl = new MeshControl(meshes, rendererElement, options);

  }

  
  /** @private */
  function initCamera() {
  
    camera = new THREE.PerspectiveCamera(settings.fov,
             settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    
    camera.position.z = settings.camHorizontalPosition;
    camera.position.y = settings.camVerticalPosition;
    
    cameraControl = new CameraDollyControl(camera, rendererElement);
    
  }

  function getSettings(type, name){
    var settings;

    settings = sceneSettings[type].filter(function(item){ return item.name == name });

    return settings[0];
  }

  function getModel(name){ 
   
   var settings = getSettings("models", name);
   var object = scene.getObjectByName(settings.scene_object);

   return {mesh: object, settings: settings};

  }

  /**
    @private
    @param {string} name - name texture was saved with
    @return {THREE.Texture}
  */
  function getTextureByName(name) {
  
    var texture;

    texture = textures.filter(function(item){ return item.name == name });
    
    return texture[0];
    
  }

  function getTexture(name) {

    var texturePromise;

    if (textureInitialized(name)) {
      
      texture = getTextureByName(name);

      texturePromise = Promise.resolve(texture);
      
    } else {

      var textureSettings = getSettings("textures", name);

      if (!textureSettings) {

        var textureSettings = getSettings("maps", name);

      }

      if (textureSettings) {

        texturePromise = loadTexture(textureSettings.file, textureSettings.name);

      } else {
       
       texturePromise = Promise.reject("Settings for texture " + name + " not found.");

      }

    }

    return texturePromise;

  }

  function loadTexture(url, name){

    if (!name){
      name = url;
    }

    var textureLoader = new THREE.TextureLoader();

    var loadingPromise = new Promise(function(resolve, reject){

      textureLoader.load(url, 
        resolve, 
        function(response){}, 
        reject);

    }).then(function(result){

      storeTexture(result, name);

      return result;

    });

    return loadingPromise;

  }

  function initModel(name){

    var model = getModel(name);

    var loadMaps = [];

    for (var i=0; i < model.settings.maps.length; i++){

      var map = getSettings("maps", model.settings.maps[i]);

      if (map) {

        var loadMap = getTexture(map.name);

        loadMaps.push(loadMap);

      }

    }

    if (loadMaps.length != model.settings.maps.length){

      return Promise.reject("Expected "+ model.settings.maps.length + "settings for maps, found " + loadMaps.length);

    }

    return Promise.all(loadMaps).then(function(){

      applyMaps(model);

      if (model.settings.color){

        var color = new THREE.Color(Number(model.settings.color));
        model.mesh.material.color = color;
        
      }
         
      if (!modelInitialized(name)){ 

        if (settings.debug){ console.log("initModel", name); } 
        models.push(name);

      }

      return model;

    });

  }

  function displayModel(name){

    initModel(name).then(function(model){

        currentModel = name;

        cameraControl.focus(model.mesh);

        if (model.settings.lighting) {

          useLighting(model.settings.lighting, model.mesh);

        }

        display("models", name);

        triggerEvent("viewer.modelready");

    }).catch(function(err){
  
       console.log(err);
       triggerEvent('viewer.error', { message: err });

    });
    
  }

  function displayTexture(name){
    
    var model = getModel(currentModel);

    var textureSettings = getSettings("textures", name);

    getTexture(name).then(function(texture){

      renderTexture(texture, model.mesh);

      useLighting(textureSettings.lighting, model.mesh); 

      triggerEvent('viewer.switchtexture');

      if (settings.debug){
        console.log("applied "+ name +" to: " + model.mesh.name );
      }

    }).catch(function(err){

      console.log(err);
      triggerEvent('viewer.error', { message: err });

    });
  }

  function displayModelWithTexture(modelName, textureName){

    var textureSettings = getSettings("textures", textureName);

    var loadTextures = [initModel(modelName), getTexture(textureName)];  

    Promise.all(loadTextures).then(function(result){

        var model = result[0];
        var texture = result[1];

        currentModel = modelName;

        useLighting(textureSettings.lighting, model.mesh); 

        renderTexture(texture, model.mesh);

        cameraControl.focus(model.mesh);

        display("models", modelName);

        triggerEvent('viewer.switchtexture');

    }).catch(function(err){

      console.log(err);
      triggerEvent('viewer.error', { message: err });

    });
    
  }

  function applyMaps(model){
       
    for (var i=0; i < model.settings.maps.length; i++){
         
      var mapName = model.settings.maps[i];
      var map = getTextureByName(mapName);

      var mapSettings = getSettings("maps", mapName);
      mapType = mapSettings.type; 
         
      if (mapType == "normal") {

        model.mesh.material.normalMap = map;

      } else if (mapType == "specular") {

        model.mesh.material.specularMap = map;

      }

    }

  }

  function modelInitialized(modelName){

    var init = false;
  
    if (models.indexOf(modelName) != -1) {

      init = true;

    }

    return init;

  }

  function textureInitialized(textureName){

    var init = false;

    var texture = getTextureByName(textureName);

    if (texture) { init = true }; 

    return init;
  }

  function display(type, name){

    var settings = getSettings(type, name);
    var sceneObject = settings.scene_object;
    var objectSettings = sceneSettings[type];

    for (var i=0; i < objectSettings.length; i++){ 
  
      var object = scene.getObjectByName(objectSettings[i].scene_object);
  
      if (object) {

        if (object.name == sceneObject) {

          object.visible = true;

        } else {

          object.visible = false;

        }

      }

    }

  }

  function useLighting(name, mesh){

    if (!(currentLighting == name)) {
     
      lighting = getSettings("lighting", name);

      if (lighting.specular_color) {

        var specularColor = new THREE.Color(Number(lighting.specular_color));

        mesh.material.specular = specularColor;

      }

      display("lighting", name);

      if (settings.debug){
        console.log("useLighting", name);
      }

      currentLighting = name;
        
    }

  }
  
  /**
    @private
    @param {THREE.Texture} texture - THREE.js texture object
    @param {THREE.Mesh} mesh - THREE.js mesh object
  */
  function renderTexture(texture, mesh) {

      mesh.material.map = texture;  
      mesh.material.needsUpdate = true;
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
      meshControl.animate();
      
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
  function onMouseDown(element) {
  
     element.addClass('viewer-interacting');
     element.removeClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseUp(element) {
   
     mouseDown = false;
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseOut(element) {
   
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }
  
  /**
    @private
    @param {string} eventName - name the event
    @param {Object} detail - data object to be passed to the listener
  */
  function triggerEvent(eventName, detail){

    try {

      event = $.Event(eventName); 

     if (detail){

        event.detail = detail;

      }
      
      requestAnimationFrame(function(){
        rendererElement.trigger(event);
      });
    
    } catch (e) {  

      console.warn("Modern Event API not supported", e);
    
      var event = document.createEvent('CustomEvent');

      event.initCustomEvent(eventName, true, true, detail)
    
      var elementClass =  rendererElement.attr('class');

      eventElement = document.getElementsByClassName(elementClass)[0];

      requestAnimationFrame(function(){
        eventElement.dispatchEvent(event);
      });

    }
    

  }
  
  /**
    @private
    @param {number} deg - degrees
    @return {number} radians
  */
  
  /** private */
  function mouseFeedbackListeners(element) {
  
    element.addClass('viewer-interact');
   
    element.mousedown(function(){
       onMouseDown(element);
     });
    element.mouseup(function(){
      onMouseUp(element);
    });
    element.mouseleave(function(){
      onMouseOut(element);
    });
    
  }

  function bindElementControls(element){
    $(window).resize(function() {
     
      debounceResize(element);
      
    });
    
    mouseFeedbackListeners(element);
  };
   
  /**
   create a Viewer
   @function
   */
  this.create = function() {
  
    $.extend(settings, options);

    rendererElement = settings.container; 

    if (self.checkRenderingContext() == true) {

      loadScene().then(function(scene){

        init(scene);

      }).catch(function(err){
        
         console.log(err);
         triggerEvent("viewer.error", {message: err });

      });

    } else {

      triggerEvent("viewer.error", {message: "WebGL unavailable"});

    }
    
  };

  function storeTexture(texture, name) {
 
    if (settings.debug){
      console.log("loaded texture:", name);
    }
    
    texture.name = name;
    textures.push(texture);
  
  }
  
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

  this.displayModel = displayModel;

  this.displayTexture = displayTexture;

  this.displayModelWithTexture = displayModelWithTexture;
  
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
  
  this.idle = function(){
  
    meshControl.idle();
    
  }

  this.checkRenderingContext = function (){
 
    // Create canvas element. The canvas is not added to the
    // document itself, so it is never displayed in the
    // browser window.

    var canvas = document.createElement("canvas");
    // Get WebGLRenderingContext from canvas element.
    var gl = canvas.getContext("webgl") 
      || canvas.getContext("experimental-webgl");
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
      return true;
    } else {
      return false;
    }
    
  
  }
  
  this.create();
  
  return this;

}
