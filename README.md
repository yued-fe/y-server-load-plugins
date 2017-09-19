# y-server-load-plugins

[![npm](https://nodei.co/npm/y-server-load-plugins.svg?downloads=true)](https://nodei.co/npm/y-server-load-plugins/)

> Loads y-server plugins from package dependencies and attaches them to an object of your choice.



## Install

```sh
$ npm install --save-dev y-server-load-plugins
```


## Usage

Given a `package.json` file that has some dependencies within:

```json
{
    "dependencies": {
        "y-server-plugin-ejs": "^0.0.2",
        "y-server-plugin-error": "^0.0.3",
        "y-server-plugin-mock": "^0.0.6",
        "y-server-plugin-proxy": "^0.0.2",
        "y-server-plugin-static": "^0.0.2",
        "y-server-plugin-template": "^0.0.3"
    }
}
```

Adding this into your `y-server.config.js`:

```js
var yServerLoadPlugins = require('y-server-load-plugins');
var plugins = yServerLoadPlugins();
```

Or, even shorter:

```js
var plugins = require('y-server-load-plugins')();
```

Will result in the following happening (roughly, plugins are lazy loaded but in practice you won't notice any difference):

```js
plugins.static = require('y-server-plugin-static');
plugins.template = require('y-server-plugin-template');
```

This frees you up from having to manually require each y-server plugin.

## Options

You can pass in an object of options that are shown below: (the values for the keys are the defaults,most same to the y-server-load-plugins):

```js
yServerLoadPlugins({
    DEBUG: false, // when set to true, the plugin will log info to console. Useful for bug reporting and issue debugging
    pattern: ['y-server-plugin-*'], // the glob(s) to search for
    overridePattern: true, // When true, overrides the built-in patterns. Otherwise, extends built-in patterns matcher list.
    config: 'package.json', // where to find the plugins, by default searched up from process.cwd()
    scope: ['dependencies', 'devDependencies', 'peerDependencies'], // which keys in the config to look  context
    lazy: true, // whether the plugins should be lazy loaded on demand
    renameFn: function (name) { ... }, // a function to handle the renaming of plugins (the default works)
    postRequireTransforms: {}, // see documentation below
});
```

## Multiple `config` locations

While it's possile to grab plugins from another location, often times you may want to extend from another package that enables you to keep your own `package.json` free from duplicates, but still add in your own plugins that are needed for your project. Since the `config` option accepts an object, you can merge together multiple locations using the [lodash.merge](https://www.npmjs.com/package/lodash.merge) package:

```js
var merge = require('lodash.merge');

var packages = merge(
  require('dep/package.json'),
  require('./package.json')
);

// Utilities
var $ = yServerLoadPlugins({
  config: packages
});

```

## `postRequireTransforms`

This enables you to transform the plugin after it has been required by y-server-load-plugins.

For example, one particular plugin (let's say, `y-server-plugins-foo`), might need you to call a function to configure it before it is used. So you would end up with:

```js
var $ = require('y-server-load-plugins')();
$.foo = $.foo.configure(...);
```

This is a bit messy. Instead you can pass a `postRequireTransforms` object which will enable you to do this:

```js
var $ = require('y-server-load-plugins')({
  postRequireTransforms: {
    foo: function(foo) {
      return foo.configure(...);
    }
  }
});

$.foo // is already configured
```

Everytime a plugin is loaded, we check to see if a transform is defined, and if so, we call that function, passing in the loaded plugin. Whatever this function returns is then used as the value that's returned by y-server-load-plugins.

For 99% of y-server-plugins you will not need this behaviour, but for the odd plugin it's a nice way of keeping your code cleaner.


## Override Pattern

Configuring the `pattern` option would override the built-in `['y-server-plugins-*'`. If `overridePattern: false`, the configured `pattern` will now extends the built-in matching.



## Changelog

##### 0.0.1
- initial release
