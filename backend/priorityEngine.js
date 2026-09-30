const PRIORITY_RULES = {
    Critical: {
      score: 4,
    },
    High: {
      score: 3,
    },
    Medium: {
      score: 2,
    },
    Low: {
      score: 1,
    },
  };
  
  const KEYWORD_GROUPS = {
    Critical: [
      "fire",
      "accident",
      "electrocution",
      "gas leak",
      "collapsed",
      "life threatening",
      "dangerous",
      "trapped",
    ],
  
    High: [
        "open manhole",
        "sewage overflow",
        "major water leakage",
        "exposed wire",
        "exposed electric wire",
        "live wire",
        "electric wire",
        "broken electric pole",
        "no water",
        "flooding",
        "road accident",
      ],
  
    Medium: [
      "pothole",
      "garbage",
      "street light",
      "drain",
      "water leakage",
      "broken road",
      "illegal dumping",
    ],
  
    Low: [
      "minor",
      "cosmetic",
      "suggestion",
      "information",
    ],
  };
  
  function findKeyword(text, keywords) {
    return keywords.find((keyword) => text.includes(keyword));
  }
  
  function calculatePriority(
    complaintText = "",
    affectedPeople = 0,
    aiSeverity = ""
  ) {
    const text = complaintText.toLowerCase();
    const people = Number(affectedPeople || 0);
  
    let ruleResult = {
      priority: "Low",
      score: PRIORITY_RULES.Low.score,
      reason: "No high-severity indicators detected",
    };
  
    const criticalKeyword = findKeyword(
      text,
      KEYWORD_GROUPS.Critical
    );
  
    if (criticalKeyword) {
      ruleResult = {
        priority: "Critical",
        score: PRIORITY_RULES.Critical.score,
        reason: `Critical issue detected: "${criticalKeyword}"`,
      };
    } else {
      const highKeyword = findKeyword(
        text,
        KEYWORD_GROUPS.High
      );
  
      if (highKeyword || people >= 20) {
        ruleResult = {
          priority: "High",
          score: PRIORITY_RULES.High.score,
          reason: highKeyword
            ? `High-priority issue detected: "${highKeyword}"`
            : "Large number of affected citizens",
        };
      } else {
        const mediumKeyword = findKeyword(
          text,
          KEYWORD_GROUPS.Medium
        );
  
        if (mediumKeyword || people >= 5) {
          ruleResult = {
            priority: "Medium",
            score: PRIORITY_RULES.Medium.score,
            reason: mediumKeyword
              ? `Medium-priority civic issue detected: "${mediumKeyword}"`
              : "Multiple citizens affected",
          };
        }
      }
    }
  
    const aiPriority = String(aiSeverity || "").trim();
  
    const aiScore =
      PRIORITY_RULES[aiPriority]?.score || 0;
  
    if (aiScore > ruleResult.score) {
      return {
        priority: aiPriority,
        score: aiScore,
        reason: `Priority raised to ${aiPriority} based on AI severity`,
      };
    }
  
    return ruleResult;
  }
  
  module.exports = {
    calculatePriority,
  };