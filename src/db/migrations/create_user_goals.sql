-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_calories INTEGER,
    target_protein_ratio INTEGER,
    target_carbs_ratio INTEGER,
    target_fat_ratio INTEGER,
    target_weight_kg DECIMAL(5,2),
    target_date DATE,
    weekly_workout_goal INTEGER,
    water_intake_goal DECIMAL(3,1),
    sleep_goal DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own goals
CREATE POLICY "Users can view their own goals"
    ON user_goals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own goals
CREATE POLICY "Users can insert their own goals"
    ON user_goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own goals
CREATE POLICY "Users can update their own goals"
    ON user_goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own goals
CREATE POLICY "Users can delete their own goals"
    ON user_goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 