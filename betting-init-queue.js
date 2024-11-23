// betting-init-queue.js

class BettingInitQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.initialized = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second delay
    }

    async add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            if (!this.isProcessing) {
                this.process();
            }
        });
    }

    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        const { task, resolve, reject } = this.queue[0];

        try {
            const result = await task();
            resolve(result);
            this.queue.shift();
            this.initialized = true;
            this.retryAttempts = 0;
        } catch (error) {
            console.error('Task failed:', error);
            
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
                console.log(`Retrying in ${delay}ms... (Attempt ${this.retryAttempts})`);
                
                setTimeout(() => {
                    this.isProcessing = false;
                    this.process();
                }, delay);
                return;
            }

            reject(error);
            this.queue.shift();
            this.retryAttempts = 0;
        } finally {
            if (this.queue.length > 0) {
                this.isProcessing = false;
                this.process();
            } else {
                this.isProcessing = false;
            }
        }
    }

    clear() {
        this.queue = [];
        this.isProcessing = false;
        this.initialized = false;
        this.retryAttempts = 0;
    }
}

// Create a global instance
window.bettingInitQueue = new BettingInitQueue();