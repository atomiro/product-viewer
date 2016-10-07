function DesignPreview(textureArray, element, options){

  var settings = {
    assetPath: "assets/",
    sceneFileName: "models_scene.json",
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: -50,
    cameraYPosition: 8.5,
    initialRotation: -90
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
    
    event = $.Event('preview.togglemodel');  
    rendererElement.trigger(event);
  }
  
  this.switchTexture = function(name) {
    for (var i = 0; i < scene.children.length; i++){
      object = scene.children[i];
      if (object.type == "Mesh"){
        updateTexture(getTextureByName(name), object);
      }
    }
    
    event = $.Event('preview.switchtexture');  
    rendererElement.trigger(event);
  }
  
  this.create();
  
  // INTERNALS 
  
  var scene, camera, renderer;
  var meshes = [];
  var meshControl;
  
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  var canvasWidth = rendererElement.width();
  var canvasHeight  = canvasWidth  / settings.aspectRatio;
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ? window.devicePixelRatio : 1
  
  var CAM_FAR_PLANE = 1000;
  var CAM_NEAR_PLANE = 1;
  
  function loadScene(){
    // load scene json file created with three.js editor
    var sceneFile = settings.assetPath + settings.sceneFileName;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      setup,
      function(xhr){
        console.log("Scene " + Math.round(xhr.loaded / xhr.total * 100) + "%" );
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
    scene.background = new THREE.Color(0xEEEEEE);
    
    textureManager = new THREE.LoadingManager();
    
    for (var i =0; i < textureArray.length; i++){
      loadTexture(textureArray[i]);
    }
    
    textureManager.onLoad = function() {
      setupMeshes();
      setupCamera();
      render(); 
      
      event = $.Event('preview.load');  
      rendererElement.trigger(event);
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
    texturePath = settings.assetPath + textureFileName
    textureLoader = new THREE.TextureLoader(textureManager);
      
    textureLoader.load(texturePath,
      function(texture){
        texture.name = textureFileName;
        storeTexture(texture);
      },
      function(xhr){
         console.log("Texture " + textureFileName + " " + Math.round(xhr.loaded / xhr.total * 100) + "%" );
      },
      function(xhr){
        console.log(xhr);
      }
    );
  }
  
  function storeTexture(texture){
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