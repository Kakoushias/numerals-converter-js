// Header component

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Roman Numerals Converter
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Convert between Arabic numbers and Roman numerals (hot reload enabled)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
