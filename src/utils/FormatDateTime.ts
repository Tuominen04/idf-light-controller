// Helper to format date/time to 'YYYY-MM-DD HH:mm:ss'
export function formatDateTime(dateString: string, timeString?: string): string {
    let dateObj: Date;
    if (timeString) {
        // firmwareInfo.date: "Jul 19 2025", firmwareInfo.time: "20:29:21"
        // Parse month name to number
        const [monthStr, day, year] = dateString.split(' ');
        const monthMap: { [key: string]: string } = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const month = monthMap[monthStr] || '01';
        // Build ISO string: "2025-07-19T20:29:21"
        const isoString = `${year}-${month}-${day}T${timeString}`;
        dateObj = new Date(isoString);
    } else {
        // device.lastConnected: ISO string
        dateObj = new Date(dateString);
    }
    if (isNaN(dateObj.getTime())) return dateString + (timeString ? ' ' + timeString : '');
    // Format as YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
}