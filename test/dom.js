import { Router, Link, route } from 'src';
import { Match, Link as ActiveLink } from 'src/match';
import { h, render } from 'preact';

const Empty = () => null;

function fireEvent(on, type) {
	let e = document.createEvent('Event');
	e.initEvent(type, true, true);
	on.dispatchEvent(e);
}

describe('dom', () => {
	let scratch, $, mount;

	before( () => {
		scratch = document.createElement('div');
		document.body.appendChild(scratch);
		$ = s => scratch.querySelector(s);
		mount = jsx => render(jsx, scratch, scratch.firstChild);
	});

	beforeEach( () => {
		// manually reset the URL before every test
		history.replaceState(null, null, '/');
		fireEvent(window, 'popstate');
	});

	afterEach( () => {
		mount(<Empty />);
		scratch.innerHTML = '';
	});

	after( () => {
		document.body.removeChild(scratch);
	});

	describe('<Link />', () => {
		it('should render a normal link', () => {
			expect(
				mount(<Link href="/foo" bar="baz">hello</Link>).outerHTML
			).to.eql(
				mount(<a href="/foo" bar="baz">hello</a>).outerHTML
			);
		});

		it('should route when clicked', () => {
			let onChange = sinon.spy();
			mount(
				<div>
					<Link href="/foo">foo</Link>
					<Router onChange={onChange}>
						<div default />
					</Router>
				</div>
			);
			onChange.reset();
			$('a').click();
			expect(onChange)
				.to.have.been.calledOnce
				.and.to.have.been.calledWithMatch({ url:'/foo' });
		});
	});

	describe('<a>', () => {
		it('should route for existing routes', () => {
			let onChange = sinon.spy();
			mount(
				<div>
					<a href="/foo">foo</a>
					<Router onChange={onChange}>
						<div default />
					</Router>
				</div>
			);
			onChange.reset();
			$('a').click();
			// fireEvent($('a'), 'click');
			expect(onChange)
				.to.have.been.calledOnce
				.and.to.have.been.calledWithMatch({ url:'/foo' });
		});

		it('should not intercept non-preact elements', () => {
			let onChange = sinon.spy();
			mount(
				<div>
					<div dangerouslySetInnerHTML={{ __html: `<a href="#foo">foo</a>` }} />
					<Router onChange={onChange}>
						<div default />
					</Router>
				</div>
			);
			onChange.reset();
			$('a').click();
			expect(onChange).not.to.have.been.called;
			expect(location.href).to.contain('#foo');
		});
	});

	describe('Router', () => {
		it('should add and remove children', () => {
			class A {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(A.prototype, 'componentWillMount');
			sinon.spy(A.prototype, 'componentWillUnmount');
			mount(
				<Router>
					<A path="/foo" />
				</Router>
			);
			expect(A.prototype.componentWillMount).not.to.have.been.called;
			route('/foo');
			expect(A.prototype.componentWillMount).to.have.been.calledOnce;
			expect(A.prototype.componentWillUnmount).not.to.have.been.called;
			route('/bar');
			expect(A.prototype.componentWillMount).to.have.been.calledOnce;
			expect(A.prototype.componentWillUnmount).to.have.been.calledOnce;
		});

		it('should support re-routing', done => {
			class A {
				componentWillMount() {
					route('/b');
				}
				render(){ return <div class="a" />; }
			}
			class B {
				componentWillMount(){}
				render(){ return <div class="b" />; }
			}
			sinon.spy(A.prototype, 'componentWillMount');
			sinon.spy(B.prototype, 'componentWillMount');
			mount(
				<Router>
					<A path="/a" />
					<B path="/b" />
				</Router>
			);
			expect(A.prototype.componentWillMount).not.to.have.been.called;
			route('/a');
			expect(A.prototype.componentWillMount).to.have.been.calledOnce;
			A.prototype.componentWillMount.reset();
			expect(location.pathname).to.equal('/b');
			setTimeout( () => {
				expect(A.prototype.componentWillMount).not.to.have.been.called;
				expect(B.prototype.componentWillMount).to.have.been.calledOnce;
				expect(scratch).to.have.deep.property('firstElementChild.className', 'b');
				done();
			}, 10);
		});

		it('should not carry over the previous value of a query parameter', () => {
			class A {
				render({ bar }){ return <p>bar is {bar}</p>; }
			}
			let routerRef;
			mount(
				<Router ref={r => routerRef = r}>
					<A path="/foo" />
				</Router>
			);
			route('/foo');
			expect(routerRef.base.outerHTML).to.eql('<p>bar is </p>');
			route('/foo?bar=5');
			expect(routerRef.base.outerHTML).to.eql('<p>bar is 5</p>');
			route('/foo');
			expect(routerRef.base.outerHTML).to.eql('<p>bar is </p>');
		});
		it('should support nested routers with default', () => {
			class X {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(X.prototype, 'componentWillMount');
			sinon.spy(X.prototype, 'componentWillUnmount');
			class Y {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(Y.prototype, 'componentWillMount');
			sinon.spy(Y.prototype, 'componentWillUnmount');
			mount(
				<Router base="/app">
					<X path="/x" />
					<Router default>
					  <Y path="/y"/>
					</Router>
				</Router>
			);
			expect(X.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			route('/app/x');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
			route('/app/y');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
		});
		it('should support nested routers with path', () => {
			class X {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(X.prototype, 'componentWillMount');
			sinon.spy(X.prototype, 'componentWillUnmount');
			class Y {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(Y.prototype, 'componentWillMount');
			sinon.spy(Y.prototype, 'componentWillUnmount');
			mount(
				<Router base='/baz'>
					<X path="/j" />
					<Router path="/box/:bar*">
						<Y path="/k"/>
					</Router>
				</Router>
			);
			expect(X.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			route('/baz/j');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
			route('/baz/box/k');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
		});
		it('should support deeply nested routers', () => {
			class X {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(X.prototype, 'componentWillMount');
			sinon.spy(X.prototype, 'componentWillUnmount');
			class Y {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(Y.prototype, 'componentWillMount');
			sinon.spy(Y.prototype, 'componentWillUnmount');
			mount(
				<Router base='/baz'>
					<X path="/j" />
					<z path="/box/:bar*">
						<Router path="/box">
							<Y path="/k"/>
						</Router>
					</z>
				</Router>
			);
			expect(X.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			route('/baz/j');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
			route('/baz/box/k');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
		});
		it('should support nested routers and Match(s)', () => {
			class X {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(X.prototype, 'componentWillMount');
			sinon.spy(X.prototype, 'componentWillUnmount');
			class Y {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(Y.prototype, 'componentWillMount');
			sinon.spy(Y.prototype, 'componentWillUnmount');
			mount(
				<Router base='/ccc'>
					<X path="/jjj" />
					<Match path="/xxx/:bar*">
							<Y path="/kkk"/>
					</Match>
				</Router>
			);
			expect(X.prototype.componentWillMount, 'X1').not.to.have.been.called;
			expect(Y.prototype.componentWillMount, 'Y1').not.to.have.been.called;
			route('/ccc/jjj');
			expect(X.prototype.componentWillMount, 'X2').to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount, 'X3').not.to.have.been.called;
			expect(Y.prototype.componentWillMount, 'Y2').not.to.have.been.called;
			expect(Y.prototype.componentWillUnmount, 'Y3').not.to.have.been.called;
			route('/ccc/xxx/kkk');
			expect(X.prototype.componentWillMount, 'X4').to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount, 'X5').to.have.been.calledOnce;
			expect(Y.prototype.componentWillMount, 'Y4').to.have.been.calledOnce;
			expect(Y.prototype.componentWillUnmount, 'Y5').not.to.have.been.called;
		});
		it('should support nested router reset via base attr', () => {
			class X {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(X.prototype, 'componentWillMount');
			sinon.spy(X.prototype, 'componentWillUnmount');
			class Y {
				componentWillMount() {}
				componentWillUnmount() {}
				render(){ return <div />; }
			}
			sinon.spy(Y.prototype, 'componentWillMount');
			sinon.spy(Y.prototype, 'componentWillUnmount');
			mount(
				<Router base='/baz'>
					<X path="/j" />
					<Router path="/:bar*" base="/baz/foo">
						<Y path="/k"/>
					</Router>
				</Router>
			);
			expect(X.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			route('/baz/j');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Y.prototype.componentWillMount).not.to.have.been.called;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
			route('/baz/foo/k');
			expect(X.prototype.componentWillMount).to.have.been.calledOnce;
			expect(X.prototype.componentWillUnmount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Y.prototype.componentWillUnmount).not.to.have.been.called;
		});
	});

	describe('preact-router/match', () => {
		describe('<Match>', () => {
			it('should invoke child function with match status when routing', done => {
				let spy1 = sinon.spy(),
					spy2 = sinon.spy();
				mount(
					<div>
						<Router />
						<Match path="/foo">{spy1}</Match>
						<Match path="/bar">{spy2}</Match>
					</div>
				);

				expect(spy1, 'spy1 /foo').to.have.been.calledOnce.and.calledWithMatch({ matches: false, path:'/', url:'/' });
				expect(spy2, 'spy2 /foo').to.have.been.calledOnce.and.calledWithMatch({ matches: false, path:'/', url:'/' });

				spy1.reset();
				spy2.reset();

				route('/foo');

				setTimeout( () => {
					expect(spy1, 'spy1 /foo').to.have.been.calledOnce.and.calledWithMatch({ matches: true, path:'/foo', url:'/foo' });
					expect(spy2, 'spy2 /foo').to.have.been.calledOnce.and.calledWithMatch({ matches: false, path:'/foo', url:'/foo' });
					spy1.reset();
					spy2.reset();

					route('/foo?bar=5');

					setTimeout( () => {
						expect(spy1, 'spy1 /foo?bar=5').to.have.been.calledOnce.and.calledWithMatch({ matches: true, path:'/foo', url:'/foo?bar=5' });
						expect(spy2, 'spy2 /foo?bar=5').to.have.been.calledOnce.and.calledWithMatch({ matches: false, path:'/foo', url:'/foo?bar=5' });
						spy1.reset();
						spy2.reset();

						route('/bar');

						setTimeout( () => {
							expect(spy1, 'spy1 /bar').to.have.been.calledOnce.and.calledWithMatch({ matches: false, path:'/bar', url:'/bar' });
							expect(spy2, 'spy2 /bar').to.have.been.calledOnce.and.calledWithMatch({ matches: true, path:'/bar', url:'/bar' });

							done();
						}, 20);
					}, 20);
				}, 20);
			});
		});

		describe('<Link>', () => {
			it('should render with active class when active', done => {
				mount(
					<div>
						<Router />
						<ActiveLink activeClassName="active" path="/foo">foo</ActiveLink>
						<ActiveLink activeClassName="active" class="bar" path="/bar">bar</ActiveLink>
					</div>
				);
				route('/foo');

				setTimeout( () => {
					expect(scratch.innerHTML).to.eql('<div><a class="active">foo</a><a class="bar">bar</a></div>');

					route('/foo?bar=5');

					setTimeout( () => {
						expect(scratch.innerHTML).to.eql('<div><a class="active">foo</a><a class="bar">bar</a></div>');

						route('/bar');

						setTimeout( () => {
							expect(scratch.innerHTML).to.eql('<div><a class="">foo</a><a class="bar active">bar</a></div>');

							done();
						});
					});
				});
			});
		});
	});
});
