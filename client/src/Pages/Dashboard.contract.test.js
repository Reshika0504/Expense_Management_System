import React from "react";
import { render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import Dashboard from "./Dashboard";
import { rootReducer } from "../redux/store";
import api from "../services/api";
import fixture from "../test-fixtures/finance-contract.json";
import { formatCurrency } from "../utils/finance";
jest.mock("../services/api", () => ({
    __esModule: true,
    default: { get: jest.fn() },
    apiErrorMessage: (_e, f) => f,
}));
jest.mock("recharts", () => {
    const React = require("react");
    const Container = ({ children }) =>
        React.createElement("div", null, children);
    const Empty = () => null;
    return {
        ResponsiveContainer: Container,
        AreaChart: Container,
        PieChart: Container,
        BarChart: Container,
        LineChart: Container,
        Area: Empty,
        Pie: Empty,
        Bar: Empty,
        Line: Empty,
        Cell: Empty,
        XAxis: Empty,
        YAxis: Empty,
        Tooltip: Empty,
        Legend: Empty,
        CartesianGrid: Empty,
    };
});
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});
const renderDashboard = (overview) => {
    api.get.mockImplementation((path) =>
        Promise.resolve({
            data: path.startsWith("/categories")
                ? { categories: [] }
                : path.startsWith("/dashboard/overview")
                  ? { overview }
                  : path.startsWith("/dashboard/monthly-summary")
                    ? { monthlyData: [] }
                    : path.startsWith("/dashboard/category-report")
                      ? { categories: [] }
                      : { topCategories: [] },
        }),
    );
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: {
            auth: {
                user: {
                    id: "synthetic",
                    name: "Synthetic User",
                    monthlyIncome: 50000,
                    themePreference: "light",
                },
                token: "synthetic",
                isAuthenticated: true,
                loading: false,
            },
        },
    });
    render(
        <Provider store={store}>
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        </Provider>,
    );
};
test("API fixture flows through Redux and real dashboard without hiding cents or showing zero", async () => {
    renderDashboard(fixture.overview);
    const region = await screen.findByRole("region", {
        name: "Total Expenses",
    });
    await within(region).findByText("Rs 0.30");
    expect(
        within(screen.getByRole("region", { name: "Total Income" })).getByText(
            "Rs 10.00",
        ),
    ).toBeInTheDocument();
    expect(
        within(screen.getByRole("region", { name: "Net Savings" })).getByText(
            "Rs 9.70",
        ),
    ).toBeInTheDocument();
});
test("zero recorded income does not become configured income or invented savings", async () => {
    renderDashboard({
        ...fixture.overview,
        currentMonth: {
            totalIncome: 0,
            totalExpenses: 12.34,
            netBalance: -12.34,
            transactionCount: 1,
        },
    });
    await within(
        await screen.findByRole("region", { name: "Total Expenses" }),
    ).findByText("Rs 12.34");
    expect(
        within(screen.getByRole("region", { name: "Total Income" })).getByText(
            "Rs 0.00",
        ),
    ).toBeInTheDocument();
    expect(
        within(screen.getByRole("region", { name: "Net Savings" })).getByText(
            "Rs -12.34",
        ),
    ).toBeInTheDocument();
});
test("invalid numeric display data is unavailable, never a successful zero", () => {
    for (const value of [NaN, Infinity, null, "invalid"])
        expect(formatCurrency(value)).toBe("Unavailable");
});
test('missing API totals show a retryable unavailable state rather than invented zero cards',async()=>{
    renderDashboard(undefined);
    await screen.findByText('Your recorded totals are unavailable');
    expect(screen.queryByRole('region',{name:'Total Income'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Try again'})).toBeInTheDocument();
});
