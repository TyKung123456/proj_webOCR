// src/components/ChartView.jsx
import React from 'react';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// ลงทะเบียน components ทั้งหมดที่ Chart.js ต้องใช้
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ChartView = ({ chartType, chartData }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: chartData?.datasets?.[0]?.label || 'Chart',
                font: {
                    size: 16
                }
            },
        },
        maintainAspectRatio: false,
    };

    const renderChart = () => {
        if (!chartData || !chartData.labels || !chartData.datasets) {
            return <p className="text-center text-gray-500">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>;
        }

        switch (chartType) {
            case 'line':
                return <Line options={options} data={chartData} />;
            case 'bar':
                return <Bar options={options} data={chartData} />;
            case 'pie':
                return <Pie options={options} data={chartData} />;
            case 'scatter':
                return <Scatter options={options} data={chartData} />;
            default:
                // แสดง Bar chart เป็นค่าเริ่มต้นถ้าไม่รู้จักประเภท
                return <Bar options={options} data={chartData} />;
        }
    };

    return (
        <div className="relative w-full h-96 md:h-[450px] bg-gray-50 p-4 rounded-lg">
            {renderChart()}
        </div>
    );
};

export default ChartView;