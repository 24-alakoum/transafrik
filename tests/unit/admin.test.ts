import { describe, it, expect } from 'vitest'
import { buildAdminBillingHistory } from '../../lib/admin'

describe('buildAdminBillingHistory', () => {
  it('merges subscriptions and payment transactions into a chronological history', () => {
    const history = buildAdminBillingHistory({
      subscriptions: [
        {
          company_id: 'c1',
          plan: 'growth',
          status: 'active',
          current_period_end: '2026-06-01T00:00:00.000Z',
        },
      ],
      paymentTransactions: [
        {
          company_id: 'c1',
          provider: 'cinetpay',
          reference: 'tx-123',
          amount: 150000,
          currency: 'XOF',
          status: 'succeeded',
          plan: 'growth',
          created_at: '2026-05-01T10:00:00.000Z',
        },
      ],
    })

    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({
      companyId: 'c1',
      kind: 'payment',
      reference: 'tx-123',
      plan: 'growth',
      status: 'succeeded',
    })
    expect(history[1]).toMatchObject({
      companyId: 'c1',
      kind: 'subscription',
      plan: 'growth',
      status: 'active',
    })
  })
})
