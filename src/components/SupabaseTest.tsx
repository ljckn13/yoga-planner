import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'schema-missing'>('loading')
  const [message, setMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...')
        
        // Test basic connection
        const { data, error } = await supabase.from('users').select('count').limit(1)
        
        console.log('Supabase response:', { data, error })
        
        if (error) {
          console.error('Supabase error:', error)
          // Check if it's a 404 (table doesn't exist) vs other errors
          if (error.code === 'PGRST116' || error.message.includes('404') || error.message.includes('relation "users" does not exist')) {
            setStatus('schema-missing')
            setMessage('✅ Supabase connected! Database schema needs to be set up.')
            setErrorDetails(`Table error: ${error.message}`)
          } else {
            throw error
          }
        } else {
          setStatus('success')
          setMessage('✅ Supabase connection successful! Database schema is ready.')
          setErrorDetails('')
        }
      } catch (error) {
        console.error('Connection test error:', error)
        setStatus('error')
        setMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setErrorDetails(error instanceof Error ? error.stack || '' : '')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="fixed top-4 right-4 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg z-50 max-w-md">
      <h3 className="font-bold text-lg mb-3 text-yellow-800">🔍 SUPABASE TEST COMPONENT</h3>
      <div className={`text-sm font-semibold ${
        status === 'success' ? 'text-green-600' : 
        status === 'schema-missing' ? 'text-blue-600' :
        status === 'error' ? 'text-red-600' : 'text-blue-600'
      }`}>
        {status === 'loading' && '🔄 Testing connection...'}
        {status === 'success' && message}
        {status === 'schema-missing' && message}
        {status === 'error' && message}
      </div>
      
      {errorDetails && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
          <strong>Details:</strong> {errorDetails}
        </div>
      )}
      
      {status === 'schema-missing' && (
        <div className="mt-3 text-xs text-gray-700">
          <strong>Next step:</strong> Run the database schema in Supabase dashboard:
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Go to SQL Editor in Supabase dashboard</li>
            <li>Copy contents of <code>supabase/schema.sql</code></li>
            <li>Paste and run the SQL</li>
          </ol>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 text-xs text-gray-700">
          Make sure to:
          <ul className="list-disc list-inside mt-1">
            <li>Create a .env file with VITE_SUPABASE_ANON_KEY</li>
            <li>Run the schema.sql in your Supabase dashboard</li>
            <li>Check browser console for more details</li>
          </ul>
        </div>
      )}
    </div>
  )
} 