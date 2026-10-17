import React from "react";
import {Link} from "react-router-dom";
import Brand from "../Brand";

const Footer = () => {
    return (
        <footer className="landing-footer">
            <Link to="/" aria-label="Spendwise home"><Brand /></Link>
            <span>A brighter relationship with your money.</span>
            <p>Made with care · © 2026 Spendwise</p>
        </footer>
    );
};

export default Footer;
