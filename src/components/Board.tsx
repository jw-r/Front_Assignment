import { PropsWithChildren, forwardRef } from 'react'
import { cn } from '../lib/utils'

interface Props extends PropsWithChildren {
  name: string
  isDraggingOver: boolean
}

const Board = forwardRef<HTMLDivElement, Props>(
  ({ name, isDraggingOver, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn(
        'flex-1 rounded-lg p-4 shadow-md transition-colors duration-200 bg-white',
        isDraggingOver && 'bg-teal-50',
      )}
    >
      <h2 className="mb-4 text-center text-xl font-bold text-gray-800">{name} Board</h2>
      <div className="space-y-3">{children}</div>
    </div>
  ),
)

export default Board
