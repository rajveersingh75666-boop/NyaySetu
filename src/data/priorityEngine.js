const priorityRules = {
    critical: {
      score: 4,
      label: "Critical"
    },
  
    high: {
      score: 3,
      label: "High"
    },
  
    medium: {
      score: 2,
      label: "Medium"
    },
  
    low: {
      score: 1,
      label: "Low"
    }
  };
  
  const keywordGroups = {
    critical: [
      "fire",
      "accident",
      "electrocution",
      "gas leak",
      "collapsed",
      "life threatening",
      "dangerous",
      "trapped"
    ],
  
    high: [
      "open manhole",
      "sewage overflow",
      "major water leakage",
      "exposed wire",
      "broken electric pole",
      "no water",
      "flooding",
      "road accident"
    ],
  
    medium: [
      "pothole",
      "garbage",
      "street light",
      "drain",
      "water leakage",
      "broken road",
      "illegal dumping"
    ],
  
    low: [
      "minor",
      "cosmetic",
      "suggestion",
      "information"
    ]
  };
  
  function containsKeyword(text, keywords) {
    return keywords.find((keyword) => text.includes(keyword));
  }
  
  export function calculatePriority(complaintText = "", options = {}) {
    const text = complaintText.toLowerCase();
  
    const affectedPeople = Number(options.affectedPeople || 0);
  
    const criticalKeyword = containsKeyword(
      text,
      keywordGroups.critical
    );
  
    if (criticalKeyword) {
      return {
        priority: priorityRules.critical.label,
        score: priorityRules.critical.score,
        reason: `Critical issue detected: "${criticalKeyword}"`
      };
    }
  
    const highKeyword = containsKeyword(
      text,
      keywordGroups.high
    );
  
    if (highKeyword || affectedPeople >= 20) {
      return {
        priority: priorityRules.high.label,
        score: priorityRules.high.score,
        reason: highKeyword
          ? `High-priority issue detected: "${highKeyword}"`
          : "Large number of affected citizens"
      };
    }
  
    const mediumKeyword = containsKeyword(
      text,
      keywordGroups.medium
    );
  
    if (mediumKeyword || affectedPeople >= 5) {
      return {
        priority: priorityRules.medium.label,
        score: priorityRules.medium.score,
        reason: mediumKeyword
          ? `Medium-priority civic issue detected: "${mediumKeyword}"`
          : "Multiple citizens affected"
      };
    }
  
    return {
      priority: priorityRules.low.label,
      score: priorityRules.low.score,
      reason: "No high-severity indicators detected"
    };
  }
  
  export default calculatePriority;