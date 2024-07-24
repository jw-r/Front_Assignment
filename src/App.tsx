import { useState } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggableLocation,
  DragUpdate,
  Droppable,
  DropResult,
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

export default function App() {
  const [boards, setBoards] = useState<Board[]>(() =>
    BOARDS.map((board) => ({ ...board, items: getItems(board.name, 10) })),
  )

  const [invalidMove, setInvalidMove] = useState<string | null>(null)

  const reorderItems = (list: Item[], startIndex: number, endIndex: number): Item[] => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
  }

  const moveToOtherBoard = (
    source: Item[],
    destination: Item[],
    droppableSource: DraggableLocation,
    droppableDestination: DraggableLocation,
  ) => {
    const sourceClone = Array.from(source)
    const destClone = Array.from(destination)
    const [removed] = sourceClone.splice(droppableSource.index, 1)

    destClone.splice(droppableDestination.index, 0, removed)

    return [sourceClone, destClone]
  }

  const isMovementAllowed = (
    source: DraggableLocation,
    destination: DraggableLocation,
    draggableId: string,
  ) => {
    // 첫 번째 board에서 세 번째 board로 이동 불가
    if (source.droppableId === BOARDS[0].id && destination.droppableId === BOARDS[2].id) {
      return false
    }

    const sourceBoard = boards.find((board) => board.id === source.droppableId)!
    const destBoard = boards.find((board) => board.id === destination.droppableId)!
    const draggedItem = sourceBoard.items.find((item) => item.id === draggableId)!

    // 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
    if (draggedItem.isEven) {
      const destIndex = destination.index
      if (destIndex > 0) {
        const itemBefore = destBoard.items[destIndex - 1]
        if (itemBefore.isEven) {
          return false
        }
      }
    }

    return true
  }

  const onDragUpdate = (update: DragUpdate) => {
    if (!update.destination) {
      setInvalidMove(null)
      return
    }

    const sourceBoard = boards.find((board) => board.id === update.source.droppableId)!
    const destBoard = boards.find((board) => board.id === update.destination?.droppableId)!
    const draggedItem = sourceBoard.items.find((item) => item.id === update.draggableId)!

    if (
      update.source.droppableId === BOARDS[0].id &&
      update.destination.droppableId === BOARDS[2].id
    ) {
      setInvalidMove(update.draggableId)
    } else if (draggedItem.isEven && update.destination.index > 0) {
      const itemBefore = destBoard.items[update.destination.index - 1]
      if (itemBefore.isEven) {
        setInvalidMove(update.draggableId)
      } else {
        setInvalidMove(null)
      }
    } else {
      setInvalidMove(null)
    }
  }

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (!destination) {
      return
    }

    if (!isMovementAllowed(source, destination, draggableId)) {
      return
    }

    if (source.droppableId === destination.droppableId) {
      const items = reorderItems(
        boards.find((board) => board.id === source.droppableId)!.items,
        source.index,
        destination.index,
      )

      setBoards((prev) =>
        prev.map((board) => (board.id === source.droppableId ? { ...board, items } : board)),
      )
    } else {
      const [sourceItems, destItems] = moveToOtherBoard(
        boards.find((board) => board.id === source.droppableId)!.items,
        boards.find((board) => board.id === destination.droppableId)!.items,
        source,
        destination,
      )

      setBoards((prev) =>
        prev.map((board) => {
          if (board.id === source.droppableId) {
            return { ...board, items: sourceItems }
          }
          if (board.id === destination.droppableId) {
            return { ...board, items: destItems }
          }
          return board
        }),
      )
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
      <div className="mx-auto flex w-fit py-[5vh]">
        {boards.map((board) => (
          <Droppable key={board.id} droppableId={board.id}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`m-2 w-64 p-2 ${snapshot.isDraggingOver ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <h2 className="mb-2 text-center text-lg font-bold">{board.name} Board</h2>
                <div className="min-h-[100px]">
                  {board.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-2 select-none p-4
                          ${
                            snapshot.isDragging
                              ? invalidMove === item.id
                                ? 'bg-red-500'
                                : 'bg-green-200'
                              : 'bg-gray-300'
                          }
                        `}
                        >
                          {item.content}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}

const getItems = (prefix: string, count: number): Item[] =>
  Array.from({ length: count }, (_, k) => ({
    id: `${prefix}-item-${k + 1}`,
    content: `${prefix} item ${k + 1}`,
    isEven: (k + 1) % 2 === 0,
  }))
