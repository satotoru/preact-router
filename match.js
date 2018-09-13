'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Link = exports.Match = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _preact = require('preact');

var _preactRouter = require('preact-router');

var _index = require('./index');

var _util = require('./util');

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Match = exports.Match = function (_Component) {
	_inherits(Match, _Component);

	function Match(props, context) {
		_classCallCheck(this, Match);

		var _this = _possibleConstructorReturn(this, _Component.call(this, props));

		_this.update = function (url) {
			_this.nextUrl = url;
			_this.setState({});
		};

		_this.baseUrl = props.base || '';
		if (props.path) {
			var segments = (0, _util.segmentize)(props.path);
			segments.forEach(function (segment) {
				if (segment.indexOf(':') == -1) {
					_this.baseUrl = _this.baseUrl + '/' + segment;
				}
			});
		}
		if (context && context[_index.PREACT_ROUTER_BASE] && !_this.props.base) {
			_this.baseUrl = context[_index.PREACT_ROUTER_BASE] + _this.baseUrl;
		}
		return _this;
	}

	Match.prototype.getChildContext = function getChildContext() {
		var ret = _defineProperty({}, _index.PREACT_ROUTER_BASE, this.baseUrl);
		return ret;
	};

	Match.prototype.componentDidMount = function componentDidMount() {
		_preactRouter.subscribers.push(this.update);
	};

	Match.prototype.componentWillUnmount = function componentWillUnmount() {
		_preactRouter.subscribers.splice(_preactRouter.subscribers.indexOf(this.update) >>> 0, 1);
	};

	Match.prototype.render = function render(props) {
		var url = this.nextUrl || (0, _preactRouter.getCurrentUrl)(),
		    path = url.replace(/\?.+$/, '');
		this.nextUrl = null;
		var newProps = {
			url: url,
			path: path,
			matches: path === props.path || (0, _util.exec)(path, context[_index.PREACT_ROUTER_BASE] + props.path, {})
		};
		return props.children[0] && (typeof props.children[0] === 'function' ? props.children[0](newProps) : (0, _preact.cloneElement)(props.children[0], newProps));
	};

	return Match;
}(_preact.Component);

var Link = function Link(_ref) {
	var activeClassName = _ref.activeClassName,
	    path = _ref.path,
	    props = _objectWithoutProperties(_ref, ['activeClassName', 'path']);

	return (0, _preact.h)(
		Match,
		{ path: path || props.href },
		function (_ref2) {
			var matches = _ref2.matches;
			return (0, _preact.h)(_preactRouter.Link, _extends({}, props, { 'class': [props.class || props.className, matches && activeClassName].filter(Boolean).join(' ') }));
		}
	);
};

exports.Link = Link;
exports.default = Match;

Match.Link = Link;
