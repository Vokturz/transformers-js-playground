function Header() {
  return (
    <header className="bg-white shadow-xs border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-10 lg:h-16">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="/hf-logo.svg"
                alt="Hugging Face"
                className="w-10 h-10 lg:w-12 lg:h-12"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Transformers.js Playground
              </h1>
              <p className="text-sm text-gray-500 hidden lg:block">
                Run Hugging Face models in your browser
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
