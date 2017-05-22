var ControlUtils = {

 clamp: function(value, min, max) {
 
    var clampedValue = (value > max) ? max : (value < min) ? min : value;
    return clampedValue;
    
  },
  
 lerp: function(p0, p1, progress) {
 
    ControlUtils.clamp(progress, 0, 1);
    var pu = p0 + (p1 - p0) * progress;
    return pu;
    
  },

};
