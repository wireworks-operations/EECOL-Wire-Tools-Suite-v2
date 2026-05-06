import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  title: string;
}

const ReportChart: React.FC<ChartProps> = ({ type, data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title, font: { size: 14, weight: 'bold' as const } }
    }
  };

  if (type === 'line') return <div className="h-64"><Line options={options} data={data} /></div>;
  if (type === 'bar') return <div className="h-64"><Bar options={options} data={data} /></div>;
  if (type === 'doughnut') return <div className="h-64"><Doughnut options={options} data={data} /></div>;
  return null;
};

export default ReportChart;
