import { Reservation } from "../entity/Reservation"
import { User } from "../entity/User"
import { Place } from "../entity/Place"

export interface ReservationMessage {
    type: 'RESERVATION_CREATED' | 'RESERVATION_CHECKED_IN' | 'RESERVATION_CANCELLED' | 'RESERVATION_NO_SHOW'
    reservationId: number
    userId: number
    userEmail?: string
    userName: string
    placeLabel: string
    reservationDate: string
    expiresAt: string
    timestamp: string
}


class MessageQueueService {
    private queueUrl: string | undefined
    private enabled: boolean
    
    constructor() {
        this.queueUrl = process.env.QUEUE_URL
        this.enabled = process.env.ENABLE_QUEUE === 'true'
        
        if (this.enabled && !this.queueUrl) {
            console.warn('Message queue is enabled but QUEUE_URL is not set')
        }
    }
    
    async sendReservationMessage(message: ReservationMessage): Promise<void> {
        if (!this.enabled) {
            // console.log('[Queue Disabled] Would send message:', JSON.stringify(message, null, 2))
            return
        }
        
        try {
            await this.sendToQueue(message)
            // console.log('[Queue] Message sent successfully:', message.type, message.reservationId)
        } catch (error) {
            console.error('[Queue] Failed to send message:', error)
      
        }
    }
    
    private async sendToQueue(message: ReservationMessage): Promise<void> {
        console.log('[Queue] Sending message to queue:', this.queueUrl || 'console')
        // console.log(JSON.stringify(message, null, 2))
    }
    
    createReservationCreatedMessage(reservation: Reservation): ReservationMessage {
        return {
            type: 'RESERVATION_CREATED',
            reservationId: reservation.id,
            userId: reservation.user.id,
            userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
            placeLabel: reservation.place.label,
            reservationDate: new Date(reservation.reservationDate).toISOString(),
            expiresAt: new Date(reservation.expiresAt).toISOString(),
            timestamp: new Date().toISOString()
        }
    }
    
    createReservationCheckedInMessage(reservation: Reservation): ReservationMessage {
        return {
            type: 'RESERVATION_CHECKED_IN',
            reservationId: reservation.id,
            userId: reservation.user.id,
            userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
            placeLabel: reservation.place.label,
            reservationDate: new Date(reservation.reservationDate).toISOString(),
            expiresAt: new Date(reservation.expiresAt).toISOString(),
            timestamp: new Date().toISOString()
        }
    }
}

export const messageQueueService = new MessageQueueService()
