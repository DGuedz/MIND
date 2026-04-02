import { spawn } from "child_process";
const lt = spawn("npx", ["localtunnel", "--port", "3000", "--local-host", "127.0.0.1", "--local-https", "false", "--allow-invalid-cert"]);
lt.stdout.on("data", data => {
  const match = data.toString().match(/your url is: (https:\/\/[^\s]+)/);
  if (match) console.log(match[1]);
});
