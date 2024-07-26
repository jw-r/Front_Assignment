import {
  DragDropContext,
  Draggable,
  Droppable,
  DraggableProvided,
  DroppableProvided,
} from 'react-beautiful-dnd'
import { BOARDS } from './constants/dragDrop'
import { cn } from './lib/utils'
import useDND from './hooks/useDND'
import { Utils } from './hooks/useDND/types'

interface Item {
  id: string
  content: string
  isEven: boolean
}

interface Board {
  id: string
  name: string
  items: Item[]
}

export default function App() {
  const {
    boards,
    selectedItemIds,
    invalidItemIds,
    errorMessage,
    isDragging,
    handleDragStart,
    handleDragUpdate,
    handleDragEnd,
    handleItemClick,
  } = useDND<Board>({
    initialBoards: BOARDS.map((board) => ({ ...board, items: generateItems(board.name, 10) })),
    options: {
      clearSelectionOnEsc: true,
      onValidateMovement: (state, baseUtils) => {
        const utils = getDomainSpecificUtils(baseUtils)

        return (_, destination, itemIds) => {
          const sourceBoards = utils.getBoardsWithSelectedItems(state.boards, state.selectedItemIds)
          const destinationBoard = utils.getDestinationBoard(state.boards, destination.droppableId)

          if (!destinationBoard) {
            return {
              isAllowed: false,
              invalidItemIds: itemIds,
              errorMessage: '목적지 보드를 찾을 수 없습니다.',
            }
          }

          for (const sourceBoard of sourceBoards) {
            if (
              !utils.isMoveAllowedBetweenBoards(
                sourceBoard,
                destinationBoard,
                BOARDS[0].id,
                BOARDS[2].id,
              )
            ) {
              return {
                isAllowed: false,
                invalidItemIds: itemIds,
                errorMessage: 'A Board에서 C Board로는 이동할 수 없습니다.',
              }
            }

            const invalidEvenItemIds = utils.getInvalidEvenItems(
              sourceBoard,
              destinationBoard,
              itemIds,
              destination.index,
            )

            if (invalidEvenItemIds.length > 0) {
              return {
                isAllowed: false,
                invalidItemIds: invalidEvenItemIds,
                errorMessage:
                  '짝수 번호의 아이템을 다른 짝수 번호 아이템의 앞으로 이동시킬 수 없습니다.',
              }
            }
          }

          return { isAllowed: true, invalidItemIds: [], errorMessage: '' }
        }
      },
    },
  })

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      {(isDragging || selectedItemIds.length > 0) && (
        <div
          className={cn(
            'fixed top-0 z-10 w-full p-3 text-center text-white',
            errorMessage ? 'bg-rose-600' : 'bg-teal-600',
          )}
        >
          {isDragging ? (
            <>
              {selectedItemIds.length}개의 아이템을 이동중입니다.
              {errorMessage && <div className="mt-2">Error: {errorMessage}</div>}
            </>
          ) : selectedItemIds.length > 0 ? (
            'ESC 버튼을 통해 아이템 선택을 해제할 수 있습니다'
          ) : null}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex max-sm:flex-col max-sm:space-y-6 sm:space-x-6">
          {boards.map((board) => (
            <Droppable key={board.id} droppableId={board.id}>
              {(provided: DroppableProvided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'flex-1 rounded-lg p-4 shadow-md transition-colors duration-200',
                    snapshot.isDraggingOver ? 'bg-teal-50' : 'bg-white',
                  )}
                >
                  <h2 className="mb-4 text-center text-xl font-bold text-gray-800">
                    {board.name} Board
                  </h2>
                  <div className="space-y-3">
                    {board.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided: DraggableProvided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleItemClick(item.id)}
                            className={cn(
                              'flex cursor-pointer select-none items-center justify-between rounded-md p-3 shadow',
                              selectedItemIds.includes(item.id) ? 'bg-teal-100' : 'bg-gray-50',
                              {
                                'bg-rose-100':
                                  (snapshot.isDragging || selectedItemIds.includes(item.id)) &&
                                  invalidItemIds.includes(item.id),
                                'opacity-75':
                                  (snapshot.isDragging || selectedItemIds.includes(item.id)) &&
                                  !invalidItemIds.includes(item.id),
                                'shadow-lg': snapshot.isDragging,
                              },
                            )}
                          >
                            <span className="text-gray-800">{item.content}</span>
                            {selectedItemIds.includes(item.id) && (
                              <span className="ml-2 flex size-6 items-center justify-center rounded-full bg-teal-500 text-sm font-medium text-white">
                                {selectedItemIds.indexOf(item.id) + 1}
                              </span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}

const generateItems = (prefix: string, count: number): Item[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-item-${index + 1}`,
    content: `${prefix} item ${index + 1}`,
    isEven: (index + 1) % 2 === 0,
  }))

const getDomainSpecificUtils = (utils: Utils<Board>) => ({
  ...utils,
  getInvalidEvenItems: (
    sourceBoard: Board,
    destinationBoard: Board,
    itemIds: string[],
    destinationIndex: number,
  ) => {
    const updatedDestinationItems = utils.getUpdatedDestinationItems(
      sourceBoard,
      destinationBoard,
      itemIds,
      destinationIndex,
    )

    return itemIds.filter((itemId, index) => {
      const item =
        sourceBoard.items.find((i) => i.id === itemId) ||
        destinationBoard.items.find((i) => i.id === itemId)

      if (item && item.isEven) {
        const prevItemIndex = destinationIndex + index - 1
        const prevItem = prevItemIndex >= 0 ? updatedDestinationItems[prevItemIndex] : null
        return prevItem && prevItem.isEven && !itemIds.includes(prevItem.id)
      }
      return false
    })
  },
})
