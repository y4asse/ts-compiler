import { findLvar, Lvar } from "./lvar.ts";

type TokenKindReserved = "RESERVED";
type TokenKindNum = "NUM";
type TokenKindIdent = "IDENT";
type TokenKindEOF = "EOF";
type TokenKindHead = "HEAD";

type TokenReserved = {
  kind: TokenKindReserved;
  str: string;
  next: Token | null;
  len: number;
};

type TokenNum = {
  kind: TokenKindNum;
  val: number;
  next: Token | null;
};

type TokenIdent = {
  kind: TokenKindIdent;
  str: string;
  next: Token | null;
  len: number;
};
type TokenEOF = {
  kind: TokenKindEOF;
};

type TokenHead = {
  kind: TokenKindHead;
  next: null;
};

type Token =
  | TokenReserved
  | TokenNum
  | TokenIdent
  | TokenEOF
  | TokenHead;
export type { TokenIdent };

let token: Token | null = null;
let userInput: string = "";
let locals: Lvar | null = null;
let labelSeq = 0;

const newToken = (
  cur: Token,
  newToken: Token,
): Token => {
  if (cur.kind === "EOF") {
    return newToken;
  }
  cur.next = newToken;
  return newToken;
};

const newTokenReserved = (str: string, len: number): Token => {
  return {
    kind: "RESERVED",
    str,
    next: null,
    len,
  };
};

const newTokenNum = (val: number): Token => {
  return {
    kind: "NUM",
    val,
    next: null,
  };
};

const newTokenIdent = (str: string, len: number): Token => {
  return {
    kind: "IDENT",
    str,
    next: null,
    len,
  };
};

const isDigit = (char: string): boolean => {
  return /\d/.test(char);
};

const isReservedToken = (text: string, pos: number): string | null => {
  const reservedToken = reservedTokens.find((v) => text.startsWith(v, pos));
  if (reservedToken && !isAlnum(text[pos + reservedToken.length])) {
    return reservedToken;
  }

  const multiLetter = multiLetterPunctuator.find((v) =>
    text.startsWith(v, pos)
  );
  if (multiLetter) {
    return multiLetter;
  }

  const char = text[pos];
  if (singleLetterPunctuator.includes(char)) {
    return char;
  }

  return null;
};

const isAlnum = (char: string): boolean => {
  return ("a".charCodeAt(0) <= char.charCodeAt(0) &&
    char.charCodeAt(0) <= "z".charCodeAt(0)) ||
    ("A".charCodeAt(0) <= char.charCodeAt(0) &&
      char.charCodeAt(0) <= "Z".charCodeAt(0)) ||
    ("0".charCodeAt(0) <= char.charCodeAt(0) &&
      char.charCodeAt(0) <= "9".charCodeAt(0)) ||
    (char === "_");
};

const error = (text: string) => {
  console.error(text);
  Deno.exit(1);
};

const multiLetterPunctuator = ["==", "!=", "<=", ">="];
const singleLetterPunctuator = [
  "+",
  "-",
  "*",
  "/",
  "(",
  ")",
  "<",
  ">",
  "=",
  ";",
];
const reservedTokens = [
  "return",
  "if",
  "else",
];

const tokenize = (text: string) => {
  const head: Token = {
    kind: "HEAD",
    next: null,
  };
  let cur: Token = head;

  let i = 0;
  while (i !== text.length) {
    // 空白をスキップ
    if (text[i] === " ") {
      i++;
      continue;
    }

    const reservedToken = isReservedToken(text, i);
    if (reservedToken) {
      const len = reservedToken.length;
      cur = newToken(
        cur,
        newTokenReserved(reservedToken, len),
      );
      i += len;
      continue;
    }

    if (isDigit(text[i])) {
      const start = i;
      while (isDigit(text[i])) {
        i++;
      }
      const numStr = text.slice(start, i);
      const num = parseInt(numStr);
      cur = newToken(cur, newTokenNum(num));
      continue;
    }

    if (isAlnum(text[i])) {
      const start = i;
      while (isAlnum(text[i])) {
        i++;
      }
      const str = text.slice(start, i);
      cur = newToken(cur, newTokenIdent(str, str.length)); // 一旦1文字
      continue;
    }

    errorAt(i, "トークナイズできません");
  }

  newToken(cur, { kind: "EOF" });

  return head.next;
};

const expectNumber = () => {
  if (token === null) {
    return error("トークンがありません");
  }
  if (token.kind !== "NUM") {
    return error("数ではありません");
  }
  const val = token.val;
  token = token.next;
  return val;
};

const atEOF = () => {
  return token?.kind === "EOF";
};

const consume = (op: string) => {
  if (token?.kind !== "RESERVED") {
    return false;
  }

  if (token.str !== op) {
    return false;
  }

  token = token.next;
  return true;
};

const consumeIdent = (): TokenIdent | null => {
  if (token?.kind !== "IDENT") {
    return null;
  }

  // 今見てるIdentトークンを返しつつトークンを1つ進める
  const tokenIdent = token;
  token = token.next;
  return tokenIdent;
};

const expect = (op: string) => {
  if (token?.kind !== "RESERVED" || token.str !== op) {
    return false;
  }
  token = token.next;
};

const errorAt = (pos: number, message: string) => {
  console.error(userInput);
  console.error(" ".repeat(pos) + "^ " + message);
  Deno.exit(1);
};

// 抽象構文木を生成する
type ND_ADD = "ND_ADD";
type ND_SUB = "ND_SUB";
type ND_MUL = "ND_MUL";
type ND_DIV = "ND_DIV";
type ND_NUM = "ND_NUM";
type ND_EQ = "ND_EQ";
type ND_NE = "ND_NE";
type ND_LE = "ND_LE";
type ND_LT = "ND_LT";
type ND_ASSIGN = "ND_ASSIGN";
type ND_LVAR = "ND_LVAR";
type ND_RETURN = "ND_RETURN";
type ND_IF = "ND_IF";

type Node = {
  kind:
    | ND_ADD
    | ND_SUB
    | ND_MUL
    | ND_DIV
    | ND_EQ
    | ND_NE
    | ND_LE
    | ND_LT
    | ND_ASSIGN;
  lhs: Node;
  rhs: Node;
} | {
  kind: ND_NUM;
  val: number;
} | {
  kind: ND_LVAR;
  offset: number;
} | {
  kind: ND_RETURN;
  lhs: Node;
} | NodeIf;

type NodeIf = {
  kind: ND_IF;
  condition: Node;
  then: Node;
  els: Node | null;
};

const newNode = (
  kind:
    | ND_ADD
    | ND_SUB
    | ND_MUL
    | ND_DIV
    | ND_EQ
    | ND_NE
    | ND_LE
    | ND_LT
    | ND_ASSIGN,
  lhs: Node,
  rhs: Node,
): Node => {
  return {
    kind,
    lhs,
    rhs,
  };
};

const newNodeLvar = (offset: number): Node => {
  return {
    kind: "ND_LVAR",
    offset,
  };
};

const newNodeNum = (val: number): Node => {
  return {
    kind: "ND_NUM",
    val,
  };
};

const newNodeReturn = (lhs: Node): Node => {
  return {
    kind: "ND_RETURN",
    lhs,
  };
};

const newNodeIf = (condition: Node, then: Node, els: Node | null): NodeIf => {
  return {
    kind: "ND_IF",
    condition,
    then,
    els,
  };
};

const code: (Node | null)[] = [];
const programCode = () => {
  let i = 0;
  while (!atEOF()) {
    code[i++] = stmt();
  }
  code[i] = null;
};

// stmt    = expr ";"
//         | "if" "(" expr ")" stmt ("else" stmt)?
//         | "return" expr ";"
const stmt = (): Node => {
  if (consume("if")) {
    expect("(");
    const condition = expr();
    expect(")");
    const then = stmt();

    const node = newNodeIf(condition, then, null);

    if (consume("else")) {
      node.els = stmt();
    }
    return node;
  }

  let node: Node;
  if (consume("return")) {
    node = newNodeReturn(expr());
  } else {
    node = expr();
  }
  expect(";");

  return node;
};

const expr = (): Node => {
  return assign();
};

const assign = (): Node => {
  let node = equality();
  if (consume("=")) {
    node = newNode("ND_ASSIGN", node, assign());
  }
  return node;
};

// equality = relational ("==" relational | "!=" relational)*
const equality = (): Node => {
  let node = relational();

  while (true) {
    if (consume("==")) {
      node = newNode("ND_EQ", node, relational());
    } else if (consume("!=")) {
      node = newNode("ND_NE", node, relational());
    } else {
      return node;
    }
  }
};

// relational = add ("<" add | "<=" add | ">" add | ">=" add)*
const relational = (): Node => {
  let node = add();

  while (true) {
    if (consume("<")) {
      node = newNode("ND_LT", node, add());
    } else if (consume(">")) {
      node = newNode("ND_LT", add(), node);
    } else if (consume("<=")) {
      node = newNode("ND_LE", node, add());
    } else if (consume(">=")) {
      node = newNode("ND_LE", add(), node);
    } else {
      return node;
    }
  }
};

// add = mul ("+" mul | "-" mul)*
const add = (): Node => {
  let node = mul();

  while (true) {
    if (consume("+")) {
      node = newNode("ND_ADD", node, mul());
    } else if (consume("-")) {
      node = newNode("ND_SUB", node, mul());
    } else {
      return node;
    }
  }
};

const mul = (): Node => {
  let node = unary();

  while (true) {
    if (consume("*")) {
      node = newNode("ND_MUL", node, unary());
    } else if (consume("/")) {
      node = newNode("ND_DIV", node, unary());
    } else {
      return node;
    }
  }
};

const unary = (): Node => {
  if (consume("+")) {
    return primary();
  }

  if (consume("-")) {
    return newNode("ND_SUB", newNodeNum(0), primary());
  }

  return primary();
};

const primary = (): Node => {
  const identToken = consumeIdent();
  if (identToken) {
    const lvar = findLvar(locals, identToken);
    if (lvar) {
      return newNodeLvar(lvar.offset);
    } else {
      const newLvar: Lvar = {
        next: locals,
        name: identToken.str,
        len: identToken.len,
        offset: locals ? locals.offset + 8 : 8,
      };
      locals = newLvar;
      return newNodeLvar(newLvar.offset);
    }
  }

  if (consume("(")) {
    const node = expr();
    expect(")");
    return node;
  }

  return newNodeNum(expectNumber());
};

let program: string = "";

const genLval = (node: Node) => {
  if (node.kind === "ND_LVAR") {
    program += "  mov rax, rbp\n";
    program += `  sub rax, ${node.offset}\n`;
    program += "  push rax\n";
    return;
  }
  error("代入の左辺値が変数ではありません");
};

const gen = (node: Node) => {
  switch (node.kind) {
    case "ND_NUM": {
      program += `  push ${node.val}\n`;
      return;
    }
    case "ND_LVAR": {
      genLval(node);
      program += `  pop rax\n`;
      program += `  mov rax, [rax]\n`;
      program += `  push rax\n`;
      return;
    }
    case "ND_ASSIGN": {
      genLval(node.lhs);
      gen(node.rhs);
      program += `  pop rdi\n`;
      program += `  pop rax\n`;
      program += `  mov [rax], rdi\n`;
      program += `  push rdi\n`;
      return;
    }
    case "ND_RETURN": {
      gen(node.lhs);
      program += `  pop rax\n`;
      program += `  ret\n`;
      return;
    }
    case "ND_IF": {
      const seq = labelSeq++;
      if (node.els) {
        gen(node.condition);
        program += `  pop rax\n`;
        program += `  cmp rax, 0\n`;
        program += `  je .Lelse${seq}\n`;
        gen(node.then);
        program += `  jmp .Lend${seq}\n`;
        program += `.Lelse${seq}:\n`;
        gen(node.els);
        program += `.Lend${seq}:\n`;
        return;
      }
      gen(node.condition);
      program += `  pop rax\n`;
      program += `  cmp rax, 0\n`;
      program += `  je .Lend${seq}\n`;
      gen(node.then);
      program += `.Lend${seq}:\n`;
      return;
    }
  }

  gen(node.lhs);
  gen(node.rhs);

  program += "  pop rdi\n"; // 右のNodeの計算結果が入る
  program += "  pop rax\n"; // 左のNodeの計算結果が入る

  switch (node.kind) {
    case "ND_ADD":
      program += "  add rax, rdi\n";
      break;
    case "ND_SUB":
      program += "  sub rax, rdi\n";
      break;
    case "ND_MUL":
      program += "  imul rax, rdi\n";
      break;
    case "ND_DIV":
      program += "  cqo\n"; // RAXに入っている64ビットの値を128ビットに伸ばしてRDXとRAXにセットする
      program += "  idiv rdi\n";
      break;
    case "ND_EQ":
      program += "  cmp rax, rdi\n";
      program += "  sete al\n";
      program += "  movzb rax, al\n";
      break;
    case "ND_NE":
      program += "  cmp rax, rdi\n";
      program += "  setne al\n";
      program += "  movzb rax, al\n";
      break;
    case "ND_LT":
      program += "  cmp rax, rdi\n";
      program += "  setl al\n";
      program += "  movzb rax, al\n";
      break;
    case "ND_LE":
      program += "  cmp rax, rdi\n";
      program += "  setle al\n";
      program += "  movzb rax, al\n";
      break;
  }

  program += "  push rax\n";
};

const main = async () => {
  program = ".intel_syntax noprefix\n";
  program += ".globl main\n";
  program += "\n";
  program += "main:\n";

  userInput = await Deno.readTextFile("program");

  // トークナイズする
  token = tokenize(userInput);

  // codeにNodeの配列が入る
  programCode();

  for (let i = 0; code[i]; i++) {
    const node = code[i];
    if (!node) {
      break;
    }

    gen(node);

    program += "  pop rax\n";
  }

  // TODOエピローグ
  program += "  ret\n";

  await Deno.writeTextFile("./dist/out.s", program);
};

main();
