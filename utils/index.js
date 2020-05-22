const transformRiskParameters = (price, riskParameters) => {
  if (!price || !riskParameters) {
    throw new Error("price and riskParameters are mandatory");
  }
  if (
    !riskParameters.riskPerTrade ||
    !riskParameters.profitPerTrade ||
    !riskParameters.trailForEach
  ) {
    throw new Error("riskperTrade, profitperTrade, trailForEach are mandatory");
  }
  const { riskPerTrade, profitPerTrade, trailForEach } = riskParameters;
  let r, p, t;
  if (riskParameters.unit === "percentage") {
    r = (Number(price) * riskPerTrade) / 100;
    p = (Number(price) * profitPerTrade) / 100;
    t = (Number(price) * trailForEach) / 100;
  } else {
    r = riskPerTrade;
    p = profitPerTrade;
    t = trailForEach;
  }
  return {
    riskperTrade: r,
    profitperTrade: p,
    trailForEach: t
  };
};

module.exports = { transformRiskParameters };
