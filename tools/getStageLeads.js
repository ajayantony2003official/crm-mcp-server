const axios = require("axios");

module.exports = async (args = {}) => {
    const {
        stageId,
        filters,
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

    const body = filters || {};

    const countResponse = await axios.post(
        `https://adv-mob.idamtat.in/get_sample_count_by_stageid/${stageId}`,
        body,
        { headers }
    );

    const totalCount = Number(
        Object.values(countResponse.data?.data?.sample_count || {})[0] || 0
    );

    if (totalCount === 0) {
        return {
            total_count: 0,
            filters_used: body,
            leads: []
        };
    }

    const pageSize = 50;
    const totalPages = Math.ceil(totalCount / pageSize);
    const allLeads = [];
    let columnMap = null;

    for (let page = 1; page <= totalPages; page += 1) {
        const response = await axios.post(
            `https://adv-mob.idamtat.in/get_sample_data_by_stageid/${stageId}?page_size=${pageSize}&page_number=${page}`,
            body,
            { headers }
        );

        const leads = response.data?.data?.sample_data || [];

        if (!columnMap) {
            const columns = response.data?.data?.columns || [];
            columnMap = {};

            columns.forEach((column) => {
                columnMap[column.field_name] = column.label_name;
            });
        }

        for (const lead of leads) {
            const tableObj = lead.table_obj || {};
            const parsedRow = {};

            for (const key of Object.keys(tableObj)) {
                const label = columnMap[key] || key;
                parsedRow[label] = tableObj[key]?.masked_value;
            }

            allLeads.push({
                parsed: parsedRow,
                audit_obj: lead.audit_obj
            });
        }
    }

    return {
        total_count: totalCount,
        filters_used: body,
        leads: allLeads,
        guidance: {
            ui_usage: {
                table_data: "Use parsed object to render leads in list/table UI",
                detail_data: "Use audit_obj to open full lead details screen"
            },
            next_api: {
                description: "Use audit_obj fields for further API calls like open lead, update lead, or allocate lead",
                body_example: {
                    StageId: "audit_obj.StageId",
                    TicketId: "audit_obj.TicketId",
                    Trans_Unique_Id: "audit_obj.Trans_Unique_Id"
                }
            }
        }
    };
};
