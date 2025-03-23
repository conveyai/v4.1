// pages/auth-test.js
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthTest() {
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState([]);
  const [dbTest, setDbTest] = useState(null);

  // Add a log entry with timestamp
  const addLog = (message, type = 'info') => {
    setTestResults(prev => [
      ...prev,
      { 
        time: new Date().toLocaleTimeString(), 
        message, 
        type 
      }
    ]);
  };

  // Test the debug endpoint
  const testDebugEndpoint = async () => {
    try {
      addLog('Testing debug endpoint...');
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDbTest(data);
      
      if (data.session) {
        addLog('Session found in debug endpoint', 'success');
      } else {
        addLog('No session found in debug endpoint', 'error');
      }
      
      if (data.database?.connected) {
        addLog('Database connection successful', 'success');
        
        if (data.database.counts) {
          const { clients, matters, properties } = data.database.counts;
          addLog(`Found ${clients} clients, ${matters} matters, ${properties} properties`, 
            clients > 0 || matters > 0 || properties > 0 ? 'success' : 'warning');
        }
      } else {
        addLog('Database connection failed', 'error');
      }
    } catch (error) {
      addLog(`Error testing debug endpoint: ${error.message}`, 'error');
    }
  };

  // Test clients API
  const testClientsApi = async () => {
    try {
      addLog('Testing clients API...');
      const response = await fetch('/api/clients');
      
      if (response.ok) {
        const data = await response.json();
        addLog(`Clients API returned ${data.length} records`, 'success');
      } else {
        const errorText = await response.text();
        addLog(`Clients API error: ${response.status} ${response.statusText}`, 'error');
        addLog(`Error details: ${errorText}`, 'error');
      }
    } catch (error) {
      addLog(`Error testing clients API: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    addLog(`Auth status: ${status}`);
    
    if (status === 'authenticated') {
      addLog('User authenticated', 'success');
      addLog(`User: ${session.user.name} (${session.user.email})`);
      addLog(`Tenant ID: ${session.user.tenantId}`);
    } else if (status === 'unauthenticated') {
      addLog('User not authenticated', 'error');
    }
  }, [status, session]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Head>
        <title>Authentication Test | Conveyancing Management App</title>
      </Head>
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
        
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <div className="mb-4">
            <p>Current status: <span className={`font-bold ${status === 'authenticated' ? 'text-green-600' : status === 'loading' ? 'text-yellow-600' : 'text-red-600'}`}>
              {status}
            </span></p>
          </div>
          
          {status === 'authenticated' ? (
            <div>
              <p className="text-green-600 font-semibold">Authenticated as {session.user.name}</p>
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <pre>{JSON.stringify(session, null, 2)}</pre>
              </div>
              <button
                onClick={() => signOut()}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600 mb-2">Not authenticated</p>
              <button
                onClick={() => signIn()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={testDebugEndpoint}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Test Debug Endpoint
          </button>
          
          <button
            onClick={testClientsApi}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Clients API
          </button>
        </div>
        
        {dbTest && (
          <div className="mb-6 p-4 border rounded">
            <h2 className="text-lg font-semibold mb-2">Debug Endpoint Results</h2>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-64">
              {JSON.stringify(dbTest, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Test Logs</h2>
          <div className="border rounded overflow-auto max-h-64">
            {testResults.length === 0 ? (
              <p className="p-4 text-gray-500">No test results yet</p>
            ) : (
              <div className="divide-y">
                {testResults.map((log, index) => (
                  <div key={index} className={`p-2 text-sm ${
                    log.type === 'error' ? 'bg-red-50 text-red-800' : 
                    log.type === 'success' ? 'bg-green-50 text-green-800' :
                    log.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 
                    'bg-gray-50'
                  }`}>
                    <span className="font-mono">[{log.time}]</span> {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-8 pt-4 border-t">
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}