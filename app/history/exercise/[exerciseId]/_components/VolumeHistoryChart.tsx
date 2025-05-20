'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VolumeDataPoint {
  workout_date: string; // Should be in a format like 'YYYY-MM-DD'
  total_volume: number;
}

interface VolumeHistoryChartProps {
  data: VolumeDataPoint[];
  exerciseName: string;
}

export function VolumeHistoryChart({ data, exerciseName }: VolumeHistoryChartProps) {
  if (!data || data.length === 0) {
    return <p>No volume data available for {exerciseName} yet.</p>;
  }

  const formattedData = data.map(item => ({
    ...item,
    // Format date for display if needed, e.g., using toLocaleDateString
    // For XAxis, it often works well with direct date strings if they are sorted
    date: new Date(item.workout_date).toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric',
        year: 'numeric' // Optional, if space allows and provides clarity
    }),
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
        <h3 className="text-lg font-semibold mb-2 text-center">Volume History: {exerciseName}</h3>
        <ResponsiveContainer>
            <LineChart
            data={formattedData}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Total Volume (lbs)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
                formatter={(value: number) => [`${value.toFixed(0)} lbs`, 'Volume']}
            />
            <Legend />
            <Line type="monotone" dataKey="total_volume" name="Total Volume" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
} 