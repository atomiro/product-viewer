/**
  Viewer creates a 3D render using an initial texture with an html element
  @param {string} initTexture - path to a texture to initialize with
  @param {Object} element - HTML element selected with JQuery
  @param {Object} options - options object
  @return {Viewer} Viewer
  @constructor
*/
function Viewer(initTexture, element, options) {

  var settings = {
  
    sceneFile: 'models_scene.json',
    fov: 23,
    aspectRatio: 4/5,
    cameraXPosition: 35,
    cameraYPosition: 11.5,
    initialRotation: 20,
    sceneBackgroundColor: 'transparent',
    normalXS: 'assets/maps/viewer_XS_2k_normal.jpg',
    normal3XL: 'assets/maps/viewer_3XL_2k_normal.jpg',
    specularXS: 'assets/maps/viewer_XS_2k_specular.jpg',
    specular3XL: 'assets/maps/viewer_3XL_2k_specular.jpg',
    lightSpecColor: 0x202020,
    darkSpecColor: 0xa5a4a6,
    
  };
  
  // INTERNALS
  
  var requestFrame = true;
  var initialized = false;
  
  var scene;
  var camera;
  var renderer;
  
  var meshes = [];
  
  var meshControl;
  var cameraControl;
  
  var textures = [];
  var textureManager;
  
  var rendererElement = element;
  
  var canvasWidth = rendererElement.width();
  var canvasHeight = canvasWidth / settings.aspectRatio;
  
  var DEVICE_PIXEL_RATIO = window.devicePixelRatio ?
    window.devicePixelRatio : 1;
  
  var CAM_FAR_PLANE = 500;
  var CAM_NEAR_PLANE = 0.1;
  
  var self = this;
  
  /** @private */
  function loadScene() {
  
    // load scene json file created with three.js editor
    
    var sceneFile = settings.sceneFile;
    var objloader = new THREE.ObjectLoader();
        
    objloader.load(sceneFile,
      setup,
      function(xhr) {
      
        var percent = Math.round(xhr.loaded / xhr.total * 100);
        var partialPercent = Math.round(xhr.loaded / xhr.total * 75);
        
        console.log('Scene ' + sceneFile + ': ' + percent + '%');
        triggerEvent('viewer.progress', {'percent': partialPercent});
        
      },
      function(xhr) {
      
        console.log(xhr);
        
      });
    
  }
  
  /**
    @private
    @param {Object} sceneFile - THREE.js Scene json object
  */
  function setup(sceneFile) {
  
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(DEVICE_PIXEL_RATIO);
    renderer.setSize(canvasWidth, canvasHeight);
    rendererElement.append(renderer.domElement);
    
    if (settings.sceneBackgroundColor == 'transparent') {
    
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
    
    initManager.onLoad = function() {
    
      initScene();
      
    };
    
    initManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
      console.log('INIT Loading file: ' + url +
        '.\nLoaded ' + itemsLoaded +
        ' of ' + itemsTotal + ' files.');
      
    };
    
    textureManager = new THREE.LoadingManager();
    
    textureManager.onError = function(event) {
    
      console.log('manager error');
      console.log(event);
      
    };
    
    textureManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    
      console.log('Loading file: ' + url +
       '.\nLoaded ' + itemsLoaded + ' of '
       + itemsTotal + ' files.');
     
    };
    
    textureManager.onLoad = function() {
    
       // console.log("texture added");
       
    };
    
    loadTexture(initTexture, initManager);
    
    loadTexture(settings.normalXS, initManager, 'XS_Normal');
    loadTexture(settings.specularXS, initManager, 'XS_Specular');
    loadTexture(settings.normal3XL, initManager, '3XL_Normal');
    loadTexture(settings.specular3XL, initManager, '3XL_Specular');

  }
  
  /** @private */
  function initScene() {
  
    if (initialized == false) {
    
        setupMeshes();
        setupCamera();
        changeLighting('mid');
        render();
        
        triggerEvent('viewer.loaded');
      
        initialized = true;
        
      }
      
  }
  
  /** @private */
  function setupCamera() {
  
    camera = new THREE.PerspectiveCamera(settings.fov,
      settings.aspectRatio, CAM_NEAR_PLANE, CAM_FAR_PLANE);
    
    camera.position.z = settings.cameraXPosition;
    
    var center = meshes[1].geometry.boundingBox.center().y * .13;
    camera.position.y = center;
    camera.lookAt(new THREE.Vector3(0, center, 0));
    
    var cameraSettings = {
    
      maxZoomDistance: settings.cameraXPosition,
      maxCameraHeight: meshes[1].geometry.boundingBox.size().y * .115,
      
    };
    
    cameraControl = new CameraDollyControl(camera,
      rendererElement, cameraSettings);

  }
  
  /** @private */
  function setupMeshes() {
    
    for (var i = 0; i < scene.children.length; i++) {
    
        object = scene.children[i];
        
        if (object.type == 'Mesh') {
        
          meshes.push(object);
          console.log(object.name);
          object.material.map = getTextureByName(initTexture);
          
          if (object.name == 'artemix3XLMesh.js') {
          
            object.material.normalMap = getTextureByName('3XL_Normal');
            object.material.specularMap = getTextureByName('3XL_Specular');
            
          } else {
          
            object.material.normalMap = getTextureByName('XS_Normal');
            object.material.specularMap = getTextureByName('XS_Specular');
            
          }
          
          object.geometry.computeBoundingBox();
          object.rotation.y = radians(settings.initialRotation);
          
        }
        
      }
      
    meshes[1].visible = false;
    meshes[0].visible = true;
      
    meshControl = new MeshControl(meshes, rendererElement);
    
  }
  
  /**
    @private
    @param {string} style - "Light", "Dark" or "Mid"
  */
  function changeLighting(style) {
  
    // light or dark style
    
    style = style.toLowerCase();
    
    if (style == 'dark') {
    
      specularColor = new THREE.Color(settings.darkSpecColor);
      
      for (i=0; i < meshes.length; i++) {
      
        meshes[i].material.specular = specularColor;
        
      }
      
      scene.getObjectByName('DarkDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('MidDesignLights').visible = false;
      
    } else if (style == 'light') {
    
      specularColor = new THREE.Color(settings.lightSpecColor);
      
      for (i=0; i < meshes.length; i++) {
      
        meshes[i].material.specular = specularColor;
        
      }
      
      scene.getObjectByName('BrightDesignLights').visible = true;
      scene.getObjectByName('DarkDesignLights').visible = false;
      scene.getObjectByName('MidDesignLights').visible = false;
      
    } else if (style == 'mid') {
    
      scene.getObjectByName('MidDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('DarkDesignLights').visible = false;
      
    } else {
    
      scene.getObjectByName('MidDesignLights').visible = true;
      scene.getObjectByName('BrightDesignLights').visible = false;
      scene.getObjectByName('DarkDesignLights').visible = false;
      
    }
      
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
  
  /**
    @private
    @param {string} name - name of mesh objects in scene file
    @return {THREE.Mesh}
  */
  function getMeshByName(name) {
  
    var mesh;
    
    for (var i = 0; i < meshes.length; i++) {
    
      if (meshes[i].name == name) {
      
        mesh = meshes[i];
        
      }
      
    }
    
    return mesh;
    
  }
  
  /**
    @private
    @param {Array|string} textureFileArray - Array of paths
  */
  function loadTextures(textureFileArray) {
  
    for (var i = 0; i < textureFileArray.length; i++) {
    
        loadTexture(textureFileArray[i], textureManager);
        
     }
     
  }
  
  /**
    @private
    @param {string} textureFileName - path to texture
    @param {THREE.LoadingManager} manager - THREE.js loading manager
    @param {string} newName - override current file name when
    saving it as a texture
  */
  function loadTexture(textureFileName, manager, newName) {
  
    textureLoader = new THREE.TextureLoader(manager);
    
    textureLoader.load(textureFileName,
      function(texture) {
      
         if (newName) {
         
            storeTexture(texture, newName);
            
          } else {
          
            storeTexture(texture, textureFileName);
            
          }
          
      },
      function(xhr) {
         
         var percentage = Math.round(xhr.loaded / xhr.total * 100);
         console.log('Texture ' + textureFileName + ' ' + percentage + '%');
           
         partialPercent = Math.round(percentage * .25) + 75;
         triggerEvent('viewer.progress', {'percent': partialPercent});
         
      },
      function(xhr) {
      
        console.log('loader error');
        console.log(xhr);
        
      });
    
  }
  
  /**
    @private
    @param {THREE.Texture} texture - THREE.js texture object
    @param {string} filename - name to save the texture with
  */
  function storeTexture(texture, filename) {
  
    texture.name = filename;
    textures.push(texture);
    
  }
  
  /**
    @private
    @param {THREE.Texture} texture - THREE.js texture object
    @param {THREE.Mesh} mesh - THREE.js mesh object
  */
  function updateTexture(texture, mesh) {
  
    texture.needsUpdate = true;
    mesh.material.map = texture;
    
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
      renderer.render(scene, camera);
      
    }
    
  }
  
  /** @private */
  function restartRender() {
  
    requestFrame = true;
    render();
    
  }
  
  /** @private */
  function haltRender() {
  
    requestFrame = false;
    
  }
  
  /** @private */
  function onMouseDown() {
  
     element.css('cursor', '-webkit-grabbing');
     element.css('cursor', 'grabbing');
     
   }
   
   /** @private */
   function onMouseUp() {
   
     mouseDown = false;
     element.css('cursor', '-webkit-grab');
     element.css('cursor', 'grab');
     
   }
   
   /** @private */
   function onMouseOut() {
   
     element.css('cursor', '-webkit-grab');
     element.css('cursor', 'grab');
     
   }
  
  /**
    @private
    @param {string} eventName - name the event
    @param {Object} detail - data object to be passed to the listener
  */
  function triggerEvent(eventName, detail) {
  
    try {
    
      event = $.Event(eventName);
      
      if (detail) {
      
        event.detail = detail;
        
      }
      
      rendererElement.trigger(event);
      
    } catch (e) {
    
      console.warn('Event API not supported', e);
      
      var event = document.createEvent('Event');
      
      event.initEvent(eventName, true, true);
    
      var elementClass = rendererElement.attr('class');
      
      eventElement = document.getElementsByClassName(elementClass)[0];
      
      eventElement.dispatchEvent(event);
      
    }
    
  }
  
  /**
    @private
    @param {number} deg - degrees
    @return {number} radians
  */
  function radians(deg) {
  
    var rad = deg * (Math.PI/180);
    return rad;
    
  }
   
  /**
   create a Viewer
   @function
   */
  this.create = function() {
  
    $.extend(settings, options);
    
    loadScene();
    
    $(window).resize(function() {
     
      debounceResize(element);
      
    });
    
    element.mousedown(onMouseDown);
    element.mouseup(onMouseUp);
    element.mouseleave(onMouseOut);
    
    element.css('cursor', '-webkit-grab');
    element.css('cursor', 'grab');
    
  };
  
  /**
   Toogle between straight and curvy models
   @function
   */
  this.toggleModels = function() {
  
    var plusModel = getMeshByName('artemix3XLMesh.js');
    var straightModel = getMeshByName('artemixXSMesh.js');
    
    if (straightModel.visible == true) {
    
      plusModel.visible = true;
      straightModel.visible = false;
      
    } else {
    
      straightModel.visible = true;
      plusModel.visible = false;
      
    }
    
    triggerEvent('viewer.togglemodel');
    
  };
  
  /**
   Display a saved texture using the name it was saved with.
   @function
   @param {string} name - name the texture was saved with
   */
  this.switchTexture = function(name) {
  
    for (var i = 0; i < scene.children.length; i++) {
    
      object = scene.children[i];
      
      if (object.type == 'Mesh') {
      
        updateTexture(getTextureByName(name), object);
        
      }
      
    }
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  /**
   Create and save a texture using an HTML image or canvas element, then
   display that texture on the current model.
   @function
   @param {Object} image - HTML image or canvas element
   @param {string} filename - name to save the texture as
   */
  this.useLocalTexture = function(image, filename) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, filename);
    self.switchTexture(filename);
    
    triggerEvent('viewer.switchtexture');
    
  };
  
  /**
   Create and save a texture using an HTML image or canvas element.
   @function
   @param {Object} image - HTML image or canvas element
   @param {string} filename - name to save the texture as
   */
  this.addLocalTexture = function(image, filename) {
  
    texture = new THREE.Texture(image);
    storeTexture(texture, filename);
    
  };
  
  /**
    Display a model by size name, "XS" or "3XL"
    @function
    @param {string} size - accepts "XS" or "3XL"
  */
  this.displayModel = function(size) {
    
    var plusModel = getMeshByName('artemix3XLMesh.js');
    var straightModel = getMeshByName('artemixXSMesh.js');
    
    if (size == 'XS') {
    
      straightModel.visible = true;
      plusModel.visible = false;
      
    } else if (size == '3XL') {
    
      plusModel.visible = true;
      straightModel.visible = false;
      
    }
    
    triggerEvent('viewer.togglemodel');
    
  };
  
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
  
    restartRender();
    self.createControls();
    
  };
  
  /**
    Stop render and remove controls
    @function
  */
  this.stop = function() {
  
    haltRender();
    self.unbindControls();
    
  };
  
  /**
    Add an array of textures
    @function
  */
  this.addTextures = loadTextures;
  
  /**
    Start render
    @function
  */
  this.restart = restartRender;
  
  /**
    Stop render
    @function
  */
  this.halt = haltRender;
  
  /**
    Change lighting set
    @function
  */
  this.changeLighting = changeLighting;
  
  this.create();
  
  return this;

}
