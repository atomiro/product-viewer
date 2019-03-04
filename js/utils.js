/**
  Animation utility functions
  @namespace
*/

var ControlUtils = {
 /**
  constrain a value between min and max
  @function  ControlUtils~clamp
  @param {Number} value
  @param {Number} min
  @param {Number} max
  @return {Number}
  */
  clamp: function(value, min, max) {
 
    var clampedValue = (value > max) ? max : (value < min) ? min : value;
    return clampedValue;
    
  },
  /**
  "lerp" stands for Linear Interpolation
  @function ControlUtils~lerp
  @param {Number} p0 - starting postion
  (you may also think of it as current postion)
  @param {Number} p1 - ending position
  @param {Number} progress - expressed in a fraction between 0 and 1
  @return {Number}
  */
  lerp: function(p0, p1, progress) {
 
    ControlUtils.clamp(progress, 0, 1);
    var pu = p0 + (p1 - p0) * progress;
    return pu;
    
  },

  radians: function(deg) {
  
    var rad = deg * (Math.PI/180);
    return rad;
    
  },

};
