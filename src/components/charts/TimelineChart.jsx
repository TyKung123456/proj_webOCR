// src/components/charts/TimelineChart.jsx - กราฟแนวโน้มการอัปโหลดเอกสารตามช่วงเวลา เช่น รายวันหรือรายเดือน
import React from 'react';

const TimelineChart = () => {
  const data = [
    { time: '10:00', count: 0 },
    { time: '10:30', count: 1 },
    { time: '11:00', count: 1 },
    { time: '11:30', count: 2 },
    { time: '12:00', count: 3 }
  ];

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="p-4">
      <div className="flex items-end justify-between h-40 border-b border-l border-gray-300">
        {data.map((item, index) => (
          <div key={item.time} className="flex flex-col items-center flex-1">
            <div
              className="bg-blue-500 w-8 transition-all duration-300 hover:bg-blue-600 rounded-t"
              style={{ height: `${(item.count / maxCount) * 120}px` }}
            ></div>
            <div className="mt-2 text-xs text-gray-600">{item.time}</div>
            <div className="text-xs font-medium">{item.count}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">Upload Timeline</div>
    </div>
  );
};

export default TimelineChart;