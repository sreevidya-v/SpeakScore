import UploadCard from "@/components/UploadCard";

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-3">🎤 Pronunciation Scorer</h1>
          <p className="text-xl text-blue-100">Master English pronunciation with AI-powered feedback</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <UploadCard />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">✨ AI-Powered Pronunciation Analysis | Your audio is not stored • Built with care</p>
        </div>
      </footer>
    </>
  );
}

