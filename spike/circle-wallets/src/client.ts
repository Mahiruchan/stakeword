import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

if (!apiKey || !entitySecret) {
  console.error(
    "Missing CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET. See .env.example and",
    "https://developers.circle.com/wallets/dev-controlled/register-entity-secret",
  );
  process.exit(1);
}

export const circle = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});
