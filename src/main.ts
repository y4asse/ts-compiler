type TokenKindReserved = "RESERVED";
type TokenKindNum = "NUM";
type TokenKindEOF = "EOF";
type TokenKindHead = "HEAD";

type TokenReserved = {
  kind: TokenKindReserved;
  str: string;
  next: Token | null;
};

type TokenNum = {
  kind: TokenKindNum;
  val: number;
  next: Token | null;
};

type TokenEOF = {
  kind: TokenKindEOF;
};

type TokenHead = {
  kind: TokenKindHead;
  next: null;
};

type Token = TokenReserved | TokenNum | TokenEOF | TokenHead;

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

const newTokenReserved = (str: string): Token => {
  return {
    kind: "RESERVED",
    str,
    next: null,
  };
};

const newTokenNum = (val: number): Token => {
  return {
    kind: "NUM",
    val,
    next: null,
  };
};

const isDigit = (char: string): boolean => {
  return /\d/.test(char);
};

const error = (text: string) => {
  console.error(text);
  Deno.exit(1);
};

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

    if (["+", "-", "*", "/", "(", ")"].includes(text[i])) {
      cur = newToken(cur, newTokenReserved(text[i++]));
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

type Node = {
  kind: ND_ADD | ND_SUB | ND_MUL | ND_DIV;
  lhs: Node;
  rhs: Node;
} | {
  kind: ND_NUM;
  val: number;
};

const newNode = (
  kind: ND_ADD | ND_SUB | ND_MUL | ND_DIV,
  lhs: Node,
  rhs: Node,
): Node => {
  return {
    kind,
    lhs,
    rhs,
  };
};

const newNodeNum = (val: number): Node => {
  return {
    kind: "ND_NUM",
    val,
  };
};

const expr = (): Node => {
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
  let node = primary();

  while (true) {
    if (consume("*")) {
      node = newNode("ND_MUL", node, primary());
    } else if (consume("/")) {
      node = newNode("ND_DIV", node, primary());
    } else {
      return node;
    }
  }
};

const primary = (): Node => {
  if (consume("(")) {
    const node = expr();
    expect(")");
    return node;
  }

  return newNodeNum(expectNumber());
};

const main = async () => {
  let program: string = "";
  program = ".intel_syntax noprefix\n";
  program += ".globl main\n";
  program += "\n";
  program += "main:\n";

  userInput = await Deno.readTextFile("program");

  // トークナイズする
  token = tokenize(userInput);

  const node = expr();
  console.log(node);

  // program += `  mov rax, ${expectNumber()}\n`;
  // while (!atEOF()) {
  //   if (consume("+")) {
  //     program += `  add rax, ${expectNumber()}\n`;
  //     continue;
  //   }

  //   expect("-");
  //   program += `  sub rax, ${expectNumber()}\n`;
  // }

  program += "  ret\n";

  await Deno.writeTextFile("./dist/out.s", program);
};

main();
