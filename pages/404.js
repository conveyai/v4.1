import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Page Not Found | Conveyancing Management App</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        
        <p className="mb-6 text-gray-600">
          The page you are looking for does not exist or has been moved.
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