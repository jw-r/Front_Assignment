import React, { useState, useEffect } from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
  DraggableProvided,
  DroppableProvided,
  DragStart,
  DraggableLocation,
  DragUpdate,
} from 'react-beautiful-dnd'
import { BOARDS } from './constants/dragDrop'
import { cn } from './lib/utils'

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

interface MovementValidation {
  isAllowed: boolean
  invalidItemIds: string[]
  errorMessage: string
}

export default function App() {
  const [boards, setBoards] = useState<Board[]>(() =>
    BOARDS.map((board) => ({ ...board, items: generateItems(board.name, 10) })),
  )
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [invalidItemIds, setInvalidItemIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedItemIds([])
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [])

  const handleDragStart = (start: DragStart) => {
    const draggedItemId = start.draggableId
    if (!selectedItemIds.includes(draggedItemId)) {
      setSelectedItemIds([draggedItemId])
    }
    setIsDragging(true)
    resetDragState()
  }

  const handleDragUpdate = (update: DragUpdate) => {
    if (!update.destination) {
      resetDragState()
      return
    }

    const draggedItemIds = selectedItemIds.length > 0 ? selectedItemIds : [update.draggableId]
    const validationResult = validateMovement(update.source, update.destination, draggedItemIds)
    setInvalidItemIds(validationResult.invalidItemIds)
    setErrorMessage(validationResult.errorMessage)
  }

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result

    setIsDragging(false)
    resetDragState()

    if (!destination) return

    const itemIdsToMove = selectedItemIds.length > 0 ? selectedItemIds : [result.draggableId]
    const validationResult = validateMovement(source, destination, itemIdsToMove)
    if (!validationResult.isAllowed) return

    const updatedBoards = [...boards]
    const sourceBoards = updatedBoards.filter((board) =>
      board.items.some((item) => itemIdsToMove.includes(item.id)),
    )
    const destinationBoard = updatedBoards.find((board) => board.id === destination.droppableId)!

    sourceBoards.forEach((sourceBoard) => {
      const itemsToMove = sourceBoard.items
        .filter((item) => itemIdsToMove.includes(item.id))
        .sort((a, b) => sourceBoard.items.indexOf(a) - sourceBoard.items.indexOf(b))

      sourceBoard.items = sourceBoard.items.filter((item) => !itemIdsToMove.includes(item.id))

      const isSameBoard = source.droppableId === destination.droppableId
      const insertIndex =
        isSameBoard && destination.index > source.index
          ? destination.index - itemsToMove.length + 1
          : destination.index

      destinationBoard.items.splice(insertIndex, 0, ...itemsToMove)
    })

    setBoards(updatedBoards)
    setSelectedItemIds([])
  }

  const validateMovement = (
    source: DraggableLocation,
    destination: DraggableLocation,
    itemIds: string[],
  ): MovementValidation => {
    const sourceBoards = boards.filter((board) =>
      board.items.some((item) => selectedItemIds.includes(item.id)),
    )

    const destinationBoard = boards.find((board) => board.id === destination.droppableId)!

    for (const sourceBoard of sourceBoards) {
      const movedItems = boards
        .flatMap((board) => board.items)
        .filter((item) => itemIds.includes(item.id))

      if (sourceBoard.id === BOARDS[0].id && destinationBoard.id === BOARDS[2].id) {
        return {
          isAllowed: false,
          invalidItemIds: movedItems.map((item) => item.id),
          errorMessage: 'A Board에서 C Board로는 이동할 수 없습니다.',
        }
      }

      const destinationItems = [...destinationBoard.items]
      if (sourceBoard.id === destinationBoard.id) {
        movedItems.forEach((item) => {
          const index = destinationItems.findIndex((i) => i.id === item.id)
          if (index !== -1) destinationItems.splice(index, 1)
        })
      }

      const updatedDestinationItems = [...destinationItems]
      const adjustedIndex = destination.index
      itemIds.forEach((itemId, i) => {
        const item = movedItems.find((item) => item.id === itemId)
        updatedDestinationItems.splice(adjustedIndex + i, 0, item!)
      })

      const invalidEvenItemIds = movedItems
        .filter((item) => {
          if (item.isEven) {
            const prevItemIndex = destination.index + movedItems.indexOf(item) - 1
            const prevItem = prevItemIndex >= 0 ? updatedDestinationItems[prevItemIndex] : null
            return prevItem && prevItem.isEven && !movedItems.includes(prevItem)
          }
          return false
        })
        .map((item) => item.id)

      if (invalidEvenItemIds.length > 0) {
        return {
          isAllowed: false,
          invalidItemIds: invalidEvenItemIds,
          errorMessage: '짝수 번호의 아이템을 다른 짝수 번호 아이템의 앞으로 이동시킬 수 없습니다.',
        }
      }
    }

    return { isAllowed: true, invalidItemIds: [], errorMessage: '' }
  }

  const handleItemClick = (itemId: string) => {
    setSelectedItemIds((prevSelectedIds) =>
      prevSelectedIds.includes(itemId)
        ? prevSelectedIds.filter((id) => id !== itemId)
        : [...prevSelectedIds, itemId],
    )
  }

  const resetDragState = () => {
    setInvalidItemIds([])
    setErrorMessage('')
  }

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
            errorMessage ? 'bg-red-500' : 'bg-blue-500',
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
                    snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white',
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
                              selectedItemIds.includes(item.id) ? 'bg-blue-100' : 'bg-gray-50',
                              {
                                'bg-red-100':
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
                              <span className="ml-2 flex size-6 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
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
