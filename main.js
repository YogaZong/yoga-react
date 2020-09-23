/**
 * webpack entry file
 * PS: this file would threw errors by IDE because of using JSX, just ignore all of them
 */
import { createElement, render, Component } from './yoga-react'

class MyComponent extends Component {
  render () {
    return <div>
      <h1>Yoga Component</h1>
      {this.children}
    </div>
  }
}

let rootJSX =
    <MyComponent id="a" class="class">
      <div id="b">abc</div>
      <div id="c"></div>
    </MyComponent>

render(rootJSX, document.getElementById('app'))
