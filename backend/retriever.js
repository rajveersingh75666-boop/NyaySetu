const { createEmbedding, cosineSimilarity } = require("./similarity");

const grievanceData = [
  {
    category: "Roads & Infrastructure",
    department: "Municipal Corporation",
    examples: [
        "Potholes",
        "Damaged roads",
        "Broken footpaths",
        "Street lights",
        "Streetlight not working",
        "Broken streetlight",
        "Street light failure",
        "Roadside lights not working",
      ],
    description:
      "Report problems related to roads, footpaths, street lighting and other public infrastructure.",
    priority: "High",
  },
  {
    category: "Water Supply",
    department: "Water Supply Department",
    examples: [
      "Water leakage",
      "No water supply",
      "Contaminated water",
      "Broken pipelines",
    ],
    description:
      "Report issues involving water supply, pipelines, leakage or water quality.",
    priority: "High",
  },
  {
    category: "Sanitation & Waste",
    department: "Municipal Corporation",
    examples: [
      "Garbage collection",
      "Illegal dumping",
      "Blocked drains",
      "Unclean public areas",
    ],
    description:
      "Report garbage, sanitation, drainage and cleanliness-related civic issues.",
    priority: "Medium",
  },
  {
    category: "Electricity",
    department: "Electricity Department",
    examples: [
      "Power outage",
      "Damaged electric poles",
      "Exposed wires",
      "Transformer problems",
      "Electric pole damage",
      "Dangerous electrical wires",
      "Electricity pole issue",
    ],
    description:
      "Report electricity supply and public electrical infrastructure problems.",
    priority: "High",
  },
  {
    category: "Public Safety",
    department: "Local Police / Civic Authority",
    examples: [
      "Unsafe public spaces",
      "Traffic obstruction",
      "Illegal parking",
      "Public nuisance",
    ],
    description:
      "Report civic issues that may affect public safety or cause significant inconvenience.",
    priority: "High",
  },
  {
    category: "Other Civic Issues",
    department: "Relevant Civic Department",
    examples: [
        "Public property damage",
        "Encroachment",
        "Other local issues",
        "Illegal occupation of public land",
        "Public land encroachment",
        "Someone occupying public land",
        "Unauthorized occupation",
      ],
    description:
      "For civic grievances that do not fall into the other available categories.",
    priority: "Medium",
  },
];

let categoryEmbeddings = null;

async function loadCategoryEmbeddings() {
  if (categoryEmbeddings) {
    return categoryEmbeddings;
  }

  console.log("Creating category embeddings...");

  categoryEmbeddings = [];

  for (const grievance of grievanceData) {
    const searchableText = [
      grievance.category,
      grievance.description,
      ...grievance.examples,
    ].join(". ");

    const embedding = await createEmbedding(searchableText);

    categoryEmbeddings.push({
      grievance,
      embedding,
    });
  }

  console.log("Category embeddings ready.");

  return categoryEmbeddings;
}

async function findSimilarCategories(complaint, topK = 3, threshold = 0.35) {
  const complaintEmbedding = await createEmbedding(complaint);

  const categories = await loadCategoryEmbeddings();

  const results = categories.map(({ grievance, embedding }) => {
    const score = cosineSimilarity(
      complaintEmbedding,
      embedding
    );

    return {
      category: grievance.category,
      department: grievance.department,
      priority: grievance.priority,
      similarity: Number(score.toFixed(4)),
    };
  });

  const filteredResults = results
  .sort((a, b) => b.similarity - a.similarity)
  .filter((result) => result.similarity >= threshold)
  .slice(0, topK);

if (filteredResults.length === 0) {
  return [
    {
      category: "Other Civic Issues",
      department: "Relevant Civic Department",
      priority: "Medium",
      similarity: 0,
      message: "No strong semantic match found.",
    },
  ];
}

return filteredResults;
}

module.exports = {
  findSimilarCategories,
};