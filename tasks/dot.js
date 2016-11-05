/*
 * grunt-etd-dot-compiler
 * https://github.com/etd-framework/grunt-etd-dot-compiler
 *
 * Copyright (c) 2016 ETD Solutions
 * Licensed under the Apache-2.0 license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('dot', 'Précompile les templates doT.js', function () {

    var path = require('path');

    var Compiler = require("./lib/Compiler"),
        createdFiles = 0,
        options = this.options({
          defs : null,
          variable: 'tmpl',
          node: false,
          namespace: false,
          root: path.dirname(grunt.file.findup('Gruntfile.js')) + '/',
          requirejs: true,
          key: function(filepath) {
            return path.basename(filepath, path.extname(filepath));
          }
        });

    var compiler = new Compiler(options);

    // Iterate over all src-dest file pairs.
    this.files.forEach(function (f) {

      var src = f.src.filter(function (filepath) {

        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file ' + filepath + ' not found.');
          return false;
        }
        return true;
      });

      if (src.length === 0) {
        grunt.log.warn('Destination ' + f.dest + ' not written because src files were empty.');
        return;
      }

      grunt.file.mkdir(f.dest);

      // Precompile files, warn and fail on error.
      f.src.forEach(function(path) {

        var dirs    = path.split("/"),
            package_file = dirs[dirs.length - 2];

        grunt.log.writeln("Source directory : " + path);

        var files = [];

        if (options.defs) {
          files = grunt.file.expand({
            cwd: options.defs,
            filter: "isFile"
          }, "*.def").map(function(item) {
            return options.defs + '/' + item;
          });

        }

        files = files.concat(grunt.file.expand({
          cwd: path,
          filter: "isFile"
        }, "*.def", "*.dot").map(function(item) {
          return path + '/' + item;
        }));

        grunt.log.writeln('Compiling ' + files.length + ' ' + grunt.util.pluralize(files.length, 'file/files') + '...');

        var content;

        try {

          content = compiler.compileTemplates(files);

        } catch (e) {
          console.log(e);
          err = new Error('Compilation failed.');
          if (e.message) {
            err.message += '\n' + e.message + '. \n';
            if (e.line) {
              err.message += 'Line ' + e.line + ' in ' + src + '\n';
            }
          }
          err.origError = e;
          grunt.log.warn('Compilation source ' + src + ' failed.');
          grunt.fail.warn(err);
        }

        // Write the destination file.
        grunt.file.write(f.dest + '/' + package_file + ".js", content);

        createdFiles++;

      });

    });

    if (createdFiles > 0) {
      grunt.log.ok(createdFiles + ' ' + grunt.util.pluralize(createdFiles, 'file/files') + ' created.');
    } else {
      grunt.log.warn('No files created.');
    }

  });

};
