import { LocalNotifications } from '@capacitor/local-notifications'

export const initNotifications = async () => {
    try {
        const perm = await LocalNotifications.requestPermissions()
        if (perm.display === 'granted') {
            await LocalNotifications.createChannel({
                id: 'deadlines',
                name: 'Terminy i Egzaminy',
                description: 'Powiadomienia o zbliżających się terminach',
                importance: 5,
                visibility: 1,
                vibration: true,
            })
        }
    } catch (e) {
        console.error('Failed to init notifications:', e)
    }
}

export const scheduleManualDeadline = async (id: string, title: string, dateStr: string) => {
    try {
        // dateStr is YYYY-MM-DD
        const deadlineDate = new Date(dateStr)
        deadlineDate.setHours(20, 0, 0, 0) // Default: 20:00

        // Notify 1 day before
        const notificationDate = new Date(deadlineDate)
        notificationDate.setDate(deadlineDate.getDate() - 1)

        // If 1 day before is in the past, try notifying today at 20:00 if it's not too late?
        // Or just skip if it's already past the notification time.
        if (notificationDate.getTime() < Date.now()) {
            // If the deadline itself is in the future, but "1 day before" is past, maybe notify immediately?
            // For now, let's stick to the rule: notify 1 day before.
            // If user adds deadline for "tomorrow", 1 day before is "today".
            // If user adds deadline for "today", 1 day before was "yesterday".
            return
        }

        // Generate numeric ID from string ID
        const notificationId = Math.abs(stringHash(id))

        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: 'Przypomnienie o terminie 📅',
                body: `Jutro: ${title}`,
                schedule: { at: notificationDate },
                channelId: 'deadlines',
                smallIcon: 'ic_stat_icon_config_sample',
                extra: { deadlineId: id }
            }]
        })
    } catch (e) {
        console.error('Failed to schedule deadline:', e)
    }
}

export const cancelDeadlineNotification = async (id: string) => {
    try {
        const notificationId = Math.abs(stringHash(id))
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] })
    } catch (e) {
        console.error('Failed to cancel notification:', e)
    }
}

function stringHash(str: string): number {
    let hash = 0, i, chr
    if (str.length === 0) return hash
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + chr
        hash |= 0
    }
    return hash
}
