import type { Location } from "@elevenlabs/react";
import type { PorcupineKeyword, PorcupineModel } from "@picovoice/porcupine-web";

type EnvSource = Record<string, string | undefined>;
type CustomKeyword = Extract<PorcupineKeyword, { label: string }>;

const DEFAULT_SERVER_LOCATION: Location = "us";
const DEFAULT_MODEL_PATH = "/picovoice/porcupine_params.pv";
const VALID_SERVER_LOCATIONS = new Set<Location>([
  "us",
  "global",
  "eu-residency",
  "in-residency",
]);

export type ScoutEnvConfig = {
  elevenLabs: {
    agentId: string;
    serverLocation: Location;
  };
  picovoice: {
    accessKey: string;
    keyword: CustomKeyword;
    model: PorcupineModel;
  };
};

function requireEnv(env: EnvSource, key: keyof ImportMetaEnv): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parseServerLocation(value?: string): Location {
  if (!value) {
    return DEFAULT_SERVER_LOCATION;
  }

  if (VALID_SERVER_LOCATIONS.has(value as Location)) {
    return value as Location;
  }

  throw new Error(
    `Invalid VITE_ELEVENLABS_SERVER_LOCATION "${value}". Expected one of: ${Array.from(
      VALID_SERVER_LOCATIONS,
    ).join(", ")}`,
  );
}

export function parseScoutEnv(env: EnvSource): ScoutEnvConfig {
  const agentId = requireEnv(env, "VITE_ELEVENLABS_AGENT_ID");
  const accessKey = requireEnv(env, "VITE_PICOVOICE_ACCESS_KEY");
  const keywordPath = requireEnv(env, "VITE_PICOVOICE_KEYWORD_PUBLIC_PATH");
  const serverLocation = parseServerLocation(env.VITE_ELEVENLABS_SERVER_LOCATION);

  return {
    elevenLabs: {
      agentId,
      serverLocation,
    },
    picovoice: {
      accessKey,
      keyword: {
        publicPath: keywordPath,
        label: "Hey Scout",
      },
      model: {
        publicPath: DEFAULT_MODEL_PATH,
      },
    },
  };
}
