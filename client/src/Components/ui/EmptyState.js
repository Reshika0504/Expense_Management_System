import React from "react";

const EmptyState = ({title = "No data yet", message = "Add transactions to see this section."}) => (
    <div className="empty-state" role="status">
        <div className="empty-state-mark" aria-hidden="true">
            Rs
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
    </div>
);

export default React.memo(EmptyState);
