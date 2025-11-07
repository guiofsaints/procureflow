export default function HomePage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>
          ProcureFlow
        </h1>
        <p className='mt-6 text-lg leading-8 text-gray-600'>
          AI-Native Procurement Platform - Bootstrap Codebase
        </p>
        <p className='mt-4 text-sm text-gray-500'>
          Full-stack starter with Next.js, TypeScript, Tailwind CSS, Auth.js,
          MongoDB, and LangChain
        </p>
      </div>

      <div className='mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='bg-white p-6 rounded-lg shadow-sm border'>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>
            🚀 Tech Stack
          </h3>
          <ul className='text-sm text-gray-600 space-y-1'>
            <li>• Next.js 15 with App Router</li>
            <li>• TypeScript & Tailwind CSS</li>
            <li>• Auth.js Authentication</li>
            <li>• MongoDB with Mongoose</li>
            <li>• LangChain + OpenAI</li>
            <li>• Docker & Pulumi (GCP)</li>
          </ul>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border'>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>
            📚 Documentation
          </h3>
          <div className='space-y-2'>
            <a
              href='/README.md'
              className='block text-sm text-blue-600 hover:text-blue-800'
            >
              → README.md
            </a>
            <a
              href='/CONTRIBUTING.md'
              className='block text-sm text-blue-600 hover:text-blue-800'
            >
              → CONTRIBUTING.md
            </a>
            <a
              href='/api/health'
              className='block text-sm text-blue-600 hover:text-blue-800'
            >
              → Health Check API
            </a>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border'>
          <h3 className='text-lg font-semibold text-gray-900 mb-3'>
            🛠️ Quick Start
          </h3>
          <div className='text-sm text-gray-600 space-y-1'>
            <p>1. Copy .env.example to .env</p>
            <p>
              2. Install deps:{' '}
              <code className='bg-gray-100 px-1 rounded'>pnpm install</code>
            </p>
            <p>
              3. Run dev:{' '}
              <code className='bg-gray-100 px-1 rounded'>pnpm dev</code>
            </p>
            <p>
              4. Or Docker:{' '}
              <code className='bg-gray-100 px-1 rounded'>pnpm docker:up</code>
            </p>
          </div>
        </div>
      </div>

      <div className='mt-16 text-center'>
        <p className='text-sm text-gray-500'>
          Ready for AI-native procurement feature implementation 🎯
        </p>
      </div>
    </div>
  );
}
