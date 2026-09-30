const { findSimilarCategories } = require("./retriever");

async function main() {
  const complaint =
    "Someone has occupied public land illegally.";

  console.log("Complaint:");
  console.log(complaint);

  console.log("\nFinding similar categories...\n");

  const results = await findSimilarCategories(complaint);

  results.forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.category} | ` +
      `Score: ${result.similarity} | ` +
      `Department: ${result.department} | ` +
      `Priority: ${result.priority}`
    );
  });
}

main().catch(console.error);