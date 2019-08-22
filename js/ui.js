function ViewerUI(viewer, options) {

  var settings = {};

  var element = viewer.element;
  var viewer = viewer;

  var viewerInit = false;
  var viewerError = false;
  var helpVisible = false;

  var showLoaderID;
   
  function init(){

  	$.extend(settings, options);
 
    setupUI();

    statusDisplay();

    bindHelpToggle();

  }

  function setupUI() {

	var helpOverlay = help();

	mouseFeedback(element);

	registerInputs();

    element.addClass('viewer');

    element.append(loader());

     $('.loader').each(function(){
      arrangeInCircle($(this));
    });

    element.append(helpOverlay);

    showLoad();

  }  

  function registerInputs(){

	$('.viewer-ui').click(function(){

	   showLoad();

       var view = $(this).data();

       display(view);

	});

  }

  function display(data){

  	// TK put this stuff in the viewer itself, send an object with model and or texture to viewer

    if (data.hasOwnProperty('model') && data.hasOwnProperty('texture')) {

      viewer.displayModelWithTexture(data.model, data.texture);

    } else if (data.hasOwnProperty('model') && (data.hasOwnProperty('texture') == false)) {

  	  viewer.displayModel(data.model);

    } else if (data.hasOwnProperty('texture') && (data.hasOwnProperty('model') == false)) {	
    
      viewer.displayTexture(data.texture);

    } 

  }

   /** viewer status **/

  function statusDisplay(){	

    element.on('viewer.initialized', onInit);

    element.one('viewer.switchtexture viewer.modelready', onInitLoad);

    element.on('viewer.switchtexture viewer.modelready', onReady);

    element.on("viewer.error", onError);

  }

  function displayDefault() {

    $('.viewer-ui').each(function(){

  	  var view = $(this).data();

  	  if (view.hasOwnProperty('defaultView')){display(view);}

    });

  }

  function onInit(){

      displayDefault();

      showControls();
  }

  function onInitLoad(){

  	 window.requestAnimationFrame( function(){

   	 	viewerInit = true;

   	    element.addClass('show-viewer');

   	  });

  }

  function onReady(){

     window.requestAnimationFrame( function(){

        viewerError = false;

        showViewer();
     
      });
  }

  function onError(error){

  	console.log("error", error);

    showError();

    viewerError = true;

  }

function showViewer(){

  element.addClass('show-viewer');

  showControls();

  hideError();

  hideLoad();

}

function showControls() {

  $('.viewer-controls').css('display', 'block');

  $('.viewer-help-show').css('display', 'block');

}

function hideControls() {

  $('.viewer-controls').css('display', 'none');

  $('.viewer-help-show').css('display', 'none');

}

/** error status **/

function showError(){

  $('.error-overlay').addClass('show-status');

  hideLoad();

  hideControls();

  viewer.stop();

}

function hideError(){
  
  $('.error-overlay').removeClass('show-status');

  showControls();

  viewer.start();

}

/** loading status **/ 

function showLoad(){

  showLoaderID = window.setTimeout( function(){

    $('.status').addClass('show-status');

  }, 
  25);

}

function hideLoad() {

  window.clearTimeout(showLoaderID);	

  $('.status').removeClass('show-status');

}

/** help overlay **/

function bindHelpToggle() {

  $('.viewer-help-show').click( function() {
    showHelp()
  });
    
  $('.viewer-help-close').click( function() {  
    hideHelp();
  });

}

function showHelp(){

  helpVisible = true;

  hideControls();

  $('.viewer-help-overlay').css('display', 'block');

  if (viewerError) { hideError(); }

}

function hideHelp(){

  helpVisible = false;

  $('.viewer-help-overlay').css('display', 'none'); 

  showControls();

  if (viewerError) { showError(); }

}

/** mouse feedback **/

  function mouseFeedback(){

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

  /** @private */
  function onMouseDown() {
  
     element.addClass('viewer-interacting');
     element.removeClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseUp() {
   
     mouseDown = false;
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }
   
   /** @private */
   function onMouseOut() {
   
     element.removeClass('viewer-interacting');
     element.addClass('viewer-interact');
     
   }

   function arrangeInCircle(element) {
    var elements = element.children();
    var maxDimension = Math.max(elements.first().outerWidth(), elements.first().outerHeight());
    var childRadius = maxDimension / 2;
    var radius = (element.innerWidth() / 2) - childRadius;
    
    var childWidth = elements.first().outerWidth();
    var childHeight = elements.first().outerHeight();
    
    var numberOfElements = elements.length;
    var angleStep = 360 / numberOfElements;
    var stepCount = 0;
    
    elements.each( function() {
      var angle = angleStep * stepCount;
      var rotate = "rotate("+ angle +"deg)";
      var revRotate = "rotate(-"+ angle +"deg)";
      var transform;
      
      var initPosition = element.innerWidth() / 2;
      var initTranslate = "translate("+ (initPosition - (childWidth / 2)) +"px," + (initPosition - (childHeight / 2)) + "px)";
      var translate =  "translate(0, -"+ radius +"px)";
      transform = initTranslate + rotate + translate;

      $(this).css("transform", transform);
      stepCount++;
    });
    
  }

   /** dumb template functions **/

   function loader(){

     var htmlStr = "<div class='status'><div class='status-content'><div class='loader load-anim'>"
   
     for (var i =0;i <= 19;i++){
       htmlStr += "<div class='dot'></div>"
     }

     htmlStr += "</div></div></div>"

     return htmlStr;

   }

   function help() {

     var htmlStr = "<div class='viewer-help-overlay'><div class='viewer-help-control'><button class='viewer-help-close btn'>X</button></div>"
      
     htmlStr += "<div class='viewer-controls-help'><div class='gesture'><div class='pointer swipe-animate'></div><p class='control-description'><b>To Rotate:</b> Swipe or click and drag with your mouse.</p></div>"

     htmlStr += "<div class='gesture'><div class='bubble-container'><div class='pointer bubble-pointer-one bubble-animate-one'></div><div class='pointer bubble-pointer-two bubble-animate-two'></div></div><p class='control-description'><b>To Zoom In/Out:</b> Double tap or double click.</p></div>"

     htmlStr += "<div class='gesture'><div class='pan-container'><div class='pointer pan-animate'></div></div><p class='control-description'><b>To Pan:</b> Vertical swipe / touch hold and move vertically <br/>or click and drag vertically.</p></div>"
       
     htmlStr += "</div></div>" 

     var helpBtn = "<div class='viewer-help-control'><button class='viewer-help-show btn' title='Controls Help'>?</button></div>"

     var errorStatus = "<div class='error-overlay'><div class='viewer-error error-anim'>Sorry, this 360° view is unavailable</div></div>"

     return errorStatus + helpBtn + htmlStr;

   }

   init();

   return this;
}