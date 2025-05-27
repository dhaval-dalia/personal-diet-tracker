// src/components/dashboard/NutritionChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Heading, Text, useTheme } from '@chakra-ui/react';

interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionChartProps {
  data?: DailyNutritionData[] | null;
  title?: string;
}

// Dummy data for when no real data is available
const DUMMY_DATA: DailyNutritionData[] = [
  { date: 'Mon 20', calories: 1800, protein: 120, carbs: 200, fat: 60 },
  { date: 'Tue 21', calories: 2000, protein: 140, carbs: 220, fat: 70 },
  { date: 'Wed 22', calories: 1900, protein: 130, carbs: 210, fat: 65 },
  { date: 'Thu 23', calories: 2100, protein: 150, carbs: 230, fat: 75 },
  { date: 'Fri 24', calories: 1850, protein: 125, carbs: 205, fat: 62 },
  { date: 'Sat 25', calories: 2200, protein: 160, carbs: 240, fat: 80 },
  { date: 'Sun 26', calories: 1950, protein: 135, carbs: 215, fat: 68 },
];

const NutritionChart: React.FC<NutritionChartProps> = ({ 
  data, 
  title = "Nutritional Intake Over Time" 
}) => {
  const theme = useTheme();
  
  const chartData = data && data.length > 0 ? data : DUMMY_DATA;
  const isUsingDummyData = !data || data.length === 0;

  const caloriesColor = theme.colors.accent['500'];
  const proteinColor = theme.colors.brand['500'];
  const carbsColor = theme.colors.blue['400'];
  const fatColor = theme.colors.yellow['500'];

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg="whiteAlpha.700"
      boxShadow="lg"
      borderColor="brand.200"
      borderWidth={1}
      width="100%"
      height="auto"
    >
      <Heading as="h3" size="lg" mb={4} textAlign="center" color="text.dark">
        {title}
      </Heading>
      <Text fontSize="sm" color="text.light" textAlign="center" mb={6}>
        Daily breakdown of calories and macronutrients.
      </Text>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.gray['200']} />
          <XAxis
            dataKey="date"
            stroke={theme.colors.text.light}
            tick={{ fill: theme.colors.text.light, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.gray['300'] }}
            tickLine={{ stroke: theme.colors.gray['300'] }}
          />
          <YAxis
            stroke={theme.colors.text.light}
            tick={{ fill: theme.colors.text.light, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.gray['300'] }}
            tickLine={{ stroke: theme.colors.gray['300'] }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{
              backgroundColor: theme.colors.brand['50'],
              border: `1px solid ${theme.colors.brand['200']}`,
              borderRadius: theme.radii.md,
              boxShadow: theme.shadows.md,
              padding: '10px',
            }}
            labelStyle={{ color: theme.colors.text.dark, fontWeight: 'bold' }}
            itemStyle={{ color: theme.colors.text.dark }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', color: theme.colors.text.dark }}
            iconSize={10}
            iconType="circle"
          />
          <Bar dataKey="calories" fill={caloriesColor} name="Calories (kcal)" barSize={20} />
          <Bar dataKey="protein" fill={proteinColor} name="Protein (g)" barSize={20} />
          <Bar dataKey="carbs" fill={carbsColor} name="Carbs (g)" barSize={20} />
          <Bar dataKey="fat" fill={fatColor} name="Fat (g)" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
      
      {isUsingDummyData && (
        <Text fontSize="sm" color="gray.400" textAlign="center" fontStyle="italic" mt={4}>
          Showing sample data. Log your meals to see your real nutritional breakdown over time.
        </Text>
      )}
    </Box>
  );
};

export default NutritionChart;
