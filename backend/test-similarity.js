const {
    createEmbedding,
    cosineSimilarity,
  } = require("./similarity");
  
  async function main() {
    const complaint1 =
      "There is a huge pothole on the road near my house.";
  
    const complaint2 =
      "The road is damaged and has many potholes.";
  
    const complaint3 =
      "There is no water supply in my area.";
  
    console.log("Creating embeddings...");
  
    const embedding1 = await createEmbedding(complaint1);
    const embedding2 = await createEmbedding(complaint2);
    const embedding3 = await createEmbedding(complaint3);
  
    const similarScore = cosineSimilarity(embedding1, embedding2);
    const differentScore = cosineSimilarity(embedding1, embedding3);
  
    console.log("\nComplaint 1:", complaint1);
    console.log("Complaint 2:", complaint2);
    console.log("Complaint 3:", complaint3);
  
    console.log(
      "\nSimilarity (road ↔ road):",
      similarScore.toFixed(4)
    );
  
    console.log(
      "Similarity (road ↔ water):",
      differentScore.toFixed(4)
    );
  }
  
  main().catch(console.error);