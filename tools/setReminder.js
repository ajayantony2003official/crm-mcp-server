module.exports = async (args = {}) => {
    const { accessToken: _accessToken, ...reminder } = args;

    return {
        success: false,
        message: "setReminder is not implemented yet",
        reminder
    };
};
