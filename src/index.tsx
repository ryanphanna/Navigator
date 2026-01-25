import React from 'react';
import ReactDOM from 'react-dom/client';
import { isEnvValid, envErrors } from './config';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Error component for missing environment variables
function EnvErrorPage({ errors }: { errors: string[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Configuration Required
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Environment variables are missing or invalid.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-red-800 dark:text-red-400 mb-2">
            Missing Variables:
          </h2>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
            How to fix:
          </h2>
          <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to Environment Variables</li>
            <li>Add the required variables:
              <ul className="ml-6 mt-1 space-y-1">
                <li><code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">VITE_SUPABASE_URL</code></li>
                <li><code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
              </ul>
            </li>
            <li>Redeploy your application</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(rootElement);

// Show error page if environment is not valid, otherwise show the app
root.render(
  <React.StrictMode>
    {isEnvValid() ? <App /> : <EnvErrorPage errors={envErrors} />}
  </React.StrictMode>
);
