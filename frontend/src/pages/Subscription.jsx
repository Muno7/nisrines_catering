import { useEffect, useState } from 'react'
import { useSEO } from '../hooks/useSEO.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const LOADING = 'loading'
const EMPTY = 'empty'
const ERROR = 'error'

const formatNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function PlanTable({ title, plans, status }) {
  return (
    <div className="space-y-3">
      <div className="px-6">
        <h3 className="text-lg font-semibold text-accent">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-background text-accent">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold uppercase border border-muted/30">Days / Month</th>
              <th className="px-4 py-3 text-sm font-semibold uppercase border border-muted/30">Plat du jour ($)</th>
              <th className="px-4 py-3 text-sm font-semibold uppercase border border-muted/30">With salad ($)</th>
            </tr>
          </thead>
          <tbody className="text-accent">
            {status === LOADING && (
              <tr className="bg-surface">
                <td className="px-4 py-3 border border-muted/30 text-muted" colSpan={3}>Loading plans...</td>
              </tr>
            )}
            {status === ERROR && (
              <tr className="bg-surface">
                <td className="px-4 py-3 border border-muted/30 text-muted" colSpan={3}>Pricing is temporarily unavailable. Please contact us to order.</td>
              </tr>
            )}
            {status === EMPTY && (
              <tr className="bg-surface">
                <td className="px-4 py-3 border border-muted/30 text-muted" colSpan={3}>No plans yet.</td>
              </tr>
            )}
            {status === null && plans.map((plan, index) => {
              const rowClass = index % 2 === 0 ? 'bg-surface' : 'bg-background/60'
              const days = formatNumber(plan?.daysPerMonth)
              const platDuJour = formatNumber(plan?.platDuJour)
              const withSalad = formatNumber(plan?.withSalad)
              return (
                <tr key={index} className={rowClass}>
                  <td className="px-4 py-3 border border-muted/30">{days !== null ? `${days} days` : '—'}</td>
                  <td className="px-4 py-3 border border-muted/30">{platDuJour ?? '—'}</td>
                  <td className="px-4 py-3 border border-muted/30">{withSalad ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Subscription() {
  useSEO({
    title: "Meal Subscriptions | Nisrine's Catering",
    description: "Subscribe to weekly or monthly homemade Lebanese meal plans. Flexible plans for individuals and families. Delivered to your door in Beirut.",
    path: '/subscription',
  })

  const [personPlans, setPersonPlans] = useState([])
  const [familyPlans, setFamilyPlans] = useState([])
  const [status, setStatus] = useState(LOADING)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const { data } = await response.json()
        const plans = Array.isArray(data) ? data : []
        const byDays = (a, b) => (formatNumber(a?.daysPerMonth) ?? Infinity) - (formatNumber(b?.daysPerMonth) ?? Infinity)
        setPersonPlans(plans.filter(p => p?.audience?.toLowerCase() === 'person').sort(byDays))
        setFamilyPlans(plans.filter(p => p?.audience?.toLowerCase() === 'family').sort(byDays))
        setStatus(null)
      } catch {
        setStatus(ERROR)
      }
    }
    load()
  }, [])

  const personStatus = status === LOADING ? LOADING : status === ERROR ? ERROR : personPlans.length === 0 ? EMPTY : null
  const familyStatus = status === LOADING ? LOADING : status === ERROR ? ERROR : familyPlans.length === 0 ? EMPTY : null

  return (
    <main className="site-main">
      <section className="container mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Monthly packages</p>
          <h1 className="text-3xl font-bold text-accent">Subscriptions</h1>
          <p className="text-sm text-muted">Choose the plan that fits your family and schedule.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl shadow-md border border-muted/30 overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-5 border-b border-muted/20">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 4 14 14" className="w-6 h-6 fill-current">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.5 5C10.5 4.72386 10.2761 4.5 10 4.5C9.72386 4.5 9.5 4.72386 9.5 5V5.5H7C6.17157 5.5 5.5 6.17157 5.5 7V16C5.5 16.8284 6.17157 17.5 7 17.5H17C17.8284 17.5 18.5 16.8284 18.5 16V7C18.5 6.17157 17.8284 5.5 17 5.5H14.5V5C14.5 4.72386 14.2761 4.5 14 4.5C13.7239 4.5 13.5 4.72386 13.5 5V5.5H10.5V5ZM9.5 6.5C9.5 6.77614 9.72386 7 10 7C10.2761 7 10.5 6.77614 10.5 6.5H13.5C13.5 6.77614 13.7239 7 14 7C14.2761 7 14.5 6.77614 14.5 6.5H17C17.2761 6.5 17.5 6.72386 17.5 7V8.5H6.5V7C6.5 6.72386 6.72386 6.5 7 6.5H9.5ZM6.5 9.5V16C6.5 16.2761 6.72386 16.5 7 16.5H17C17.2761 16.5 17.5 16.2761 17.5 16V9.5H6.5Z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-accent">Plans &amp; pricing</h2>
                  <p className="text-sm text-muted">Browse the packages and choose the one you prefer.</p>
                </div>
              </div>

              <div className="space-y-8 py-6">
                <PlanTable title="1 Person" plans={personPlans} status={personStatus} />
                <PlanTable title="Family of 4" plans={familyPlans} status={familyStatus} />
              </div>

              <div className="px-4 py-2 gap-2">
                <p className="text-sm font-semibold text-secondary uppercase">+ Delivery charge</p>
                <p className="text-muted">You can switch any dish with our daily specials.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-md border border-muted/30 p-6 space-y-5">
              <h2 className="text-2xl font-bold text-accent">Order now</h2>
              <p className="text-muted">Reach out to confirm your start date and preferred dishes.</p>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-muted">Phone</span>
                  <a href="tel:+96171226934" className="text-lg font-semibold text-accent hover:text-primary">71 226 934</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-secondary text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-muted">Email</span>
                  <a href="mailto:nisrinescatering@gmail.com" className="text-lg font-semibold text-accent hover:text-secondary">nisrinescatering@gmail.com</a>
                </div>
              </div>

              <a
                href="https://api.whatsapp.com/send/?phone=96171226934&text=Hi%20Nisrine,%20I%27d%20like%20to%20start%20a%20subscription"
                className="button-cta w-full inline-flex items-center justify-center gap-2 mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Subscription
