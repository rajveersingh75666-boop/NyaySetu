const express = require("express");
const cors = require("cors");

const { analyzeWithAI } = require("./ai/coordinator");
const { detectDuplicate } = require("./duplicateDetector");

const {
  translateToEnglish,
  translateAnalysisToHindi,
} = require("./translation");

const app = express();

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8004";

app.use(cors());
app.use(express.json());

/*
==========================================================
DEPARTMENT MAPPING
==========================================================
*/

function mapDepartment(departments, aiDepartment) {
  if (
    !aiDepartment ||
    !Array.isArray(departments) ||
    departments.length === 0
  ) {
    return null;
  }

  const target = String(aiDepartment)
    .toLowerCase()
    .trim();

  // Exact match
  const exactMatch = departments.find(
    (item) =>
      String(item.name || "")
        .toLowerCase()
        .trim() === target
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Includes match
  const includesMatch = departments.find((item) => {
    const name = String(item.name || "")
      .toLowerCase()
      .trim();

    return (
      name.includes(target) ||
      target.includes(name)
    );
  });

  if (includesMatch) {
    return includesMatch;
  }

  // Significant word match
  const significantWords = target
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        word !== "department"
    );

  return (
    departments.find((item) => {
      const name = String(item.name || "")
        .toLowerCase();

      return significantWords.some((word) =>
        name.includes(word)
      );
    }) || null
  );
}

/*
==========================================================
ERROR HELPER
==========================================================
*/

async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();

    return (
      data.detail ||
      data.error ||
      fallback
    );
  } catch {
    return fallback;
  }
}

/*
==========================================================
ROOT API
==========================================================
*/

app.get("/", (req, res) => {
  res.json({
    message: "NyaySetu backend is running",
  });
});

/*
==========================================================
AI ANALYSIS API
==========================================================
*/

app.post("/api/complaints/analyze", async (req, res) => {
  const {
    text,
    language = "en",
  } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      error: "Complaint text is required",
    });
  }

  try {
    /*
     * English complaints remain unchanged.
     *
     * Hindi complaints are translated into English
     * only for internal AI processing.
     */

    const englishText = await translateToEnglish(
      text,
      language
    );

    console.log("=================================");
    console.log("Original complaint:");
    console.log(text);

    console.log("English complaint for AI:");
    console.log(englishText);
    console.log("=================================");

    /*
     * Existing NyaySetu AI pipeline.
     */

    const result = await analyzeWithAI(
      englishText
    );

    /*
     * Translate the AI result back to Hindi
     * when the citizen submitted the complaint
     * in Hindi.
     *
     * IMPORTANT:
     * Pass the original Hindi complaint too.
     */

    const finalResult =
      language === "hi"
        ? await translateAnalysisToHindi(
            result,
            text
          )
        : result;

    res.json(finalResult);
  } catch (error) {
    console.error(
      "AI analysis error:",
      error
    );

    res.status(500).json({
      error:
        error.message ||
        "AI analysis failed",
    });
  }
});

/*
==========================================================
COMPLAINT SUBMISSION API
==========================================================
*/

app.post(
  "/api/complaints/submit",
  async (req, res) => {
    const {
      citizen_name,
      citizen_mobile,
      description,
      location,
      language = "en",
    } = req.body;

    if (
      !description ||
      !description.trim()
    ) {
      return res.status(400).json({
        error:
          "Complaint description is required",
      });
    }

    try {
      /*
       * IMPORTANT:
       *
       * description is the ORIGINAL citizen complaint.
       * We never overwrite it.
       *
       * englishDescription is only used internally
       * by the AI pipeline.
       */

      const englishDescription =
        await translateToEnglish(
          description,
          language
        );

      console.log("=================================");
      console.log("Original complaint:");
      console.log(description);

      console.log("English complaint for AI:");
      console.log(englishDescription);
      console.log("=================================");

      /*
       * Existing NyaySetu AI pipeline.
       */

      const analysis =
        await analyzeWithAI(
          englishDescription
        );
        // Check for duplicate complaints
const complaintsResponse = await fetch(
  `${FASTAPI_BASE_URL}/api/complaints`
);

if (!complaintsResponse.ok) {
  throw new Error("Could not fetch existing complaints");
}

const existingComplaints =
  await complaintsResponse.json();

  const duplicateResults = await detectDuplicate(
    englishDescription,
    location,
    existingComplaints.map((complaint) => ({
      id: complaint.id,
      text: complaint.description,
      location: complaint.location,
    }))
  );

const duplicateComplaint =
  duplicateResults.find(
    (result) => result.isDuplicate
  );
  if (duplicateComplaint) {
    return res.json({
      isDuplicate: true,
      duplicateComplaintId: duplicateComplaint.id,
      message: `A similar complaint already exists with ID ${duplicateComplaint.id}.`,
      similarity: duplicateComplaint.similarity,
    });
  }
  console.log("Duplicate check results:", duplicateResults);
console.log("Detected duplicate:", duplicateComplaint);

      /*
       * Fetch departments from FastAPI.
       */

      const departmentsResponse =
        await fetch(
          `${FASTAPI_BASE_URL}/api/departments`
        );

      if (!departmentsResponse.ok) {
        throw new Error(
          "Could not fetch departments"
        );
      }

      const departments =
        await departmentsResponse.json();

      const department =
        mapDepartment(
          departments,
          analysis.department
        );

      /*
       * Save the ORIGINAL complaint.
       *
       * A Hindi complaint remains Hindi
       * in the database.
       */

      const complaintResponse =
        await fetch(
          `${FASTAPI_BASE_URL}/api/complaints`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              citizen_name:
                citizen_name || null,

              citizen_mobile:
                citizen_mobile || null,

              description,

              location:
                location || null,

              category:
                analysis.category,
            }),
          }
        );

      if (!complaintResponse.ok) {
        const message =
          await readErrorMessage(
            complaintResponse,
            "Could not save complaint"
          );

        throw new Error(message);
      }

      const complaint =
        await complaintResponse.json();

      /*
       * Save AI analysis.
       */

      const updateResponse =
        await fetch(
          `${FASTAPI_BASE_URL}/api/complaints/${complaint.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              department_id:
                department
                  ? department.id
                  : null,

              priority:
                analysis.priority,

              status:
                analysis.status ||
                "Pending",

              ai_summary:
                analysis.summary,

              ai_analysis:
                analysis.reason,
            }),
          }
        );

      if (!updateResponse.ok) {
        const message =
          await readErrorMessage(
            updateResponse,
            "Could not update AI analysis"
          );

        throw new Error(message);
      }

      const savedComplaint =
        await updateResponse.json();

      /*
       * Translate ONLY the citizen-facing response.
       *
       * Database remains unchanged.
       *
       * IMPORTANT:
       * Pass the original Hindi complaint
       * to the translation function.
       */

      const citizenAnalysis =
        language === "hi"
          ? await translateAnalysisToHindi(
              analysis,
              description
            )
          : analysis;

          res.json({
            complaintId:
              savedComplaint.id,
          
            ...citizenAnalysis,
          
            departmentId:
              department
                ? department.id
                : null,
          
            duplicateDetected: !!duplicateComplaint,
          
            duplicateComplaint: duplicateComplaint
              ? {
                  id: duplicateComplaint.id,
                  similarity: duplicateComplaint.similarity,
                  text: duplicateComplaint.text,
                }
              : null,
          });
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "Complaint submission failed",
      });
    }
  }
);

/*
==========================================================
ADMIN APIs
==========================================================
*/

/*
 * Get all complaints for admin panel
 */

app.get(
  "/api/admin/complaints",
  async (req, res) => {
    try {
      const response =
        await fetch(
          `${FASTAPI_BASE_URL}/api/complaints`
        );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            "Could not fetch complaints"
          );

        return res
          .status(response.status)
          .json({
            error: message,
          });
      }

      const complaints =
        await response.json();

      res.json(complaints);
    } catch (error) {
      console.error(
        "Admin complaints fetch error:",
        error
      );

      res.status(500).json({
        error:
          "Could not fetch complaints",
      });
    }
  }
);

/*
 * Get one complaint for admin panel
 */

app.get(
  "/api/admin/complaints/:id",
  async (req, res) => {
    try {
      const response =
        await fetch(
          `${FASTAPI_BASE_URL}/api/complaints/${req.params.id}`
        );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            "Complaint not found"
          );

        return res
          .status(response.status)
          .json({
            error: message,
          });
      }

      const complaint =
        await response.json();

      res.json(complaint);
    } catch (error) {
      console.error(
        "Admin complaint fetch error:",
        error
      );

      res.status(500).json({
        error:
          "Could not fetch complaint",
      });
    }
  }
);

/*
 * Update complaint status/priority/details
 */

app.patch(
  "/api/admin/complaints/:id",
  async (req, res) => {
    try {
      const response =
        await fetch(
          `${FASTAPI_BASE_URL}/api/complaints/${req.params.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              req.body
            ),
          }
        );

      if (!response.ok) {
        const message =
          await readErrorMessage(
            response,
            "Could not update complaint"
          );

        return res
          .status(response.status)
          .json({
            error: message,
          });
      }

      const updatedComplaint =
        await response.json();

      res.json(updatedComplaint);
    } catch (error) {
      console.error(
        "Admin complaint update error:",
        error
      );

      res.status(500).json({
        error:
          "Could not update complaint",
      });
    }
  }
);

/*
==========================================================
START SERVER
==========================================================
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `NyaySetu backend running on http://localhost:${PORT}`
  );
});