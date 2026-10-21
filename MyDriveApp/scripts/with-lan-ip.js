const os = require("os");
const { spawn } = require("child_process");

function getLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== "IPv4" || net.internal) {
        continue;
      }
      if (net.address.startsWith("169.254.")) {
        continue;
      }
      candidates.push({ name, address: net.address });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const preferred = candidates.find(({ name }) =>
    /wi-?fi|wlan|ethernet/i.test(name)
  );
  const nonVirtual = candidates.find(({ name }) =>
    !/virtual|vmware|vbox|docker|wsl|hyper[- ]?v|vethernet/i.test(name)
  );

  const chosen = preferred || nonVirtual || candidates[0];
  return chosen.address;
}

const port = process.env.EXPO_PUBLIC_API_PORT || "3000";

if (!process.env.EXPO_PUBLIC_API_URL) {
  const ip = getLanIp();
  const host = ip ? ip : "localhost";
  process.env.EXPO_PUBLIC_API_URL = `http://${host}:${port}`;
}

const args = process.argv.slice(2);
const expoArgs = args.length > 0 ? args : ["start"];

console.log(`EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL}`);

const child = spawn("npx", ["expo", ...expoArgs], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
