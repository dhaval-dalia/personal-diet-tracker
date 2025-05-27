// src/components/dashboard/NutritionChart.tsx
// This component visualizes nutritional intake over time using Recharts.
// It displays daily calories and macronutrient breakdown (protein, carbs, fat)
// using a BarChart, styled with the application's pastel theme.

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Heading, Text, useTheme } from '@chakra-ui/react';

// Define the interface for the data expected by the chart
interface DailyNutritionData {
  date: string; // e.g., "Mon 24" or "2023-05-24"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionChartProps {
  data: DailyNutritionData[]; // Array of daily nutrition data points
  title?: string; // Optional chart title
}

const NutritionChart: React.FC<NutritionChartProps> = ({ data, title = "Nutritional Intake Over Time" }) => {
  const theme = useTheme(); // Access Chakra UI theme for consistent colors

  // Define colors for the chart bars using the custom theme
  const caloriesColor = theme.colors.accent['500']; // A vibrant pastel pink for calories
  const proteinColor = theme.colors.brand['500'];   // A green for protein
  const carbsColor = theme.colors.blue['400'];     // A blue for carbs
  const fatColor = theme.colors.yellow['500'];      // A yellow/orange for fat

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg="whiteAlpha.700"
      boxShadow="lg"
      borderColor="brand.200"
      borderWidth={1}
      width="100%"
      height="auto" // Allow height to adjust based on content
    >
      <Heading as="h3" size="lg" mb={4} textAlign="center" color="text.dark">
        {title}
      </Heading>
      <Text fontSize="sm" color="text.light" textAlign="center" mb={6}>
        Daily breakdown of calories and macronutrients.
      </Text>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {/* Grid lines for better readability, using a light gray from theme */}
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.gray['200']} />

          {/* X-Axis for dates, styled with light text color */}
          <XAxis
            dataKey="date"
            stroke={theme.colors.text.light}
            tick={{ fill: theme.colors.text.light, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.gray['300'] }}
            tickLine={{ stroke: theme.colors.gray['300'] }}
          />

          {/* Y-Axis for values, styled with light text color */}
          <YAxis
            stroke={theme.colors.text.light}
            tick={{ fill: theme.colors.text.light, fontSize: 12 }}
            axisLine={{ stroke: theme.colors.gray['300'] }}
            tickLine={{ stroke: theme.colors.gray['300'] }}
          />

          {/* Tooltip for detailed information on hover */}
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} // Light background for tooltip cursor
            contentStyle={{
              backgroundColor: theme.colors.brand['50'], // Light pastel background for tooltip box
              border: `1px solid ${theme.colors.brand['200']}`,
              borderRadius: theme.radii.md,
              boxShadow: theme.shadows.md,
              padding: '10px',
            }}
            labelStyle={{ color: theme.colors.text.dark, fontWeight: 'bold' }}
            itemStyle={{ color: theme.colors.text.dark }}
          />

          {/* Legend to identify each bar, styled with dark text color */}
          <Legend
            wrapperStyle={{ paddingTop: '20px', color: theme.colors.text.dark }}
            iconSize={10}
            iconType="circle"
          />

          {/* Bars for each nutritional metric */}
          <Bar dataKey="calories" fill={caloriesColor} name="Calories (kcal)" barSize={20} />
          <Bar dataKey="protein" fill={proteinColor} name="Protein (g)" barSize={20} />
          <Bar dataKey="carbs" fill={carbsColor} name="Carbs (g)" barSize={20} />
          <Bar dataKey="fat" fill={fatColor} name="Fat (g)" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default NutritionChart;
