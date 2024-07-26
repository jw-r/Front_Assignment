import { forwardRef } from 'react'
import { cn } from '../lib/utils'

interface Props {
  isSelected: boolean
  isDragging: boolean
  hasError: boolean
  order: number
  onClick: () => void
  content: React.ReactNode
}

const Item = forwardRef<HTMLDivElement, Props>(
  ({ isDragging, onClick, isSelected, hasError, order, content, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      onClick={onClick}
      className={cn(
        'flex cursor-pointer select-none items-center justify-between rounded-md p-3 shadow bg-gray-50',
        {
          'bg-teal-100': isSelected,
          'bg-rose-100': hasError,
          'opacity-75': isDragging && !hasError,
          'shadow-lg': isDragging,
        },
      )}
    >
      <span className="text-gray-800">{content}</span>
      {isSelected && (
        <span className="ml-2 flex size-6 items-center justify-center rounded-full bg-teal-500 text-sm font-medium text-white">
          {order}
        </span>
      )}
    </div>
  ),
)

export default Item
