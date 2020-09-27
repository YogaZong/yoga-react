/**
 * webpack entry file
 * PS: this file would threw errors by IDE because of using JSX, just ignore all of them
 */
import { createElement, render, Component } from './yoga-react';

class MyComponent extends Component {
  constructor() {
    super();
    this.state = {
      a: 1,
      b: 2,
    };
  }
  render() {
    return (
      <div>
        <h1>Yoga Component</h1>
        <button
          onclick={() => {
            this.setState({ a: this.state.a + 1 });
          }}
        >
          count ++
        </button>
        <p>a: {this.state.a.toString()}</p>
        <p>b: {this.state.b.toString()}</p>
      </div>
    );
  }
}

let rootJSX = (
  <MyComponent id="a" class="class">
    <div id="b">abc</div>
    <div id="c"></div>
  </MyComponent>
);

render(rootJSX, document.getElementById('app'));
