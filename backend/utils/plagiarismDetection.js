/**
 * Plagiarism Detection Using TF-IDF and String Similarity
 * Analyzes submissions for potential plagiarism
 */

const levenshteinDistance = require('js-levenshtein');

/**
 * Calculate similarity between two texts using TF-IDF
 */
const calculateTextSimilarity = (text1, text2) => {
  const words1 = tokenizeText(text1);
  const words2 = tokenizeText(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Calculate TF-IDF vectors
  const tfidf1 = calculateTFIDF(words1, [words1, words2]);
  const tfidf2 = calculateTFIDF(words2, [words1, words2]);

  // Calculate cosine similarity
  return calculateCosineSimilarity(tfidf1, tfidf2);
};

/**
 * Detect plagiarism in a submission by comparing with other submissions
 */
const detectPlagiarism = async (currentSubmission, otherSubmissions = []) => {
  try {
    const plagiarismResults = [];
    const currentText = extractText(currentSubmission);

    for (const other of otherSubmissions) {
      const otherText = extractText(other);
      const similarity = calculateTextSimilarity(currentText, otherText);

      if (similarity > 0.7) {
        plagiarismResults.push({
          submissionId: other._id,
          studentName: other.studentName,
          similarity: parseFloat((similarity * 100).toFixed(2)),
          matchedPhrases: findMatchedPhrases(currentText, otherText),
          suspiciousLevel: getSuspiciousLevel(similarity)
        });
      }
    }

    // Sort by similarity
    plagiarismResults.sort((a, b) => b.similarity - a.similarity);

    const maxSimilarity = plagiarismResults.length > 0
      ? plagiarismResults[0].similarity
      : 0;

    return {
      overallSimilarity: maxSimilarity,
      suspiciousLevel: getSuspiciousLevel(maxSimilarity / 100),
      matches: plagiarismResults.slice(0, 5), // Top 5 matches
      isPlagiarized: maxSimilarity > 75,
      confidence: calculateConfidence(plagiarismResults.length),
      details: {
        totalComparisons: otherSubmissions.length,
        suspiciousMatches: plagiarismResults.filter(r => r.similarity > 75).length,
        recommendedAction: getRecommendedAction(maxSimilarity)
      }
    };
  } catch (err) {
    console.error("Plagiarism detection error:", err);
    return { error: "Unable to analyze plagiarism" };
  }
};

/**
 * Analyze code similarity (for programming submissions)
 */
const analyzeCodeSimilarity = (code1, code2) => {
  try {
    // Normalize code (remove comments, whitespace)
    const normalized1 = normalizeCode(code1);
    const normalized2 = normalizeCode(code2);

    // Calculate similarity using multiple methods
    const structuralSimilarity = calculateStructuralSimilarity(normalized1, normalized2);
    const tokenizerSimilarity = calculateTokenSimilarity(normalized1, normalized2);
    const editDistance = levenshteinDistance(normalized1, normalized2);
    
    const maxEditDistance = Math.max(normalized1.length, normalized2.length);
    const editDistanceSimilarity = 1 - (editDistance / maxEditDistance);

    // Weighted average
    const finalSimilarity = (
      structuralSimilarity * 0.4 +
      tokenizerSimilarity * 0.35 +
      editDistanceSimilarity * 0.25
    );

    return {
      overallSimilarity: parseFloat((finalSimilarity * 100).toFixed(2)),
      structuralMatch: parseFloat((structuralSimilarity * 100).toFixed(2)),
      logicalMatch: parseFloat((tokenizerSimilarity * 100).toFixed(2)),
      syntaxMatch: parseFloat((editDistanceSimilarity * 100).toFixed(2)),
      suspiciousPatterns: findSuspiciousPatterns(code1, code2)
    };
  } catch (err) {
    console.error("Code similarity analysis error:", err);
    return null;
  }
};

/**
 * Check for suspicious patterns in submission metadata
 */
const checkMetadataSuspicion = (submissions) => {
  const suspiciousPatterns = [];

  // Pattern 1: Same submission time (within 1 minute)
  const timeGroups = {};
  submissions.forEach(sub => {
    const time = new Date(sub.submittedAt).getTime();
    const timeKey = Math.floor(time / 60000); // Group by minute

    if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
    timeGroups[timeKey].push(sub);
  });

  Object.entries(timeGroups).forEach(([_, group]) => {
    if (group.length > 1) {
      suspiciousPatterns.push({
        type: "Simultaneous Submissions",
        count: group.length,
        students: group.map(s => s.studentName),
        severity: "medium"
      });
    }
  });

  // Pattern 2: Same file size (within 5% margin)
  const sizeGroups = {};
  submissions.forEach(sub => {
    const size = sub.fileSize;
    const sizeKey = Math.round(size / 100); // Group by ~100 bytes

    if (!sizeGroups[sizeKey]) sizeGroups[sizeKey] = [];
    sizeGroups[sizeKey].push(sub);
  });

  Object.entries(sizeGroups).forEach(([_, group]) => {
    if (group.length > 2) {
      suspiciousPatterns.push({
        type: "Identical File Sizes",
        count: group.length,
        students: group.map(s => s.studentName),
        severity: "low"
      });
    }
  });

  return suspiciousPatterns;
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

const tokenizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
};

const calculateTFIDF = (words, allDocuments) => {
  const tfidf = {};
  const documentCount = allDocuments.length;

  words.forEach(word => {
    // Term Frequency
    const tf = words.filter(w => w === word).length / words.length;

    // Inverse Document Frequency
    const docsWithWord = allDocuments.filter(doc =>
      doc.some(w => w === word)
    ).length;
    const idf = Math.log(documentCount / (1 + docsWithWord));

    tfidf[word] = tf * idf;
  });

  return tfidf;
};

const calculateCosineSimilarity = (vec1, vec2) => {
  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allKeys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;

    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
};

const extractText = (submission) => {
  if (typeof submission === 'string') return submission;
  if (submission.content) return submission.content;
  if (submission.text) return submission.text;
  return submission.toString();
};

const findMatchedPhrases = (text1, text2) => {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const phrases = [];
  const phraseLength = 5; // 5-word phrases

  for (let i = 0; i < words1.length - phraseLength; i++) {
    const phrase = words1.slice(i, i + phraseLength).join(' ');
    if (text2.includes(phrase)) {
      phrases.push(phrase);
    }
  }

  return phrases.slice(0, 10); // Top 10 matched phrases
};

const getSuspiciousLevel = (similarity) => {
  if (similarity > 0.8) return "very_high";
  if (similarity > 0.65) return "high";
  if (similarity > 0.45) return "moderate";
  return "low";
};

const calculateConfidence = (matchCount) => {
  return Math.min(95, 50 + matchCount * 5);
};

const getRecommendedAction = (similarity) => {
  if (similarity > 85) return "Immediate Review by Instructor";
  if (similarity > 70) return "Manual Review Recommended";
  if (similarity > 50) return "Monitor for Patterns";
  return "No Action Required";
};

const normalizeCode = (code) => {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\/\/.*/g, '') // Remove single-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

const calculateStructuralSimilarity = (code1, code2) => {
  const struct1 = extractCodeStructure(code1);
  const struct2 = extractCodeStructure(code2);

  let matches = 0;
  for (let i = 0; i < Math.min(struct1.length, struct2.length); i++) {
    if (struct1[i] === struct2[i]) matches++;
  }

  return matches / Math.max(struct1.length, struct2.length);
};

const calculateTokenSimilarity = (code1, code2) => {
  const tokens1 = tokenizeCode(code1);
  const tokens2 = tokenizeCode(code2);

  const commonTokens = tokens1.filter(t => tokens2.includes(t)).length;
  return commonTokens / Math.max(tokens1.length, tokens2.length);
};

const extractCodeStructure = (code) => {
  // Extract function/class definitions, control structures
  const structure = [];
  const functionRegex = /function\s+(\w+)|class\s+(\w+)|if\s*\(|for\s*\(|while\s*\(/g;

  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    structure.push(match[0]);
  }

  return structure;
};

const tokenizeCode = (code) => {
  return code
    .split(/[\s(){};,.]/)
    .filter(token => token.length > 0);
};

const findSuspiciousPatterns = (code1, code2) => {
  const patterns = [];

  // Pattern 1: Variable names are identical
  const varRegex = /(?:let|const|var)\s+(\w+)/g;
  const vars1 = new Set();
  const vars2 = new Set();

  let match1;
  while ((match1 = varRegex.exec(code1)) !== null) {
    vars1.add(match1[1]);
  }

  let match2;
  while ((match2 = varRegex.exec(code2)) !== null) {
    vars2.add(match2[1]);
  }

  const identicalVars = [...vars1].filter(v => vars2.has(v));
  if (identicalVars.length > 5) {
    patterns.push({
      pattern: "Identical Variable Names",
      count: identicalVars.length,
      severity: "medium"
    });
  }

  // Pattern 2: Similar function structure
  const funcRegex = /function\s+\w+\s*\([^)]*\)\s*{/g;
  if (funcRegex.test(code1) && funcRegex.test(code2)) {
    patterns.push({
      pattern: "Similar Function Structures",
      severity: "low"
    });
  }

  return patterns;
};

module.exports = {
  calculateTextSimilarity,
  detectPlagiarism,
  analyzeCodeSimilarity,
  checkMetadataSuspicion
};
