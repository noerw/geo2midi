module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'jshint': {
      files: ['src/**', 'examples/*.js'],
      options: {
        ignores: ['src/lib/**'],
        browser: true,
        devel: true,
        eqeqeq: true,
        eqnull: true,
        nonew: true,
        nonbsp: true,
        strict: 'implied',
        undef: true,
        unused: true,
        globals: {
          L: true,
          STORYLINE: true,
          WebMidi: true
        }
      }
    },
    'watch': {
      files: ['<%= jshint.files %>', 'Gruntfile.js'],
      tasks: ['jshint'],
    },
    'uglify': {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %> - <%= pkg.homepage %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: true,
        compress: true,
        sourceMap: true,
        wrap: 'playback',
        globals: ['L', 'Storyline']
      },
      build: {
        src: ['src/lib/storyline.js', 'src/sequencer.js', 'src/playhead.js', 'src/control-playback.js'],
        dest: 'dist/leaflet-playback.min.js'
      }
    },
    'release-it': {
      options: {
        'pkgFiles': ['package.json'],
        'npm.forcePublishSourceRepo': true,
        'buildCommand': 'grunt build',
        'commitMessage': 'release %s',
        'tagName': '%s',
        'tagAnnotation': 'release %s',
        'dist': {
          'repo': 'git@github.com:noerw/leaflet-playback.git#gh-pages',
          'baseDir': '',
          'files': ['examples/**', 'dist/**'],
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-release-it');

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['uglify']);
  grunt.registerTask('release', ['jshint','release-it']);
};
