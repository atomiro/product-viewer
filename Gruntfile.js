module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    concat: {
       options: {
          separator: ';'
       },
       dist: {
         src: ['js/*.js'],
         dest: 'release/viewer.js'
       }
    },
    
    uglify: {
        options: {
           mangle: false,
           sourceMap: true
        },
        my_target: {
            src: 'release/viewer.js',
            dest: 'release/viewer.min.js'
        }
    },
    
     eslint: {
        target: ['js/*.js'],
    },
    
    jsdoc : {
        dist : {
            src: ['js/*.js'],
            options: {
                destination: 'documentation'
            }
        }
    }
  
  });
  
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jsdoc');
  
  grunt.registerTask('default', ['concat', 'uglify']);
  grunt.registerTask('hint', ['eslint']);
  grunt.registerTask('docs', ['jsdoc']);
 
};