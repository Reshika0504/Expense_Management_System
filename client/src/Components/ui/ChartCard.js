import React from "react";

const ChartCard = ({title, subtitle, children}) => (
    <section className="finance-card chart-card">
        <div className="chart-card-header">
            <div>
                <h3>{title}</h3>
                {subtitle && <p>{subtitle}</p>}
            </div>
        </div>
        <div className="chart-card-body">{children}</div>
    </section>
);

export default React.memo(ChartCard);
