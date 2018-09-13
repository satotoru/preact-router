import { h, Component, cloneElement } from 'preact';
import { subscribers, getCurrentUrl, Link as StaticLink } from 'preact-router';
import { PREACT_ROUTER_BASE } from './index';
import { exec, segmentize } from './util';

export class Match extends Component {
	constructor(props, context) {
		super(props);
		this.baseUrl = props.base || '';
		if (props.path) {
			let segments = segmentize(props.path);
			segments.forEach(segment => {
				if (segment.indexOf(':') == -1) {
					this.baseUrl = this.baseUrl + '/' + segment;
				}
			});
		}
		if (context && context[PREACT_ROUTER_BASE] && !this.props.base) {
			this.baseUrl = context[PREACT_ROUTER_BASE] + this.baseUrl;
		}
	}
	getChildContext() {
		const ret = {
			[PREACT_ROUTER_BASE]: this.baseUrl
		};
		return ret;
	}
	update = url => {
		this.nextUrl = url;
		this.setState({});
	};
	componentDidMount() {
		subscribers.push(this.update);
	}
	componentWillUnmount() {
		subscribers.splice(subscribers.indexOf(this.update)>>>0, 1);
	}
	render(props) {
		let url = this.nextUrl || getCurrentUrl(),
			path = url.replace(/\?.+$/,'');
		this.nextUrl = null;
		const newProps = {
			url,
			path,
			matches: path===props.path || exec(path, context[PREACT_ROUTER_BASE] + props.path, {})
		};
		return props.children[0] &&
		  (typeof props.children[0] === 'function' ?
			  props.children[0](newProps) : cloneElement(props.children[0], newProps));
	}
}

export const Link = ({ activeClassName, path, ...props }) => (
	<Match path={path || props.href}>
		{ ({ matches }) => (
			<StaticLink {...props} class={[props.class || props.className, matches && activeClassName].filter(Boolean).join(' ')} />
		) }
	</Match>
);

export default Match;
Match.Link = Link;
