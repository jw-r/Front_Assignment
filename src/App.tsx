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
    const sourceBoard = updatedBoards.find((board) => board.id === source.droppableId)!
    const destinationBoard = updatedBoards.find((board) => board.id === destination.droppableId)!

    const itemsToMove = sourceBoard.items
      .filter((item) => itemIdsToMove.includes(item.id))
      .sort((a, b) => sourceBoard.items.indexOf(a) - sourceBoard.items.indexOf(b))

    sourceBoard.items = sourceBoard.items.filter((item) => !itemIdsToMove.includes(item.id))

    const isSameBoard = source.droppableId === destination.droppableId
    const insertIndex =
      isSameBoard && destination.index > source.index
        ? destination.index - itemsToMove.length
        : destination.index

    destinationBoard.items.splice(insertIndex, 0, ...itemsToMove)

    setBoards(updatedBoards)
    setSelectedItemIds([])
  }

  const validateMovement = (
    source: DraggableLocation,
    destination: DraggableLocation,
    itemIds: string[],
  ): MovementValidation => {
    const sourceBoard = boards.find((board) => board.id === source.droppableId)!
    const destinationBoard = boards.find((board) => board.id === destination.droppableId)!
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
    updatedDestinationItems.splice(destination.index, 0, ...movedItems)

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
          className={`fixed top-0 w-full p-2 text-center text-white ${
            errorMessage ? 'bg-red-500' : 'bg-blue-500'
          }`}
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
      <div className="mx-auto flex w-fit py-[5vh]">
        {boards.map((board) => (
          <Droppable key={board.id} droppableId={board.id}>
            {(provided: DroppableProvided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`m-2 w-64 p-2 ${
                  snapshot.isDraggingOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <h2 className="mb-2 text-center text-lg font-bold">{board.name} Board</h2>
                <div className="min-h-[100px]">
                  {board.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided: DraggableProvided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => handleItemClick(item.id)}
                          className={`mb-2 flex cursor-pointer select-none items-center justify-between p-4
          ${selectedItemIds.includes(item.id) ? 'bg-blue-200' : 'bg-gray-300'}
          ${
            (snapshot.isDragging || selectedItemIds.includes(item.id)) &&
            invalidItemIds.includes(item.id)
              ? 'bg-red-500'
              : ''
          }
          ${
            (snapshot.isDragging || selectedItemIds.includes(item.id)) &&
            !invalidItemIds.includes(item.id)
              ? 'opacity-50'
              : ''
          }
        `}
                        >
                          <span>{item.content}</span>
                          {selectedItemIds.includes(item.id) && (
                            <span className="ml-2 flex size-6 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
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
    </DragDropContext>
  )
}

const generateItems = (prefix: string, count: number): Item[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-item-${index + 1}`,
    content: `${prefix} item ${index + 1}`,
    isEven: (index + 1) % 2 === 0,
  }))
