import { TokenIdent } from "./main.ts";

type Lvar = {
  next: Lvar | null;
  name: string;
  len: number;
  offset: number;
};

const findLvar = (locals: Lvar | null, tok: TokenIdent) => {
  if (!locals) {
    return null;
  }

  let lvar = locals;
  while (true) {
    if (lvar.name === tok.str) {
      return lvar;
    }

    if (!lvar.next) {
      break;
    }
    lvar = lvar.next;
  }
  return null;
};

export { findLvar };
export type { Lvar };
