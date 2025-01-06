// database.js
class DatabaseConnection {
    constructor() {
        this.isInitialized = false;
        this.connectionAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    async initialize() {
        if (this.isInitialized) {
            return this.supabase;
        }

        try {
            if (!window.supabase) {
                console.error('Supabase client not loaded');
                throw new Error('Supabase client not loaded');
            }

            this.supabase = window.supabase.createClient(
                'https://roxwocgknkiqnsgiojgz.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
            );

            // Test the connection
            const { data, error } = await this.supabase
                .from('chess_games')
                .select('count')
                .limit(1);

            if (error) {
                throw error;
            }

            this.isInitialized = true;
            window.gameDatabase = this.supabase;
            console.log('Database connection established successfully');
            return this.supabase;

        } catch (error) {
            console.error('Database connection error:', error);
            
            // Implement retry logic
            if (this.connectionAttempts < this.maxRetries) {
                this.connectionAttempts++;
                console.log(`Retrying connection (attempt ${this.connectionAttempts}/${this.maxRetries})...`);
                
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(this.initialize());
                    }, this.retryDelay);
                });
            }

            // Show user-friendly error message
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = 'Unable to connect to game server. Please try refreshing the page.';
            }

            throw new Error('Failed to initialize database connection after multiple attempts');
        }
    }

    // Get database instance
    getInstance() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.supabase;
    }
}

// Create and export singleton instance
window.databaseConnection = new DatabaseConnection();