export interface IItem {
  id: string
  content: string
  isEven: boolean
}

export interface IBoard {
  id: string
  name: string
  items: IItem[]
}
