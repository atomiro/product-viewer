/**
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
    cameraXPosition: 35,
    cameraYPosition: 5,
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
  
  var CAM_FAR_PLANE = 500;
  var CAM_NEAR_PLANE = 0.1;
  
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
    
    camera.position.z = settings.cameraXPosition;
    camera.position.y = settings.cameraYPosition;
    
   var cameraSettings = {
    
      maxZoom: settings.cameraXPosition,
      maxCameraHeight: settings.cameraYPosition,
      
  };
    // get the first mesh's height to set the camera's max height
    // could set height later too if I make an attr for it
    cameraControl = new CameraDollyControl(camera, rendererElement, cameraSettings);
    
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

    if (!modelInitialized(name)){

      if (settings.debug){ console.log("initModel", name); }

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

         models.push(name);

         return model;

      });

    } else {

       return Promise.resolve(model);

    }


  }

  function displayModel(name){

    initModel(name).then(function(model){

        currentModel = name;

        cameraControl.focus(model.mesh);

        display("models", name);

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
