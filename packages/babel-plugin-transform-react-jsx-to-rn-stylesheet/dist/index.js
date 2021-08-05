"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const taro_css_to_react_native_1 = require("taro-css-to-react-native");
const STYLE_SHEET_NAME = '_styleSheet';
const GET_STYLE_FUNC_NAME = '_getStyle';
const MERGE_STYLES_FUNC_NAME = '_mergeStyles';
const GET_CLS_NAME_FUNC_NAME = '_getClassName';
const NAME_SUFFIX = 'styleSheet';
const RN_CSS_EXT = ['.css', '.scss', '.sass', '.less', '.styl', '.stylus'];
/***
 * 判断是不是样式文件
 */
const isStyle = (value) => {
    const ext = path_1.default.extname(value);
    return RN_CSS_EXT.indexOf(ext) > -1;
};
/**
 * 判断是不是 module文件
 */
const isModuleSource = (value) => value.indexOf('.module.') > -1;
const string2Object = (str) => {
    const entires = str
        .replace('/;+$/g', '')
        .split(';')
        .map((L) => {
        var _a;
        const arr = L.split(':');
        arr[1] = (_a = arr[1]) === null || _a === void 0 ? void 0 : _a.replace(/px/g, 'px');
        return arr;
    });
    const cssObject = taro_css_to_react_native_1.transformCSS(entires);
    return cssObject;
};
const object2Expression = (template, cssObject) => {
    var _a;
    const ast = template.ast(`var a=${JSON.stringify(cssObject)}`);
    return (_a = ast.declaration[0]) === null || _a === void 0 ? void 0 : _a.init;
};
function findLastImportIndex(body) {
    const bodyReverse = body.slice(0).reverse();
    let _index = 0;
    bodyReverse.some((node, index) => {
        if (node.type == 'ImportDeclaration') {
            _index = body.length - index - 1;
            return true;
        }
        return false;
    });
    return _index;
}
const MergeStylesFunction = `
function _mergeStyles() {
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
const getClassNameFunction = `
function ${GET_CLS_NAME_FUNC_NAME}() {
  var className = [];
  var args = arguments[0];
  var type = Object.prototype.toString.call(args).slice(8, -1).toLowerCase();

  if (type === 'string') {
    args = args.trim();
    args && className.push(args);
  } else if (type === 'array') {
    args.forEach(function (cls) {
      cls = ${GET_CLS_NAME_FUNC_NAME}(cls).trim();
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
}
`;
const getStyleFunction = `
function ${GET_STYLE_FUNC_NAME}(classNameExpression) { 
  var className = ${GET_CLS_NAME_FUNC_NAME}(classNameExpression);
  var classNameArr = className.split(/\\s+/);

  var style = [];
  if (classNameArr.length === 1) {
    style.push(${STYLE_SHEET_NAME}[classNameArr[0].trim()]);
  } else {
      classNameArr.forEach(function(cls) {
      style.push(${STYLE_SHEET_NAME}[cls.trim()]);
    });
  }

  return style;
}
`;
function default_1(babel) {
    const { types: t, template } = babel;
    const getClassNameFunctionTemplate = template(getClassNameFunction);
    const getStyleFunctionTemplate = template(getStyleFunction);
    const getClassNameFunctionStmt = getClassNameFunctionTemplate();
    const getStyleFunctionStmt = getStyleFunctionTemplate();
    function getMap(str) {
        return str.split(/\s+/).map((className) => {
            //return template(`${STYLE_SHEET_NAME}["${className}"]`)().expression
            const stmt = template(`${STYLE_SHEET_NAME}["${className}"]`)();
            if (t.isExpressionStatement(stmt)) {
                return stmt.expression;
            }
        });
    }
    function isCssModuleExpression(value) {
    }
    return {
        name: 'transform-react-jsx-to-rn-stylesheet',
        visitor: {}
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map