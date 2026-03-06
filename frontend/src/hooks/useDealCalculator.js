import { useMemo } from 'react';

export const useDealCalculator = ({ arv, repairCost, assignmentFee, arvRulePercent, negotiationDiscount }) => {
  return useMemo(() => {
    const arvNum = parseFloat(arv) || 0;
    const rcNum = parseFloat(repairCost) || 0;
    const afNum = parseFloat(assignmentFee) || 0;
    const arvPct = parseFloat(arvRulePercent) || 70;
    const negDisc = parseFloat(negotiationDiscount) || 10;

    const rule70 = arvNum * (arvPct / 100);
    const mao = rule70 - rcNum - afNum;
    const buyerPrice = mao + afNum;
    const firstOffer = mao - (mao * (negDisc / 100));
    const investorProfit = arvNum - mao - rcNum;

    const investorProfitPct = arvNum > 0 ? (investorProfit / arvNum) * 100 : 0;
    const repairCostPct = arvNum > 0 ? (rcNum / arvNum) * 100 : 0;

    let dealScore = { label: null, color: 'gray' };

    if (arvNum > 0) {
      if (mao <= 0) {
        dealScore = { label: 'Bad Deal', color: 'red' };
      } else if (investorProfitPct >= 25 && repairCostPct <= 25) {
        dealScore = { label: 'Excellent Deal', color: 'green' };
      } else if (investorProfitPct >= 15 && repairCostPct <= 40) {
        dealScore = { label: 'Average Deal', color: 'yellow' };
      } else {
        dealScore = { label: 'Bad Deal', color: 'red' };
      }
    }

    return { rule70, mao, buyerPrice, firstOffer, investorProfit, dealScore, investorProfitPct, repairCostPct };
  }, [arv, repairCost, assignmentFee, arvRulePercent, negotiationDiscount]);
};
