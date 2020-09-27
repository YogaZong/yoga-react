const RENDER_TO_DOM = Symbol('render to dom');

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(component) {
    this.children.push(component);
  }

  get vnode() {
    return this.render().vnode;
  }

  [RENDER_TO_DOM](range /*Range API*/) {
    this._range = range;
    this._vnode = this.vnode;
    this._vnode[RENDER_TO_DOM](range);
  }

  /*rerender() {
    // 存旧 range
    let oldRange = this._range;
    // 创建新的 range
    let range = document.createRange();
    // 新的 range 设置成旧的 range 的 start 的位置
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    // 插入
    this[RENDER_TO_DOM](range);

    // 旧的 range 挪到 新的 range 插入内容之后
    oldRange.setStart(range.endContainer, range.endOffset);
    // 删除旧 range 的内容
    oldRange.deleteContents();
  }*/
  update() {
    // Type key 是否一致
    let isSameNodeType = (n1, n2) => {
      // n1 和 n2 节点的 type 和 key 都相同，才是相同节点
      return n1.type === n2.type && n1.key === n2.key;
    };
    // 属性是否一致
    let isSameNodeProps = (n1, n2) => {
      for (let name in n2.props) {
        if (n2.props[name] !== n1.props[name]) {
          return false;
        }
      }
      return true;
    };
    let caseText = (n1, n2) => {
      if (n2.type === '#text') {
        return n2.content === n1.content;
      }
      return true;
    };
    // next 表示新的组件 vnode
    let update = (vnode, next) => {
      // patch
      // same Type? props? children? || type: text > content

      if (
        !(
          isSameNodeType(vnode, next) &&
          isSameNodeProps(vnode, next) &&
          caseText(vnode, next)
        )
      ) {
        next[RENDER_TO_DOM](vnode._range);
        return;
      }
      next._range = vnode._range;

      let nextTree = next.vchildren;
      let vnodeTree = vnode.vchildren;

      if (!vnodeTree || !nextTree.length) {
        return;
      }
      let tailRange = vnodeTree[vnodeTree.length - 1]._range;

      for (let i = 0; i < nextTree.length; i++) {
        let nextChild = nextTree[i];
        let vnodeChild = vnodeTree[i];
        if (i < vnodeTree.length) {
          update(vnodeChild, nextChild);
        } else {
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          nextChild[RENDER_TO_DOM](range);
          tailRange = range;
          // TODO
        }
      }
    };
    // 缓存旧的 vnode
    let prevNode = this.vnode;
    update(this._vnode, prevNode);
    // 更新 vnode
    this._vnode = prevNode;
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
      return;
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };
    merge(this.state, newState);
    this.update();
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
    // this.root = document.createElement(type);
  }
  /*
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLocaleLowerCase()),
        value
      );
    } else {
      if (name === 'className') {
        this.root.setAttribute('class', value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
  }

  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
*/
  get vnode() {
    this.vchildren = this.children.map((child) => child.vnode);
    return this;
    // return {
    //   type: this.type,
    //   props: this.props,
    //   children: this.children.map((child) => child.vnode),
    // };
  }

  [RENDER_TO_DOM](range /*Range API*/) {
    this._range = range;
    // range.deleteContents();

    let root = document.createElement(this.type);

    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLocaleLowerCase()),
          value
        );
      } else {
        if (name === 'className') {
          root.setAttribute('class', value);
        } else {
          root.setAttribute(name, value);
        }
      }
    }
    if (!this.vchildren) {
      this.vchildren = this.children.map((child) => child.vnode);
    }

    for (let child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }
    replaceContent(range, root);
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.type = '#text';
    this.content = content;
    // this.root = document.createTextNode(content);
  }

  get vnode() {
    return this;
    // return {
    //   type: '#text',
    //   content: this.content,
    // };
  }

  [RENDER_TO_DOM](range /*Range API*/) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === 'string') {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }

  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child);
      }
      if (child === null) {
        continue;
      }
      if (typeof child === 'object' && child instanceof Array) {
        insertChildren(child);
      } else {
        e.appendChild(child);
      }
    }
  };

  insertChildren(children);
  return e;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
