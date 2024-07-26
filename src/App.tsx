import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
} from 'react-beautiful-dnd'
import { BOARDS } from './constants/dragDrop'
import useDND from './hooks/useDND'
import { Utils } from './hooks/useDND/types'
import DragStatusBar from './components/DragStatusBar'
import Layout from './components/Layout'
import Board from './components/Board'
import Item from './components/Item'

interface IItem {
  id: string
  content: string
  isEven: boolean
}

interface IBoard {
  id: string
  name: string
  items: IItem[]
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
  } = useDND<IBoard>({
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
      <DragStatusBar
        isDragging={isDragging}
        selectedItemLength={selectedItemIds.length}
        errorMessage={errorMessage}
      />
      <Layout>
        {boards.map((board) => (
          <Droppable key={board.id} droppableId={board.id}>
            {(provided: DroppableProvided, snapshot) => (
              <Board
                {...provided.droppableProps}
                ref={provided.innerRef}
                name={board.name}
                isDraggingOver={snapshot.isDraggingOver}
              >
                {board.items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided: DraggableProvided, snapshot) => (
                      <Item
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => handleItemClick(item.id)}
                        isSelected={selectedItemIds.includes(item.id)}
                        isDragging={snapshot.isDragging}
                        hasError={invalidItemIds.includes(item.id)}
                        order={selectedItemIds.indexOf(item.id) + 1}
                        content={item.content}
                      />
                    )}
                  </Draggable>
                ))}
              </Board>
            )}
          </Droppable>
        ))}
      </Layout>
    </DragDropContext>
  )
}

const generateItems = (prefix: string, count: number): IItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-item-${index + 1}`,
    content: `${prefix} item ${index + 1}`,
    isEven: (index + 1) % 2 === 0,
  }))

const getDomainSpecificUtils = (utils: Utils<IBoard>) => ({
  ...utils,
  getInvalidEvenItems: (
    sourceBoard: IBoard,
    destinationBoard: IBoard,
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
