const transformRiskParameters = (price, riskParameters) => {
  if (!price || !riskParameters) {
    throw new Error("price and riskParameters are mandatory");
  }
  if (
    !riskParameters.riskPerTrade ||
    !riskParameters.profitPerTrade ||
    !riskParameters.trailForEach ||
    !riskParameters.portfolio
  ) {
    throw new Error(
      "riskperTrade, profitperTrade, trailForEach, portfolio are mandatory"
    );
  }
  const {
    riskPerTrade,
    profitPerTrade,
    trailForEach,
    portfolio
  } = riskParameters;
  let r, p, t, q;
  if (riskParameters.unit === "percentage") {
    r = (Number(portfolio) * riskPerTrade) / 100;
    p = (Number(portfolio) * profitPerTrade) / 100;
    t = (Number(portfolio) * trailForEach) / 100;
    q = r / price;
  } else {
    r = riskPerTrade;
    p = profitPerTrade;
    t = trailForEach;
    q = riskPerTrade / price;
  }
  return {
    riskPerTrade: r,
    profitPerTrade: p,
    trailForEach: t,
    quantity: q
  };
};

module.exports = { transformRiskParameters };
