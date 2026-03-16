import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Card, Col, Row, Select, Table} from "antd";
import AppShell from "../Components/AppShell";
import {getCategoryReport, getMonthlySummary, getTopCategories} from "../redux/slices/dashboardSlice";

const Reports = () => {
    const dispatch = useDispatch();
    const {monthlySummary, categoryReport, topCategories} = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(getMonthlySummary());
        dispatch(getCategoryReport({period: "month", type: "expense"}));
        dispatch(getTopCategories({type: "expense", limit: 5}));
    }, [dispatch]);

    const monthlyColumns = [
        {title: "Month", dataIndex: "monthName", key: "monthName"},
        {title: "Income", dataIndex: "totalIncome", key: "totalIncome", render: (value) => `Rs ${value.toLocaleString()}`},
        {
            title: "Expenses",
            dataIndex: "totalExpenses",
            key: "totalExpenses",
            render: (value) => `Rs ${value.toLocaleString()}`,
        },
        {title: "Net", dataIndex: "netBalance", key: "netBalance", render: (value) => `Rs ${value.toLocaleString()}`},
    ];

    const categoryColumns = [
        {title: "Category", dataIndex: "categoryName", key: "categoryName"},
        {title: "Transactions", dataIndex: "transactionCount", key: "transactionCount"},
        {
            title: "Amount",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (value) => `Rs ${value.toLocaleString()}`,
        },
        {title: "Share", dataIndex: "percentage", key: "percentage", render: (value) => `${value}%`},
    ];

    return (
        <AppShell title="Reports">
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Card title="Report Range">
                        <Select
                            defaultValue="month"
                            style={{width: "100%"}}
                            onChange={(period) => dispatch(getCategoryReport({period, type: "expense"}))}
                            options={[
                                {label: "This week", value: "week"},
                                {label: "This month", value: "month"},
                                {label: "This year", value: "year"},
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Top Category (30 Days)">
                        <p className="text-lg font-semibold">
                            {topCategories?.[0]?.categoryName || "No data"}
                        </p>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="Total Expense">
                        <p className="text-lg font-semibold">Rs {categoryReport?.totalAmount?.toLocaleString() || 0}</p>
                    </Card>
                </Col>
            </Row>

            <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Monthly Summary</h3>
                <Table
                    rowKey={(record) => `${record.year}-${record.month}`}
                    dataSource={monthlySummary?.monthlyData || []}
                    columns={monthlyColumns}
                    pagination={false}
                />
            </div>

            <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Category Breakdown</h3>
                <Table
                    rowKey="categoryName"
                    dataSource={categoryReport?.categories || []}
                    columns={categoryColumns}
                    pagination={false}
                />
            </div>
        </AppShell>
    );
};

export default Reports;
