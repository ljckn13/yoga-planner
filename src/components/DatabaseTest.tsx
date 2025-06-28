import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DatabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    async function testDatabase() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setStatus('error')
          setMessage('No authenticated user found')
          return
        }

    

        // Test users table with new columns
        const { data, error } = await supabase
          .from('users')
          .select('id, email, display_name, avatar_url, preferences, created_at, updated_at')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Database test error:', error)
          setStatus('error')
          setMessage(`Database error: ${error.message}`)
          return
        }

  
        setUserData(data)
        setStatus('success')
        setMessage('✅ Database migration successful! User profile loaded.')
      } catch (error) {
        console.error('Database test error:', error)
        setStatus('error')
        setMessage(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    testDatabase()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border rounded-lg shadow-lg z-50 max-w-md">
      <h3 className="font-semibold mb-2">Database Migration Test</h3>
      <div className={`text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
        {status === 'loading' && '🔄 Testing database migration...'}
        {status === 'success' && message}
        {status === 'error' && message}
      </div>
      
      {userData && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
          <strong>User Data:</strong>
          <pre className="mt-1 text-xs overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-2 text-xs text-gray-600">
          <strong>Next step:</strong> Run the migration SQL in Supabase dashboard:
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Go to SQL Editor in Supabase dashboard</li>
            <li>Copy contents of <code>supabase/migration.sql</code></li>
            <li>Paste and run the SQL</li>
          </ol>
        </div>
      )}
    </div>
  )
} 