import React from "react";

const Skeleton = ({rows = 3}) => (
    <div className="skeleton-stack" aria-label="Loading content">
        {Array.from({length: rows}).map((_, index) => (
            <div className="skeleton-row" key={index} />
        ))}
    </div>
);

export default React.memo(Skeleton);
