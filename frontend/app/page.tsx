import UploadCard from "@/components/UploadCard";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black text-white py-16 shadow-2xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-3 tracking-tight">
            🎤 Pronunciation Master
          </h1>
          <p className="text-xl text-gray-300">
            Perfect your English pronunciation with AI-powered real-time feedback
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-white via-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <UploadCard />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Real-time analysis</li>
                <li>✓ Phoneme-level feedback</li>
                <li>✓ Audio recording</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Technology</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ AI-powered scoring</li>
                <li>✓ Word recognition</li>
                <li>✓ Pronunciation analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Privacy</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ No data storage</li>
                <li>✓ Instant processing</li>
                <li>✓ Secure analysis</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>✨ Pronunciation Master | Powered by AI | Your privacy is our priority</p>
            <p className="mt-2">© 2026 All rights reserved</p>
          </div>
        </div>
      </footer>
    </>
  );
}

