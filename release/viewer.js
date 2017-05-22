function CameraDollyControl(camera, rendererElement, options) {

  var settings = {
  
    minZoomDistance: 12,
    maxZoomDistance: 50,
    minCameraHeight: 2.5,
    maxCameraHeight: 14.5,
    animationSpeed: .04,
    touchPanSpeedFactor: .3,
    mousePanSpeedFactor: .015,
    interactiveZoomSpeedFactor: .2,
    
  };

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

  var isAnimating = false;
  var zoomingOut = false;
  var progress = 0;

  var self = this;

  init();

  function init() {

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
  
  function onDblClick(event) {
  
    autoZoom();
    
  }
  
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
  
  function onMouseDown(event) {
  
    mouseDown = true;
    
  }
  
  function onMouseUp(event) {
  
    mouseDown = false;
    
  }
  
  function onHoverIn(event) {
  
    mouseIn = true;
    
  }
  
  function onHoverOut(event) {
  
    mouseIn = false;
    
  }
  
  function onMouseMove(event) {
  
    if (Math.abs(cameraDist) < self.panLockAt) {
    
      var delta = getMouseMoveDelta(event);
      
      if (Math.abs(delta[1]) > Math.abs(delta[0])) {
      
        pan(delta[1], settings.mousePanSpeedFactor);
        
      }
      
    }
    
  }
  
  function onMouseWheel(event) {

    if (mouseIn) {

      isAnimating = false;
      event.preventDefault();
      scrollDelta = ControlUtils.clamp(event.deltaY, -100, 100);
      interactiveZoom(scrollDelta, settings.interactiveZoomSpeedFactor);
  
    }

  }
   
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
        interactiveZoom(touchTracker.deltaDistance, settings.interactiveZoomSpeedFactor);
        
     }
     
   }
  
  function interactiveZoom(speed, factor) {

    cameraDist -= speed * factor;
    constrainZoom(settings.minZoomDistance, settings.maxZoomDistance);
    camera.position.z = cameraDist;
    centerCamera();

  }
  
  function pan(speed, factor) {
  
    cameraHeight -= speed * factor;
    constrainVerticalPan(settings.minCameraHeight, settings.maxCameraHeight);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));

  }
  
  function centerCamera() {
  
    zoomLevel = Math.abs(cameraDist - settings.minZoomDistance) / totalZoomDist;
    cameraHeight = ControlUtils.lerp(cameraHeight, initHeight, zoomLevel);
    camera.position.y = cameraHeight;
    camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));
    
  }
  
  function animateZoom(step) {

    if (isAnimating) {

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
      camera.lookAt(new THREE.Vector3(0, cameraHeight, 0));
      
    }
    
    if (progress >= 1) {
    
      isAnimating = false;
      progress = 0;
      
    }
     
  }

  function constrainZoom(min, max) {

    if (Math.abs(cameraDist) < Math.abs(min)) {
 
      cameraDist = min;

    }
    
    if (Math.abs(cameraDist) > Math.abs(max)) {

      cameraDist = max;
 
    }

  }
      
  function constrainVerticalPan(min, max) {

     cameraHeight = ControlUtils.clamp(cameraHeight, min, max);

  }
  
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
  
  
  this.animate = function() {

    animateZoom(settings.animationSpeed);

  };
  
  this.registerControls = initControls;
  this.unbindControls = unbindControls;
  
  return this;

}
;function MeshControl(meshes, rendererElement, options) {

//
// Rotate multiple meshes by clicking and dragging side to side
//

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
   
   function init() {
   
     $.extend(settings, options);
    
     registerControls();
     
   }
   
  function registerControls() {
  
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     rendererElement.mouseenter(onMouseIn);
     rendererElement.mouseleave(onMouseOut);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
     
  }
  
  function unbindControls() {
  
     rendererElement.off('mousedown', onMouseDown);
     rendererElement.off('mouseup', onMouseUp);
     rendererElement.off('mousemove', onMouseMove);
     
     rendererElement[0].removeEventListener('touchmove', onTouchMove);
     
  }
   
  function onMouseMove(event) {
  
     updateMouseMoveDelta(event);
     
     if (Math.abs(mouseDeltaX) > Math.abs(mouseDeltaY)) {
     
       mouseDeltaX = ControlUtils.clamp(mouseDeltaX, -30, 30);
       var angle = (mouseDeltaX * Math.PI / 180) * settings.mouseSpeedFactor;
       rotateTo(angle);
       
     }
     
   }
   
   function onMouseDown(event) {
   
     mouseDown = true;
     
   }
   
   function onMouseUp(event) {
   
     mouseDown = false;
     
   }
   
   function onMouseIn(event) {
   
      mouseIn = true;
      
   }
   
   function onMouseOut(event) {
   
     mouseIn = false;
     mouseDown = false;
     
   }
   
   function onTouchMove(event) {
   
     if (event.touches.length == 1) {
     
       if (touchTracker.axis == 'HORIZONTAL') {
       
          event.preventDefault();
          
          var angle = (touchTracker.speedX * Math.PI / 180) * settings.touchSpeedFactor;
            
          rotateTo(angle);
          
        }
        
     }
     
   }

   function rotateTo(angle) {
     
     var axisOfRotation = new THREE.Vector3(0, 1, 0);
     
     for (var i = 0; i < meshes.length; i++) {
     
       meshes[i].rotateOnAxis(axisOfRotation, -angle);
       
     }
     
   }
   
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
   
   this.registerControls = registerControls;
   this.unbindControls = unbindControls;
   
   return this;

}
;function TouchTracker(element) {
  
  var currentDistance = 0;
  
  var lastPosition = {x: 0, y: 0};
  var lastTouchTime;
  var lastDistance = 0;
   
  this.deltaX = 0;
  this.deltaY = 0;
  this.deltaDistance = 0;
  
  this.speedX = 0;
  this.speedY = 0;
  
  this.axis = 'HORIZONTAL';
  
  var self = this;
   
  init();

  function init() {
  
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false);
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
    
  }
    
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
   
   function onTouchEnd(event) {
   
     self.deltaX = 0;
     self.deltaY = 0;
     self.deltaDistance = 0;
     
   }
   
   function getTouchMoveDelta(event) {
        
     self.deltaX = lastPosition.x - event.touches[0].pageX;
     self.deltaY = lastPosition.y - event.touches[0].pageY;
     lastPosition.x = event.touches[0].pageX;
     lastPosition.y = event.touches[0].pageY;
      
   }
   
   function touchDistance(event) {
   
     var dx = Math.abs(event.touches[0].pageX - event.touches[1].pageX);
     var dy = Math.abs(event.touches[0].pageY - event.touches[1].pageY);
     
     var distance = Math.sqrt(dx * dx + dy * dy);
     
     return distance;
     
   }
   
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
  
   this.getDeltas = function(event) {
   
     getTouchMoveDelta(event);
     
     return {dx: deltaX, dy: deltaY};
     
   };

   return this;
   
}
;var ControlUtils = {

 clamp: function(value, min, max) {
 
    var clampedValue = (value > max) ? max : (value < min) ? min : value;
    return clampedValue;
    
  },
  
 lerp: function(p0, p1, progress) {
 
    ControlUtils.clamp(progress, 0, 1);
    var pu = p0 + (p1 - p0) * progress;
    return pu;
    
  },

};
;function Viewer(initTexture, element, options) {

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
  
  var meshes = [];
  
  var meshControl;
  var cameraControl;
  
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  var canvasWidth = rendererElement.width();
  var canvasHeight = canvasWidth / settings.aspectRatio;
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ? window.devicePixelRatio : 1;
  
  var CAM_FAR_PLANE = 500;
  var CAM_NEAR_PLANE = 0.1;
  
  var self = this;
  
  function loadScene() {
  
    // load scene json file created with three.js editor
    
    var sceneFile = settings.sceneFile;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      setup,
      function(xhr) {
      
        var percent = Math.round(xhr.loaded / xhr.total * 75);
        console.log('Scene ' + sceneFile + ' percent ' + Math.round(xhr.loaded / xhr.total * 100));
        triggerEvent('viewer.progress', {'percent': percent});
        
      },
      function(xhr) {
      
        console.log(xhr);
        
      });
    
  }
  
  function setup(sceneFile) {
  
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO);
    renderer.setSize(canvasWidth, canvasHeight);
    rendererElement.append(renderer.domElement);
    
    if (settings.sceneBackgroundColor == 'transparent') {
    
      renderer.setClearColor(0x000000, 0);
      
    } else {
    
      var bgcolor = new THREE.Color(settings.sceneBackgroundColor);
      
      if (bgcolor) {
      
        sceneFile.background = bgcolor;
        
      } else {
      
        sceneFile.background = new THREE.Color(0x000000);
        
      }
       
    }
      
    scene = sceneFile;
    
    initManager = new THREE.LoadingManager();
    
    initManager.onLoad = function(event) {
    
      initScene();
      
    };
    
    initManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
      console.log('INIT Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
      
    };
    
    textureManager = new THREE.LoadingManager();
    
    textureManager.onError = function(event) {
    
      console.log('manager error');
      console.log(event);
      
    };
    
    textureManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
     // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
     
    };
    
    textureManager.onLoad = function(event) {
    
       // console.log("texture added");
       
    };
    
    loadTexture(initTexture, initManager);
    
    loadTexture(settings.normalXS, initManager, 'XS_Normal');
    loadTexture(settings.specularXS, initManager, 'XS_Specular');
    loadTexture(settings.normal3XL, initManager, '3XL_Normal');
    loadTexture(settings.specular3XL, initManager, '3XL_Specular');

  }
  
  function initScene() {
  
    if (initialized == false) {
    
        setupMeshes();
        setupCamera();
        changeLighting('mid');
        render();
        
        triggerEvent('viewer.loaded');
      
        initialized = true;
        
      }
      
  }
  
  function setupCamera() {
  
    camera = new THREE.PerspectiveCamera(settings.fov, settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    
    camera.position.z = settings.cameraXPosition;
    
    var center = meshes[1].geometry.boundingBox.center().y * .13;
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
    var cameraSettings = {
    
      maxZoomDistance: settings.cameraXPosition,
      maxCameraHeight: meshes[1].geometry.boundingBox.size().y * .115,
      
    };
    
    cameraControl = new CameraDollyControl(camera, rendererElement, cameraSettings);

  }
  
  function setupMeshes() {
    
    for (var i = 0; i < scene.children.length; i++) {
    
        object = scene.children[i];
        
        if (object.type == 'Mesh') {
        
          meshes.push(object);
          console.log(object.name);
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
  
  function changeLighting(style) {
  
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
  
  function getTextureByName(name) {
  
    var texture;
    
    for (var i = 0; i < textures.length; i++) {
    
      if (textures[i].name == name) {
      
        texture = textures[i];
        
      }
      
    }
    
    return texture;
    
  }
  
  function getMeshByName(name) {
  
    var mesh;
    
    for (var i = 0; i < meshes.length; i++) {
    
      if (meshes[i].name == name) {
      
        mesh = meshes[i];
        
      }
      
    }
    
    return mesh;
    
  }
  
  function loadTextures(textureFileArray) {
  
    for (var i = 0; i < textureFileArray.length; i++) {
    
        loadTexture(textureFileArray[i], textureManager);
        
     }
     
  }
  
  function loadTexture(textureFileName, manager, newName) {
  
    textureLoader = new THREE.TextureLoader(manager);
    
    textureLoader.load(textureFileName,
      function(texture) {
      
         if (newName) {
         
            storeTexture(texture, newName);
            
          } else {
          
            storeTexture(texture, textureFileName);
            
          }
          
      },
      function(xhr) {
      
         console.log('Texture ' + textureFileName + ' ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
         percent = Math.round((xhr.loaded / xhr.total * 100) * .25) + 75;
         triggerEvent('viewer.progress', {'percent': percent});
         
      },
      function(xhr) {
      
        console.log('loader error');
        console.log(xhr);
        
      });
    
  }
  
  function storeTexture(texture, filename) {
  
    texture.name = filename;
    textures.push(texture);
    
  }
  
  function updateTexture(texture, mesh) {
  
    texture.needsUpdate = true;
    mesh.material.map = texture;
    
  }
  
  function debounceResize(element) {
  
    var debounce = _.debounce(resizeRenderer, 200, {leading: true});
    debounce(element);
    
  }
  
  function resizeRenderer(element) {
  
     canvasWidth = rendererElement.width();
     canvasHeight = canvasWidth / settings.aspectRatio;
     renderer.setSize(canvasWidth, canvasHeight);
     camera.updateProjectionMatrix();
     
  }
  
  function render() {
  
    if (requestFrame) {
    
      requestAnimationFrame(render);
      cameraControl.animate();
      renderer.render(scene, camera);
      
    }
    
  }
  
  function restartRender() {
  
    requestFrame = true;
    render();
    
  }
  
  function haltRender() {
  
    requestFrame = false;
    
  }
  
  function onMouseDown(event) {
  
     element.css('cursor', '-webkit-grabbing');
     element.css('cursor', 'grabbing');
     
   }
   
   function onMouseUp(event) {
   
     mouseDown = false;
     element.css('cursor', '-webkit-grab');
     element.css('cursor', 'grab');
     
   }
   
   function onMouseOut(event) {
   
     element.css('cursor', '-webkit-grab');
     element.css('cursor', 'grab');
     
   }
  
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
  
  function radians(deg) {
  
    var rad = deg * (Math.PI/180);
    return rad;
    
  }
   
  this.create = function() {
  
    $.extend(settings, options);
    
    loadScene();
    
    $(window).resize(function() {
     
      debounceResize(element);
      
    });
    
    element.mousedown(onMouseDown);
    element.mouseup(onMouseUp);
    element.mouseleave(onMouseOut);
    
    element.css('cursor', '-webkit-grab');
    element.css('cursor', 'grab');
    
  };
  
  this.toggleModels = function() {
  
    var plusModel = getMeshByName('artemix3XLMesh.js');
    var straightModel = getMeshByName('artemixXSMesh.js');
    
    if (straightModel.visible == true) {
    
      plusModel.visible = true;
      straightModel.visible = false;
      
    } else {
    
      straightModel.visible = true;
      plusModel.visible = false;
      
    }
    
    triggerEvent('viewer.togglemodel');
    
  };
  
  this.switchTexture = function(name) {
  
    for (var i = 0; i < scene.children.length; i++) {
    
      object = scene.children[i];
      
      if (object.type == 'Mesh') {
      
        updateTexture(getTextureByName(name), object);
        
      }
      
    }
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  this.useLocalTexture = function(image, filename) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, filename);
    self.switchTexture(filename);
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  this.addLocalTexture = function(image, filename) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, filename);
    
  };
  
  this.displayModel = function(size) {
  
    // use size names "XS" or "3XL"
    
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
   
  this.createControls = function() {
  
    cameraControl.registerControls();
    meshControl.registerControls();
    
  };
  
  this.unbindControls = function() {
  
    cameraControl.unbindControls();
    meshControl.unbindControls();
    
  };
  
  this.start = function() {
  
    restartRender();
    self.createControls();
    
  };
  
  this.stop = function() {
  
    haltRender();
    self.unbindControls();
    
  };
  
  this.addTextures = loadTextures;
  this.restart = restartRender;
  this.halt = haltRender;
  this.changeLighting = changeLighting;
  
  this.create();
  
  return this;

}
