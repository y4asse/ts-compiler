let program: string = "";

program = ".intel_syntax noprefix\n";
program += ".globl main\n";
program += "\n";
program += "main:\n";

const text = await Deno.readTextFile("program");

let i = 0;
program += `  mov rax, ${text[i]}\n`;
i++;
while (i !== text.length) {
  if (text[i] === "+") {
    i++;
    program += `  add rax, ${text[i++]}\n`;
    continue;
  }

  if (text[i] === "-") {
    i++;
    program += `  sub rax, ${text[i++]}\n`;
    continue;
  }

  console.log(
    `予期しない文字です: '${text[i]}' (文字コード: ${text.charCodeAt(i)})`,
  );
  i++;
  break;
}

program += "  ret\n";

await Deno.writeTextFile("./dist/out.s", program);
