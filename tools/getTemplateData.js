const axios = require("axios");

const SUPPORTED_TEMPLATE_TYPES = new Set(["email", "sms"]);

function readValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    return text.length ? text : null;
}

function normalizeType(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function normalizeRecipientOptions(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => ({
            actual_value: readValue(item?.actual_value) || "",
            masked_value: readValue(item?.masked_value) || "",
            is_default: item?.is_default === true
        }))
        .filter((item) => item.actual_value);
}

module.exports = async (args = {}) => {
    const {
        stageId,
        transUniqueId,
        templateName,
        accessToken = process.env.ACCESS_TOKEN
    } = args;
    const type = normalizeType(args.type);

    if (!stageId) {
        throw new Error("stageId is required");
    }

    if (!transUniqueId) {
        throw new Error("transUniqueId is required");
    }

    if (!templateName) {
        throw new Error("templateName is required");
    }

    if (!SUPPORTED_TEMPLATE_TYPES.has(type)) {
        throw new Error("type must be either email or sms");
    }

    if (!accessToken) {
        throw new Error("accessToken is required");
    }

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
    };

    const params = new URLSearchParams({
        stage_id: String(stageId),
        type,
        template_name: String(templateName),
        trans_unique_id: String(transUniqueId)
    });

    try {
        const response = await axios.get(
            `https://adv-mob.idamtat.in/get_template_data/?${params.toString()}`,
            { headers }
        );

        const responseData = response.data?.data || {};
        const recipientOptions = normalizeRecipientOptions(responseData.numbers);
        const defaultRecipient =
            recipientOptions.find((item) => item.is_default)?.actual_value || null;
        const messagePreview =
            readValue(responseData.body) ||
            "Hi, we've sent you a message from our CRM system.";

        return {
            success: true,
            stageId,
            type,
            template_name: String(templateName),
            trans_unique_id: String(transUniqueId),
            is_manual: responseData.is_manual === true,
            recipient_count: recipientOptions.length,
            recipient_options: recipientOptions,
            default_recipient: defaultRecipient,
            message_preview: messagePreview,
            message: "Template data fetched successfully"
        };
    } catch (error) {
        return {
            success: false,
            stageId,
            type,
            template_name: String(templateName),
            trans_unique_id: String(transUniqueId),
            error: error.response?.data || error.message,
            message: "Failed to fetch template data"
        };
    }
};
