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
  
  var touchPanSpeedFactor = .4;
  var mousePanSpeedFactor = .035;
  
  var self = this;
  
  var touchTracker = new TouchTracker(rendererElement); 
  
  init();
  
  function init(){
    rendererElement.mousemove(onMouseMove);
    rendererElement.mousedown(onMouseDown);
    rendererElement.mouseup(onMouseUp);
    rendererElement.hover(onHoverIn, onHoverOut);
    
    var debounce = _.debounce(onMouseWheel, 10, {leading: true});
    $(window).on('mousewheel', onMouseWheel);
    
     rendererElement[0].addEventListener('touchmove', onTouchMove, false); 
  }
  
  function onMouseMove(event){
    if (Math.abs(cameraDist) < self.panLockAt) {
      var delta = getMouseMoveDelta(event);
      if (Math.abs(delta[1]) > Math.abs(delta[0])){
        cameraHeight -= delta[1] * mousePanSpeedFactor;
        constrainVerticalPan(self.minCameraHeight, self.maxCameraHeight);
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
      constrainZoom(self.minZoomDistance, self.maxZoomDistance);
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
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        if (Math.abs(cameraDist) < self.panLockAt) {
          if (touchTracker.direction == "VERTICAL"){ 
            cameraHeight -= touchTracker.speedY * touchPanSpeedFactor;
            constrainVerticalPan(self.minCameraHeight, self.maxCameraHeight);
            camera.position.y = cameraHeight;
            camera.lookAt(new THREE.Vector3(0, cameraHeight, 0)); 
          } 
        }
     }
     else if (event.touches.length == 2){
        cameraDist += touchTracker.deltaDistance * .5;
        constrainZoom(self.minZoomDistance, self.maxZoomDistance);
        camera.position.x = cameraDist;
        centerCamera(); 
     }
   }
  
  function centerCamera(){
    var totalZoomDist = Math.abs(self.minZoomDistance - self.maxZoomDistance);
    var zoomLevel = Math.abs(cameraDist - self.minZoomDistance) / totalZoomDist;
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
  var lastTimeStamp;
   
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
       self.deltaX, self.deltaY = 0; 
       startPosX = event.touches[0].pageX;
       startPosY = event.touches[0].pageY;
       posX = event.touches[0].pageX;
       posY = event.touches[0].pageY;
     } else if (event.touches.length == 2){
       currentDistance = touchDistance(event);
       lastDistance = currentDistance;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        console.log("last", posX);
        getTouchMoveDelta(event);
        console.log("current", posX, self.deltaX);
        detectDirection();
        self.speedX = self.deltaX / (event.timeStamp - startTime);
        self.speedY = self.deltaY / (event.timeStamp - startTime);
     } else if (event.touches.length == 2) {
        currentDistance = touchDistance(event);
        self.deltaDistance = currentDistance - lastDistance;
        lastDistance = currentDistance;
     }
   }
   
   function onTouchEnd(event){
     self.deltaX, self.deltaY = 0;
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
    cameraXPosition: -50,
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
  
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  var canvasWidth = rendererElement.width();
  var canvasHeight  = canvasWidth  / settings.aspectRatio;
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ? window.devicePixelRatio : 1
  
  var CAM_FAR_PLANE = 100;
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
    renderer.setSize(canvasWidth , canvasHeight );
    
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
    camera.position.y = settings.cameraYPosition;
    camera.lookAt(new THREE.Vector3(0, settings.cameraYPosition, 0));
    cameraControl = new CameraDollyControl(camera, rendererElement);
  }
  
  function setupMeshes(){
    for (var i = 0; i < scene.children.length; i++){
        object = scene.children[i];
        if (object.type == "Mesh"){
          object.rotation.y = settings.initialRotation * Math.PI / 180;
          meshes.push(object);
          object.material.map = textures[0];
        }
      }
      
    meshes[1].visible = false;
    meshes[0].visible = true;
      
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
    renderer.render(scene, camera);
  }
  
  return this;

}