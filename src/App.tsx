import { useState } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggableLocation,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'
import { BOARDS } from './constants/dragDrop'

interface Item {
  id: string
  content: string
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

  const onDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) {
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
    <DragDropContext onDragEnd={onDragEnd}>
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
                          ${snapshot.isDragging ? 'bg-green-200' : 'bg-gray-300'}
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
  }))
