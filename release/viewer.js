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
        //console.log(distDelta, camera.position.x);
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
;function MeshControl(meshes, rendererElement){
//
// Rotate multiple meshes by clicking and dragging side to side
//
   var mouseX = 0;
   var mouseY = 0;
   var initMouseX = 0;
   var touchDeltaX = 0;
   var initMouseY = 0;
   var touchDeltaY = 0;
   var lastTimeStamp;
   
   var mouseDown = false;
   var touchStartTime;
   this.meshes = meshes;
   this.rotationSpeed = 8;
   this.mouseSpeed = this.rotationSpeed/10;
   
   this.setRotationSpeed = function(speed){
     this.rotationSpeed = speed;
     this.mouseSpeed = speed/10;
   }
   
   //INTERNALS 
      
   var obj = this;
   
   init();
   
   function init(){
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     
     rendererElement[0].addEventListener('touchmove', 
     onTouchMove, false);
     
     rendererElement[0].addEventListener('touchend', 
     onTouchEnd, false);
     
     rendererElement[0].addEventListener('touchstart', 
     onTouchStart, false);
   }
   
  function onMouseMove(event) {
     var delta = getMouseMoveDelta(event);
     if (Math.abs(delta[0]) > Math.abs(delta[1])){
       var deltaX = ControlUtils.clamp(delta[0], -30, 30);
       var angle = (deltaX * Math.PI / 180) * obj.mouseSpeed;
       rotateTo(angle);
     }
   }
   
   function onMouseDown(event) {
     mouseDown = true;
   }
   
   function onMouseUp(event) {
     mouseDown = false;
   }
   
   function onTouchStart(event){
     touchStartTime = event.timeStamp;
     if (event.touches.length == 1){
       touchDeltaX, touchDeltaY = 0;
       initMouseX = event.touches[0].pageX;
       initMouseY = event.touches[0].pageY;
       //lastMouseX = initMouseX;
     }
   }
   
   function onTouchMove(event){
     event.preventDefault();
     if (event.touches.length == 1){
        //console.log(initMouseX, mouseX, lastMouseX);
        getTouchMoveDelta(event);
        touchDeltaX = ControlUtils.clamp(touchDeltaX, -80, 80);
        var speed = touchDeltaX / (event.timeStamp - touchStartTime);
        angle = speed * .4;
        console.log(speed, angle);
        rotateTo(angle); 
        //lastTimeStamp = event.timeStamp; 
        //lastMouseX = mouseX;
     }
   }
   
   function onTouchEnd(event){
     touchDeltaX = 0;
     touchDeltaY = 0;
   }

   function rotateTo(angle){
     for (var i = 0; i < meshes.length; i++) {
       mesh = meshes[i];
       mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -angle);
     }  
   }
   
   function getTouchMoveDelta(event){
      touchDeltaX = initMouseX - mouseX;
      touchDeltaY = initMouseY - mouseY;
      mouseX = event.touches[0].pageX;
      mouseY = event.touches[0].pageY;
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