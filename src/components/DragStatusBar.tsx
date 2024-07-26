import { cn } from '../lib/utils'

interface Props {
  isDragging: boolean
  selectedItemLength: number
  errorMessage: string
}

const DragStatusBar = ({ isDragging, selectedItemLength, errorMessage }: Props) => {
  return (
    <>
      {(isDragging || selectedItemLength > 0) && (
        <div
          className={cn(
            'fixed top-0 z-10 w-full p-3 text-center text-white',
            errorMessage ? 'bg-rose-600' : 'bg-teal-600',
          )}
        >
          {isDragging ? (
            <>
              {selectedItemLength}개의 아이템을 이동중입니다.
              {errorMessage && <div className="mt-2">Error: {errorMessage}</div>}
            </>
          ) : (
            <>ESC 버튼을 통해 아이템 선택을 해제할 수 있습니다</>
          )}
        </div>
      )}
    </>
  )
}

export default DragStatusBar
