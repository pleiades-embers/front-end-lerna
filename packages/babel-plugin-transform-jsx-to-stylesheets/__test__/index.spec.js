import jSXStylePlugin from '../src/index';
import syntaxJSX from 'babel-plugin-syntax-jsx';
import { transform } from 'babel-core';
import path from 'path';
const mergeStylesFunctionTemplate = `function _mergeStyles() {
  var newTarget = {};

  for (var index = 0; index < arguments.length; index++) {
    var target = arguments[index];

    for (var key in target) {
      newTarget[key] = Object.assign(newTarget[key] || {}, target[key]);
    }
  }

  return newTarget;
}
`;

const getClassNameFunctionTemplate = `function _getClassName() {
  var className = [];
  var args = arguments[0];
  var type = Object.prototype.toString.call(args).slice(8, -1).toLowerCase();

  if (type === 'string') {
    args = args.trim();
    args && className.push(args);
  } else if (type === 'array') {
    args.forEach(function (cls) {
      cls = _getClassName(cls).trim();
      cls && className.push(cls);
    });
  } else if (type === 'object') {
    for (var k in args) {
      k = k.trim();

      if (k && args.hasOwnProperty(k) && args[k]) {
        className.push(k);
      }
    }
  }

  return className.join(' ').trim();
}`;

const getStyleFunctionTemplate = `function _getStyle(classNameExpression) {
  var cache = _styleSheet.__cache || (_styleSheet.__cache = {});

  var className = _getClassName(classNameExpression);\n
  var classNameArr = className.split(/\\s+/);
  var style = cache[className];

  if (!style) {
    style = {};

    if (classNameArr.length === 1) {
      style = _styleSheet[classNameArr[0].trim()];
    } else {
      classNameArr.forEach(function (cls) {
        style = Object.assign(style, _styleSheet[cls.trim()]);
      });
    }

    cache[className] = style;
  }

  return style;
}`;
describe('jsx style plugin', () => {
  function getTransfromCode(code) {
    return transform(code, {
      plugins: [jSXStylePlugin, syntaxJSX]
    }).code;
  }

  it('取文件名字', () => {
    expect(
      path.basename(`import './app.css';`, path.extname(`import './app.css';`))
    ).toBe('app');
  });

  it('transform only one className to style as member', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.css';

class App extends Component {
  render() {
    return <div className="header" />;
  }
}`)
    ).toBe(`
import { createElement, Component } from 'rax';
import appStyleSheet from './app.css';

var _styleSheet = appStyleSheet;
class App extends Component {
  render() {
    return <div style={_styleSheet["header"]} />;
  }
}`);
  });

  it('transform array, object and expressions', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.css';

class App extends Component {
  render() {
    return <div className={'header'}>
      <div className={{ active: props.isActive }} />
      <div className={['header1 header2', 'header3', { active: props.isActive }]} />
      <div className={props.visible ? 'show' : 'hide'} />
      <div className={getClassName()} />
    </div>;
  }
}`)
    ).toBe(`
import { createElement, Component } from 'rax';
import appStyleSheet from './app.css';

var _styleSheet = appStyleSheet;

${getClassNameFunctionTemplate}

${getStyleFunctionTemplate}

class App extends Component {
  render() {
    return <div style={_styleSheet["header"]}>
      <div style={_getStyle({ active: props.isActive })} />
      <div style={_getStyle(['header1 header2', 'header3', { active: props.isActive }])} />
      <div style={_getStyle(props.visible ? 'show' : 'hide')} />
      <div style={_getStyle(getClassName())} />
    </div>;
  }
}`);
  });

  it('结合一个样式和class', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.css';
import style from './style.css';

class App extends Component {
  render() {
    return <div className="header2" style={styles.header1} />;
  }
}`)
    ).toBe(`${mergeStylesFunctionTemplate}
import { createElement, Component } from 'rax';
import appStyleSheet from './app.css';
import styleStyleSheet from './style.css';

var _styleSheet = _mergeStyles(appStyleSheet, styleStyleSheet);

class App extends Component {
  render() {
    return <div style={[_styleSheet["header2"], styles.header1]} />;
  }
}`);
  });

  it('combine inline style object and className', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.css';

class App extends Component {
  render() {
    return <div className="header" style={{
      height: 100
    }} />;
  }
}`)
    ).toBe(`
import { createElement, Component } from 'rax';
import appStyleSheet from './app.css';

var _styleSheet = appStyleSheet;
class App extends Component {
  render() {
    return <div style={[_styleSheet["header"], {
      height: 100
    }]} />;
  }
}`);
  });

  it('combine multiple styles and className', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.css';
import style from './style.css';

class App extends Component {
  render() {
    return <div className="header2" style={[styles.header1, styles.header3]} />;
  }
}`)
    ).toBe(`${mergeStylesFunctionTemplate}
import { createElement, Component } from 'rax';
import appStyleSheet from './app.css';
import styleStyleSheet from './style.css';

var _styleSheet = _mergeStyles(appStyleSheet, styleStyleSheet);

class App extends Component {
  render() {
    return <div style={[_styleSheet["header2"], styles.header1, styles.header3]} />;
  }
}`);
  });

  it('当没有css的时候不转换代码', () => {
    const code = `
import { createElement, Component } from 'rax';

class App extends Component {
  render() {
    return <div className="header" />;
  }
}`;

    expect(getTransfromCode(code)).toBe(code);
  });

  it('转换css文件', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app.scss';

class App extends Component {
  render() {
    return <div className="header" />;
  }
}`)
    ).toBe(`
import { createElement, Component } from 'rax';
import appStyleSheet from './app.scss';

var _styleSheet = appStyleSheet;
class App extends Component {
  render() {
    return <div style={_styleSheet["header"]} />;
  }
}`);
  });

  it('转换css文件使用连字号 hyphen(-) 在文件名', () => {
    expect(
      getTransfromCode(`
import { createElement, Component } from 'rax';
import './app-style.scss';

class App extends Component {
  render() {
    return <div className="header" />;
  }
}`)
    ).toBe(`
import { createElement, Component } from 'rax';
import app_styleStyleSheet from './app-style.scss';

var _styleSheet = app_styleStyleSheet;
class App extends Component {
  render() {
    return <div style={_styleSheet["header"]} />;
  }
}`);
  });

  it('在渲染中变换常量函数', () => {
    expect(
      getTransfromCode(`
import { createElement, render } from 'rax';
import './app.css';

render(<div className="header" />);
`)
    ).toBe(`
import { createElement, render } from 'rax';
import appStyleSheet from './app.css';

var _styleSheet = appStyleSheet;
render(<div style={_styleSheet["header"]} />);`);
  });

  it('transform stylus in render', () => {
    expect(
      getTransfromCode(`
import { createElement, render } from 'rax';
import './app.styl';

render(<div className="header" />);
`)
    ).toBe(`
import { createElement, render } from 'rax';
import appStyleSheet from './app.styl';

var _styleSheet = appStyleSheet;
render(<div style={_styleSheet["header"]} />);`);
  });
});
