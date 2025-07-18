// src/components/charts/DocumentTypeChart.jsx (New and Improved Version)

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ชุดสีสำหรับกราฟ
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#3B82F6'];

const DocumentTypeChart = ({ files = [] }) => {
  // ประมวลผลข้อมูลไฟล์ เพื่อนับจำนวนแต่ละประเภท
  const chartData = useMemo(() => {
    if (!files || files.length === 0) {
      return [];
    }

    const typeCounts = files.reduce((acc, file) => {
      const fileType = file.type || file.file_type || 'Unknown';
      acc[fileType] = (acc[fileType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [files]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>No document data to display.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} files`, name]}
          contentStyle={{
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0'
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DocumentTypeChart;