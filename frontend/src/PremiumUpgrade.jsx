import { useState } from 'react'

export default function PremiumUpgrade({ onClose }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const requestPremium = async () => {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch('/api/request-premium/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => onClose(), 2000)
      }
    } catch (e) {
      console.error('Failed to request premium:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to Premium</h2>
          <p className="text-gray-600 mb-6">Unlock advanced features and predictions</p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              Request submitted! An admin will review it soon.
            </div>
          )}

          <div className="text-left space-y-4 mb-8">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">5-Year Rating Predictions</div>
                <div className="text-sm text-gray-600">AI-powered forecasting of your chess ratings</div>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Advanced Analytics</div>
                <div className="text-sm text-gray-600">Detailed insights and performance metrics</div>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Priority Support</div>
                <div className="text-sm text-gray-600">Get help when you need it</div>
              </div>
            </div>
          </div>

          <button
            onClick={requestPremium}
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-3"
          >
            {loading ? 'Submitting...' : success ? 'Request Sent!' : 'Request Premium Access'}
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-gray-800 py-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
