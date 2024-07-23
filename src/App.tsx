import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface Item {
  id: string
  content: string
}

export default function App() {
  const getItems = (count: number): Item[] =>
    Array.from({ length: count }, (v, k) => k).map((k) => ({
      id: `item-${k}`,
      content: `item ${k}`,
    }))

  const [items, setItems] = useState<Item[]>(getItems(10))

  const reorder = (list: Item[], startIndex: number, endIndex: number): Item[] => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
  }

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }

      const newItems = reorder(items, result.source.index, result.destination.index)

      setItems(newItems)
    },
    [items],
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`w-64 p-2 ${snapshot.isDraggingOver ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                        mb-2 select-none p-4 
                        ${snapshot.isDragging ? 'bg-green-200' : 'bg-gray-300'}
                      `}
                  >
                    {item.content}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
