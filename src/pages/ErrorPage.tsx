import React from 'react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const ErrorPage: React.FC<{ error?: Error }> = ({ error }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto p-8 w-full">
        <div className="bg-white border rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">An unexpected error occurred. Please try again or return to the homepage.</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link to="/" className="inline-block bg-brand-green text-white px-4 py-2 rounded-full text-sm font-medium">Go Home</Link>
            <button className="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm" onClick={()=>window.location.reload()}>Reload</button>
          </div>
          {error && (
            <details className="text-left mt-4 text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 border rounded p-3">
              <summary className="cursor-pointer text-gray-700">Details</summary>
              {String(error)}
            </details>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ErrorPage;
