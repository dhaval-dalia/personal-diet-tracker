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
  fiber: number;
}

interface NutritionChartProps {
  data?: DailyNutritionData[] | null;
  title?: string;
}

// Dummy data for when no real data is available
const DUMMY_DATA: DailyNutritionData[] = [
  { date: 'Mon 20', calories: 1800, protein: 120, carbs: 200, fat: 60, fiber: 25 },
  { date: 'Tue 21', calories: 2000, protein: 140, carbs: 220, fat: 70, fiber: 28 },
  { date: 'Wed 22', calories: 1900, protein: 130, carbs: 210, fat: 65, fiber: 26 },
  { date: 'Thu 23', calories: 2100, protein: 150, carbs: 230, fat: 75, fiber: 30 },
  { date: 'Fri 24', calories: 1850, protein: 125, carbs: 205, fat: 62, fiber: 24 },
  { date: 'Sat 25', calories: 2200, protein: 160, carbs: 240, fat: 80, fiber: 32 },
  { date: 'Sun 26', calories: 1950, protein: 135, carbs: 215, fat: 68, fiber: 27 },
];

// Target values for each nutrient
const TARGETS = {
  calories: 2000,
  protein: 150, // grams
  carbs: 250,   // grams
  fat: 65,      // grams
  fiber: 30     // grams
};

const NutritionChart: React.FC<NutritionChartProps> = ({ 
  data, 
  title = "Nutritional Intake Over Time" 
}) => {
  const theme = useTheme();
  
  const chartData = data && data.length > 0 ? data : DUMMY_DATA;
  const isUsingDummyData = !data || data.length === 0;

  // Calculate percentages for each nutrient
  const processedData = chartData.map(item => ({
    date: item.date,
    calories: (item.calories / TARGETS.calories) * 100,
    protein: (item.protein / TARGETS.protein) * 100,
    carbs: (item.carbs / TARGETS.carbs) * 100,
    fat: (item.fat / TARGETS.fat) * 100,
    fiber: (item.fiber / TARGETS.fiber) * 100
  }));

  // Colors for each nutrient
  const colors = {
    calories: theme.colors.accent['500'],
    protein: theme.colors.brand['500'],
    carbs: theme.colors.blue['400'],
    fat: theme.colors.yellow['500'],
    fiber: theme.colors.green['500']
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg="white"
          p={3}
          borderRadius="md"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="bold" mb={2}>{label}</Text>
          {payload.map((entry: any) => (
            <Text key={entry.name} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}% of target
            </Text>
          ))}
        </Box>
      );
    }
    return null;
  };

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
        Daily breakdown of nutritional targets achieved (%)
      </Text>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={processedData}
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px', color: theme.colors.text.dark }}
            iconSize={10}
            iconType="circle"
          />
          <Bar dataKey="calories" fill={colors.calories} name="Calories" barSize={20} />
          <Bar dataKey="protein" fill={colors.protein} name="Protein" barSize={20} />
          <Bar dataKey="carbs" fill={colors.carbs} name="Carbs" barSize={20} />
          <Bar dataKey="fat" fill={colors.fat} name="Fat" barSize={20} />
          <Bar dataKey="fiber" fill={colors.fiber} name="Fiber" barSize={20} />
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
