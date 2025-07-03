function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
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
          <div className="text-sm text-gray-500">
            All processing happens in your browser - your data stays private
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
