function Viewer(textureArray, element, options){

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
    
    cameraControl.animate(.04);
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