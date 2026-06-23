export const formatCurrency = (value = 0) =>
    `Rs ${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })}`;

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
