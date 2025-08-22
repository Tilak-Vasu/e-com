import React, { useState, useEffect, useMemo } from 'react';
import useApi from '../hooks/useApi';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import './AdminDashboardPage.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Reusable Widget Components ---
const KPICard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
    <div className="dashboard-widget kpi-card">
        <div className="kpi-icon-wrapper">{icon}</div>
        <div className="kpi-content">
            <div className="kpi-value">{value}</div>
            <div className="kpi-title">{title}</div>
        </div>
    </div>
);

const TableWidget: React.FC<{ title: string; items: any[] }> = ({ title, items }) => (
    <div className="dashboard-widget table-widget recent-transactions-widget">
        <h4>{title}</h4>
        <table className="transaction-table">
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <td className="order-cell">
                            Order #{item.id}
                            <span className="user-email">by {item.user}</span>
                        </td>
                        <td className="payment-cell">
                            <span className="item-meta">{item.payment_method}</span>
                        </td>
                        <td className="amount-cell">
                            ${item.total_amount}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- Main Dashboard Page Component ---
const AdminDashboardPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<'monthly' | 'daily'>('monthly');
    const [dataType, setDataType] = useState<'sales' | 'orders'>('sales');
    const api = useApi();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/admin/dashboard/');
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [api]);

    // Chart Options with Legend Spacing
    const mainChartOptions = useMemo(() => {
        const isSalesChart =
            (timePeriod === 'monthly') || (timePeriod === 'daily' && dataType === 'sales');

        const options: any = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: { size: 14, weight: '600' },
                        color: '#333',
                        padding: 20, // Add padding between legend items
                        usePointStyle: true // Makes legend use point style instead of rectangles
                    },
                    // Add margin/padding around the entire legend
                    padding: {
                        top: 10,
                        bottom: 30 // This creates space between legend and chart
                    }
                }
            },
            layout: {
                padding: {
                    top: 20, // Additional top padding if needed
                    bottom: 10
                }
            },
            scales: {}
        };

        if (timePeriod === 'monthly') {
            options.scales = {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { drawOnChartArea: true, color: '#e9ecef' },
                    ticks: {
                        color: '#444',
                        font: { size: 13, weight: '600' },
                        callback: (value: number) =>
                            isSalesChart ? '$' + value.toLocaleString() : value
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: '#444',
                        font: { size: 13, weight: '600' }
                    }
                }
            };
        } else {
            // Daily chart
            options.scales = {
                y: {
                    min: 0,
                    max: dataType === 'orders' ? 10 : undefined, // limit to 10 for orders
                    ticks: {
                        stepSize: 1, // step size 1
                        color: '#444',
                        font: { size: 13, weight: '600' },
                        callback: (value: number) =>
                            dataType === 'sales'
                                ? '$' + value.toLocaleString()
                                : value
                    },
                    grid: { color: '#e9ecef' }
                },
                x: {
                    ticks: {
                        color: '#444',
                        font: { size: 13, weight: '600' }
                    },
                    grid: { color: '#e9ecef' }
                }
            };
        }

        return options;
    }, [timePeriod, dataType]);

    // Chart Data
    const mainChartData = useMemo(() => {
        if (!data) return { labels: [], datasets: [] };
        const sourceData = data.main_chart[timePeriod];

        if (timePeriod === 'monthly') {
            // Ensure months are in Jan → Dec order
            const monthOrder = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            const orderedLabels = monthOrder.filter(m => sourceData.labels.includes(m));
            const orderedSales = orderedLabels.map(m => sourceData.sales_data[sourceData.labels.indexOf(m)]);
            const orderedOrders = orderedLabels.map(m => sourceData.orders_data[sourceData.labels.indexOf(m)]);

            return {
                labels: orderedLabels,
                datasets: [
                    {
                        label: 'Sales ($)',
                        data: orderedSales,
                        backgroundColor: '#3b82f6', // brighter blue
                        borderRadius: 6,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Orders',
                        data: orderedOrders,
                        backgroundColor: '#a855f7', // brighter purple
                        borderRadius: 6,
                        yAxisID: 'y1',
                    }
                ],
            };
        } else {
            return {
                labels: sourceData.labels,
                datasets: [{
                    label: dataType === 'sales' ? 'Daily Sales ($)' : 'Daily Orders',
                    data: dataType === 'sales' ? sourceData.sales_data : sourceData.orders_data,
                    backgroundColor: dataType === 'sales' ? '#3b82f6' : '#a855f7',
                    borderRadius: 6
                }],
            };
        }
    }, [data, timePeriod, dataType]);

    const categoryChartData = useMemo(() => {
        if (!data?.category_sales_chart?.labels?.length) return { labels: [], datasets: [] };
        return {
            labels: data.category_sales_chart.labels,
            datasets: [{
                data: data.category_sales_chart.data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            }]
        };
    }, [data]);

    if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
    if (!data) return <div className="dashboard-error">Could not load dashboard data. Please try again.</div>;

    return (
        <div className="admin-dashboard-grid">
            <h1 className="dashboard-header">Dashboard</h1>

            <KPICard title="Total Income" value={`$${data.kpis.total_income}`} icon="💳" />
            <KPICard title="Total Orders" value={data.kpis.total_orders} icon="🛒" />
            <KPICard title="Total Users" value={data.kpis.total_users} icon="👥" />

            <div className="dashboard-widget chart-widget">
                <div className="widget-header">
                    <h4>Performance Overview</h4>
                    <div className="toggle-controls">
                        <div className="chart-toggle">
                            <button onClick={() => setTimePeriod('daily')} className={timePeriod === 'daily' ? 'active' : ''}>Daily</button>
                            <button onClick={() => setTimePeriod('monthly')} className={timePeriod === 'monthly' ? 'active' : ''}>Monthly</button>
                        </div>
                        {timePeriod === 'daily' && (
                            <div className="chart-toggle">
                                <button onClick={() => setDataType('sales')} className={dataType === 'sales' ? 'active' : ''}>Sales</button>
                                <button onClick={() => setDataType('orders')} className={dataType === 'orders' ? 'active' : ''}>Orders</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="chart-container">
                    <Bar data={mainChartData} options={mainChartOptions} />
                </div>
            </div>

            <div className="dashboard-widget donut-chart-widget">
                <h4>Sales by Category</h4>
                <div className="chart-container-donut">
                    <Doughnut
                        data={categoryChartData}
                        options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { position: 'right' } } }}
                    />
                </div>
            </div>

            <TableWidget title="Recent Transactions" items={data.recent_transactions} />
        </div>
    );
};

export default AdminDashboardPage;