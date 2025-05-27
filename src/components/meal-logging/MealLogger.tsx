// src/components/meal-logging/MealLogger.tsx
// This is the main component for logging meals. It integrates FoodSearch,
// BarcodeScanner, and QuickAdd components, allowing users to add food items
// through various methods and then submit the complete meal log.
// It uses React Hook Form with Zod for overall meal validation.

import React, { useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  Text,
  IconButton,
  HStack,
  VStack,
  Icon,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  useTheme,
} from '@chakra-ui/react';
import { FaBarcode, FaSearch, FaTrash } from 'react-icons/fa';
import FoodSearch, { SearchedFoodItem } from './FoodSearch';
import BarcodeScanner from './BarcodeScanner';
import QuickAdd from './QuickAdd';
import { mealLogSchema, foodItemSchema } from '../../utils/validation';
import { useMealLogging } from '../../hooks/useMealLogging';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { format } from 'date-fns';

// Define the type for the meal log form inputs
type MealLogFormInputs = z.infer<typeof mealLogSchema>;

interface FoodItemData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  barcode?: string;
}

const MealLogger: React.FC = () => {
  const { isLogging, submitMealLog } = useMealLogging();
  const { handleError } = useErrorHandling();
  const theme = useTheme();

  const { isOpen: isFoodSearchOpen, onOpen: onFoodSearchOpen, onClose: onFoodSearchClose } = useDisclosure();
  const { isOpen: isBarcodeScannerOpen, onOpen: onBarcodeScannerOpen, onClose: onBarcodeScannerClose } = useDisclosure();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<MealLogFormInputs>({
    resolver: zodResolver(mealLogSchema),
    defaultValues: {
      mealType: 'lunch',
      mealDate: format(new Date(), 'yyyy-MM-dd'),
      mealTime: format(new Date(), 'HH:mm'),
      foodItems: [],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foodItems',
  });

  const handleAddFoodItem = useCallback((food: FoodItemData) => {
    const existingIndex = fields.findIndex(item => item.name === food.name && item.unit === food.unit);

    if (existingIndex > -1) {
      const currentQuantity = getValues(`foodItems.${existingIndex}.quantity`);
      setValue(`foodItems.${existingIndex}.quantity`, currentQuantity + (food.quantity || 1));
    } else {
      append(food);
    }
    onFoodSearchClose();
    onBarcodeScannerClose();
  }, [append, fields, getValues, setValue, onFoodSearchClose, onBarcodeScannerClose]);

  const onSubmit = async (data: MealLogFormInputs) => {
    try {
      await submitMealLog(data);
      reset({
        mealType: 'lunch',
        mealDate: format(new Date(), 'yyyy-MM-dd'),
        mealTime: format(new Date(), 'HH:mm'),
        foodItems: [],
        notes: '',
      });
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Box
      p={8}
      maxWidth="800px"
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg="whiteAlpha.700"
      borderColor="brand.200"
      mx="auto"
      my={8}
    >
      <Stack gap={6}>
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Log Your Meal
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Record what you've eaten to track your nutritional intake.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={4}>
            <HStack gap={4} flexWrap="wrap">
              <FormControl id="mealType" isInvalid={!!errors.mealType} flex="1">
                <FormLabel color="text.dark">Meal Type</FormLabel>
                <Select
                  placeholder="Select meal type"
                  {...register('mealType')}
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="other">Other</option>
                </Select>
                <FormErrorMessage>{errors.mealType?.message}</FormErrorMessage>
              </FormControl>

              <FormControl id="mealDate" isInvalid={!!errors.mealDate} flex="1">
                <FormLabel color="text.dark">Date</FormLabel>
                <Input
                  type="date"
                  {...register('mealDate')}
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <FormErrorMessage>{errors.mealDate?.message}</FormErrorMessage>
              </FormControl>

              <FormControl id="mealTime" isInvalid={!!errors.mealTime} flex="1">
                <FormLabel color="text.dark">Time</FormLabel>
                <Input
                  type="time"
                  {...register('mealTime')}
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <FormErrorMessage>{errors.mealTime?.message}</FormErrorMessage>
              </FormControl>
            </HStack>

            <Divider my={4} borderColor="brand.100" />

            <Heading as="h3" size="md" color="text.dark">
              Food Items
            </Heading>
            <Text fontSize="sm" color="text.light">
              Add food items to your meal using search, barcode, or quick add.
            </Text>

            <HStack gap={4} justifyContent="center" mb={4}>
              <Button
                onClick={onFoodSearchOpen}
                colorScheme="teal"
                variant="outline"
                bg="brand.100"
                color="text.dark"
                _hover={{ bg: 'brand.200' }}
              >
                <Icon as={FaSearch} mr={2} />
                Search Food
              </Button>
              <Button
                onClick={onBarcodeScannerOpen}
                colorScheme="teal"
                variant="outline"
                bg="brand.100"
                color="text.dark"
                _hover={{ bg: 'brand.200' }}
              >
                <Icon as={FaBarcode} mr={2} />
                Scan Barcode
              </Button>
            </HStack>

            <VStack gap={3} align="stretch">
              {fields.length === 0 && (
                <Text textAlign="center" color="text.light">No food items added yet.</Text>
              )}
              {fields.map((item, index) => (
                <Box
                  key={item.id}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor="brand.200"
                  bg="brand.50"
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Box>
                      <Text fontWeight="bold" color="text.dark">{item.name}</Text>
                      <Text fontSize="sm" color="text.light">
                        {item.calories} kcal | {item.protein}g P | {item.carbs}g C | {item.fat}g F
                      </Text>
                    </Box>
                    <HStack>
                      <FormControl isInvalid={!!errors.foodItems?.[index]?.quantity} width="100px">
                        <NumberInput
                          min={0.1}
                          precision={1}
                          step={0.1}
                          onChange={(_, valueAsNumber) => setValue(`foodItems.${index}.quantity`, valueAsNumber)}
                          value={item.quantity}
                        >
                          <NumberInputField
                            {...register(`foodItems.${index}.quantity`, { valueAsNumber: true })}
                            borderColor="brand.200"
                            _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormErrorMessage>{errors.foodItems?.[index]?.quantity?.message}</FormErrorMessage>
                      </FormControl>
                      <Text fontSize="sm" color="text.light">{item.unit}</Text>
                      <IconButton
                        aria-label="Remove food item"
                        onClick={() => remove(index)}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                      >
                        <FaTrash />
                      </IconButton>
                    </HStack>
                  </HStack>
                </Box>
              ))}
              {errors.foodItems && (
                <Text color="red.500" fontSize="sm">
                  {errors.foodItems.message || 'Please add at least one food item.'}
                </Text>
              )}
            </VStack>

            {/* Quick Add Section */}
            <QuickAdd onQuickAdd={handleAddFoodItem} />

            <Divider my={4} borderColor="brand.100" />

            {/* Notes */}
            <FormControl id="notes" isInvalid={!!errors.notes}>
              <FormLabel color="text.dark">Notes (Optional)</FormLabel>
              <Input
                {...register('notes')}
                placeholder="e.g., A light and healthy lunch."
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              />
              <FormErrorMessage>{errors.notes && errors.notes.message}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              isLoading={isLogging}
              colorScheme="teal"
              variant="solid"
              width="full"
              mt={6}
              bg="accent.500"
              color="white"
              _hover={{ bg: 'accent.600' }}
            >
              Log Meal
            </Button>
          </Stack>
        </form>
      </Stack>

      {/* Food Search Modal */}
      <Modal isOpen={isFoodSearchOpen} onClose={onFoodSearchClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="whiteAlpha.900" borderRadius="lg" p={4}>
          <ModalHeader color="text.dark">Search & Add Food</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FoodSearch onFoodSelect={(food) => handleAddFoodItem({
              ...food,
              quantity: 1,
              unit: food.unit || 'serving'
            })} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal isOpen={isBarcodeScannerOpen} onClose={onBarcodeScannerClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="whiteAlpha.900" borderRadius="lg" p={4}>
          <ModalHeader color="text.dark">Scan Barcode</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <BarcodeScanner onScan={(barcode) => {
              // In a real app, you'd fetch food item details using this barcode
              // For now, let's just add a placeholder food item
              const scannedFood: FoodItemData = {
                name: `Scanned Item: ${barcode}`,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                quantity: 1,
                unit: 'piece',
                barcode: barcode,
              };
              handleAddFoodItem(scannedFood);
            }} onClose={onBarcodeScannerClose} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MealLogger;
