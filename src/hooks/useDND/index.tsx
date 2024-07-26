import { useState, useEffect, useCallback, useMemo } from 'react'
import { DraggableLocation, DropResult, DragStart, DragUpdate } from 'react-beautiful-dnd'
import { UseDNDOptions, UseDNDState, Utils } from './types'

export default function useDND<T extends { id: string; items: { id: string }[] }>({
  initialBoards,
  options = {},
}: UseDNDOptions<T>) {
  const [state, setState] = useState<UseDNDState<T>>({
    boards: initialBoards,
    selectedItemIds: [],
    invalidItemIds: [],
    errorMessage: '',
    isDragging: false,
  })

  const { clearSelectionOnEsc = true, onValidateMovement } = options

  useEffect(() => {
    if (clearSelectionOnEsc) {
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setState((prevState) => ({ ...prevState, selectedItemIds: [] }))
        }
      }

      window.addEventListener('keydown', handleEscapeKey)
      return () => window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [clearSelectionOnEsc])

  const utils: Utils<T> = useMemo(
    () => ({
      getPreviousItem: (board, index) => (index > 0 ? board.items[index - 1] : null),
      getNextItem: (board, index) =>
        index < board.items.length - 1 ? board.items[index + 1] : null,
      getUpdatedDestinationItems: (sourceBoard, destinationBoard, itemIds, destinationIndex) => {
        const movedItems = sourceBoard.items.filter((item) => itemIds.includes(item.id))
        const destinationItems = [...destinationBoard.items]

        if (sourceBoard.id === destinationBoard.id) {
          itemIds.forEach((id) => {
            const index = destinationItems.findIndex((item) => item.id === id)
            if (index !== -1) destinationItems.splice(index, 1)
          })
        }

        destinationItems.splice(destinationIndex, 0, ...movedItems)
        return destinationItems
      },
      getBoardsWithSelectedItems: (boards, selectedItemIds) =>
        boards.filter((board) => board.items.some((item) => selectedItemIds.includes(item.id))),
      getDestinationBoard: (boards, destinationId) =>
        boards.find((board) => board.id === destinationId),
      isMoveAllowedBetweenBoards: (
        sourceBoard,
        destinationBoard,
        restrictedSourceId,
        restrictedDestinationId,
      ) =>
        !(sourceBoard.id === restrictedSourceId && destinationBoard.id === restrictedDestinationId),
    }),
    [],
  )

  const validateMovement = useCallback(
    (source: DraggableLocation, destination: DraggableLocation, itemIds: string[]) => {
      if (onValidateMovement) {
        return onValidateMovement(state, utils)(source, destination, itemIds)
      }
      return { isAllowed: true, invalidItemIds: [], errorMessage: '' }
    },
    [state, utils, onValidateMovement],
  )

  const handleDragStart = useCallback((start: DragStart) => {
    setState((prevState) => ({
      ...prevState,
      selectedItemIds: prevState.selectedItemIds.includes(start.draggableId)
        ? prevState.selectedItemIds
        : [start.draggableId],
      isDragging: true,
      invalidItemIds: [],
      errorMessage: '',
    }))
  }, [])

  const handleDragUpdate = useCallback(
    (update: DragUpdate) => {
      if (!update.destination) {
        setState((prevState) => ({ ...prevState, invalidItemIds: [], errorMessage: '' }))
        return
      }

      setState((prevState) => {
        const draggedItemIds =
          prevState.selectedItemIds.length > 0 ? prevState.selectedItemIds : [update.draggableId]
        const validationResult = validateMovement(
          update.source,
          update.destination!,
          draggedItemIds,
        )
        return {
          ...prevState,
          invalidItemIds: validationResult.invalidItemIds,
          errorMessage: validationResult.errorMessage,
        }
      })
    },
    [validateMovement],
  )

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result

      setState((prevState) => {
        if (!destination) {
          return { ...prevState, isDragging: false, invalidItemIds: [], errorMessage: '' }
        }

        const itemIdsToMove =
          prevState.selectedItemIds.length > 0 ? prevState.selectedItemIds : [result.draggableId]

        const validationResult = validateMovement(source, destination, itemIdsToMove)
        if (!validationResult.isAllowed) {
          return { ...prevState, isDragging: false, invalidItemIds: [], errorMessage: '' }
        }

        const updatedBoards = [...prevState.boards]
        const sourceBoards = utils.getBoardsWithSelectedItems(updatedBoards, itemIdsToMove)
        const destinationBoard = utils.getDestinationBoard(updatedBoards, destination.droppableId)

        if (!destinationBoard) {
          return {
            ...prevState,
            isDragging: false,
            invalidItemIds: [],
            errorMessage: '목적지 보드를 찾을 수 없습니다.',
          }
        }

        sourceBoards.forEach((sourceBoard) => {
          const updatedDestinationItems = utils.getUpdatedDestinationItems(
            sourceBoard,
            destinationBoard,
            itemIdsToMove,
            destination.index,
          )

          sourceBoard.items = sourceBoard.items.filter((item) => !itemIdsToMove.includes(item.id))
          destinationBoard.items = updatedDestinationItems
        })

        return {
          ...prevState,
          boards: updatedBoards,
          selectedItemIds: [],
          isDragging: false,
          invalidItemIds: [],
          errorMessage: '',
        }
      })
    },
    [validateMovement, utils],
  )

  const handleItemClick = useCallback((itemId: string) => {
    setState((prevState) => ({
      ...prevState,
      selectedItemIds: prevState.selectedItemIds.includes(itemId)
        ? prevState.selectedItemIds.filter((id) => id !== itemId)
        : [...prevState.selectedItemIds, itemId],
    }))
  }, [])

  return {
    ...state,
    setBoards: useCallback((boards: T[]) => setState((prev) => ({ ...prev, boards })), []),
    setSelectedItemIds: useCallback(
      (selectedItemIds: string[]) => setState((prev) => ({ ...prev, selectedItemIds })),
      [],
    ),
    handleDragStart,
    handleDragUpdate,
    handleDragEnd,
    handleItemClick,
    utils,
  }
}
