'use strict';
var micromatch = require('micromatch');
var unique = require('array-unique');
var findup = require('findup-sync');
var resolve = require('resolve');
var path = require('path');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

function getPattern(options) {
    var defaultPatterns = ['y-server-*'];
    var overridePattern = 'overridePattern' in options ? !!options.overridePattern : true;
    if(overridePattern) {
        return arrayify(options.pattern || defaultPatterns);
    }
    return defaultPatterns.concat(arrayify(options.pattern));
}

module.exports = function(options) {
    var finalObject = {},
        configObject,
        requireFn,
        options = options || {};

    var DEBUG = options.DEBUG || false;
    var pattern = getPattern(options);
    var lazy = 'lazy' in options ? !! options.lazy : true;
    var config = options.config || findup('package.json', {cwd: parentDir });
    var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);
    var replaceString = options.replaceString || /^y-server-plugin(-|\.)/;

    var renameFn = options.renameFn || function(name) {
        name = name.replace(replaceString, '');
        return name;
    }
    var postRequireTransforms = options.postRequireTransforms || {};

    configObject = (typeof config === 'string') ? require(config) : config;

    if(!configObject) {
        throw new Error('Could not find dependencies. Do you have a package.json file in your project?');
    }

    var names = scope.reduce(function(result, prop) {
        return result.concat(Object.keys(configObject[prop] || {}));
    }, []);

    pattern.push('!gulp-load-plugins');

    var log = logger(options);

    function logger(options) {
        return typeof options.log === 'undefined' ? console.log.bind(console) : options.log;
    }

    function logDebug(message) {
        if (DEBUG) {
            log('y-server-loader-plugins: ' + message);
        }
    }

    function getRequireName(name) {
        return renameFn(name);
    }
    function defineProperty(object, transform, requireName, name) {
        var err;
        if (object[requireName]) {
          logDebug('error: defineProperty ' + name);
          err = 'Could not define the property "' + requireName + '", you may have repeated dependencies in your package.json like' + ' "gulp-' + requireName + '" and ' + '"' + requireName + '"';
          throw new Error(err);
        }

        if (lazy) {
          logDebug('lazyload: adding property ' + requireName);
          Object.defineProperty(object, requireName, {
            enumerable: true,
            get: function() {
              logDebug('lazyload: requiring ' + name + '...');
              return transform(requireName, require(name));
            }
          });
        } else {
          logDebug('requiring ' + name + '...');
          object[requireName] = transform(requireName, require(name));
        }
    }

    function applyTransform(requireName, plugin) {
      var transform = postRequireTransforms[requireName];

      if (transform && typeof transform === 'function') { // if postRequireTransform function is passed, pass it the plugin and return it
        logDebug('transforming ' + requireName);
        return transform(plugin);
      } else {
        return plugin; // if no postRequireTransform function passed, return the plugin as is
      }
    }

    unique(micromatch(names, pattern)).forEach(function(name) {
        var decomposition;
        var fObject = finalObject;

        defineProperty(fObject, applyTransform, getRequireName(name), name);
    });

    return finalObject;
}

var parentDir = path.dirname(module.parent.filename);
