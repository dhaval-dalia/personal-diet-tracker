import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@chakra-ui/react';
import Dashboard from '../components/dashboard/Dashboard';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!user) {
    return null; // will redirect in useEffect
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Dashboard />
    </Box>
  );
} 