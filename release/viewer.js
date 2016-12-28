//
// Zoom with scroll wheel and vertical pan by clicking a dragging up and down
//
function CameraDollyControl(camera, rendererElement, options){

  var settings = {
    minZoomDistance: -12,
    maxZoomDistance: -50,
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
  var cameraDist = camera.position.x;
  
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
     event.preventDefault();
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < self.panLockAt) {
          if (touchTracker.axis == "VERTICAL"){ 
            pan(touchTracker.speedY, settings.touchPanSpeedFactor);
          } 
        }
     }
     else if (event.touches.length == 2){
        isAnimating = false;
        interactiveZoom(touchTracker.deltaDistance, settings.interactiveZoomSpeedFactor);
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
  
  this.registerControls = initControls;
  this.unbindControls = unbindControls;
  
  return this;

}
;function MeshControl(meshes, rendererElement, options){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   settings = {
     mouseSpeedFactor: .7,
     touchSpeedFactor: 15
   }
   
   this.meshes = meshes;
   
   //INTERNALS 
   
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var initMouseY = 0;
   
   var mouseDeltaX = 0;
   var mouseDeltaY = 0;
   
   var mouseDown = false;
   var touchStartTime;
   var lastTimeStamp;
      
   var self = this;
   
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   function init(){
     $.extend(settings, options);
    
    registerControls(); 
   }
   
  function registerControls(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
  }
  
  function unbindControls(){
     rendererElement.off('mousedown', onMouseDown);
     rendererElement.off('mouseup', onMouseUp);
     rendererElement.off('mousemove', onMouseMove);
     
     rendererElement[0].removeEventListener('touchmove', onTouchMove);
  }
   
  function onMouseMove(event) {
     updateMouseMoveDelta(event);
     if (Math.abs(mouseDeltaX) > Math.abs(mouseDeltaY)){
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
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
       if (touchTracker.axis == "HORIZONTAL"){
          var angle = (touchTracker.speedX * Math.PI / 180) * settings.touchSpeedFactor;
          rotateTo(angle); 
        }
     }
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       meshes[i].rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function updateMouseMoveDelta(event) {
        mouseDeltaX = 0;
        mouseDeltaY = 0;
        
        if (mouseDown) {
          mouseDeltaX = mouseX - event.pageX;
          mouseDeltaY = mouseY - event.pageY;
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
   } 
   
   this.registerControls = registerControls;
   this.unbindControls = unbindControls;
   
   return this;

};function TouchTracker(element){   
   
  var posX = 0;
  var posY = 0;
   
  var startPosX = 0;
  var startPosY = 0;
  var startTime;
  var lastTouchTime;
   
  this.deltaX = 0;
  this.deltaY = 0;
  this.speedX = 0;
  this.speedY = 0;
  this.axis = "HORIZONTAL";
  
  var lastPosition = {x: 0, y: 0}
  var lastDistance = 0;
  var currentDistance = 0;
  
  var currentDirection;
  var lastDirection;
  
  this.deltaDistance = 0;
  
  var self = this;
   
  init();

  function init(){
    var el = element[0];
    el.addEventListener('touchstart', onTouchStart, false); 
    el.addEventListener('touchmove', onTouchMove, false);
    el.addEventListener('touchend', onTouchEnd, false);
  } 
    
  function onTouchStart(event){
     startTime = event.timeStamp;
     lastTouchTime = event.timeStamp;
     if (event.touches.length == 1){
       self.deltaX = 0; 
       self.deltaY = 0;
       startPosX = event.touches[0].pageX;
       posX = startPosX;
       startPosY = event.touches[0].pageY;
       posY = startPosY;
       lastPosition.x = event.touches[0].pageX;
       lastPosition.y = event.touches[0].pageY;
     } else if (event.touches.length == 2){
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        detectAxis();
        self.speedX = self.deltaX / (event.timeStamp - lastTouchTime);
        self.speedY = self.deltaY / (event.timeStamp - lastTouchTime);
        
        lastTouchTime = event.timeStamp;
     } else if (event.touches.length == 2) {
        currentDistance = touchDistance(event);
        self.deltaDistance = currentDistance - lastDistance;
        lastDistance = currentDistance;
     }
   }
   
   function onTouchEnd(event){
     self.deltaX = 0;
     self.deltaY = 0;
     self.deltaDistance = 0;
   }  
   
   function getTouchMoveDelta(event){
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
        
      self.deltaX = lastPosition.x - event.touches[0].pageX;
      self.deltaY = lastPosition.y - event.touches[0].pageY;
      lastPosition.x = event.touches[0].pageX; 
      lastPosition.y = event.touches[0].pageY; 
   }
   
   function touchDistance(event){
      var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	  var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY; 
	  
	  var distance = Math.sqrt( dx * dx + dy * dy );
	  return distance;
   }
   
   function detectAxis(){
     var axisDiff = Math.abs(self.deltaY - self.deltaX);
     console.log(axisDiff);
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)){
       if (axisDiff > 5) {
         self.axis = "VERTICAL";
       }  
     } else {
       if (axisDiff > 5) {
         self.axis = "HORIZONTAL";
       }  
     }
   }

  
   this.getDeltas = function(event){
     getTouchMoveDelta(event);
     
     return { dx: deltaX,  dy: deltaY }
   }

   return this;
};var ControlUtils = {

 clamp:  function(value, min, max){
    var clampedValue = (value > max) ? max : (value < min) ? min : value; 
    return clampedValue;
  },
  
 lerp:  function(p0, p1, progress){
    ControlUtils.clamp(progress, 0, 1);
    var pu = p0 + (p1 - p0) * progress; 
    return pu;
  }

} ;function Viewer(textureArray, element, options){

  var lightingConfigLight = {
      "key": 0.5,
      "rim_right":  0.6,
      "rim_left":  0.6,
      "fill":  0.4,
      "ambient": 0.6
   }
   
   var lightingConfigDark = {
      "key":  0.7,
      "rim_right":  0.8,
      "rim_left":  1.00,
      "fill":  0.3,
      "ambient": 0.3
   }

  var settings = {
    sceneFile: "models_scene.json",
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: -35,
    cameraYPosition: 8.5,
    initialRotation: -90,
    sceneBackgroundColor: "rgb(100, 100, 100)",
  }
  
  // INTERNALS 
  
  var requestFrame = true;
  var initialized = false;
  
  var scene, camera, renderer;
  var meshes = [];
  var lights = {};
  
  var meshControl;
  var cameraControl;
  
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  var canvasWidth = rendererElement.width();
  var canvasHeight  = canvasWidth  / settings.aspectRatio;
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ? window.devicePixelRatio : 1
  
  var CAM_FAR_PLANE = 1000;
  var CAM_NEAR_PLANE = 0.1;
  
  var self = this;

  this.create = function(){
    $.extend(settings, options);
    loadScene();
    
    $(window).resize(function(){ 
      debounceResize(element);
    });
    
    element.mousedown(onMouseDown);
    element.mouseup(onMouseUp);
    
    element.css("cursor", "-webkit-grab");
    element.css("cursor", "grab");
  }
  
  this.toggleModels = function() {
    var plusModel = meshes[1];
    var straightModel = meshes[0];
    
    if (straightModel.visible == true) {
      plusModel.visible = true;
      straightModel.visible = false;
    } else {
      straightModel.visible = true;
      plusModel.visible = false;
    }
    
    event = $.Event('viewer.togglemodel');  
    rendererElement.trigger(event);
  }
  
  this.switchTexture = function(name) {
    for (var i = 0; i < scene.children.length; i++){
      object = scene.children[i];
      if (object.type == "Mesh"){
        updateTexture(getTextureByName(name), object);
      }
    }
    
    event = $.Event('viewer.switchtexture');  
    rendererElement.trigger(event);
  }
  
  this.addTexture = loadTexture;
  
  this.create();
  
  function loadScene(){
    // load scene json file created with three.js editor
    var sceneFile = settings.sceneFile;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      setup,
      function(xhr){
        console.log("Scene " + sceneFile );
      },
      function(xhr){
        console.log(xhr);
      }
    );
  }
  
  function setup(sceneFile){
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO); 
    renderer.setSize(canvasWidth, canvasHeight);
    
    rendererElement.append(renderer.domElement);
    
    scene = sceneFile;
    scene.background = new THREE.Color(settings.sceneBackgroundColor);
    
    textureManager = new THREE.LoadingManager();
    
    textureManager.onError = function(event) {
      console.log("manager error");
      console.log(event);
    }
    
    textureManager.onProgress = function(event) {
      console.log("manager progress");
      console.log(event);
    }
    
    textureManager.onLoad = function(event){
      if (initialized == false){
        setupMeshes();
        setupCamera();
        setupLighting(lightingConfigLight);
        render();
      
        event = $.Event('viewer.loaded');  
        rendererElement.trigger(event);
      
        initialized = true;
      }
    }
    
    for (var i =0; i < textureArray.length; i++){
      loadTexture(textureArray[i]);
    }
 
  }
  
  function setupCamera(){
    camera = new THREE.PerspectiveCamera(settings.fov, settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    camera.position.x = settings.cameraXPosition;
    
    var center = meshes[1].geometry.boundingBox.center().y * .12;
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
    var cameraSettings = {
      maxZoomDistance: settings.cameraXPosition,
      maxCameraHeight: meshes[1].geometry.boundingBox.size().y * .1 
    }
    
    cameraControl = new CameraDollyControl(camera, rendererElement, cameraSettings);

  }
  
  function setupMeshes(){
    for (var i = 0; i < scene.children.length; i++){
        object = scene.children[i];
        if (object.type == "Mesh"){
          object.rotation.y = settings.initialRotation * Math.PI / 180;
          meshes.push(object);
          object.material.map = textures[0];
          object.geometry.computeBoundingBox();
        }
      }
      
    meshes[1].visible = false;
    meshes[0].visible = true;
      
    meshControl = new MeshControl(meshes, rendererElement);
  }
  
  function setupLighting(config){
    lights = {
      "key": scene.getObjectByName("LKEY"),
      "rim_right": scene.getObjectByName("LRIM_Right"),
      "rim_left": scene.getObjectByName("LRIM_Left"),
      "fill": scene.getObjectByName("LFILL"),
      "ambient": scene.getObjectByName("LAmbient")
    }  
    
    lights.key.intensity = config.key;
    lights.rim_right.intensity = config.rim_right; 
    lights.rim_left.intensity = config.rim_left;
    lights.fill.intensity =  config.fill;
    lights.ambient.intensity = config.ambient;
  }
  
  function changeLighting(style){
    //light or dark style 
    if (style.toLowerCase() == "light") {
      config = lightingConfigLight;
    } else if (style.toLowerCase() == "dark"){
      config = lightingConfigDark;
    }
    
    lights.key.intensity = config.key;
    lights.rim_right.intensity = config.rim_right; 
    lights.rim_left.intensity = config.rim_left;
    lights.fill.intensity =  config.fill;
    lights.ambient.intensity = config.ambient;
  }
  
  function getTextureByName(name){
    var texture;
    
    for (var i = 0; i < textures.length; i++){
      if (textures[i].name == name) { texture = textures[i]; }
    }
    
    return texture;
  }
  
  function loadTexture(textureFile){
    textureLoader = new THREE.TextureLoader(textureManager);
      
    textureLoader.load(textureFile,
      function(texture){
        console.log("loader success");
        storeTexture(texture, textureFile);
      },
      function(xhr){
         console.log("Texture " + textureFile + " " + Math.round(xhr.loaded / xhr.total * 100) + "%" );
      },
      function(xhr){
        console.log("loader error");
        console.log(xhr);
      }
    );
  }
  
  function storeTexture(texture, filename){
    texture.name = filename;
    textures.push(texture);
  }
  
  function updateTexture(texture, mesh){
    texture.needsUpdate = true;
    mesh.material.map = texture;
  }
  
  function debounceResize(element){
    var debounce = _.debounce(resizeRenderer, 200, {leading: true});
    debounce(element);
  }
  
  function resizeRenderer(element){
     canvasWidth  = rendererElement.width();
     canvasHeight  = canvasWidth / settings.aspectRatio;
     renderer.setSize(canvasWidth, canvasHeight );
     camera.updateProjectionMatrix();
  }
  
  function render(){
    if (requestFrame){
      requestAnimationFrame(render);
      cameraControl.animate();
      renderer.render(scene, camera);
    }
  }
  
  function restartRender(){
    requestFrame = true;
    render();
  }
  
  function haltRender(){
    requestFrame = false;
  }
  
  function onMouseDown(event) {
     element.css("cursor", "-webkit-grabbing");
     element.css("cursor", "grabbing");
   }
   
   function onMouseUp(event) {
     mouseDown = false;
     element.css("cursor", "-webkit-grab");
     element.css("cursor", "grab");
   }
   
  this.createControls = function(){
    cameraControl.registerControls();
    meshControl.registerControls();
  }
  
  this.unbindControls = function(){
    cameraControl.unbindControls();
    meshControl.unbindControls();
  }
  
  this.restart = restartRender;
  this.halt = haltRender; 
  this.changeLighting = changeLighting;
  
  return this;

}