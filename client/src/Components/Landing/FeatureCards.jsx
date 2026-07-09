import React from "react";
import {motion} from "framer-motion";
import {FiGrid, FiPieChart, FiBarChart2, FiLock} from "react-icons/fi";

const features = [
    {
        icon: FiGrid,
        title: "Category-based Tracking",
        description: "Split expenses into categories to identify spending habits instantly.",
    },
    {
        icon: FiPieChart,
        title: "Dashboard Overview",
        description: "See income, expenses, and net balance together without digging through tables.",
    },
    {
        icon: FiBarChart2,
        title: "Actionable Reports",
        description: "Review monthly trends to cut waste and plan future budgets with confidence.",
    },
    {
        icon: FiLock,
        title: "Secure Authentication",
        description: "Keep personal finance data protected behind account-based access.",
    },
];

const metrics = [
    {value: "3-step", label: "Transaction logging"},
    {value: "Live", label: "Balance updates"},
    {value: "Monthly", label: "Insight reports"},
];

const container = {
    hidden: {opacity: 0},
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
        },
    },
};

const card = {
    hidden: {opacity: 0, y: 26},
    show: {opacity: 1, y: 0, transition: {duration: 0.45, ease: "easeOut"}},
};

const FeatureCards = () => {
    return (
        <section className="landing-features" id="features">
            <div className="landing-section-heading">
                <span>Everything after the hero stays discoverable</span>
                <h2>Built for daily expense clarity</h2>
                <p>
                    The original informational sections are now organized into cleaner cards that are easier to scan on
                    every screen size.
                </p>
            </div>

            <motion.div
                className="landing-feature-grid"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{once: true, amount: 0.22}}
            >
                {features.map(({icon: Icon, title, description}) => (
                    <motion.article key={title} className="landing-feature-card" variants={card}>
                        <div className="landing-feature-icon">
                            <Icon />
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                    </motion.article>
                ))}
            </motion.div>

            <motion.div
                className="landing-metric-grid"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{once: true, amount: 0.25}}
            >
                {metrics.map((metric) => (
                    <motion.article key={metric.label} className="landing-metric-card" variants={card}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                    </motion.article>
                ))}
            </motion.div>
        </section>
    );
};

export default FeatureCards;
