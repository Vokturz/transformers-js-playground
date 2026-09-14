import React from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: string | React.ReactNode
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className }) => {
  return (
    <div className="relative group flex items-center">
      {children}
      <div
        className={`absolute left-0 top-full z-20 mt-2 w-max max-w-sm rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-sm opacity-0 pointer-events-none invisible transition-opacity duration-200 group-hover:visible group-hover:opacity-100 ${className}`}
      >
        {content}
      </div>
    </div>
  )
}

export default Tooltip
