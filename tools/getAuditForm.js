const axios = require("axios");

function readValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    return text.length ? text : null;
}

function normalizeList(value) {
    return Array.isArray(value)
        ? value
            .map((item) => readValue(item))
            .filter(Boolean)
        : [];
}

function normalizeActions(value) {
    return normalizeList(value).map((action) => action.toLowerCase());
}

function buildTemplateActions(actions, templatesByType) {
    return {
        email: {
            action_listed: actions.includes("email"),
            available: actions.includes("email") && templatesByType.email.length > 0,
            template_count: templatesByType.email.length,
            templates: templatesByType.email
        },
        sms: {
            action_listed: actions.includes("sms"),
            available: actions.includes("sms") && templatesByType.sms.length > 0,
            template_count: templatesByType.sms.length,
            templates: templatesByType.sms
        },
        whatsapp: {
            action_listed: actions.includes("whatsapp call"),
            available:
                actions.includes("whatsapp call") &&
                templatesByType.whatsapp.length > 0,
            template_count: templatesByType.whatsapp.length,
            templates: templatesByType.whatsapp
        }
    };
}

function buildSummary(secA, secB) {
    const secAFields = Array.isArray(secA) ? secA : [];
    const secBBlocks = Array.isArray(secB) ? secB : [];

    const lookupFromFields = (fields, keywords) => {
        const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());

        for (const field of fields) {
            const key = String(field?.key || "").toLowerCase();
            if (!lowerKeywords.some((keyword) => key.includes(keyword))) {
                continue;
            }

            const value = readValue(field?.value) || readValue(field?.actual_value);
            if (value) {
                return value;
            }
        }

        return null;
    };

    const lookupFromBlocks = (blocks, keywords) => {
        for (const block of blocks) {
            const value = lookupFromFields(block?.block_data || [], keywords);
            if (value) {
                return value;
            }
        }

        return null;
    };

    const leadName = lookupFromFields(secAFields, ["customer name", "lead name", "customer", "name"]);
    const interestedModel = lookupFromBlocks(secBBlocks, ["interested model", "model"]);
    const interestedVariant = lookupFromBlocks(secBBlocks, ["interested variant", "variant"]);
    const qualification = lookupFromFields(secAFields, ["lead qualification"]);
    const nextAction = lookupFromFields(secAFields, ["crc lead next action", "next action"]);
    const parts = [];

    if (interestedModel) {
        parts.push(
            `${leadName || "Lead"} is interested in ${interestedModel}${interestedVariant ? ` (${interestedVariant})` : ""}.`
        );
    }

    if (qualification) {
        parts.push(`Qualification: ${qualification}.`);
    }

    if (nextAction) {
        parts.push(`Next action: ${nextAction}.`);
    }

    if (parts.length === 0) {
        return "Section A and Section B data fetched successfully.";
    }

    return parts.join(" ");
}

module.exports = async (args = {}) => {
    try {
        const {
            stageId,
            auditPayload = {},
            accessToken = process.env.ACCESS_TOKEN
        } = args;

        if (!stageId) {
            throw new Error("stageId is required");
        }

        if (!accessToken) {
            throw new Error("accessToken is required");
        }

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        };

        const response = await axios.post(
            `https://adv-mob.idamtat.in/get_audit_form/${stageId}`,
            auditPayload,
            { headers }
        );

        const responseData = response.data?.data || {};
        const secA = Array.isArray(responseData.sec_a) ? responseData.sec_a : [];
        const secB = Array.isArray(responseData.sec_b) ? responseData.sec_b : [];
        const smsTemplates = normalizeList(responseData.sms_templates);
        const emailTemplates = normalizeList(responseData.email_templates);
        const whatsappTemplates = normalizeList(responseData.whatsapp_templates);
        const rawActions = normalizeActions(responseData.actions);
        const templateActions = buildTemplateActions(rawActions, {
            email: emailTemplates,
            sms: smsTemplates,
            whatsapp: whatsappTemplates
        });

        return {
            success: true,
            stageId,
            auditPayload,
            audit_obj: auditPayload,
            trans_unique_id:
                responseData.trans_unique_id ??
                auditPayload.Trans_Unique_Id ??
                auditPayload.trans_unique_id ??
                null,
            ticket_id:
                responseData.ticket_id ??
                auditPayload.TicketId ??
                auditPayload.ticket_id ??
                null,
            data: {
                sec_a: secA,
                sec_b: secB,
                sec_a_hidden: responseData.sec_a_hidden ?? false,
                sec_b_hidden: responseData.sec_b_hidden ?? false,
                trans_unique_id: responseData.trans_unique_id ?? null,
                ticket_id: responseData.ticket_id ?? null
            },
            raw_actions: rawActions,
            template_actions: templateActions,
            sms_templates: smsTemplates,
            email_templates: emailTemplates,
            whatsapp_templates: whatsappTemplates,
            summary: buildSummary(secA, secB),
            message: "Audit form fetched successfully"
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            message: "Failed to fetch audit form"
        };
    }
};
