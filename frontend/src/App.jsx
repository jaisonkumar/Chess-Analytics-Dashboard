import { useState, useContext } from "react"
import { Line, Pie, Scatter, Bar } from "react-chartjs-2"
import 'chart.js/auto'
import { AuthContext } from './AuthContext'
import Login from './Login'
import Register from './Register'
import AdminDashboard from './AdminDashboard'
import PremiumUpgrade from './PremiumUpgrade'
import './App.css'

// Helper functions
function combinedOpeningStats(openingRepertoire) {
  if (!openingRepertoire) return []
  const openingsMap = new Map()
  for (const color of ['white', 'black']) {
    if (!openingRepertoire[color]) continue
    for (const [opening, stats] of Object.entries(openingRepertoire[color])) {
      if (!openingsMap.has(opening)) {
        openingsMap.set(opening, {
          opening,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        })
      }
      const curr = openingsMap.get(opening)
      curr.games += stats.games
      curr.wins += stats.wins
      curr.losses += stats.losses
      curr.draws += stats.draws
    }
  }
  return Array.from(openingsMap.values()).sort((a, b) => b.games - a.games)
}

function openingBarChartData(openingRepertoire) {
  const data = combinedOpeningStats(openingRepertoire)
  return {
    labels: data.map(d => d.opening),
    datasets: [{
      label: 'Games Played',
      data: data.map(d => d.games),
      backgroundColor: '#3b82f6',
    }]
  }
}

function openingWinRateBarData(openingRepertoire) {
  const data = combinedOpeningStats(openingRepertoire)
  return {
    labels: data.map(d => d.opening),
    datasets: [{
      label: 'Win Rate %',
      data: data.map(d => (d.games > 0 ? (d.wins / d.games) * 100 : 0)),
      backgroundColor: '#10b981',
    }]
  }
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function heatmapColor(count) {
  if (count === 0) return '#f3f4f6'  // light gray
  if (count < 3) return '#93c5fd'    // light blue
  if (count < 6) return '#3b82f6'    // medium blue
  return '#1e40af'                   // dark blue
}

export default function App() {
  const { user, logout, loading: authLoading } = useContext(AuthContext)
  const [showAuth, setShowAuth] = useState('login')
  
  // New state for admin and premium features
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [recentPerformancePoints, setRecentPerformancePoints] = useState([])
  const [username, setUsername] = useState("")
  const [profile, setProfile] = useState(null)
  const [ratingCharts, setRatingCharts] = useState([])
  const [loading, setLoading] = useState(false)
  const [predictedRating, setPredictedRating] = useState(null)
  const [futureRatingData, setFutureRatingData] = useState(null)
  const [openingRepertoire, setOpeningRepertoire] = useState(null)
  const [loadingOpeningRepertoire, setLoadingOpeningRepertoire] = useState(false)

  function formatDate(epochMs) {
    return new Date(epochMs).toLocaleString()
  }

  const fetchProfile = async (username) => {
    try {
      const res = await fetch(`/api/user-profile/${username}/`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setProfile(data)
    } catch (e) {
      setProfile(null)
      alert("Failed to fetch user profile")
    }
  }

  const fetchPredictedRating = async () => {
    try {
      const res = await fetch(`/api/predict-future-ratings/${username}/`)
      if (!res.ok) throw new Error('Prediction not available')
      const { predicted_next_rapid_rating } = await res.json()
      setPredictedRating(predicted_next_rapid_rating)
    } catch {
      setPredictedRating(null)
    }
  }

  const fetchFutureRatings = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`/api/predict-future-ratings/${username}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.status === 403) {
        // Premium feature - show upgrade modal
        setShowPremiumModal(true)
        setFutureRatingData(null)
        return
      }
      
      if (!res.ok) throw new Error('Failed to fetch future ratings')
      const data = await res.json()
      const monthsLabels = Array.from({ length: 60 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() + i + 1)
        return date.toLocaleString('default', { month: 'short', year: 'numeric' })
      })

      const datasets = ['bullet', 'blitz', 'rapid'].map((variant, idx) => ({
        label: variant.charAt(0).toUpperCase() + variant.slice(1),
        data: data[variant] || [],
        borderColor: ['#3b82f6', '#10b981', '#f59e0b'][idx],
        fill: false,
        tension: 0.3,
      }))

      setFutureRatingData({
        labels: monthsLabels,
        datasets,
      })
    } catch {
      setFutureRatingData(null)
    }
  }

  const fetchOpeningRepertoire = async () => {
    if (!username) return
    setLoadingOpeningRepertoire(true)
    try {
      const res = await fetch(`/api/opening-repertoire/${username}/`)
      if (!res.ok) throw new Error('Failed to fetch opening repertoire')
      const data = await res.json()
      setOpeningRepertoire(data)
    } catch (e) {
      alert("Failed to load opening repertoire: " + e.message)
      setOpeningRepertoire(null)
    } finally {
      setLoadingOpeningRepertoire(false)
    }
  }

  function handleApiError(error, context = '') {
    console.error(`Error in ${context}:`, error)
    const message = (error?.message || '').toLowerCase()

    if (message.includes('not found') || message.includes('404')) {
      setErrorMessage('❌ User not found on Lichess. Please check the username and try again.')
    } else if (message.includes('network')) {
      setErrorMessage('⚠️ Network issue. Please check your internet connection.')
    } else if (message.includes('403')) {
      setErrorMessage('🔒 This feature requires Premium access.')
    } else {
      setErrorMessage('⚠️ Something went wrong while analyzing the user data.')
    }
  }



  const fetchRatingHistory = async () => {
  if (!username) return
  setLoading(true)
  setErrorMessage("") // clear any old message

  try {
    // Reset old analysis data before new one
    setProfile(null)
    setRatingCharts([])
    setFutureRatingData(null)
    setPredictedRating(null)
    setOpeningRepertoire(null)

    // Step 1 — Validate username via user profile
    const profileRes = await fetch(`/api/user-profile/${username}/`)
    if (!profileRes.ok) {
      const err = await profileRes.json().catch(() => ({}))
      throw new Error(err.error || 'User not found')
    }

    const profileData = await profileRes.json()
    setProfile(profileData)

    // Step 2 — Fetch supporting data only if profile is valid
    await fetchPredictedRating()
    await fetchFutureRatings()
    await fetchOpeningRepertoire()

    // Step 3 — Fetch rating history
    const res = await fetch(`/api/rating-history/${username}/`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Rating history fetch failed (${res.status})`)
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No rating data found for this user.')
    }

    // Step 4 — Build charts
    const chartsData = data.map(variant => {
      if (!variant.points || variant.points.length === 0) return null
      return {
        name: variant.name,
        chartData: {
          labels: variant.points.map(point =>
            new Date(point[0], point[1], point[2]).toLocaleDateString()
          ),
          datasets: [{
            label: `${variant.name} Rating`,
            data: variant.points.map(point => point[3]),
            borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
            fill: false,
          }]
        }
      }
    }).filter(Boolean)

    setRatingCharts(chartsData)
    fetchRecentPerformance(data)

  } catch (error) {
    // Step 5 — Handle error and show user-friendly message
    handleApiError(error, 'fetchRatingHistory')

    // Reset UI data on failure
    setProfile(null)
    setRatingCharts([])
    setFutureRatingData(null)
    setPredictedRating(null)
    setOpeningRepertoire(null)
  } finally {
    setLoading(false)
  }
}




  const winLossDrawData = profile ? {
    labels: ['Wins', 'Losses', 'Draws'],
    datasets: [{
      data: [profile.count.win, profile.count.loss, profile.count.draw],
      backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
      hoverOffset: 30,
    }]
  } : null

  const ratingsBubbleData = profile && profile.perfs ? (() => {
    const variants = Object.keys(profile.perfs)
    return {
      labels: variants.map(v => v.charAt(0).toUpperCase() + v.slice(1)),
      datasets: [{
        label: 'Ratings vs Games Played',
        data: variants.map((variant, idx) => {
          const stats = profile.perfs[variant]
          const winRate = stats.games > 0 ? stats.win / stats.games : 0
          return {
            x: stats.rating,
            y: idx,
            r: Math.min(Math.sqrt(stats.games) * 2, 20),
            backgroundColor: `rgba(59, 130, 246, ${0.4 + 0.6 * winRate})`,
            borderColor: `rgba(30, 64, 175, 1)`,
            borderWidth: 1,
          }
        }),
      }]
    }
  })() : null


  
  const fetchRecentPerformance = (ratingHistory) => {
    if (!ratingHistory || ratingHistory.length === 0) {
      setRecentPerformancePoints([])
      return
    }
    const allPoints = []
    ratingHistory.forEach(variant => {
      if (variant.points) {
        variant.points.forEach(p => allPoints.push(p[3]))
      }
    })
    const latestPoints = allPoints.slice(-30)
    setRecentPerformancePoints(latestPoints)
  }

  const recentPerformanceData = {
    labels: recentPerformancePoints.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'Rating',
      data: recentPerformancePoints,
      fill: false,
      borderColor: '#3b82f6',
      tension: 0.3,
    }]
  }

  const bubbleOptions = {
    indexAxis: 'xy',
    scales: {
      x: {
        title: { display: true, text: 'Rating' },
        min: 1000,
        max: 3000,
      },
      y: {
        type: 'category',
        labels: profile && profile.perfs ? Object.keys(profile.perfs).map(v => v.charAt(0).toUpperCase() + v.slice(1)) : [],
        title: { display: true, text: 'Variant' },
        offset: true,
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const d = context.raw
            const games = Math.round((d.r / 2) ** 2)
            const variantLabel = context.chart.scales.y.ticks[d.y]?.label || 'Variant'
            return `Variant: ${variantLabel}, Rating: ${d.x}, Games: ${games}`
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return showAuth === 'login' 
      ? <Login onSwitchToRegister={() => setShowAuth('register')} />
      : <Register onSwitchToLogin={() => setShowAuth('login')} />
  }

  // Show admin dashboard if user is superuser and dashboard is toggled
  if (showAdminDashboard && user.is_superuser) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={() => setShowAdminDashboard(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Back to App
            </button>
          </div>
        </div>
        <AdminDashboard />
      </div>
    )
  }

  const showWelcomeScreen = !username && !profile

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chess Analytics</h1>
                <p className="text-sm text-gray-600"></p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.is_superuser && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md"
                >
                  Admin Dashboard
                </button>
              )}
              <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{user.username}</span>
                  {user.profile?.is_premium && (
                    <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">Premium</span>
                  )}
                </div>
              </div>
              <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition transform hover:scale-105 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex-1 min-w-[300px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lichess Username</label>
                <input
                  type="text"
                  placeholder="Enter Lichess Username (e.g., DrNykterstein)"
                  value={username}
                  onChange={e => setUsername(e.target.value.trim())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  onKeyDown={e => { if (e.key === 'Enter') fetchRatingHistory() }}
                />
              </div>
              <button
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition mt-6"
                onClick={fetchRatingHistory}
                disabled={loading || !username}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Analyze'}
              </button>
            </div>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-sm">
            {errorMessage}
          </div>
        )}
        {/* Welcome Screen */}
        {showWelcomeScreen && (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-6 animate-bounce">
              <svg className="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Chess Analytics!</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Unlock powerful insights into your chess performance with AI-powered analysis
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Rating Predictions</h3>
                <p className="text-gray-600">AI-powered forecasting of your future ratings based on historical performance</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition">
                <div className="text-5xl mb-4">♟️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Opening Analysis</h3>
                <p className="text-gray-600">Deep dive into your opening repertoire with win rates and statistics</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transform hover:scale-105 transition">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Insights</h3>
                <p className="text-gray-600">Comprehensive charts and visualizations of your chess journey</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 max-w-3xl mx-auto shadow-xl">
              <h3 className="text-2xl font-bold mb-4">🚀 Get Started in 3 Simple Steps</h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-3xl font-bold mb-2">1</div>
                    <p className="text-sm">Enter your Lichess username above</p>
                  </div>
                </div>
                <div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-3xl font-bold mb-2">2</div>
                    <p className="text-sm">Click "Analyze" to fetch your data</p>
                  </div>
                </div>
                <div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-3xl font-bold mb-2">3</div>
                    <p className="text-sm">Explore insights and predictions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile content */}
        {profile && (
          <>
            <div className="user-profile mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.username}</h2>
                  <a href={profile.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                    View on Lichess
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(profile.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Seen:</span>
                      <span className="ml-2 font-medium">{formatDate(profile.seenAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white p-4 rounded-xl">
                  <div className="text-sm opacity-90">Total Games</div>
                  <div className="text-3xl font-bold">{profile.count.all}</div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.count.rated}</div>
                  <div className="text-sm text-gray-600">Rated</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.count.win}</div>
                  <div className="text-sm text-gray-600">Wins</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{profile.count.loss}</div>
                  <div className="text-sm text-gray-600">Losses</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{profile.count.draw}</div>
                  <div className="text-sm text-gray-600">Draws</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {winLossDrawData && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Win / Loss / Draw Ratio</h3>
                  <Pie data={winLossDrawData} />
                </div>
              )}

              {ratingsBubbleData && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200" style={{ height: 400 }}>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Ratings vs Games Played</h3>
                  <Scatter data={ratingsBubbleData} options={bubbleOptions} />
                </div>
              )}
            </div>

            {futureRatingData && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Predicted Ratings for Next 12 Months</h3>
                <Line data={futureRatingData} />
              </div>
            )}

            {predictedRating !== null && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-lg mb-8 text-center">
                <div className="text-sm opacity-90 mb-2">Predicted Next Rapid Rating</div>
                <div className="text-5xl font-bold">{predictedRating}</div>
              </div>
            )}

            {openingRepertoire && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Opening Repertoire Analysis</h2>

                <div className="mb-12" style={{ height: 400 }}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Games Played per Opening</h3>
                  <Bar
                    data={openingBarChartData(openingRepertoire)}
                    options={{
                      indexAxis: 'y',
                      scales: { x: { beginAtZero: true } },
                      plugins: { legend: { display: false } },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>

                <div style={{ height: 400 }}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Win Rate % per Opening</h3>
                  <Bar
                    data={openingWinRateBarData(openingRepertoire)}
                    options={{
                      indexAxis: 'y',
                      scales: { x: { min: 0, max: 100 } },
                      plugins: { legend: { display: false } },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            )}

            

            <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Recent Performance (Last 30 Games)</h2>
              {recentPerformancePoints.length > 0 ? (
                <Line data={recentPerformanceData} options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: false } },
                }} />
              ) : (
                <p>No recent performance data available.</p>
              )}
              {recentPerformancePoints.length > 1 && (
                <div className="mt-3 font-semibold text-gray-800 text-center">
                  Rating Change: {Math.round(recentPerformancePoints[recentPerformancePoints.length - 1] - recentPerformancePoints[0]) > 0 ? '+' : ''}
                  {Math.round(recentPerformancePoints[recentPerformancePoints.length - 1] - recentPerformancePoints[0])}
                </div>
              )}
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ratingCharts.map(({ name, chartData }) => (
                <div key={name} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h2 className="text-lg font-bold mb-4 text-gray-900">{name} Rating History</h2>
                  <Line data={chartData} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <PremiumUpgrade onClose={() => setShowPremiumModal(false)} />
      )}
    </div>



  
  )


  
  


}

