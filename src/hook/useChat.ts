import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChatInterface, MessageInterface } from '../interfaces/IChat'
import { chatService } from '../services/chat/chatService'

export function useChat(userId: number, selectedChatId: number | null) {
  const queryClient = useQueryClient()

  const chatsQuery = useQuery<ChatInterface[]>({
    queryKey: ['chats'],
    queryFn: () => chatService.getChats(userId),
    enabled: !!userId,
    refetchInterval: 2000
  })

  const messagesQuery = useQuery<MessageInterface[]>({
    queryKey: ['messages', selectedChatId],
    queryFn: () => chatService.getMessages(selectedChatId!),
    enabled: !!selectedChatId,
    refetchInterval: 2000
  })

  const sendMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: number; content: string }) =>
      chatService.sendMessage(chatId, userId, content),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChatId] })
  })

  const createChatMutation = useMutation({
    mutationFn: ({
      name,
      participant
    }: {
      name: string
      participant: number
    }) => chatService.createChat(name, userId, participant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] })
  })

  return {
    chatsQuery,
    messagesQuery,
    sendMutation,
    createChatMutation
  }
}
