function Viewer(initTexture, element, options){

  var settings = {
    sceneFile: "models_scene.json",
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: 35,
    cameraYPosition: 11.5,
    initialRotation: -90,
    sceneBackgroundColor: "transparent"
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
  
  var CAM_FAR_PLANE = 500;
  var CAM_NEAR_PLANE = 0.1;
  
  var self = this;
  
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
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO); 
    renderer.setSize(canvasWidth, canvasHeight);
    rendererElement.append(renderer.domElement);
    
    if (settings.sceneBackgroundColor == "transparent"){
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
    
    initManager.onLoad = function(event){
      initScene();
    }
    
    textureManager = new THREE.LoadingManager();
    
    textureManager.onError = function(event) {
      console.log("manager error");
      console.log(event);
    }
    
    textureManager.onProgress = function(event) {
      //console.log("manager progress");
      //console.log(event);
    }
    
    textureManager.onLoad = function(event){
       console.log("texture added");
       console.log(event);
    }
    
    loadTexture(initTexture, initManager);
 
  }
  
  function initScene(){
    if (initialized == false){
        setupMeshes();
        setupCamera();
        render();
        
        triggerEvent('viewer.loaded');
      
        initialized = true;
      }
  }
  
  function setupCamera(){
    camera = new THREE.PerspectiveCamera(settings.fov, settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    camera.position.z = settings.cameraXPosition;
    
    var center = meshes[1].geometry.boundingBox.center().y * .13;
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
    var cameraSettings = {
      maxZoomDistance: settings.cameraXPosition,
      maxCameraHeight: meshes[1].geometry.boundingBox.size().y * .115 
    }
    
    cameraControl = new CameraDollyControl(camera, rendererElement, cameraSettings);

  }
  
  function setupMeshes(){
    for (var i = 0; i < scene.children.length; i++){
        object = scene.children[i];
        if (object.type == "Mesh"){
          meshes.push(object);
          var smoothGeometry = object.geometry.clone();
          object.material.map = textures[0];
          object.geometry.computeBoundingBox();
          console.log(object.rotation.y);
        }
      }
      
    meshes[1].visible = false;
    meshes[0].visible = true;
      
    meshControl = new MeshControl(meshes, rendererElement);
  }
  
  function setupLighting(config){
    
  }
  
  function changeLighting(style){
    //light or dark style 
  
  }
  
  function getTextureByName(name){
    var texture;
    
    for (var i = 0; i < textures.length; i++){
      if (textures[i].name == name) { texture = textures[i]; }
    }
    return texture;
  }
  
  function getMeshByName(name){
    var mesh;
    
    for (var i = 0; i < meshes.length; i++){
      if (meshes[i].name == name) { mesh = meshes[i]; }
    }
    
    return mesh;
  }
  
  function loadTextures(textureFileArray){
    for (var i = 0 ; i < textureFileArray.length; i++){
        loadTexture(textureFileArray[i], textureManager);
     }
  }
  
  function loadTexture(textureFileName, manager){
    textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load(textureFileName,
      function(texture){
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
   
   function onMouseOut(event){
     element.css("cursor", "-webkit-grab");
     element.css("cursor", "grab");
   } 
  
  function triggerEvent(eventName){
    console.log(eventName);
    try {
      event = $.Event(eventName);  
      rendererElement.trigger(event);
    } catch (e) {  
      console.warn("Modern Event API not supported", e);
      
      var event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
    
      var elementClass =  rendererElement.attr('class')
      eventElement = document.getElementsByClassName(elementClass)[0];
      eventElement.dispatchEvent(event);
    }
  }
   
  this.create = function(){
    $.extend(settings, options);
    loadScene();
    
    $(window).resize(function(){ 
      debounceResize(element);
    });
    
    element.mousedown(onMouseDown);
    element.mouseup(onMouseUp);
    element.mouseleave(onMouseOut);
    
    element.css("cursor", "-webkit-grab");
    element.css("cursor", "grab");
  }
  
  this.toggleModels = function() {
    var plusModel = getMeshByName("artemix3XLMesh.js");
    var straightModel = getMeshByName("artemixXSMesh.js");
    
    if (straightModel.visible == true) {
      plusModel.visible = true;
      straightModel.visible = false;
    } else {
      straightModel.visible = true;
      plusModel.visible = false;
    }
    
    triggerEvent('viewer.togglemodel');
    
  }
  
  this.switchTexture = function(name) {
    for (var i = 0; i < scene.children.length; i++){
      object = scene.children[i];
      if (object.type == "Mesh"){
        updateTexture(getTextureByName(name), object);
      }
    }
    
    triggerEvent('viewer.switchtexture');
  }
  
  this.displayModel = function(size){
    //use size names "XS" or "3XL"
    var plusModel = getMeshByName("artemix3XLMesh.js");
    var straightModel = getMeshByName("artemixXSMesh.js");
    
    if (size == "XS"){
      straightModel.visible = true;
      plusModel.visible = false;
    } else if (size == "3XL"){
      plusModel.visible = true;
      straightModel.visible = false;
    }
    
    triggerEvent('viewer.togglemodel');
  }
   
  this.createControls = function(){
    cameraControl.registerControls();
    meshControl.registerControls();
  }
  
  this.unbindControls = function(){
    cameraControl.unbindControls();
    meshControl.unbindControls();
  }
  
  this.addTextures = loadTextures;
  this.restart = restartRender;
  this.halt = haltRender; 
  
  this.create();
  
  return this;

}