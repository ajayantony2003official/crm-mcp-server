const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
    title: String,
    body: String,
    remindAt: {
        type: Date,
        index: true
    },
    userId: {
        type: String,
        index: true
    },
    stageId: String,
    auditObj: Object,
    ticketId: String,
    transUniqueId: String,
    leadName: String,
    mobileNumber: String,
    path: {
        type: String,
        default: "/lead-details"
    },
    status: {
        type: String,
        default: "pending"
    },
    lastError: String,
    sentAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model("Reminder", reminderSchema);
