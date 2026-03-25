// ---------------------------------------------------------------------------
// Catmull-Rom spline for smooth curves
// ---------------------------------------------------------------------------
export function catmullRomPath(points, tension = 0.3) {
    if (points.length < 2) return '';
    if (points.length === 2) return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;

    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
        const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
        const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
        const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

        d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
}

// ---------------------------------------------------------------------------
// Chart color palette
// ---------------------------------------------------------------------------
export const CHART_COLORS = [
    '#2d2826', '#dc2646', '#2563eb', '#059669', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#65a30d'
];

// ---------------------------------------------------------------------------
// Pure helper functions (no component state dependency)
// ---------------------------------------------------------------------------

export function filterForecastFromToday(forecastData) {
    if (!forecastData || !forecastData.forecast) return forecastData;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredForecast = forecastData.forecast.filter(f => {
        const forecastDate = new Date(f.date);
        forecastDate.setHours(0, 0, 0, 0);
        return forecastDate >= today;
    });
    return { ...forecastData, forecast: filteredForecast };
}

export function transformProphetData(forecast, range) {
    if (!forecast || !forecast.length) return [];

    let pointsToShow = forecast.length;
    let groupBy = 1;

    if (range === 'upcomingYear') groupBy = 30;
    else if (range === 'upcomingMonth') groupBy = 7;
    else if (range === '8weeks') groupBy = 7;
    else if (range === '7days') pointsToShow = Math.min(7, forecast.length);

    const grouped = [];

    if (range === '7days') {
        for (let i = 0; i < Math.min(7, forecast.length); i++) {
            const dataPoint = forecast[i];
            const date = new Date(dataPoint.date);
            grouped.push({
                day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                predicted: Math.round(dataPoint.yhat * 10) / 10
            });
        }
    } else if (range === 'upcomingMonth') {
        const daysToShow = Math.min(4 * 7, forecast.length);
        for (let i = 0; i < daysToShow; i += groupBy) {
            const slice = forecast.slice(i, i + groupBy);
            if (slice.length === 0) break;
            const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
            const date = new Date(slice[0].date);
            grouped.push({
                day: `Week ${Math.floor(i / 7) + 1}`,
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                predicted: Math.round(avgYhat * 10) / 10
            });
        }
    } else if (range === '8weeks') {
        const daysToShow = Math.min(8 * 7, forecast.length);
        for (let i = 0; i < daysToShow; i += groupBy) {
            const slice = forecast.slice(i, i + groupBy);
            if (slice.length === 0) break;
            const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
            const date = new Date(slice[0].date);
            grouped.push({
                day: `Week ${Math.floor(i / 7) + 1}`,
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                predicted: Math.round(avgYhat * 10) / 10
            });
        }
    } else if (range === 'upcomingYear') {
        const monthlyData = {};
        forecast.forEach(f => {
            const date = new Date(f.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { values: [], firstDate: date };
            monthlyData[monthKey].values.push(f.yhat);
        });
        Object.keys(monthlyData).sort().forEach(monthKey => {
            const data = monthlyData[monthKey];
            const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
            grouped.push({
                day: data.firstDate.toLocaleDateString('en-GB', { month: 'short' }),
                date: data.firstDate.toLocaleDateString('en-GB', { year: 'numeric' }),
                predicted: Math.round(avgYhat * 10) / 10
            });
        });
    } else if (range === 'custom') {
        const totalDays = forecast.length;
        if (totalDays > 60) {
            const monthlyData = {};
            forecast.forEach(f => {
                const date = new Date(f.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) monthlyData[monthKey] = { values: [], firstDate: date };
                monthlyData[monthKey].values.push(f.yhat);
            });
            Object.keys(monthlyData).sort().forEach(monthKey => {
                const data = monthlyData[monthKey];
                const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
                grouped.push({
                    day: data.firstDate.toLocaleDateString('en-GB', { month: 'short' }),
                    date: data.firstDate.toLocaleDateString('en-GB', { year: 'numeric' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            });
            return grouped;
        }
        if (totalDays > 14) groupBy = 7;
        for (let i = 0; i < pointsToShow; i += groupBy) {
            const slice = forecast.slice(i, i + groupBy);
            const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
            const date = new Date(slice[0].date);
            if (groupBy === 7) {
                grouped.push({
                    day: `Week ${Math.floor(i / 7) + 1}`,
                    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            } else {
                grouped.push({
                    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            }
        }
    }

    return grouped;
}

export function calcForecastTrend(forecasts) {
    if (!forecasts || forecasts.length === 0) return null;
    const allPoints = forecasts.flatMap(f => f.forecast || []);
    if (allPoints.length < 2) return null;
    const mid = Math.floor(allPoints.length / 2);
    const avgFirst = allPoints.slice(0, mid).reduce((s, p) => s + p.yhat, 0) / mid;
    const avgSecond = allPoints.slice(mid).reduce((s, p) => s + p.yhat, 0) / (allPoints.length - mid);
    if (avgFirst === 0) return null;
    return ((avgSecond - avgFirst) / avgFirst) * 100;
}

export function getTrainingDays(dateRange) {
    if (!dateRange) return 'N/A';
    const [startDay, startMonth, startYear] = dateRange.start.split('/');
    const [endDay, endMonth, endYear] = dateRange.end.split('/');
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    return Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
}

export function getMaxForecastMonths(dateRangeEnd) {
    if (!dateRangeEnd) return 7;
    const lastDataDate = new Date(dateRangeEnd.split('/').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxForecastDate = new Date(lastDataDate);
    maxForecastDate.setDate(maxForecastDate.getDate() + (52 * 7));
    const monthsAvailable = Math.round((maxForecastDate - today) / (30.44 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(12, monthsAvailable));
}
