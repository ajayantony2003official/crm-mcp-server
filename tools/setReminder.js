const Reminder = require("../models/reminder.model");
const User = require("../models/user.model");

function normalizeStageId(stageId, auditObj = {}) {
    return (
        stageId ||
        auditObj.StageId ||
        auditObj.stageId ||
        null
    );
}

function normalizeAuditPayload(args = {}) {
    return args.auditObj || args.auditPayload || args.audit_obj || null;
}

function resolveReminderDate({ remindAt, relativeMinutes }) {
    if (relativeMinutes !== undefined && relativeMinutes !== null && relativeMinutes !== "") {
        const minutes = Number(relativeMinutes);

        if (!Number.isFinite(minutes) || minutes <= 0) {
            throw new Error("relativeMinutes must be a positive number");
        }

        return new Date(Date.now() + minutes * 60 * 1000);
    }

    const remindAtDate = new Date(remindAt);
    if (!remindAt || Number.isNaN(remindAtDate.getTime())) {
        throw new Error("Valid remindAt or relativeMinutes is required for setReminder");
    }

    return remindAtDate;
}

module.exports = async (args = {}) => {
    const {
        title,
        body,
        remindAt,
        relativeMinutes,
        userId,
        fcmToken,
        stageId,
        ticketId,
        transUniqueId,
        leadName,
        mobileNumber,
        path
    } = args;
    const auditObj = normalizeAuditPayload(args);
    const resolvedStageId = normalizeStageId(stageId, auditObj || {});
    const remindAtDate = resolveReminderDate({ remindAt, relativeMinutes });

    if (!userId) {
        throw new Error("userId is required for setReminder");
    }

    if (!resolvedStageId) {
        throw new Error("stageId is required for setReminder");
    }

    if (!auditObj || typeof auditObj !== "object") {
        throw new Error("auditPayload is required for setReminder");
    }

    if (userId && fcmToken) {
        await User.updateOne(
            { userId },
            {
                $set: {
                    userId,
                    fcmToken
                }
            },
            { upsert: true }
        );
    }

    const reminder = await Reminder.create({
        title: title || "Lead follow-up reminder",
        body: body || "Tap to open the audit form",
        remindAt: remindAtDate,
        userId,
        stageId: String(resolvedStageId),
        auditObj,
        ticketId:
            ticketId ||
            auditObj.TicketId ||
            auditObj.ticket_id ||
            null,
        transUniqueId: String(
            transUniqueId ||
            auditObj.Trans_Unique_Id ||
            auditObj.trans_unique_id ||
            ""
        ) || null,
        leadName: leadName || null,
        mobileNumber: mobileNumber || null,
        path: path || "/lead-details"
    });

    return {
        success: true,
        message: "Reminder created successfully",
        reminderId: reminder._id,
        remindAt: reminder.remindAt,
        relativeMinutes: relativeMinutes ?? null,
        stageId: reminder.stageId,
        audit_obj: reminder.auditObj,
        ticket_id: reminder.ticketId,
        trans_unique_id: reminder.transUniqueId
    };
};
