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

module.exports = async (args = {}) => {
    const {
        stageId,
        transUniqueId,
        templateName,
        accessToken = process.env.ACCESS_TOKEN
    } = args;
    const type = normalizeType(args.type);
    const toAddress =
        readValue(args.toAddress) ||
        readValue(args.toNumber) ||
        readValue(args.to_number) ||
        readValue(args.recipient);

    if (!stageId) {
        throw new Error("stageId is required");
    }

    if (!transUniqueId) {
        throw new Error("transUniqueId is required");
    }

    if (!templateName) {
        throw new Error("templateName is required");
    }

    if (!toAddress) {
        throw new Error("toAddress is required");
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
        to_number: toAddress,
        type,
        template_name: String(templateName),
        trans_unique_id: String(transUniqueId)
    });

    try {
        const response = await axios.post(
            `https://adv-mob.idamtat.in/submit_template_data/?${params.toString()}`,
            {},
            { headers }
        );

        return {
            success: response.data?.success ?? true,
            stageId,
            type,
            template_name: String(templateName),
            to_address: toAddress,
            trans_unique_id: String(transUniqueId),
            data: response.data?.data ?? null,
            message: response.data?.message || "Template sent successfully"
        };
    } catch (error) {
        return {
            success: false,
            stageId,
            type,
            template_name: String(templateName),
            to_address: toAddress,
            trans_unique_id: String(transUniqueId),
            error: error.response?.data || error.message,
            message: "Failed to send template"
        };
    }
};
