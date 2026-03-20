function pad(value) {
    return String(value).padStart(2, "0");
}

function formatLocalDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function detectDateFormatFromSample(sampleValue) {
    if (typeof sampleValue !== "string") {
        return null;
    }

    if (/^\d{2}-\d{2}-\d{4}(?:\s|$)/.test(sampleValue)) {
        return "DD-MM-YYYY";
    }

    if (/^\d{4}-\d{2}-\d{2}(?:\s|$)/.test(sampleValue)) {
        return "YYYY-MM-DD";
    }

    return null;
}

function pickSampleValueForField(sampleData, fieldKey) {
    const firstRow = Array.isArray(sampleData) ? sampleData[0] : null;

    return (
        firstRow?.audit_obj?.[fieldKey] ??
        firstRow?.table_obj?.[fieldKey]?.masked_value ??
        firstRow?.table_obj?.[fieldKey]?.original_value ??
        null
    );
}

function decorateLocalFilters(localFilters, sampleData) {
    const filters = Array.isArray(localFilters)
        ? localFilters.map((filter) => ({ ...filter }))
        : [];

    const byKey = new Map(filters.map((filter) => [filter.key, filter]));

    for (const filter of filters) {
        if (!filter?.key || !filter.key.startsWith("from_")) {
            continue;
        }

        const suffix = filter.key.slice("from_".length);
        const pairedFilter = byKey.get(`to_${suffix}`);

        if (!pairedFilter) {
            continue;
        }

        const sampleValue = pickSampleValueForField(sampleData, suffix);
        const expectedFormat =
            detectDateFormatFromSample(sampleValue) ||
            filter.expected_format ||
            pairedFilter.expected_format ||
            "YYYY-MM-DD";

        filter.expected_format = expectedFormat;
        pairedFilter.expected_format = expectedFormat;

        if (sampleValue !== null && sampleValue !== undefined) {
            filter.example_value = sampleValue;
            pairedFilter.example_value = sampleValue;
        }
    }

    return filters;
}

function buildDateRangeCandidates(localFilters) {
    const filters = Array.isArray(localFilters) ? localFilters : [];
    const byKey = new Map(filters.map((filter) => [filter.key, filter]));
    const candidates = [];

    for (const filter of filters) {
        if (!filter?.key || !filter.key.startsWith("from_")) {
            continue;
        }

        const suffix = filter.key.slice("from_".length);
        const toKey = `to_${suffix}`;
        const pairedFilter = byKey.get(toKey);

        if (!pairedFilter) {
            continue;
        }

        const searchableText = [
            suffix,
            filter.name,
            pairedFilter.name,
            filter.type,
            pairedFilter.type
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        candidates.push({
            fromKey: filter.key,
            toKey,
            searchableText,
            expectedFormat: filter.expected_format || pairedFilter.expected_format || "YYYY-MM-DD"
        });
    }

    return candidates;
}

function normalizeOption(option) {
    if (
        typeof option === "string" ||
        typeof option === "number" ||
        typeof option === "boolean"
    ) {
        return {
            label: String(option),
            value: option
        };
    }

    if (!option || typeof option !== "object") {
        return null;
    }

    const value =
        option.value ??
        option.id ??
        option.key ??
        option.code ??
        option.name ??
        option.label;

    const label =
        option.label ??
        option.name ??
        option.value ??
        option.id ??
        option.key ??
        option.code;

    if (value === undefined && label === undefined) {
        return null;
    }

    return {
        label: String(label ?? value),
        value: value ?? label
    };
}

function buildFilterGuide(localFilters) {
    const filters = Array.isArray(localFilters) ? localFilters : [];
    const dateRangeFilters = buildDateRangeCandidates(filters).map((candidate) => ({
        kind: "date_range",
        from_key: candidate.fromKey,
        to_key: candidate.toKey,
        hint: candidate.searchableText,
        expected_format: candidate.expectedFormat,
        example_value:
            filters.find((filter) => filter.key === candidate.fromKey)?.example_value || null
    }));

    const valueFilters = filters
        .filter(
            (filter) =>
                filter?.key &&
                !filter.key.startsWith("from_") &&
                !filter.key.startsWith("to_") &&
                Array.isArray(filter.value) &&
                filter.value.length > 0
        )
        .map((filter) => ({
            kind: "value_picker",
            key: filter.key,
            name: filter.name,
            type: filter.type,
            options: filter.value
                .map(normalizeOption)
                .filter(Boolean)
                .map((option) => option.label)
        }));

    return {
        date_range_filters: dateRangeFilters,
        value_filters: valueFilters
    };
}

module.exports = {
    buildFilterGuide,
    decorateLocalFilters,
    formatLocalDate
};
