const cron = require("node-cron");
const Reminder = require("../models/reminder.model");
const User = require("../models/user.model");
const admin = require("../utils/firebase");

function buildDataPayload(reminder) {
    return {
        path: reminder.path || "/lead-details",
        stage_id: String(reminder.stageId || ""),
        audit_obj: JSON.stringify(reminder.auditObj || {}),
        title: String(reminder.title || "Reminder 🔔"),
        body: String(reminder.body || "Tap to open the audit form"),
        ticket_id: reminder.ticketId ? String(reminder.ticketId) : "",
        trans_unique_id: reminder.transUniqueId ? String(reminder.transUniqueId) : "",
        lead_name: reminder.leadName ? String(reminder.leadName) : "",
        mobile_number: reminder.mobileNumber ? String(reminder.mobileNumber) : "",
        source: "server_reminder"
    };
}

const startReminderWorker = () => {
    cron.schedule("* * * * *", async () => {
        const now = new Date();

        try {
            const reminders = await Reminder.find({
                remindAt: { $lte: now },
                status: "pending"
            });

            for (const reminder of reminders) {
                try {
                    const user = await User.findOne({ userId: reminder.userId });

                    if (!user?.fcmToken) {
                        reminder.lastError = "FCM token not found for user";
                        await reminder.save();
                        console.warn("Reminder skipped. Missing FCM token for user:", reminder.userId);
                        continue;
                    }

                    await admin.messaging().send({
                        token: user.fcmToken,
                        notification: {
                            title: reminder.title || "Reminder 🔔",
                            body: reminder.body || "Tap to open the audit form"
                        },
                        data: buildDataPayload(reminder),
                        android: {
                            priority: "high",
                            notification: {
                                channelId: "lead_reminder_channel"
                            }
                        },
                        apns: {
                            payload: {
                                aps: {
                                    sound: "default"
                                }
                            }
                        }
                    });

                    reminder.status = "sent";
                    reminder.lastError = null;
                    reminder.sentAt = new Date();
                    await reminder.save();

                    console.log("✅ Notification sent:", reminder.title);
                } catch (error) {
                    reminder.lastError = error.message;
                    await reminder.save();
                    console.error("Reminder send failed:", error);
                }
            }
        } catch (error) {
            console.error("Reminder worker failed:", error);
        }
    });
};

module.exports = { startReminderWorker };
