import { OP, INSTR } from "./labels";

export function getInheritanceTree(cls) {
  let base = cls;
  let tree = [cls.name];
  while (true) {
    base = Object.getPrototypeOf(base);
    if (base === Function.prototype) break;
    tree.push(base.name);
  };
  return tree;
};

export function instructionToString(n) {
  for (let key in INSTR) {
    let value = INSTR[key];
    if (value === n) return key;
  };
  console.warn(`Unexpected instruction value ${n}`);
  return "";
};

export function injectPatchIntoNode(node, patch, end) {
  let body = null;
  let type = node.type;
  if (type === "Program") body = node.body;
  else if (type === "BlockStatement") body = node.body;
  else if (type === "ForStatement") body = node.body.body;
  else if (isLoopStatement(type)) body = node.body.body;
  else if (isFunctionNode(type)) {
    body = node.body.body;
  }
  else console.error(`Invalid patch node type ${type}`);
  console.assert(body instanceof Array);
  // force patches to be magic
  patch.magic = true;
  if (end) body.push(patch);
  else body.unshift(patch);
};

export function resolveCallee(node) {
  let type = node.type;
  if (node.type === "MemberExpression") {
    return node.object;
  }
  return node;
};

export function isFunctionNode(type) {
  return (
    type === "FunctionExpression" ||
    type === "FunctionDeclaration" ||
    type === "ArrowFunctionExpression"
  );
};

export function isExpression(type) {
  return (
    type === "ArrayExpression" ||
    type === "AssignmentExpression" ||
    type === "BinaryExpression" ||
    type === "CallExpression" ||
    type === "ConditionalExpression" ||
    type === "FunctionExpression" ||
    type === "Identifier" ||
    type === "Literal" ||
    type === "LogicalExpression" ||
    type === "MemberExpression" ||
    type === "NewExpression" ||
    type === "ObjectExpression" ||
    type === "SequenceExpression" ||
    type === "ThisExpression" ||
    type === "UnaryExpression" ||
    type === "UpdateExpression"
  );
};

export function isStatement(type) {
  return (
    type === "BlockStatement" ||
    type === "BreakStatement" ||
    type === "ContinueStatement" ||
    type === "DebuggerStatement" ||
    type === "DoWhileStatement" ||
    type === "EmptyStatement" ||
    type === "ExpressionStatement" ||
    type === "ForInStatement" ||
    type === "ForStatement" ||
    type === "IfStatement" ||
    type === "LabeledStatement" ||
    type === "ReturnStatement" ||
    type === "SwitchStatement" ||
    type === "ThrowStatement" ||
    type === "TryStatement" ||
    type === "VariableDeclaration" ||
    type === "WhileStatement" ||
    type === "WithStatement"
  );
};

export function isLoopStatement(type) {
  return (
    type === "ForStatement" ||
    type === "ForInStatement" ||
    type === "ForOfStatement" ||
    type === "WhileStatement" ||
    type === "DoWhileStatement"
  );
};

export function isSwitchStatement(type) {
  return (
    type === "SwitchStatement"
  );
};

export function isTryStatement(type) {
  return (
    type === "TryStatement"
  );
};

export function isLabeledStatement(type) {
  return (
    type === "LabeledStatement"
  );
};

export function isPrimitive(value) {
  let type = getValueType(value);
  return (
    type === "number" ||
    type === "string" ||
    type === "boolean" ||
    type === "undefined" ||
    type === "null" ||
    type === "symbol"
  );
};

export function getValueType(value) {
  if (value === null) return "null";
  return typeof value;
};

export function isAbstract(value) {
  return !isPrimitive(value);
};

export function isLoopFrameType(type) {
  return (
    type === INSTR.LOOP_ENTER
  );
};

export function isSwitchFrameType(type) {
  return (
    type === INSTR.SWITCH_ENTER
  );
};

export function isSwitchCaseFrameType(type) {
  return (
    type === INSTR.CASE_ENTER
  );
};

export function isFunctionFrameType(type) {
  return (
    type === INSTR.FUNCTION_CALL
  );
};

export function isMethodFrameType(type) {
  return (
    type === INSTR.METHOD_ENTER
  );
};

export function isReturnableFrameType(type) {
  return (
    isMethodFrameType(type) ||
    isFunctionFrameType(type)
  );
};

export function isBreakableFrameType(type) {
  return (
    isLoopFrameType(type) ||
    isSwitchFrameType(type)
  );
};

export function isContinuableFrameType(type) {
  return (
    isLoopFrameType(type)
  );
};

export function isTryStatementFrameType(type) {
  return (
    type === INSTR.TRY_ENTER
  );
};

export function isInstantiationFrameType(type) {
  return (
    type === INSTR.OP_NEW
  );
};

export function isValidFrameInstruction(frame) {
  console.assert(typeof frame.cleanType === "string");
  let type = frame.cleanType;
  return (
    INSTR[type] >= 0
  );
};

export function operatorToString(op) {
  for (let key in OP) {
    if (OP[key] === op) return key;
  };
  return "undefined";
};

export function processLabels(node) {
  let labels = [];
  // we can have multiple labels in js
  // *universe collapses*
  while (true) {
    if (node.type === "LabeledStatement") {
      labels.push(node.label.name);
    } else if (isStatement(node.type)) {
      node.labels = labels;
      break;
    }
    node = node.body;
  };
  return node;
};

export function processArguments(args) {
  let values = [];
  for (let ii = 0; ii < args.length; ++ii) {
    values.push(args[ii]);
  };
  return values;
};

export function getCallee(callee, call) {
  if (call === null) {
    return callee.name;
  }
  return call;
};

export function indentString(n) {
  let str = "";
  for (let ii = 0; ii < n; ++ii) {
    str += " ";
  };
  return str;
};

export function cloneNode(node) {
  let clone = JSON.parse(JSON.stringify(node));
  return clone;
};

export function deepMagicPatch(node) {
  // magic patch the whole ast
  acorn.walk.full(node, function(child) {
    child.magic = true;
  });
};

export function parse() {
  return acorn.parse.apply(null, arguments);
};

export function generate() {
  return escodegen.generate.apply(null, arguments);
};

export function parseExpression(input) {
  let node = parse(input);
  let result = node.body[0].expression;
  deepMagicPatch(result);
  return result;
};

export function parseExpressionStatement(input) {
  let node = parse(input);
  let result = node.body[0];
  deepMagicPatch(result);
  return result;
};

export function forceLoopBodyBlocked(node) {
  if (node.body.type !== "BlockStatement") {
    node.body = {
      magic: true,
      type: "BlockStatement",
      body: [node.body]
    };
  }
};