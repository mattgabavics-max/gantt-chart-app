import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')

  const fetchMessage = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      console.error('Error fetching message:', error)
      setMessage('Error connecting to server')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Gantt Chart Application
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-4">
            Your Gantt chart application is successfully set up and running.
          </p>

          <button
            onClick={fetchMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Test Backend Connection
          </button>

          {message && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
