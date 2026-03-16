import React from "react";
import Layout from "../Components/Layout/Layout";
import {Link} from "react-router-dom";

const HomePage = () => {
    return (
        <Layout>
            <section className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Every Rupee. Plan Better.</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Manage your income and expenses with categories, reports, and a clean dashboard.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link to="/register" className="btn-primary">
                        Create Account
                    </Link>
                    <Link to="/login" className="btn-secondary">
                        Login
                    </Link>
                </div>
            </section>
        </Layout>
    );
};

export default HomePage;
