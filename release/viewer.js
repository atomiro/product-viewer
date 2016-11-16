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
    window.addEventListener('wheel', onMouseWheel);
    
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
      var deltaY = ControlUtils.clamp(event.deltaY, -100, 100); 
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
;function MeshControl(meshes, rendererElement){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   this.meshes = meshes;
   this.mouseSpeedFactor = .8;
   this.touchSpeedFactor = .35;
   
   //INTERNALS 
   
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var initMouseY = 0;
   
   var mouseDown = false;
   var touchStartTime;
   var lastTimeStamp;
      
   var self = this;
   
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
   }
   
  function onMouseMove(event) {
     var delta = getMouseMoveDelta(event);
     if (Math.abs(delta[0]) > Math.abs(delta[1])){
       var deltaX = ControlUtils.clamp(delta[0], -30, 30);
       var angle = (deltaX * Math.PI / 180) * self.mouseSpeedFactor;
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
       if (touchTracker.direction == "HORIZONTAL"){
          angle = touchTracker.speedX * self.touchSpeedFactor;
          rotateTo(angle); 
        }
     }
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       mesh = meshes[i];
       mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
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
  this.direction = "HORIZONTAL";
  
  var lastDistance = 0;
  var currentDistance = 0;
  
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
     console.log("tracker", posX, posY);
     startTime = event.timeStamp;
     if (event.touches.length == 1){
       self.deltaX = 0; 
       self.deltaY = 0;
       startPosX = event.touches[0].pageX;
       posX = startPosX;
       startPosY = event.touches[0].pageY;
       posY = startPosY;
     } else if (event.touches.length == 2){
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        getTouchMoveDelta(event);
        detectDirection();
        console.log(self.deltaX);
        self.speedX = self.deltaX / (event.timeStamp - startTime);
        self.speedY = self.deltaY / (event.timeStamp - startTime);
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
      self.deltaX = startPosX - posX;
      self.deltaY = startPosY - posY;
      posX = event.touches[0].pageX;
      posY = event.touches[0].pageY;
   }
   
   function touchDistance(event){
      var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	  var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY; 
	  
	  var distance = Math.sqrt( dx * dx + dy * dy );
	  return distance;
   }
   
   function detectDirection(){
     if (Math.abs(self.deltaY) > Math.abs(self.deltaX)){
       self.direction = "VERTICAL";
     } else {
       self.direction = "HORIZONTAL";
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

  var settings = {
    assetPath: "assets/",
    sceneFile: "models_scene.json",
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: -35,
    cameraYPosition: 8.5,
    initialRotation: -90,
    sceneBackgroundColor: "rgb(100, 100, 100)"
  }

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
  
  // INTERNALS 
  
  var initialized = false;
  
  var scene, camera, renderer;
  var meshes = [];
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
  
  function loadScene(){
    // load scene json file created with three.js editor
    var sceneFile = settings.assetPath + settings.sceneFile;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      setup,
      function(xhr){
        console.log("Scene " + sceneFile + " "+ Math.round(xhr.loaded / xhr.total * 100) + "%" );
      },
      function(xhr){
        console.log(xhr);
      }
    );
  }
  
  function setup(sceneFile){
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO); 
    renderer.setSize(canvasWidth, canvasHeight);
    
    rendererElement.append(renderer.domElement);
    
    scene = sceneFile;
    scene.background = new THREE.Color(settings.sceneBackgroundColor);
    
    var grid = new THREE.GridHelper( 200, 50, 0x0000ff, 0x808080 );
	scene.add(grid);
    
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
    cameraControl = new CameraDollyControl(camera, meshes, rendererElement, cameraSettings);
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
    var bbox1 = new THREE.BoundingBoxHelper(meshes[0], 0x00ff00);
    var bbox2 = new THREE.BoundingBoxHelper(meshes[1], 0xff0000);
    bbox1.update();
    bbox2.update();
    //scene.add(bbox1);
    //scene.add(bbox2);
      
    meshControl = new MeshControl(meshes, rendererElement);
  }
  
  function getTextureByName(name){
    var texture;
    
    for (var i = 0; i < textures.length; i++){
      if (textures[i].name == name) { texture = textures[i]; }
    }
    
    return texture;
  }
  
  function loadTexture(textureFileName){
    texturePath = settings.assetPath + textureFileName;
    textureLoader = new THREE.TextureLoader(textureManager);
      
    textureLoader.load(texturePath,
      function(texture){
        console.log("loader success");
        storeTexture(texture, textureFileName);
      },
      function(xhr){
         console.log("Texture " + textureFileName + " " + Math.round(xhr.loaded / xhr.total * 100) + "%" );
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
    requestAnimationFrame(render);
    
    cameraControl.animate();
    renderer.render(scene, camera);
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
  
  return this;

}