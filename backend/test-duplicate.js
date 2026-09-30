const { detectDuplicate } = require("./duplicateDetector");

async function main() {
  const newComplaint =
    "There is a huge pothole near Central Market causing problems for vehicles.";

  const existingComplaints = [
    {
      id: 1,
      text: "A large pothole has appeared near Central Market and is causing traffic problems.",
    },
    {
      id: 2,
      text: "There is no water supply in our neighborhood since yesterday.",
    },
    {
      id: 3,
      text: "Garbage has not been collected from our street for several days.",
    },
  ];

  console.log("New complaint:");
  console.log(newComplaint);

  console.log("\nChecking for similar complaints...\n");

  const results = await detectDuplicate(
    newComplaint,
    "Korba",
    existingComplaints
  );
  results.forEach((result, index) => {
    console.log(
      `${index + 1}. ID: ${result.id} | ` +
      `Score: ${result.similarity} | ` +
      `Duplicate: ${result.isDuplicate}`
    );
  });
}

main().catch(console.error);