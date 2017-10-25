/**
  Rotate multiple meshes using mouse or touch controls.
  @param {Array} meshes - Array of THREE.js Mesh Objects
  @param {Object} rendererElement - HTML element selected with jQuery
  @param {Object} options - options object
  @return {MeshControl}
  @constructor
*/
function MeshControl(meshes, rendererElement, options) {
   
   settings = {
   
     mouseSpeedFactor: .7,
     touchSpeedFactor: 15,
     idleSpeed: 0.006
     
   };
   
   this.meshes = meshes;
   
   // INTERNALS
   
   var mouseX = 0;
   var mouseY = 0;
   
   var mouseDeltaX = 0;
   var mouseDeltaY = 0;
   
   var mouseDown = false;
   var mouseIn = false;
   
   var idling = true;
      
   var touchTracker = new TouchTracker(rendererElement);
   
   init();
   
   /**
     @private
   */
   function init() {
   
     $.extend(settings, options);
    
     registerControls();
     
   }
  
   /**
     @private
   */
   function registerControls() {
  
     rendererElement.mousedown(onMouseDown);
     rendererElement.mouseup(onMouseUp);
     rendererElement.mousemove(onMouseMove);
     rendererElement.mouseenter(onMouseIn);
     rendererElement.mouseleave(onMouseOut);
     
     rendererElement[0].addEventListener('touchmove', onTouchMove, false);
     
   }
   
   /**
     @private
   */
   function unbindControls() {
  
     rendererElement.off('mousedown', onMouseDown);
     rendererElement.off('mouseup', onMouseUp);
     rendererElement.off('mousemove', onMouseMove);
     
     rendererElement[0].removeEventListener('touchmove', onTouchMove);
     
   }
   
   /**
     @private
     @param {event} event - mouse/pointer event
   */
   function onMouseMove(event) {
  
     updateMouseMoveDelta(event);
     
     if (Math.abs(mouseDeltaX) > Math.abs(mouseDeltaY)) {
     
       mouseDeltaX = ControlUtils.clamp(mouseDeltaX, -30, 30);
       var angle = (mouseDeltaX * Math.PI / 180) * settings.mouseSpeedFactor;
       rotateTo(angle);
       
     }
     
   }
   
   /**
     @private
   */
   function onMouseDown() {
   
     if (idling){
       idling = false;
     }
     
     mouseDown = true;
     
   }
   
   /**
     @private
   */
   function onMouseUp() {
   
     mouseDown = false;
     
   }
   
   /**
     @private
   */
   function onMouseIn() {
   
      mouseIn = true;
      
   }
   
   /**
     @private
   */
   function onMouseOut() {
   
     mouseIn = false;
     mouseDown = false;
     
   }
   
   /**
     @private
     @param {event} event - touch/pointer event
   */
   function onTouchMove(event) {
   
     if (event.touches.length == 1) {
     
       if (touchTracker.axis == 'HORIZONTAL') {
       
         event.preventDefault();
       
         if (idling){
           idling = false;
         }
          
          var angle = (touchTracker.speedX * Math.PI / 180)
            * settings.touchSpeedFactor;
            
          rotateTo(angle);
          
        }
        
     }
     
   }
   
   /**
     @private
     @param {number} angle - in radians
   */
   function rotateTo(angle) {
     
     var axisOfRotation = new THREE.Vector3(0, 1, 0);
     
     for (var i = 0; i < meshes.length; i++) {
     
       meshes[i].rotateOnAxis(axisOfRotation, -angle);
       
     }
     
   }
   
   /**
     @private
     @param {event} event - mouse/pointer event
   */
   function updateMouseMoveDelta(event) {
   
        mouseDeltaX = 0;
        mouseDeltaY = 0;
        
        if (mouseIn && mouseDown) {
        
          mouseDeltaX = mouseX - event.pageX;
          mouseDeltaY = mouseY - event.pageY;
          
        }
        
        mouseX = event.pageX;
        mouseY = event.pageY;
        
   }
   
   /** 
   Idle animation - call within main render loop 
   @function 
   */
   this.animate = function(){
     
     if (idling){
     
       for (var i = 0; i < meshes.length; i++) {
         meshes[i].rotation.y += settings.idleSpeed
       }
     
     }
     
   }
   
   this.idle = function() {
   
     idling = true;
   
   }
   
   /**
   Register event listeners to the rendererElement
   @function
   */
   this.registerControls = registerControls;
   
   /**
   Remove event listeners from the rendererElement
   @function
   */
   this.unbindControls = unbindControls;
   
   return this;

}
