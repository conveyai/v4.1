import { useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

function Error({ statusCode, err }) {
  useEffect(() => {
    // Log errors to console in development
    if (process.env.NODE_ENV !== 'production' && err) {
      console.error(err);
    }
  }, [err]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Error | Conveyancing Management App</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">
          {statusCode
            ? `Error ${statusCode}`
            : 'An error occurred'}
        </h1>
        
        <p className="mb-6 text-gray-600">
          {statusCode === 404
            ? "We couldn't find the page you were looking for."
            : "Sorry, something went wrong. Please try again."}
        </p>
        
        <Link href="/"
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, err };
};

export default Error;