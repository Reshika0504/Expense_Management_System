import React from "react";

const KpiCard = ({label, value, detail, accent = "sky", icon}) => (
    <section className={`finance-card kpi-card accent-${accent}`} aria-label={label}>
        <div className="kpi-card-top">
            <span className="kpi-icon" aria-hidden="true">
                {icon}
            </span>
            <span className="kpi-label">{label}</span>
        </div>
        <strong className="kpi-value">{value}</strong>
        {detail && <p className="kpi-detail">{detail}</p>}
    </section>
);

export default React.memo(KpiCard);
