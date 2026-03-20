const axios = require("axios");
const {
    buildFilterGuide,
    decorateLocalFilters,
    formatLocalDate
} = require("../services/filterInference");

module.exports = async (args = {}) => {
    const { stageId, accessToken = process.env.ACCESS_TOKEN } = args;

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
        `https://adv-mob.idamtat.in/get_sample_data_by_stageid/${stageId}?page_size=1&page_number=1`,
        {},
        { headers }
    );

    const rawFilters = response.data?.data?.local_filters || [];
    const sampleData = response.data?.data?.sample_data || [];
    const localFilters = decorateLocalFilters(rawFilters, sampleData);

    return {
        stageId,
        current_date: formatLocalDate(new Date()),
        local_filters: localFilters,
        filter_guide: buildFilterGuide(localFilters),
        guidance: [
            "Never assume filter keys. Always inspect local_filters and use the exact keys returned for that stage.",
            "For any matching date range pair such as from_* and to_*, use the expected_format or example_value returned for that stage when building getStageLeads.filters.",
            "If a filter exposes selectable values, use the exact option returned in local_filters."
        ]
    };
};
