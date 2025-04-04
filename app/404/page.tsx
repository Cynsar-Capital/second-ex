import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <h2 className="mt-4 text-2xl font-medium text-gray-700 dark:text-gray-300">Profile Not Found</h2>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        The profile you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link 
        href="/"
        className="mt-8 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
