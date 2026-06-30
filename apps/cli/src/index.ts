#!/usr/bin/env node
/**
 * MyCodexVantaOS Forge CLI
 *
 * Command-line interface for MyCodexVantaOS platform operations.
 * Machine identity: mycodexvantaos
 * Canonical URL: https://mycodexvantaos.com
 */

import { getCanonicalUrl, resolveEnvironment } from "@mycodexvantaos/core/config/domains";
import { loadEnvironmentConfig } from "@mycodexvantaos/core/config/environment";

const CLI_NAME = "mcxos";
const CLI_VERSION = "1.0.0";
const MACHINE_IDENTITY = "mycodexvantaos";

interface CliCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void>;
}

const commands: CliCommand[] = [
  {
    name: "version",
    description: "Show CLI version and platform identity",
    handler: async () => {
      console.log(`${CLI_NAME} v${CLI_VERSION}`);
      console.log(`Machine Identity: ${MACHINE_IDENTITY}`);
      console.log(`Brand Identity: MyCodexVantaOS`);
      console.log(`Canonical URL: ${getCanonicalUrl()}`);
    },
  },
  {
    name: "config",
    description: "Show current environment configuration",
    handler: async () => {
      const config = loadEnvironmentConfig();
      console.log("Environment Configuration:");
      console.log(`  Environment: ${config.appEnv}`);
      console.log(`  Canonical URL: ${config.publicCanonicalUrl}`);
      console.log(`  API URL: ${config.publicApiUrl}`);
      console.log(`  App URL: ${config.publicAppUrl}`);
    },
  },
  {
    name: "validate",
    description: "Validate platform configuration",
    handler: async (args: string[]) => {
      const target = args[0] ?? "all";
      console.log(`Validating: ${target}`);

      const env = resolveEnvironment();
      const canonicalUrl = getCanonicalUrl(env);

      if (!canonicalUrl.startsWith("https://") && env === "production") {
        console.error("ERROR: Canonical URL must use HTTPS in production");
        process.exit(1);
      }

      console.log(`✓ Canonical URL: ${canonicalUrl}`);
      console.log(`✓ Environment: ${env}`);
      console.log("Validation passed");
    },
  },
  {
    name: "help",
    description: "Show help information",
    handler: async () => {
      console.log(`${CLI_NAME} — MyCodexVantaOS Forge CLI v${CLI_VERSION}`);
      console.log("");
      console.log("Usage: mcxos <command> [options]");
      console.log("");
      console.log("Commands:");
      for (const cmd of commands) {
        console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
      }
    },
  },
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const commandName = args[0] ?? "help";
  const commandArgs = args.slice(1);

  const command = commands.find((c) => c.name === commandName);

  if (!command) {
    console.error(`Unknown command: ${commandName}`);
    console.error(`Run '${CLI_NAME} help' for available commands`);
    process.exit(1);
  }

  try {
    await command.handler(commandArgs);
  } catch (error) {
    console.error(`Error executing command '${commandName}':`, error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
