function Footer() {
  return (
    <footer className="bg-white w-full">
      <div className="max-w-7xl flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-4 mx-auto">
        <div className="flex flex-row items-center space-x-2 text-sm text-gray-500">
          <a
            href="https://vnavarro.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 "
          >
            vnavarro.dev
          </a>
          {/* vertical inline */}
          <div className="w-[1px] h-4 bg-gray-500" />
          <div className="flex flex-row space-x-2">
            <span>Powered by</span>
            <a
              href="https://huggingface.co/docs/transformers.js"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>🤗 Transformers.js</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
