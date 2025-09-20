// AdminDashboardPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import useApi from '../hooks/useApi'; // Assuming you have this custom hook
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
import { Link } from 'react-router-dom'; // --- IMPORT for navigation ---
import PerformanceMetricsWidget from '../components/admin/PerformanceMetricsWidget';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- HSL-Based Dynamic Color Generation ---
const generateDistinctColors = (count: number): string[] => {
    const colors: string[] = [];
    const goldenRatio = 0.618033988749895;
    let hue = Math.random();
    
    for (let i = 0; i < count; i++) {
        hue += goldenRatio;
        hue %= 1;
        
        const hueDegrees = Math.floor(hue * 360);
        const saturation = 65 + (i % 3) * 10;
        const lightness = 50 + (i % 2) * 10;
        
        colors.push(`hsl(${hueDegrees}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
};

// --- Hash-based consistent colors (for consistent category colors) ---
const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 4) * 8;
    const lightness = 45 + (Math.abs(hash) % 3) * 8;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// --- Reusable Widget Components ---

const KPICard: React.FC<{ title: string; value: string | number; icon: string; to?: string }> = ({ title, value, icon, to }) => {
    const cardContent = (
        <div className="dashboard-widget kpi-card">
            <div className="kpi-icon-wrapper">{icon}</div>
            <div className="kpi-content">
                <div className="kpi-value">{value}</div>
                <div className="kpi-title">{title}</div>
            </div>
        </div>
    );

    if (to) {
        return (
            <Link to={to} className="nav-kpi-link">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

const TableWidget: React.FC<{ title: string; items: any[] }> = ({ title, items }) => (
    <div className="dashboard-widget table-widget recent-transactions-widget">
        <h4>{title}</h4>
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Order Details</th>
                        <th className="cell-center">Payment</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="cell-user">
                                Order #{item.id}
                            <span className="subtext">by {item.user || 'Anonymous'}</span>                            
                            </td>
                            <td className="cell-payment">
                                <span className="status-pill status-neutral">{item.payment_method}</span>
                            </td>
                            <td className="cell-amount">${item.total_amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const InventoryInsightsWidget: React.FC<{ title: string; items: any[] }> = ({ title, items }) => {
    
    const getStatusClass = (status: string) => {
        if (status === 'Critical') return 'status-critical';
        if (status === 'Warning') return 'status-warning';
        if (status === 'Stale') return 'status-stale'; // Handles unsold products
        return 'status-ok';
    };

    return (
        <div className="dashboard-widget table-widget inventory-insights-widget">
            <h4>{title}</h4>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th className="cell-center">Last Month Sales</th>
                            <th className="cell-center">Current Stock</th>
                            <th className="cell-center">Suggested Order</th>
                            <th>AI Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.product_id}>
                                <td className="cell-product">{item.product_name}</td>
                                <td className="cell-center">{item.previous_month_sales}</td>
                                <td className="cell-center">{item.current_stock}</td>
                                <td className="cell-center cell-suggestion">
                                    {item.suggested_order_quantity > 0 ? item.suggested_order_quantity : '-'}
                                </td>
                                <td>
                                    <span className={`status-pill ${getStatusClass(item.ai_status)}`}>
                                        {item.ai_recommendation}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Dashboard Page Component ---

const AdminDashboardPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<'monthly' | 'daily'>('monthly');
    const [dataType, setDataType] = useState<'sales' | 'orders'>('sales');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [colorMethod, setColorMethod] = useState<'dynamic' | 'hash'>('hash');
    const api = useApi();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch data for the selected year
                const response = await api.get(`/admin/dashboard/?year=${selectedYear}`);
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setData(null); // Clear data on error
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [api, selectedYear]);

    const mainChartOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return label.includes('Sales') ? `${label}: $${value.toLocaleString()}` : `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: { display: true, text: 'Sales ($)' },
                ticks: { callback: (value: any) => '$' + value.toLocaleString() }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: { display: true, text: 'Orders' },
                grid: { drawOnChartArea: false }
            },
        },
    }), []);
    
    const mainChartData = useMemo(() => {
        if (!data?.main_chart?.[timePeriod]) return { labels: [], datasets: [] };
        const source = data.main_chart[timePeriod];
        
        const salesDataset = {
            label: timePeriod === 'monthly' ? 'Sales ($)' : 'Daily Sales ($)',
            data: source.sales_data,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
            yAxisID: 'y'
        };

        const ordersDataset = {
            label: timePeriod === 'monthly' ? 'Orders' : 'Daily Orders',
            data: source.orders_data,
            backgroundColor: '#a855f7',
            borderColor: '#9333ea',
            borderWidth: 1,
            yAxisID: 'y1'
        };

        if (timePeriod === 'monthly') {
            return { labels: source.labels, datasets: [salesDataset, ordersDataset] };
        }
        
        // For daily view, show one dataset at a time based on dataType state
        return {
            labels: source.labels,
            datasets: [dataType === 'sales' ? salesDataset : ordersDataset],
        };
    }, [data, timePeriod, dataType]);

    const categoryChartData = useMemo(() => {
        if (!data?.category_sales_chart?.labels?.length) return { labels: [], datasets: [] };
        
        const labels = data.category_sales_chart.labels;
        const categoryColors = colorMethod === 'dynamic'
            ? generateDistinctColors(labels.length)
            : labels.map((label: string) => stringToColor(label));

        return {
            labels,
            datasets: [{
                data: data.category_sales_chart.data,
                backgroundColor: categoryColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }, [data, colorMethod]);

    const categoryChartOptions = useMemo(() => ({
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { position: 'right' as const, labels: { padding: 15, usePointStyle: true, font: { size: 12 } } },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        }
    }), []);

    const YearSelector = () => (
        <div className="year-selector">
            <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Select year"
                disabled={!data?.chart_meta?.available_years}
            >
                {data?.chart_meta?.available_years?.map((year: number) => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
    );

    const ColorMethodToggle = () => (
        <div className="color-method-toggle">
            <button
                onClick={() => setColorMethod(prev => prev === 'dynamic' ? 'hash' : 'dynamic')}
                title="Toggle color generation method"
            >
                🎨 {colorMethod === 'dynamic' ? 'Dynamic' : 'Consistent'} Colors
            </button>
        </div>
    );

    if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
    if (!data) return <div className="dashboard-error">Could not load dashboard data. Please try again later.</div>;

    return (
        <div className="admin-dashboard-grid">
            <h1 className="dashboard-header">Admin Dashboard</h1>

            <KPICard title="Total Income" value={`$${data.kpis.total_income}`} icon="💳" />
            <KPICard title="Total Orders" value={data.kpis.total_orders} icon="🛒" />
            <KPICard title="Total Users" value={data.kpis.total_users} icon="👥" />
            <KPICard 
                title="Document Assistant" 
                value="Policy Docs" 
                icon="📄" 
                to="/admin/documents" 
            />
        {data.performance_metrics && <PerformanceMetricsWidget data={data.performance_metrics} />}

            <div className="dashboard-widget chart-widget main-chart">
                <div className="widget-header">
                    <h4>Performance Overview</h4>
                    <div className="all-controls-wrapper">
                        <YearSelector />
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
                </div>
                <div className="chart-container">
                    <Bar data={mainChartData} options={mainChartOptions} />
                </div>
            </div>

            <div className="dashboard-widget donut-chart-widget">
                <div className="widget-header">
                    <h4>Sales by Category</h4>
                    <ColorMethodToggle />
                </div>
                <div className="chart-container-donut">
                    <Doughnut data={categoryChartData} options={categoryChartOptions} />
                </div>
            </div>

            <div className="recent-transactions-widget">
                <TableWidget title="Recent Transactions" items={data.recent_transactions} />
            </div>

            {data.inventory_insights && data.inventory_insights.length > 0 && (
                <div className="inventory-insights-widget">
                    <InventoryInsightsWidget title="AI Inventory Insights" items={data.inventory_insights} />
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;