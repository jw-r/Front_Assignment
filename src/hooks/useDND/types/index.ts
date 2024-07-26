import { DraggableLocation } from 'react-beautiful-dnd'

export interface ValidationResult {
  isAllowed: boolean
  invalidItemIds: string[]
  errorMessage: string
}

export type ValidateMovementFn = (
  source: DraggableLocation,
  destination: DraggableLocation,
  itemIds: string[],
) => ValidationResult

export interface Utils<T extends { id: string; items: { id: string }[] }> {
  getPreviousItem: (board: T, index: number) => T['items'][number] | null
  getNextItem: (board: T, index: number) => T['items'][number] | null
  getUpdatedDestinationItems: (
    sourceBoard: T,
    destinationBoard: T,
    itemIds: string[],
    destinationIndex: number,
  ) => T['items']
  getBoardsWithSelectedItems: (boards: T[], selectedItemIds: string[]) => T[]
  getDestinationBoard: (boards: T[], destinationId: string) => T | undefined
  isMoveAllowedBetweenBoards: (
    sourceBoard: T,
    destinationBoard: T,
    restrictedSourceId: string,
    restrictedDestinationId: string,
  ) => boolean
}

export interface UseDNDState<T> {
  boards: T[]
  selectedItemIds: string[]
  invalidItemIds: string[]
  errorMessage: string
  isDragging: boolean
}

export interface UseDNDOptions<T extends { id: string; items: { id: string }[] }> {
  initialBoards: T[]
  options?: {
    clearSelectionOnEsc?: boolean
    onValidateMovement?: (state: UseDNDState<T>, utils: Utils<T>) => ValidateMovementFn
  }
}
