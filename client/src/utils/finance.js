// Existing records are single-currency major-unit numbers; do not hide cents or invalid data.
export const formatCurrency = (value = 0) => {
    if(typeof value !== 'number' || !Number.isFinite(value))return 'Unavailable';
    return `Rs ${value.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
};

export const formatPercent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;

export const clampPercent = (value = 0) => Math.min(100, Math.max(0, Number(value || 0)));

export const getMonthLabel = (month) =>
    new Date(2026, Number(month || 1) - 1, 1).toLocaleString("en-IN", {
        month: "short",
    });

export const downloadCsv = (rows, filename) => {
    const csv = rows
    .map((row) =>
        row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
