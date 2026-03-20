import { describe, expect, it } from "vitest";
import { parseScoutEnv } from "./env";

describe("parseScoutEnv", () => {
  it("parses the required Scout env values and applies defaults", () => {
    const config = parseScoutEnv({
      VITE_ELEVENLABS_AGENT_ID: "agent_123",
      VITE_PICOVOICE_ACCESS_KEY: "pv_access_key",
      VITE_PICOVOICE_KEYWORD_PUBLIC_PATH: "/picovoice/hey-scout.ppn",
    });

    expect(config.elevenLabs.agentId).toBe("agent_123");
    expect(config.elevenLabs.serverLocation).toBe("us");
    expect(config.picovoice.accessKey).toBe("pv_access_key");
    expect(config.picovoice.keyword.publicPath).toBe("/picovoice/hey-scout.ppn");
    expect(config.picovoice.model.publicPath).toBe("/picovoice/porcupine_params.pv");
  });

  it("throws when a required env variable is missing", () => {
    expect(() =>
      parseScoutEnv({
        VITE_PICOVOICE_ACCESS_KEY: "pv_access_key",
        VITE_PICOVOICE_KEYWORD_PUBLIC_PATH: "/picovoice/hey-scout.ppn",
      }),
    ).toThrowError(/VITE_ELEVENLABS_AGENT_ID/);
  });
});
