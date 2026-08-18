import { randomBytes, scryptSync } from "node:crypto";

function readHiddenPassword(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("이 명령은 대화형 터미널에서 실행해야 합니다.");
  }

  return new Promise((resolve, reject) => {
    let password = "";

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (character) => {
      if (character === "\u0003") {
        finish();
        reject(new Error("취소되었습니다."));
        return;
      }

      if (character === "\r" || character === "\n") {
        finish();
        resolve(password);
        return;
      }

      if (character === "\u007f" || character === "\b") {
        password = password.slice(0, -1);
        return;
      }

      password += character;
    };

    process.stdin.on("data", onData);
  });
}

try {
  const password = await readHiddenPassword("로그인 비밀번호: ");

  if (password.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  const confirmation = await readHiddenPassword("비밀번호 확인: ");

  if (password !== confirmation) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const authSecret = randomBytes(48).toString("base64url");

  console.log("\n아래 값을 .env.local에 추가하세요. 비밀번호 원문은 저장되지 않았습니다.\n");
  console.log(
    `STUDIO_LOGIN_PASSWORD_HASH=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`,
  );
  console.log(`STUDIO_AUTH_SECRET=${authSecret}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "설정하지 못했습니다.");
  process.exitCode = 1;
}
