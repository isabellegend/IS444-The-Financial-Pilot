/**
 * goalService.js
 * Stub for Goal Optimisation service.
 * Will be wired to OutSystems Wealth + OpenAI atomic services.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function getGoalProgress(userId) {
  await delay(300)
  return {
    userId,
    goals: [
      {
        id: 'goal-1',
        name: 'House Downpayment',
        target: 50000,
        current: 17000,
        deadline: '2026-12-31',
        emoji: '🏠',
      },
      {
        id: 'goal-2',
        name: 'Emergency Fund',
        target: 15000,
        current: 12450,
        deadline: '2026-06-30',
        emoji: '🛡️',
      },
    ],
  }
}

const AI_RESPONSES = [
  {
    keywords: ['save', 'saving', 'house', 'downpayment', 'home'],
    reply:
      'To hit your House Downpayment goal by Dec 2026, I recommend increasing your Save allocation to 45%. At your current salary of S$8,500/month, this adds S$425 more per month to savings.',
  },
  {
    keywords: ['invest', 'investing', 'wealth', 'grow'],
    reply:
      'Your current Invest bucket (30%) is a healthy baseline. If your emergency fund is topped up, consider bumping Invest to 35% — compounding works best when started early.',
  },
  {
    keywords: ['spend', 'spending', 'budget', 'expense'],
    reply:
      'Your Spend allocation is currently 30% (S$2,550/month). Based on similar profiles, a 25% Spend allocation is sustainable while still maintaining lifestyle — that frees up 5% to reinvest.',
  },
  {
    keywords: ['optimise', 'optimize', 'best', 'recommend', 'suggest'],
    reply:
      'Based on your goals and timeline, here\'s my optimised split: Save 45% → Invest 30% → Spend 25%. This accelerates your downpayment by ~3 months without impacting your invest trajectory.',
  },
  {
    keywords: ['goal', 'target', 'deadline', 'when'],
    reply:
      'At your current Save rate of 40%, you\'ll reach your House Downpayment target around March 2027 — 3 months after your deadline. Bump Save to 45% to hit Dec 2026 comfortably.',
  },
]

export async function optimizeSplit(userId, userMessage) {
  await delay(900 + Math.random() * 400)
  const lower = userMessage.toLowerCase()
  const match = AI_RESPONSES.find((r) => r.keywords.some((k) => lower.includes(k)))
  return {
    reply:
      match?.reply ??
      'I can help you optimise your Save/Invest/Spend split. Tell me about a specific goal (e.g. "house", "retire early", "emergency fund") and I\'ll run the numbers.',
    suggestedSplit: match ? { save: 45, invest: 30, spend: 25 } : null,
  }
}
