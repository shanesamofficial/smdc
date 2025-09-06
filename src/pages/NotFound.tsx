import React from 'react';
import SiteNav from '../components/SiteNav';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto p-8 w-full">
        <div className="bg-white border rounded-2xl shadow-sm p-10 text-center">
          <div className="text-6xl font-bold text-brand-green mb-4">404</div>
          <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
          <p className="text-gray-600 mb-6">The page you’re looking for doesn’t exist or was moved.</p>
          <Link to="/" className="inline-block bg-brand-green text-white px-5 py-2 rounded-full text-sm font-medium">Go to Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
