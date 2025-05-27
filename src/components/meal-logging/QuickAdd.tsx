// src/components/meal-logging/QuickAdd.tsx
// This component provides a simplified interface for quickly adding a food item
// with minimal details (e.g., just name and calories). It's designed for speed
// and convenience, then passes the data to the parent for full meal logging.

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { foodItemSchema } from '../../utils/validation';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { FoodItemData } from '../../hooks/useMealLogging';

const quickAddFoodSchema = foodItemSchema.pick({ name: true, calories: true }).extend({
  quantity: z.number().min(0.1, 'Quantity must be greater than 0'),
  unit: z.string(),
});

type QuickAddFoodInputs = z.infer<typeof quickAddFoodSchema>;

interface QuickAddProps {
  onQuickAdd: (food: FoodItemData) => void;
}

const QuickAdd: React.FC<QuickAddProps> = ({ onQuickAdd }) => {
  const { handleError, showToast } = useErrorHandling();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuickAddFoodInputs>({
    resolver: zodResolver(quickAddFoodSchema),
    defaultValues: {
      name: '',
      calories: 0,
      quantity: 1,
      unit: 'serving',
    },
  });

  const onSubmit = (data: QuickAddFoodInputs) => {
    try {
      const fullFoodItem: FoodItemData = {
        ...data,
        protein: 0,
        carbs: 0,
        fat: 0,
        barcode: undefined,
      };
      onQuickAdd(fullFoodItem);
      showToast({
        title: 'Food Added!',
        description: `${data.name} added to your meal.`,
        status: 'success',
      });
      reset();
    } catch (error) {
      handleError(error, 'Failed to quick add food');
    }
  };

  return (
    <Box p={4} borderRadius="md" bg="whiteAlpha.700" boxShadow="md" borderColor="brand.200" borderWidth={1}>
      <Stack gap={4}>
        <Heading as="h3" size="md" textAlign="center" color="text.dark">
          Quick Add Food
        </Heading>
        <Text fontSize="sm" color="text.light" textAlign="center">
          Quickly add a food item with just a name and calories.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={3}>
            <div>
              <label htmlFor="quick-name" className="block text-sm font-medium text-gray-700">
                Food Name
              </label>
              <Input
                id="quick-name"
                {...register('name')}
                placeholder="e.g., Apple, Coffee"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring-brand-300"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quick-calories" className="block text-sm font-medium text-gray-700">
                Calories (kcal)
              </label>
              <Input
                id="quick-calories"
                type="number"
                min={0}
                max={5000}
                step={1}
                {...register('calories', { valueAsNumber: true })}
                placeholder="e.g., 100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring-brand-300"
              />
              {errors.calories && (
                <p className="mt-1 text-sm text-red-600">{errors.calories.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quick-quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <Input
                id="quick-quantity"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                {...register('quantity', { valueAsNumber: true })}
                placeholder="e.g., 1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring-brand-300"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quick-unit" className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <Input
                id="quick-unit"
                {...register('unit')}
                placeholder="e.g., serving, piece, g"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring-brand-300"
              />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-brand-300 text-white hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-300"
            >
              {isSubmitting ? 'Adding...' : 'Add Food'}
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

export default QuickAdd;
