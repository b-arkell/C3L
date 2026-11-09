// Sam - Validation functions
import { findConversationById, findMembership } from './repository'

export function conversationExists(conversationId: string): boolean {
    const conversation = findConversationById(conversationId)
    if (conversation != null) {
        return true
    }
    return false
}

export function isActiveMember(conversationId: string, userId: string): boolean {
    const isMember = findMembership(conversationId, userId)
    if (isMember != null)
        return true
    return false
}