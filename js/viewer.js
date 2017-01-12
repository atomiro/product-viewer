function Viewer(textureArray, element, options){

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
  
  var CAM_FAR_PLANE = 1000;
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
        setupLighting(lightingConfigDark);
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
  
  function getMeshByName(name){
    var mesh;
    
    for (var i = 0; i < meshes.length; i++){
      if (meshes[i].name == name) { mesh = meshes[i]; }
    }
    
    return mesh;
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
    var plusModel = getMeshByName("artemix3XLMesh.js");
    var straightModel = getMeshByName("artemixXSMesh.js");
    
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
    
    event = $.Event('viewer.togglemodel');  
    rendererElement.trigger(event);
  }
   
  this.createControls = function(){
    cameraControl.registerControls();
    meshControl.registerControls();
  }
  
  this.unbindControls = function(){
    cameraControl.unbindControls();
    meshControl.unbindControls();
  }
  
  this.addTexture = loadTexture;
  this.restart = restartRender;
  this.halt = haltRender; 
  this.changeLighting = changeLighting;
  
  this.create();
  
  return this;

}