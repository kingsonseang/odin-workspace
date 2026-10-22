import { loadConfig } from "./config.js";

const configPath = process.argv[2] ?? "config/service.config.json";

try {
  const config = loadConfig(configPath);

  // This downstream use deliberately assumes the configuration is valid.
  // A missing serviceName currently fails with a confusing TypeError here.
  console.log(`Loaded ${config.serviceName.toUpperCase()}.`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Port: ${config.port}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
