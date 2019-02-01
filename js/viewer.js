/**
  Viewer creates a 3D render using an initial texture with an html element
  @param {string} initTexture - path to a texture to initialize with
  @param {Object} element - HTML element selected with JQuery
  @param {Object} options - options object
  @return {Viewer} Viewer
  @constructor
*/
function Viewer(options, sceneSettings) {

  var settings = {
    scene: "assets/scene_specularImageADJ.json",
    container: $('.viewer'),
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: 35,
    cameraYPosition: 11.5,
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

  // local objects - models and textures that have already been initialized
  var currentModel;
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
      
    rendererElement = settings.container;  
    var sceneFile = settings.scene;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      init,
      function(xhr) {
      
        var percent = xhr.loaded / xhr.total;
        
        triggerEvent('viewer.progress', {'percent': percent});
        
      },
      function(xhr) {
      
        console.log(xhr);
        
      });
    
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
    var mc_options = { idleSpeed: settings.idleSpeed }

    for (var i = 0; i < scene.children.length; i++) {
    
        object = scene.children[i];
        
        if (object.type == 'Mesh') {
        
          meshes.push(object);
        }  
    }    

    meshControl = new MeshControl(meshes, rendererElement, mc_options);
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

  function getModelByName(modelName){
    var model;
     for (var i=0; i < sceneSettings.models.length; i++){  
       if (sceneSettings.models[i].name == modelName){
         model = sceneSettings.models[i];
       }
     }

     return model;
  }

  function getMapByName(mapName){
    var map;
    
     for (var i=0; i < sceneSettings.maps.length; i++){  
      if (sceneSettings.maps[i].name == mapName){
         map = sceneSettings.maps[i];
       }
     }

     return map;
  }

  /**
    @private
    @param {string} name - name texture was saved with
    @return {THREE.Texture}
  */
  function getTextureByName(name) {
  
    var texture;
    
    for (var i = 0; i < textures.length; i++) {
    
      if (textures[i].name == name) {
      
        texture = textures[i];
        
      }
      
    }
    
    return texture;
    
  }

  function loadTexture(url){
    if (settings.debug){
      console.log('loading texture:', url);
    }
    return new Promise(function(resolve, reject){
      var textureLoader = new THREE.TextureLoader();

      textureLoader.load(url, 
        resolve, 
        function(response){
          //console.log(response);
        }, 
        reject);

    });
  }

  // load and prepare one model at a time according to the product variant
  function initModel(modelName){
    if (settings.debug){
     console.log("initModel", modelName);
   }

     var model = getModelByName(modelName);
     var object = scene.getObjectByName(model.scene_object);

     var texturePromises = []

     for (var i=0; i < model.maps.length; i++){

        var map = getMapByName(model.maps[i]);
        var promise = loadTexture(map.file);

        texturePromises.push(promise);

     }

    Promise.all(texturePromises).then(function(result){
       
       object.material.normalMap = result[0];
       object.material.specularMap = result[1];

       object.material.needsUpdate = true;

       models.push(modelName);

     }, function(xhr){
       triggerEvent("viewer.error", {message: xhr.target.status });
     });

  }

  function displayModel(name){
    currentModel = name;

    if (models.indexOf(name) == -1) {
      initModel(name);
    }

    var model = getModelByName(name);
    var mesh = scene.getObjectByName(model.scene_object);

    mesh.visible = true;
    cameraControl.focus(mesh);

    for (var i=0; i < sceneSettings.models.length; i++){
      var objectName = sceneSettings.models[i].scene_object;
      if (objectName != mesh.name){
        var m = scene.getObjectByName(objectName);
        m.visible = false;
      }
    }

  }

  function initTexture(name){
    var model = getModelByName(currentModel);
    var mesh = scene.getObjectByName(model.scene_object);

    var textureSettings;

    for (var i=0; i < sceneSettings.textures.length; i++){ 

      if (sceneSettings.textures[i].name == name){
        textureSettings = sceneSettings.textures[i];
      }

    }

    if (textureSettings) {
      var file = textureSettings.file;
      var promise = loadTexture(file);

       promise.then( function(texture){ 
        storeTexture(texture, textureSettings.name);
    
        renderTexture(texture, mesh);

        if (settings.debug){
          console.log("init loaded texture:", textureSettings.name);
          console.log("applied to:", mesh.name);
        }

        useLighting(textureSettings.lighting);
        triggerEvent('viewer.switchtexture');

      }, function(xhr){
        triggerEvent("viewer.error", {message: xhr.target.status });
      });
    } else {
      triggerEvent("viewer.error", {message: "texture " + name + " not found." });
    }

  }

  function displayTexture(name){
    var model = getModelByName(currentModel);
    var mesh = scene.getObjectByName(model.scene_object);

    var textureSettings;

    for (var i=0; i < sceneSettings.textures.length; i++){ 
      if (sceneSettings.textures[i].name == name){
         textureSettings = sceneSettings.textures[i];
      }
    }
    
    var texture = getTextureByName(name);

    if (!texture) {

      initTexture(name);

    } else {

      renderTexture(texture, mesh);

      useLighting(textureSettings.lighting); 

      triggerEvent('viewer.switchtexture');

      if (settings.debug){
        console.log("applied "+ texture.name +" to: " + mesh.name );
      }

    }
    
  }

  function displayModelWithTexture(modelName, textureName){
    currentModel = modelName;

    var model = getModelByName(modelName);
    var mesh = scene.getObjectByName(model.scene_object);

    var texture = getTextureByName(textureName);
    var textureSettings = getTextureSettings(textureName);

    var texturePromises = [];
    
    if (!modelInitialized(modelName)) {

       if (settings.debug) {
         console.log('init model with texture', modelName, textureName);
       }   

       for (var i=0; i < model.maps.length; i++){

          var map = getMapByName(model.maps[i]);
          var promise = loadTexture(map.file);

          texturePromises.push(promise);

       }
    }

    if (!textureInitialized(textureName)){

      if (textureSettings) {
        texturePromises.push(loadTexture(textureSettings.file));
      } else {
        triggerEvent("viewer.error", {message: "texture " + textureName + " not found."});
      }

    } else {

      mesh.material.map = texture;
      mesh.material.needsUpdate = true;

      if (modelInitialized(modelName)){

        setVisible(modelName);
        useLighting(textureSettings.lighting); 
        triggerEvent('viewer.switchtexture');
     
      }  

    }

    Promise.all(texturePromises).then(function(result){
  
      if (result.length == 1) {
        if (settings.debug) {
          console.log("loaded texture: " + textureSettings.name);
        }
        storeTexture(result[0], textureSettings.name);

        mesh.material.map = result[0];

      } else if (result.length == 2){

        if (settings.debug) {
          console.log("loaded maps");
        }

        applyMaps(mesh, result[0], result[1]);

        models.push(modelName);
        cameraControl.focus(mesh);

      } else if (result.length > 0) {

        if (settings.debug) {
          console.log("loaded texture and maps");
        }

        applyMaps(mesh, result[0], result[1]);

        mesh.material.map = result[2];
    
        models.push(modelName);
        cameraControl.focus(mesh);

        storeTexture(result[2], textureSettings.name);

      }

      useLighting(textureSettings.lighting); 

      mesh.material.needsUpdate = true;
      setVisible(modelName);
      triggerEvent('viewer.switchtexture');

    }, function(xhr){
      triggerEvent("viewer.error", { message: xhr.target.status });
    });

  }

  function applyMaps(mesh, normal, specular){
    mesh.material.normalMap = normal;
    mesh.material.specularMap = specular;
  }

  function getTextureSettings(textureName){
    var settings;

    for (var i=0; i < sceneSettings.textures.length; i++){ 
      if (sceneSettings.textures[i].name == textureName){
         settings = sceneSettings.textures[i];
      }
    }

    return settings
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

  function setVisible(modelName){
    
    var model = getModelByName(modelName);
    var mesh = scene.getObjectByName(model.scene_object); 
    mesh.visible = true;

    for (var i=0; i < sceneSettings.models.length; i++){
      var objectName = sceneSettings.models[i].scene_object;
      if (objectName != mesh.name){
        var object = scene.getObjectByName(objectName);
        object.visible = false;
      }
    }

  }

  function useLighting(name){
    var model = getModelByName(currentModel);
    var mesh = scene.getObjectByName(model.scene_object);

    var lightingSettings;

    for (var i=0; i < sceneSettings.lighting.length; i++){ 
      if (sceneSettings.lighting[i].name == name){
        lightingSettings = sceneSettings.lighting[i];
      }
    }

    var lightsObject = lightingSettings.scene_object;
    if (settings.debug){
      console.log("useLighting", name, lightsObject);
    }

    if (lightingSettings.specular_color){

      var specularColor = new THREE.Color(Number(lightingSettings.specular_color));
      mesh.material.specular = specularColor;

    }

    for (var i=0; i < sceneSettings.lighting.length; i++){ 
      var object = scene.getObjectByName(sceneSettings.lighting[i].scene_object);
      if (object.name == lightsObject) {
        object.visible = true;
      } else {
        object.visible = false;
      }
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
      console.log("new style event " + eventName);
      event = $.Event(eventName); 

     if (detail){

        event.detail = detail;

      }

      rendererElement.trigger(event);
    
    } catch (e) {  

      console.warn("Modern Event API not supported", e);
      console.log("old style event " + eventName);
      var event = document.createEvent('CustomEvent');

      event.initCustomEvent(eventName, true, true, detail)
    
      var elementClass =  rendererElement.attr('class');

      eventElement = document.getElementsByClassName(elementClass)[0];
      eventElement.dispatchEvent(event);

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

    if (self.checkRenderingContext() == true) {
      loadScene();
    } else {
      triggerEvent("viewer.error", {message: "WebGL unavailable"});
    }
    
  };

  function storeTexture(texture, name) {
    
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
