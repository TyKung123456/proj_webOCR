// src/components/charts/DocumentTypeChart.jsx - กราฟแสดงสัดส่วนประเภทของเอกสารที่อัปโหลด เช่น ใบเสร็จ, สัญญา
import React from 'react';

const DocumentTypeChart = ({ files }) => {
  const data = [
    { type: 'Invoice', count: files.filter(f => f.type === 'Invoice').length, color: '#3b82f6' },
    { type: 'Contract', count: files.filter(f => f.type === 'Contract').length, color: '#10b981' },
    { type: 'Receipt', count: files.filter(f => f.type === 'Receipt').length, color: '#f59e0b' },
    { type: 'Other', count: files.filter(f => f.type === 'Unknown').length, color: '#ef4444' }
  ].filter(d => d.count > 0);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 rounded-full relative overflow-hidden mb-4 bg-gray-100">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const cumulativePercentage = data.slice(0, index).reduce((sum, d) => sum + (d.count / total) * 100, 0);
          const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2;

          return (
            <div
              key={item.type}
              className="absolute inset-0"
              style={{
                backgroundColor: item.color,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos(startAngle) * 50}% ${50 + Math.sin(startAngle) * 50}%, ${50 + Math.cos(endAngle) * 50}% ${50 + Math.sin(endAngle) * 50}%)`
              }}
            />
          );
        })}
      </div>
      <div className="space-y-2 text-sm">
        {data.map(item => (
          <div key={item.type} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
            <span>{item.type}: {item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentTypeChart;