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
        className={`absolute bottom-full mb-2 w-max max-w-xs px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10 ${className}`}
      >
        {content}
      </div>
    </div>
  )
}

export default Tooltip
