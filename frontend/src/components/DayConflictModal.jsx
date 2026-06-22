import { useEffect } from 'react'
import { capitalize } from '../utils/days.js'

export default function DayConflictModal({ currentDay, productDay, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="bg-secondary/10 rounded-full p-3 mr-4">
              <svg className="text-secondary w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text">Order Day Conflict</h2>
          </div>
          <div className="space-y-4 text-muted">
            <p className="text-lg">
              This meal is only available for{' '}
              <span className="font-semibold text-text">{capitalize(productDay)}</span>.
            </p>
            <p className="text-lg">
              Your basket already contains products for{' '}
              <span className="font-semibold text-text">{capitalize(currentDay)}</span>.
            </p>
            <p className="text-lg">
              To order for <span className="font-semibold text-text">{capitalize(productDay)}</span>, please place a separate order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-secondary hover:bg-secondary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
