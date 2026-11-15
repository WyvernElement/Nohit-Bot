function formatTimestamp(time){
    const date = new Date(time);
    if(Number.isNaN(date.getTime())){
        return String(time);
    }
    const zone = {timeZone: "America/New_York"};
    const dateString = date.toLocaleDateString("en-US", zone);
    const timeString = date.toLocaleTimeString("en-US", {
        ...zone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).replace(/\u202f/g, "");
    return `${dateString} ${timeString}`;
}
module.exports = {formatTimestamp}