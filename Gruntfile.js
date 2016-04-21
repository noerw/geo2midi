module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'uglify': {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> - <%= pkg.homepage %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: { except: ['L', 'storyline'] },
        compress: true,
      },
      build: {
        src: ['leaflet-playback.js', 'storyline.js'],
        dest: 'leaflet-playback.min.js'
      }
    },
    'release-it': {
      options: {
        pkgFiles: ['package.json'],
        commitMessage: 'release %s',
        tagName: '%s',
        tagAnnotation: 'release %s',
        dist: {
          "repo": 'git@github.com:noerw/leaflet-playback.git#gh-pages',
          "baseDir": "",
          "files": ['./examples/**', 'leaflet-playback.min.js', 'leaflet-playback.css'],
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-release-it');

  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('build', ['uglify']);
  grunt.registerTask('release', ['uglify', 'release-it']);
};
