// src/components/dashboard/NutritionChart.tsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Heading, Text, useTheme, Spinner, Center, Button, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { format, subDays } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FaUtensils } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend as ChartLegend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartLegend
);

interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface NutritionChartProps {
  title?: string;
  onNavigate: (view: string) => void;
}

interface UserGoals {
  target_calories?: number;
  target_protein_ratio?: number;
  target_carbs_ratio?: number;
  target_fat_ratio?: number;
}

const NutritionChart: React.FC<NutritionChartProps> = ({ 
  title = "Nutritional Intake Over Time",
  onNavigate
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<DailyNutritionData[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch user goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (goalsError) throw goalsError;
        setUserGoals(goalsData);

        // Fetch last 7 days of meal data
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const { data: mealsData, error: mealsError } = await supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true });

        if (mealsError) throw mealsError;

        // Process meal data
        const dailyData = new Map<string, DailyNutritionData>();
        
        mealsData.forEach(meal => {
          const date = format(new Date(meal.created_at), 'EEE dd');
          const existing = dailyData.get(date) || {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          };

          // Add meal macros to daily totals
          existing.calories += meal.calories || 0;
          existing.protein += meal.protein || 0;
          existing.carbs += meal.carbs || 0;
          existing.fat += meal.fat || 0;
          existing.fiber += meal.fiber || 0;

          dailyData.set(date, existing);
        });

        // Convert Map to array and fill in missing days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = format(subDays(new Date(), i), 'EEE dd');
          return dailyData.get(date) || {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          };
        }).reverse();

        setChartData(last7Days);
      } catch (error) {
        console.error('Error fetching nutrition data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('meal_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_logs',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchData(); // Refetch data when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Calculate percentages based on user goals or default targets
  const TARGETS = {
    calories: userGoals?.target_calories || 2000,
    protein: userGoals?.target_protein_ratio || 150,
    carbs: userGoals?.target_carbs_ratio || 250,
    fat: userGoals?.target_fat_ratio || 65,
    fiber: 30 // Default fiber target
  };

  // Process data to show percentages of targets
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

  if (isLoading) {
    return (
      <Box
        p={6}
        borderRadius="lg"
        bg={bgColor}
        boxShadow="lg"
        borderColor="brand.200"
        borderWidth={1}
        height="400px"
      >
        <Center h="100%">
          <Spinner size="xl" color="accent.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg={bgColor}
      boxShadow="lg"
      borderColor="brand.200"
      borderWidth={1}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="md" color={textColor}>
              {title}
            </Heading>
            <Text color="text.light" fontSize="sm">
              Daily breakdown of nutritional targets achieved (%)
            </Text>
          </VStack>
          <Button
            onClick={() => onNavigate('log-meal')}
            colorScheme="teal"
            variant="outline"
            size="sm"
            leftIcon={<FaUtensils />}
          >
            Log Your First Meal
          </Button>
        </HStack>

        <Box height="300px">
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
              <RechartsTooltip content={<CustomTooltip />} />
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
        </Box>
      </VStack>
    </Box>
  );
};

export default NutritionChart;
