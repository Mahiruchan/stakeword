import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { env } from "../env";

type CircleClient = ReturnType<typeof initiateDeveloperControlledWalletsClient>;

let cached: CircleClient | undefined;

export function circle(): CircleClient {
  if (cached) return cached;
  const { CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET } = env();
  cached = initiateDeveloperControlledWalletsClient({
    apiKey: CIRCLE_API_KEY,
    entitySecret: CIRCLE_ENTITY_SECRET,
  });
  return cached;
}
