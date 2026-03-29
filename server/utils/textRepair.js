const SUSPICIOUS_MOJIBAKE_PATTERN = /(เธ|เน€|โ€|�|Ã|Â)/;

function scoreTextQuality(text) {
  const thaiCount = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  const replacementCount = (text.match(/�/g) || []).length;
  const suspiciousCount = (text.match(SUSPICIOUS_MOJIBAKE_PATTERN) || []).length;
  return thaiCount * 2 - replacementCount * 3 - suspiciousCount * 4;
}

function repairLikelyMojibake(value) {
  if (typeof value !== "string" || !value || !SUSPICIOUS_MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const repaired = Buffer.from(value, "latin1").toString("utf8");
    return scoreTextQuality(repaired) > scoreTextQuality(value) ? repaired : value;
  } catch {
    return value;
  }
}

function repairProductTextFields(row) {
  if (!row || typeof row !== "object") return row;

  return {
    ...row,
    tea_name: repairLikelyMojibake(row.tea_name),
    tea_type: repairLikelyMojibake(row.tea_type),
    description: repairLikelyMojibake(row.description),
  };
}

module.exports = {
  repairLikelyMojibake,
  repairProductTextFields,
};
