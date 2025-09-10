// interfaces/IChat.ts
export interface IChatRoom {
  id?: string
  participants: string[]
  createdAt?: Date
}

export interface IMessage {
  id?: string
  roomId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'location'
  createdAt?: Date
}

export interface IChatRoomWithMessages extends IChatRoom {
  messages: IMessage[]
}
