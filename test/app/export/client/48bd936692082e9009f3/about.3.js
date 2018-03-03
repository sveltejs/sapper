webpackJsonp([3],[
/* 0 */,
/* 1 */,
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export blankObject */
/* unused harmony export destroy */
/* unused harmony export destroyDev */
/* unused harmony export differs */
/* unused harmony export dispatchObservers */
/* unused harmony export fire */
/* unused harmony export get */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return init; });
/* unused harmony export observe */
/* unused harmony export observeDev */
/* unused harmony export on */
/* unused harmony export onDev */
/* unused harmony export set */
/* unused harmony export _set */
/* unused harmony export setDev */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return callAll; });
/* unused harmony export _mount */
/* unused harmony export _unmount */
/* unused harmony export isPromise */
/* unused harmony export PENDING */
/* unused harmony export SUCCESS */
/* unused harmony export FAILURE */
/* unused harmony export removeFromStore */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "p", function() { return proto; });
/* unused harmony export protoDev */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return appendNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "n", function() { return insertNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return detachNode; });
/* unused harmony export detachBetween */
/* unused harmony export detachBefore */
/* unused harmony export detachAfter */
/* unused harmony export reinsertBetween */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "q", function() { return reinsertChildren; });
/* unused harmony export reinsertAfter */
/* unused harmony export reinsertBefore */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return destroyEach; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return createFragment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return createElement; });
/* unused harmony export createSvgElement */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return createText; });
/* unused harmony export createComment */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return addListener; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "r", function() { return removeListener; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "s", function() { return setAttribute; });
/* unused harmony export setXlinkAttribute */
/* unused harmony export getBindingGroupValue */
/* unused harmony export toNumber */
/* unused harmony export timeRangesToArray */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return children; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return claimElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return claimText; });
/* unused harmony export setInputType */
/* unused harmony export setStyle */
/* unused harmony export selectOption */
/* unused harmony export selectOptions */
/* unused harmony export selectValue */
/* unused harmony export selectMultipleValue */
/* unused harmony export linear */
/* unused harmony export generateRule */
/* unused harmony export hash */
/* unused harmony export wrapTransition */
/* unused harmony export transitionManager */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "o", function() { return noop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return assign; });
function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function detachBetween(before, after) {
	while (before.nextSibling && before.nextSibling !== after) {
		before.parentNode.removeChild(before.nextSibling);
	}
}

function detachBefore(after) {
	while (after.previousSibling) {
		after.parentNode.removeChild(after.previousSibling);
	}
}

function detachAfter(before) {
	while (before.nextSibling) {
		before.parentNode.removeChild(before.nextSibling);
	}
}

function reinsertBetween(before, after, target) {
	while (before.nextSibling && before.nextSibling !== after) {
		target.appendChild(before.parentNode.removeChild(before.nextSibling));
	}
}

function reinsertChildren(parent, target) {
	while (parent.firstChild) target.appendChild(parent.firstChild);
}

function reinsertAfter(before, target) {
	while (before.nextSibling) target.appendChild(before.nextSibling);
}

function reinsertBefore(after, target) {
	var parent = after.parentNode;
	while (parent.firstChild !== after) target.appendChild(parent.firstChild);
}

function destroyEach(iterations) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d();
	}
}

function createFragment() {
	return document.createDocumentFragment();
}

function createElement(name) {
	return document.createElement(name);
}

function createSvgElement(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function setXlinkAttribute(node, attribute, value) {
	node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
}

function getBindingGroupValue(group) {
	var value = [];
	for (var i = 0; i < group.length; i += 1) {
		if (group[i].checked) value.push(group[i].__value);
	}
	return value;
}

function toNumber(value) {
	return value === '' ? undefined : +value;
}

function timeRangesToArray(ranges) {
	var array = [];
	for (var i = 0; i < ranges.length; i += 1) {
		array.push({ start: ranges.start(i), end: ranges.end(i) });
	}
	return array;
}

function children (element) {
	return Array.from(element.childNodes);
}

function claimElement (nodes, name, attributes, svg) {
	for (var i = 0; i < nodes.length; i += 1) {
		var node = nodes[i];
		if (node.nodeName === name) {
			for (var j = 0; j < node.attributes.length; j += 1) {
				var attribute = node.attributes[j];
				if (!attributes[attribute.name]) node.removeAttribute(attribute.name);
			}
			return nodes.splice(i, 1)[0]; // TODO strip unwanted attributes
		}
	}

	return svg ? createSvgElement(name) : createElement(name);
}

function claimText (nodes, data) {
	for (var i = 0; i < nodes.length; i += 1) {
		var node = nodes[i];
		if (node.nodeType === 3) {
			node.data = data;
			return nodes.splice(i, 1)[0];
		}
	}

	return createText(data);
}

function setInputType(input, type) {
	try {
		input.type = type;
	} catch (e) {}
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function selectOption(select, value) {
	for (var i = 0; i < select.options.length; i += 1) {
		var option = select.options[i];

		if (option.__value === value) {
			option.selected = true;
			return;
		}
	}
}

function selectOptions(select, value) {
	for (var i = 0; i < select.options.length; i += 1) {
		var option = select.options[i];
		option.selected = ~value.indexOf(option.__value);
	}
}

function selectValue(select) {
	var selectedOption = select.querySelector(':checked') || select.options[0];
	return selectedOption && selectedOption.__value;
}

function selectMultipleValue(select) {
	return [].map.call(select.querySelectorAll(':checked'), function(option) {
		return option.__value;
	});
}

function linear(t) {
	return t;
}

function generateRule(
	a,
	b,
	delta,
	duration,
	ease,
	fn
) {
	var keyframes = '{\n';

	for (var p = 0; p <= 1; p += 16.666 / duration) {
		var t = a + delta * ease(p);
		keyframes += p * 100 + '%{' + fn(t) + '}\n';
	}

	return keyframes + '100% {' + fn(b) + '}\n}';
}

// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
	var hash = 5381;
	var i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return hash >>> 0;
}

function wrapTransition(component, node, fn, params, intro, outgroup) {
	var obj = fn(node, params);
	var duration = obj.duration || 300;
	var ease = obj.easing || linear;
	var cssText;

	// TODO share <style> tag between all transitions?
	if (obj.css && !transitionManager.stylesheet) {
		var style = createElement('style');
		document.head.appendChild(style);
		transitionManager.stylesheet = style.sheet;
	}

	if (intro) {
		if (obj.css && obj.delay) {
			cssText = node.style.cssText;
			node.style.cssText += obj.css(0);
		}

		if (obj.tick) obj.tick(0);
	}

	return {
		t: intro ? 0 : 1,
		running: false,
		program: null,
		pending: null,
		run: function(intro, callback) {
			var program = {
				start: window.performance.now() + (obj.delay || 0),
				intro: intro,
				callback: callback
			};

			if (obj.delay) {
				this.pending = program;
			} else {
				this.start(program);
			}

			if (!this.running) {
				this.running = true;
				transitionManager.add(this);
			}
		},
		start: function(program) {
			component.fire(program.intro ? 'intro.start' : 'outro.start', { node: node });

			program.a = this.t;
			program.b = program.intro ? 1 : 0;
			program.delta = program.b - program.a;
			program.duration = duration * Math.abs(program.b - program.a);
			program.end = program.start + program.duration;

			if (obj.css) {
				if (obj.delay) node.style.cssText = cssText;

				program.rule = generateRule(
					program.a,
					program.b,
					program.delta,
					program.duration,
					ease,
					obj.css
				);

				transitionManager.addRule(program.rule, program.name = '__svelte_' + hash(program.rule));

				node.style.animation = (node.style.animation || '')
					.split(', ')
					.filter(function(anim) {
						// when introing, discard old animations if there are any
						return anim && (program.delta < 0 || !/__svelte/.test(anim));
					})
					.concat(program.name + ' ' + duration + 'ms linear 1 forwards')
					.join(', ');
			}

			this.program = program;
			this.pending = null;
		},
		update: function(now) {
			var program = this.program;
			if (!program) return;

			var p = now - program.start;
			this.t = program.a + program.delta * ease(p / program.duration);
			if (obj.tick) obj.tick(this.t);
		},
		done: function() {
			var program = this.program;
			this.t = program.b;
			if (obj.tick) obj.tick(this.t);
			if (obj.css) transitionManager.deleteRule(node, program.name);
			program.callback();
			program = null;
			this.running = !!this.pending;
		},
		abort: function() {
			if (obj.tick) obj.tick(1);
			if (obj.css) transitionManager.deleteRule(node, this.program.name);
			this.program = this.pending = null;
			this.running = false;
		}
	};
}

var transitionManager = {
	running: false,
	transitions: [],
	bound: null,
	stylesheet: null,
	activeRules: {},

	add: function(transition) {
		this.transitions.push(transition);

		if (!this.running) {
			this.running = true;
			requestAnimationFrame(this.bound || (this.bound = this.next.bind(this)));
		}
	},

	addRule: function(rule, name) {
		if (!this.activeRules[name]) {
			this.activeRules[name] = true;
			this.stylesheet.insertRule('@keyframes ' + name + ' ' + rule, this.stylesheet.cssRules.length);
		}
	},

	next: function() {
		this.running = false;

		var now = window.performance.now();
		var i = this.transitions.length;

		while (i--) {
			var transition = this.transitions[i];

			if (transition.program && now >= transition.program.end) {
				transition.done();
			}

			if (transition.pending && now >= transition.pending.start) {
				transition.start(transition.pending);
			}

			if (transition.running) {
				transition.update(now);
				this.running = true;
			} else if (!transition.pending) {
				this.transitions.splice(i, 1);
			}
		}

		if (this.running) {
			requestAnimationFrame(this.bound);
		} else if (this.stylesheet) {
			var i = this.stylesheet.cssRules.length;
			while (i--) this.stylesheet.deleteRule(i);
			this.activeRules = {};
		}
	},

	deleteRule: function(node, name) {
		node.style.animation = node.style.animation
			.split(', ')
			.filter(function(anim) {
				return anim.slice(0, name.length) !== name;
			})
			.join(', ');
	}
};

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.u();
	this._fragment.d();
	this._fragment = this._state = null;
}

function destroyDev(detach) {
	destroy.call(this, detach);
	this.destroy = function() {
		console.warn('Component was already destroyed');
	};
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init(component, options) {
	component._observers = { pre: blankObject(), post: blankObject() };
	component._handlers = blankObject();
	component._bind = options._bind;

	component.options = options;
	component.root = options.root || component;
	component.store = component.root.store || options.store;
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function observeDev(key, callback, options) {
	var c = (key = '' + key).search(/[^\w]/);
	if (c > -1) {
		var message =
			'The first argument to component.observe(...) must be the name of a top-level property';
		if (c > 0)
			message += ", i.e. '" + key.slice(0, c) + "' rather than '" + key + "'";

		throw new Error(message);
	}

	return observe.call(this, key, callback, options);
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function onDev(eventName, handler) {
	if (eventName === 'teardown') {
		console.warn(
			"Use component.on('destroy', ...) instead of component.on('teardown', ...) which has been deprecated and will be unsupported in Svelte 2"
		);
		return this.on('destroy', handler);
	}

	return on.call(this, eventName, handler);
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	this.root._lock = true;
	callAll(this.root._beforecreate);
	callAll(this.root._oncreate);
	callAll(this.root._aftercreate);
	this.root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
		this._fragment.p(changed, this._state);
		dispatchObservers(this, this._observers.post, changed, this._state, oldState);
	}
}

function setDev(newState) {
	if (typeof newState !== 'object') {
		throw new Error(
			this._debugName + '.set was called without an object of data key-values to update.'
		);
	}

	this._checkReadOnly(newState);
	set.call(this, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function _mount(target, anchor) {
	this._fragment.m(target, anchor);
}

function _unmount() {
	if (this._fragment) this._fragment.u();
}

function isPromise(value) {
	return value && typeof value.then === 'function';
}

var PENDING = {};
var SUCCESS = {};
var FAILURE = {};

function removeFromStore() {
	this.store._remove(this);
}

var proto = {
	destroy: destroy,
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	teardown: destroy,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};

var protoDev = {
	destroy: destroyDev,
	get: get,
	fire: fire,
	observe: observeDev,
	on: onDev,
	set: setDev,
	teardown: destroyDev,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};




/***/ }),
/* 3 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(8);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./node_modules/svelte/shared.js
var shared = __webpack_require__(2);

// CONCATENATED MODULE: ./routes/_components/Nav.html
/* routes/_components/Nav.html generated by Svelte v1.49.1 */


function encapsulateStyles(node) {
	Object(shared["s" /* setAttribute */])(node, "svelte-2882498094", "");
}

function create_main_fragment(state, component) {
	var nav, ul, li, a, text, li_1, a_1, text_1, li_2, a_2, text_2, li_3, a_3, text_3, li_4, a_4, text_4, li_5, a_5, text_5, li_6, a_6, text_6, a_6_class_value;

	return {
		c: function create() {
			nav = Object(shared["h" /* createElement */])("nav");
			ul = Object(shared["h" /* createElement */])("ul");
			li = Object(shared["h" /* createElement */])("li");
			a = Object(shared["h" /* createElement */])("a");
			text = Object(shared["j" /* createText */])("home");
			li_1 = Object(shared["h" /* createElement */])("li");
			a_1 = Object(shared["h" /* createElement */])("a");
			text_1 = Object(shared["j" /* createText */])("about");
			li_2 = Object(shared["h" /* createElement */])("li");
			a_2 = Object(shared["h" /* createElement */])("a");
			text_2 = Object(shared["j" /* createText */])("slow preload");
			li_3 = Object(shared["h" /* createElement */])("li");
			a_3 = Object(shared["h" /* createElement */])("a");
			text_3 = Object(shared["j" /* createText */])("redirect");
			li_4 = Object(shared["h" /* createElement */])("li");
			a_4 = Object(shared["h" /* createElement */])("a");
			text_4 = Object(shared["j" /* createText */])("broken link");
			li_5 = Object(shared["h" /* createElement */])("li");
			a_5 = Object(shared["h" /* createElement */])("a");
			text_5 = Object(shared["j" /* createText */])("error link");
			li_6 = Object(shared["h" /* createElement */])("li");
			a_6 = Object(shared["h" /* createElement */])("a");
			text_6 = Object(shared["j" /* createText */])("blog");
			this.h();
		},

		l: function claim(nodes) {
			nav = Object(shared["f" /* claimElement */])(nodes, "NAV", {}, false);
			var nav_nodes = Object(shared["e" /* children */])(nav);

			ul = Object(shared["f" /* claimElement */])(nav_nodes, "UL", {}, false);
			var ul_nodes = Object(shared["e" /* children */])(ul);

			li = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_nodes = Object(shared["e" /* children */])(li);

			a = Object(shared["f" /* claimElement */])(li_nodes, "A", { href: true }, false);
			var a_nodes = Object(shared["e" /* children */])(a);

			text = Object(shared["g" /* claimText */])(a_nodes, "home");
			a_nodes.forEach(shared["l" /* detachNode */]);
			li_nodes.forEach(shared["l" /* detachNode */]);

			li_1 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_1_nodes = Object(shared["e" /* children */])(li_1);

			a_1 = Object(shared["f" /* claimElement */])(li_1_nodes, "A", { href: true }, false);
			var a_1_nodes = Object(shared["e" /* children */])(a_1);

			text_1 = Object(shared["g" /* claimText */])(a_1_nodes, "about");
			a_1_nodes.forEach(shared["l" /* detachNode */]);
			li_1_nodes.forEach(shared["l" /* detachNode */]);

			li_2 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_2_nodes = Object(shared["e" /* children */])(li_2);

			a_2 = Object(shared["f" /* claimElement */])(li_2_nodes, "A", { href: true }, false);
			var a_2_nodes = Object(shared["e" /* children */])(a_2);

			text_2 = Object(shared["g" /* claimText */])(a_2_nodes, "slow preload");
			a_2_nodes.forEach(shared["l" /* detachNode */]);
			li_2_nodes.forEach(shared["l" /* detachNode */]);

			li_3 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_3_nodes = Object(shared["e" /* children */])(li_3);

			a_3 = Object(shared["f" /* claimElement */])(li_3_nodes, "A", { href: true }, false);
			var a_3_nodes = Object(shared["e" /* children */])(a_3);

			text_3 = Object(shared["g" /* claimText */])(a_3_nodes, "redirect");
			a_3_nodes.forEach(shared["l" /* detachNode */]);
			li_3_nodes.forEach(shared["l" /* detachNode */]);

			li_4 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_4_nodes = Object(shared["e" /* children */])(li_4);

			a_4 = Object(shared["f" /* claimElement */])(li_4_nodes, "A", { href: true }, false);
			var a_4_nodes = Object(shared["e" /* children */])(a_4);

			text_4 = Object(shared["g" /* claimText */])(a_4_nodes, "broken link");
			a_4_nodes.forEach(shared["l" /* detachNode */]);
			li_4_nodes.forEach(shared["l" /* detachNode */]);

			li_5 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_5_nodes = Object(shared["e" /* children */])(li_5);

			a_5 = Object(shared["f" /* claimElement */])(li_5_nodes, "A", { href: true }, false);
			var a_5_nodes = Object(shared["e" /* children */])(a_5);

			text_5 = Object(shared["g" /* claimText */])(a_5_nodes, "error link");
			a_5_nodes.forEach(shared["l" /* detachNode */]);
			li_5_nodes.forEach(shared["l" /* detachNode */]);

			li_6 = Object(shared["f" /* claimElement */])(ul_nodes, "LI", {}, false);
			var li_6_nodes = Object(shared["e" /* children */])(li_6);

			a_6 = Object(shared["f" /* claimElement */])(li_6_nodes, "A", { rel: true, class: true, href: true }, false);
			var a_6_nodes = Object(shared["e" /* children */])(a_6);

			text_6 = Object(shared["g" /* claimText */])(a_6_nodes, "blog");
			a_6_nodes.forEach(shared["l" /* detachNode */]);
			li_6_nodes.forEach(shared["l" /* detachNode */]);
			ul_nodes.forEach(shared["l" /* detachNode */]);
			nav_nodes.forEach(shared["l" /* detachNode */]);
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(nav);
			encapsulateStyles(ul);
			encapsulateStyles(li);
			encapsulateStyles(a);
			a.href = "/";
			encapsulateStyles(li_1);
			encapsulateStyles(a_1);
			a_1.href = "/about";
			encapsulateStyles(li_2);
			encapsulateStyles(a_2);
			a_2.href = "/slow-preload";
			encapsulateStyles(li_3);
			encapsulateStyles(a_3);
			a_3.href = "/redirect-from";
			encapsulateStyles(li_4);
			encapsulateStyles(a_4);
			a_4.href = "/blog/nope";
			encapsulateStyles(li_5);
			encapsulateStyles(a_5);
			a_5.href = "/blog/throw-an-error";
			encapsulateStyles(li_6);
			encapsulateStyles(a_6);
			a_6.rel = "prefetch";
			a_6.className = a_6_class_value = state.page === "blog"  ? "selected" : "";
			a_6.href = "/blog";
		},

		m: function mount(target, anchor) {
			Object(shared["n" /* insertNode */])(nav, target, anchor);
			Object(shared["b" /* appendNode */])(ul, nav);
			Object(shared["b" /* appendNode */])(li, ul);
			Object(shared["b" /* appendNode */])(a, li);
			Object(shared["b" /* appendNode */])(text, a);
			Object(shared["b" /* appendNode */])(li_1, ul);
			Object(shared["b" /* appendNode */])(a_1, li_1);
			Object(shared["b" /* appendNode */])(text_1, a_1);
			Object(shared["b" /* appendNode */])(li_2, ul);
			Object(shared["b" /* appendNode */])(a_2, li_2);
			Object(shared["b" /* appendNode */])(text_2, a_2);
			Object(shared["b" /* appendNode */])(li_3, ul);
			Object(shared["b" /* appendNode */])(a_3, li_3);
			Object(shared["b" /* appendNode */])(text_3, a_3);
			Object(shared["b" /* appendNode */])(li_4, ul);
			Object(shared["b" /* appendNode */])(a_4, li_4);
			Object(shared["b" /* appendNode */])(text_4, a_4);
			Object(shared["b" /* appendNode */])(li_5, ul);
			Object(shared["b" /* appendNode */])(a_5, li_5);
			Object(shared["b" /* appendNode */])(text_5, a_5);
			Object(shared["b" /* appendNode */])(li_6, ul);
			Object(shared["b" /* appendNode */])(a_6, li_6);
			Object(shared["b" /* appendNode */])(text_6, a_6);
		},

		p: function update(changed, state) {
			if ((changed.page) && a_6_class_value !== (a_6_class_value = state.page === "blog"  ? "selected" : "")) {
				a_6.className = a_6_class_value;
			}
		},

		u: function unmount() {
			Object(shared["l" /* detachNode */])(nav);
		},

		d: shared["o" /* noop */]
	};
}

function Nav(options) {
	Object(shared["m" /* init */])(this, options);
	this._state = Object(shared["c" /* assign */])({}, options.data);

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		var nodes = Object(shared["e" /* children */])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(shared["l" /* detachNode */]);
		this._fragment.m(options.target, options.anchor || null);
	}
}

Object(shared["c" /* assign */])(Nav.prototype, shared["p" /* proto */]);
/* harmony default export */ var _components_Nav = (Nav);
__webpack_require__(6);

// CONCATENATED MODULE: ./routes/_components/Layout.html
/* routes/_components/Layout.html generated by Svelte v1.49.1 */





function Layout_create_main_fragment(state, component) {
	var text, main, slot_content_default = component._slotted.default;

	var nav = new _components_Nav({
		root: component.root,
		data: { page: state.page }
	});

	return {
		c: function create() {
			nav._fragment.c();
			text = Object(shared["j" /* createText */])("\n\n");
			main = Object(shared["h" /* createElement */])("main");
		},

		l: function claim(nodes) {
			nav._fragment.l(nodes);
			text = Object(shared["g" /* claimText */])(nodes, "\n\n");

			main = Object(shared["f" /* claimElement */])(nodes, "MAIN", {}, false);
			var main_nodes = Object(shared["e" /* children */])(main);

			main_nodes.forEach(shared["l" /* detachNode */]);
		},

		m: function mount(target, anchor) {
			nav._mount(target, anchor);
			Object(shared["n" /* insertNode */])(text, target, anchor);
			Object(shared["n" /* insertNode */])(main, target, anchor);

			if (slot_content_default) {
				Object(shared["b" /* appendNode */])(slot_content_default, main);
			}
		},

		p: function update(changed, state) {
			var nav_changes = {};
			if (changed.page) nav_changes.page = state.page;
			nav._set(nav_changes);
		},

		u: function unmount() {
			nav._unmount();
			Object(shared["l" /* detachNode */])(text);
			Object(shared["l" /* detachNode */])(main);

			if (slot_content_default) {
				Object(shared["q" /* reinsertChildren */])(main, slot_content_default);
			}
		},

		d: function destroy() {
			nav.destroy(false);
		}
	};
}

function Layout(options) {
	Object(shared["m" /* init */])(this, options);
	this._state = Object(shared["c" /* assign */])({}, options.data);

	this._slotted = options.slots || {};

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this.slots = {};

	this._fragment = Layout_create_main_fragment(this._state, this);

	if (options.target) {
		var nodes = Object(shared["e" /* children */])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(shared["l" /* detachNode */]);
		this._fragment.m(options.target, options.anchor || null);

		this._lock = true;
		Object(shared["d" /* callAll */])(this._beforecreate);
		Object(shared["d" /* callAll */])(this._oncreate);
		Object(shared["d" /* callAll */])(this._aftercreate);
		this._lock = false;
	}
}

Object(shared["c" /* assign */])(Layout.prototype, shared["p" /* proto */]);
/* harmony default export */ var _components_Layout = __webpack_exports__["a"] = (Layout);

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(7);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../../../Users/208311/Development/SVELTE/sapper/test/app/node_modules/css-loader/index.js!./svelte-2882498094.css", function() {
			var newContent = require("!!../../../../../../Users/208311/Development/SVELTE/sapper/test/app/node_modules/css-loader/index.js!./svelte-2882498094.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(undefined);
// imports


// module
exports.push([module.i, "nav[svelte-2882498094]{border-bottom:1px solid rgba(170,30,30,0.1);font-weight:300;padding:0 1em}ul[svelte-2882498094]{margin:0;padding:0}ul[svelte-2882498094]::after{content:'';display:block;clear:both}li[svelte-2882498094]{display:block;float:left}.selected[svelte-2882498094]{position:relative;display:inline-block}.selected[svelte-2882498094]::after{position:absolute;content:'';width:calc(100% - 1em);height:2px;background-color:rgb(170,30,30);display:block;bottom:-1px}a[svelte-2882498094]{text-decoration:none;padding:1em 0.5em;display:block}", ""]);

// exports


/***/ }),
/* 8 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_Layout_html__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__runtime_js__ = __webpack_require__(0);
/* routes/about.html generated by Svelte v1.49.1 */




var methods = {
	goto: __WEBPACK_IMPORTED_MODULE_2__runtime_js__["a" /* goto */],
	prefetch: __WEBPACK_IMPORTED_MODULE_2__runtime_js__["c" /* prefetch */]
};

function create_main_fragment(state, component) {
	var title, text, text_2, text_3, h1, text_4, text_5, p, text_6, text_7, button, text_8, text_9, button_1, text_10, text_11;

	function click_handler(event) {
		component.goto("/blog/what-is-sapper");
	}

	function click_handler_1(event) {
		component.goto("/blog/why-the-name");
	}

	var layout = new __WEBPACK_IMPORTED_MODULE_1__components_Layout_html__["a" /* default */]({
		root: component.root,
		slots: { default: Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["i" /* createFragment */])() },
		data: { page: "about" }
	});

	return {
		c: function create() {
			title = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("title");
			text = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("About");
			text_2 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n\n");
			text_3 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n\t");
			h1 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("h1");
			text_4 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("About this site");
			text_5 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n\n\t");
			p = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("p");
			text_6 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("This is the 'about' page. There's not much here.");
			text_7 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n\n\t");
			button = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("button");
			text_8 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("What is Sapper?");
			text_9 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n\t");
			button_1 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("button");
			text_10 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("Why the name?");
			text_11 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("\n");
			layout._fragment.c();
			this.h();
		},

		l: function claim(nodes) {
			title = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["h" /* createElement */])("title");
			text = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["j" /* createText */])("About");
			text_2 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n\n");
			text_3 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n\t");

			h1 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["f" /* claimElement */])(nodes, "H1", {}, false);
			var h1_nodes = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["e" /* children */])(h1);

			text_4 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(h1_nodes, "About this site");
			h1_nodes.forEach(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */]);
			text_5 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n\n\t");

			p = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["f" /* claimElement */])(nodes, "P", {}, false);
			var p_nodes = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["e" /* children */])(p);

			text_6 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(p_nodes, "This is the 'about' page. There's not much here.");
			p_nodes.forEach(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */]);
			text_7 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n\n\t");

			button = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["f" /* claimElement */])(nodes, "BUTTON", { class: true }, false);
			var button_nodes = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["e" /* children */])(button);

			text_8 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(button_nodes, "What is Sapper?");
			button_nodes.forEach(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */]);
			text_9 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n\t");

			button_1 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["f" /* claimElement */])(nodes, "BUTTON", { class: true }, false);
			var button_1_nodes = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["e" /* children */])(button_1);

			text_10 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(button_1_nodes, "Why the name?");
			button_1_nodes.forEach(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */]);
			text_11 = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["g" /* claimText */])(nodes, "\n");
			layout._fragment.l(nodes);
			this.h();
		},

		h: function hydrate() {
			button.className = "goto";
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["a" /* addListener */])(button, "click", click_handler);
			button_1.className = "prefetch";
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["a" /* addListener */])(button_1, "click", click_handler_1);
		},

		m: function mount(target, anchor) {
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(title, document.head);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text, title);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["n" /* insertNode */])(text_2, target, anchor);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_3, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(h1, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_4, h1);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_5, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(p, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_6, p);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_7, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(button, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_8, button);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_9, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(button_1, layout._slotted.default);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_10, button_1);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["b" /* appendNode */])(text_11, layout._slotted.default);
			layout._mount(target, anchor);
		},

		p: __WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["o" /* noop */],

		u: function unmount() {
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */])(title);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */])(text_2);
			layout._unmount();
		},

		d: function destroy() {
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["r" /* removeListener */])(button, "click", click_handler);
			Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["r" /* removeListener */])(button_1, "click", click_handler_1);
			layout.destroy(false);
		}
	};
}

function About(options) {
	Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["m" /* init */])(this, options);
	this._state = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["c" /* assign */])({}, options.data);

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		var nodes = Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["e" /* children */])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["l" /* detachNode */]);
		this._fragment.m(options.target, options.anchor || null);

		this._lock = true;
		Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["d" /* callAll */])(this._beforecreate);
		Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["d" /* callAll */])(this._oncreate);
		Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["d" /* callAll */])(this._aftercreate);
		this._lock = false;
	}
}

Object(__WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["c" /* assign */])(About.prototype, methods, __WEBPACK_IMPORTED_MODULE_0__Users_208311_Development_SVELTE_sapper_test_app_node_modules_svelte_shared_js__["p" /* proto */]);
/* harmony default export */ __webpack_exports__["default"] = (About);

/***/ })
]);