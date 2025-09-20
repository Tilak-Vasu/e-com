// PerformanceMetricsWidget.tsx

import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';

// --- Reusable Stat Card Component ---
const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="dashboard-widget kpi-card">
        <div className="kpi-content">
            <div className="kpi-value">{value}</div>
            <div className="kpi-title">{title}</div>
        </div>
    </div>
);

// --- Main Performance Widget Component ---
const PerformanceMetricsWidget: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;

    const statusCodeChartData = {
        labels: data.status_code_chart.labels,
        datasets: [{
            data: data.status_code_chart.values,
            backgroundColor: [
                'hsl(180, 55%, 55%)', // Success (2xx)
                'hsl(350, 85%, 60%)', // Error (4xx/5xx)
                'hsl(45, 90%, 55%)',  // Redirect (3xx)
                'hsl(270, 70%, 65%)', // Other
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };
    
    const responseTimeChartData = {
        labels: data.response_time_chart.labels,
        datasets: [{
            label: 'Avg Response Time (ms)',
            data: data.response_time_chart.values,
            backgroundColor: 'hsl(210, 80%, 60%)',
        }],
    };

    const pieOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { position: 'right' as const } },
    };

    const barOptions = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
    };

    return (
        <>
            <h2 className="dashboard-subheader">API Performance (Last 7 Days)</h2>
            <StatCard title="Total API Requests" value={data.total_requests.toLocaleString()} />
            <StatCard title="API Errors (4xx/5xx)" value={data.error_count.toLocaleString()} />
            <StatCard title="Average API Latency" value={`${data.avg_latency.toFixed(2)} ms`} />

            <div className="dashboard-widget donut-chart-widget">
                <div className="widget-header">
                    <h4>API Requests by Status Code</h4>
                </div>
                <div className="chart-container-donut">
                    <Pie data={statusCodeChartData} options={pieOptions} />
                </div>
            </div>

            <div className="dashboard-widget chart-widget">
                 <div className="widget-header">
                    <h4>Top 10 Slowest API Endpoints</h4>
                </div>
                <div className="chart-container">
                    <Bar data={responseTimeChartData} options={barOptions} />
                </div>
            </div>
        </>
    );
};

export default PerformanceMetricsWidget;