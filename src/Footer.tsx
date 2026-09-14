function Footer() {
  return (
    <footer className="z-20 shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground">
          Powered by{' '}
          <a
            href="https://huggingface.co/docs/transformers.js"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <span>🤗 Transformers.js</span>
          </a>
        </p>
        <p className="hidden text-xs text-muted-foreground/70 sm:block">
          Runs locally · no data leaves your browser
        </p>
      </div>
    </footer>
  )
}

export default Footer
