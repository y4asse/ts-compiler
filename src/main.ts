type TokenKind = "RESERVED" | "NUM" | "EOF";

type Token = {
  kind: TokenKind;
  str: string;
  val: number;
  next: Token | null;
};

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
    error("トークナイズできません");
  }

  newToken("EOF", cur, "");

  return head.next;
};

const main = async () => {
  let program: string = "";
  program = ".intel_syntax noprefix\n";
  program += ".globl main\n";
  program += "\n";
  program += "main:\n";

  const text = await Deno.readTextFile("program");

  // トークナイズする
  const token = tokenize(text);
  console.dir(token, { depth: null });

  await Deno.writeTextFile("./dist/out.s", program);
};

main();
