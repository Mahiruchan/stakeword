/**
 * Read an existing ERC-8183 job by ID and print all fields.
 * Read-only — requires no API key.
 *
 * Run: npm run read-job -- <jobId>
 * e.g. npm run read-job -- 1
 */
import { formatUnits } from "viem";
import { AGENTIC_COMMERCE_CONTRACT, STATUS_NAMES } from "./constants.js";
import { agenticCommerceAbi } from "./abi.js";
import { publicClient } from "./public-client.js";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run read-job -- <jobId>");
    process.exit(1);
  }
  const jobId = BigInt(arg);

  console.log(`Reading job ${jobId} from ${AGENTIC_COMMERCE_CONTRACT}…`);

  try {
    const job = await publicClient.readContract({
      address: AGENTIC_COMMERCE_CONTRACT,
      abi: agenticCommerceAbi,
      functionName: "getJob",
      args: [jobId],
    });

    console.log("\nJob:");
    console.log(`  id:          ${job.id}`);
    console.log(`  client:      ${job.client}`);
    console.log(`  provider:    ${job.provider}`);
    console.log(`  evaluator:   ${job.evaluator}`);
    console.log(`  description: ${job.description}`);
    console.log(`  budget:      ${formatUnits(job.budget, 6)} USDC`);
    console.log(`  expiredAt:   ${job.expiredAt} (${new Date(Number(job.expiredAt) * 1000).toISOString()})`);
    console.log(`  status:      ${STATUS_NAMES[Number(job.status)]} (${job.status})`);
    console.log(`  hook:        ${job.hook}`);
  } catch (err) {
    console.error(`getJob(${jobId}) failed: ${(err as Error).message.slice(0, 200)}`);
    console.log("\nNote: most likely jobId does not exist yet. Try lower IDs or create one first.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
