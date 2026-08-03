export type AdminCompany = {
  id: string
  name?: string | null
  plan?: string | null
  created_at?: string | null
}

export type AdminUser = {
  id?: string
  company_id: string
  full_name?: string | null
  role?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

export type AdminSubscription = {
  company_id: string
  plan?: string | null
  status?: string | null
  current_period_end?: string | null
}

export type AdminTrip = {
  company_id: string
  revenue_fcfa?: number | string | null
}

export type AdminPaymentTransaction = {
  company_id: string
  provider?: string | null
  reference?: string | null
  amount?: number | string | null
  currency?: string | null
  status?: string | null
  plan?: string | null
  created_at?: string | null
}

export type AdminBillingEntry = {
  id: string
  companyId: string
  kind: 'payment' | 'subscription'
  reference?: string
  plan?: string
  status?: string
  amount?: number
  currency?: string
  createdAt: string
}

export type AdminCompanySummary = {
  id: string
  name: string
  plan: string
  createdAt: string
  userCount: number
  activeUsers: number
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionEndsAt: string
  revenue: number
}

export type AdminOverview = {
  totalCompanies: number
  totalUsers: number
  activeUsers: number
  activeSubscriptions: number
  totalRevenue: number
  companies: AdminCompanySummary[]
}

export function buildAdminBillingHistory(params: {
  subscriptions: AdminSubscription[]
  paymentTransactions: AdminPaymentTransaction[]
}): AdminBillingEntry[] {
  const subscriptions = (params.subscriptions ?? []).map((subscription) => ({
    id: `subscription-${subscription.company_id}`,
    companyId: subscription.company_id,
    kind: 'subscription' as const,
    plan: subscription.plan ?? undefined,
    status: subscription.status ?? undefined,
    createdAt: subscription.current_period_end || '',
  }))

  const payments = (params.paymentTransactions ?? []).map((transaction) => ({
    id: `payment-${transaction.reference || transaction.company_id}`,
    companyId: transaction.company_id,
    kind: 'payment' as const,
    reference: transaction.reference || undefined,
    plan: transaction.plan ?? undefined,
    status: transaction.status ?? undefined,
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || 'XOF',
    createdAt: transaction.created_at || '',
  }))

  return [...payments, ...subscriptions].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateA - dateB
  })
}

export function buildAdminOverview(params: {
  companies: AdminCompany[]
  users: AdminUser[]
  subscriptions: AdminSubscription[]
  trips: AdminTrip[]
}): AdminOverview {
  const companies = params.companies ?? []
  const users = params.users ?? []
  const subscriptions = params.subscriptions ?? []
  const trips = params.trips ?? []

  const companySummaries: AdminCompanySummary[] = companies.map((company) => {
    const companyUsers = users.filter((user) => user.company_id === company.id)
    const activeUsers = companyUsers.filter((user) => user.is_active !== false).length

    const subscription = subscriptions.find((item) => item.company_id === company.id)
    const subscriptionStatus = subscription?.status || 'none'
    const subscriptionPlan = subscription?.plan || company.plan || 'trial'
    const subscriptionEndsAt = subscription?.current_period_end || ''

    const companyRevenue = trips
      .filter((trip) => trip.company_id === company.id)
      .reduce((sum, trip) => sum + Number(trip.revenue_fcfa || 0), 0)

    return {
      id: company.id,
      name: company.name || 'Entreprise sans nom',
      plan: company.plan || 'trial',
      createdAt: company.created_at || '',
      userCount: companyUsers.length,
      activeUsers,
      subscriptionPlan,
      subscriptionStatus,
      subscriptionEndsAt,
      revenue: companyRevenue,
    }
  })

  const activeSubscriptions = companySummaries.filter((company) =>
    ['active', 'trialing'].includes(company.subscriptionStatus)
  ).length

  const totalRevenue = companySummaries.reduce((sum, company) => sum + company.revenue, 0)

  return {
    totalCompanies: companies.length,
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.is_active !== false).length,
    activeSubscriptions,
    totalRevenue,
    companies: companySummaries.sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0))),
  }
}
