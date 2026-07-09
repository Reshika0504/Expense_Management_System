import React from "react";
import Navbar from "../Components/Landing/Navbar";
import Hero from "../Components/Landing/Hero";
import FeatureCards from "../Components/Landing/FeatureCards";
import Footer from "../Components/Landing/Footer";

const HomePage = () => {
    return (
        <div className="landing-page">
            <Navbar />
            <main>
                <Hero />
                <FeatureCards />
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;
