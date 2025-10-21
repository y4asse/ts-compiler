type TokenKind = "RESERVED" | "NUM" | "EOF";

type Token = {
  kind: TokenKind;
  str: string;
  val: number;
  next: Token | null;
};

let token: Token | null = null;
let userInput: string = "";

const newToken = (
  kind: TokenKind,
  cur: Token,
  str: string,
): Token => {
  const token: Token = {
    kind,
    str,
    val: 0,
    next: null,
  };
  cur.next = token;
  return token;
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
    kind: "EOF",
    str: "",
    val: 0,
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

    if (text[i] === "+" || text[i] === "-") {
      cur = newToken("RESERVED", cur, text[i++]);
      continue;
    }

    if (isDigit(text[i])) {
      cur = newToken("NUM", cur, text[i]);
      const start = i;
      while (isDigit(text[i])) {
        i++;
      }
      const numStr = text.slice(start, i);
      cur.val = parseInt(numStr);
      continue;
    }
    errorAt(i, "トークナイズできません");
  }

  newToken("EOF", cur, "");

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

const main = async () => {
  let program: string = "";
  program = ".intel_syntax noprefix\n";
  program += ".globl main\n";
  program += "\n";
  program += "main:\n";

  userInput = await Deno.readTextFile("program");

  // トークナイズする
  token = tokenize(userInput);

  program += `  mov rax, ${expectNumber()}\n`;

  while (!atEOF()) {
    if (consume("+")) {
      program += `  add rax, ${expectNumber()}\n`;
      continue;
    }

    expect("-");
    program += `  sub rax, ${expectNumber()}\n`;
  }

  program += "  ret\n";

  await Deno.writeTextFile("./dist/out.s", program);
};

main();
