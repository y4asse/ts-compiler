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

type Token = TokenReserved | TokenNum | TokenIdent | TokenEOF | TokenHead;

let token: Token | null = null;
let userInput: string = "";

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

    if (multiLetterPunctuator.find((v) => text.startsWith(v, i))) {
      cur = newToken(cur, newTokenReserved(text.substring(i, i + 2), 2));
      i += 2;
      continue;
    }

    if (singleLetterPunctuator.includes(text[i])) {
      cur = newToken(cur, newTokenReserved(text[i++], 1));
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

    if ("a" <= text[i] && text[i] <= "z") {
      cur = newToken(cur, newTokenIdent(text[i++], 1)); // 一旦1文字
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
  if (token?.kind !== "RESERVED" || token.str !== op) {
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

const code: (Node | null)[] = [];
const programCode = () => {
  let i = 0;
  while (!atEOF()) {
    code[i++] = stmt();
  }
  code[i] = null;
};

const stmt = (): Node => {
  const node = expr();
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
      node = newNode("ND_LT", node, relational());
    } else if (consume(">")) {
      node = newNode("ND_LT", relational(), node);
    } else if (consume("<=")) {
      node = newNode("ND_LE", node, relational());
    } else if (consume(">=")) {
      node = newNode("ND_LE", relational(), node);
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
    const offset = (identToken.str.charCodeAt(0) - "a".charCodeAt(0) + 1) * 8;
    return newNodeLvar(offset);
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
