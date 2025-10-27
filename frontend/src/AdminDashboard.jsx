import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('access_token')
    try {
      const [usersRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/users/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/analytics/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (usersRes.ok) setUsers(await usersRes.json())
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
    } catch (e) {
      console.error('Failed to fetch admin data:', e)
    } finally {
      setLoading(false)
    }
  }

  const togglePremium = async (userId) => {
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-premium/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error('Failed to toggle premium:', e)
    }
  }

  const toggleActive = async (userId) => {
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error('Failed to toggle active:', e)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const userGrowthChart = analytics ? {
    labels: analytics.user_growth.map(d => d.month),
    datasets: [{
      label: 'New Users',
      data: analytics.user_growth.map(d => d.count),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }]
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users and view analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Logs
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Total Users</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{analytics.total_users}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Premium Users</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">{analytics.premium_users}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Active Users</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{analytics.active_users}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">New (30d)</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">{analytics.new_users_30d}</div>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">User Growth (Last 12 Months)</h3>
              {userGrowthChart && <Line data={userGrowthChart} />}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analyses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          {user.is_superuser && <span className="text-xs text-red-600">Admin</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.profile?.is_premium ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.profile?.is_premium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.profile?.total_analyses || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!user.is_superuser && (
                        <>
                          <button
                            onClick={() => togglePremium(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {user.profile?.is_premium ? 'Remove Premium' : 'Make Premium'}
                          </button>
                          <button
                            onClick={() => toggleActive(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && analytics && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {analytics.recent_logs.map(log => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{log.username || 'System'}</span>
                      <span className="text-gray-600 ml-2">{log.action}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {log.details && (
                    <div className="text-sm text-gray-600 mt-1">{log.details}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
