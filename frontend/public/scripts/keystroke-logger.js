class KeystrokeLogger {
    constructor() {
        this.events = [];
        this.lastKeystrokeTime = null;
        this.lastErrorTime = null;
        this.attemptNumber = 0;
    }

    logKeydown(event) {
        const now = Date.now();
        
        const eventData = {
            timestamp: new Date(now).toISOString(),
            event_type: 'keydown',
            data: {
                key: event.key,
                code: event.code,
                is_backspace: event.key === 'Backspace'
            }
        };
        
        if (this.lastKeystrokeTime !== null) {
            eventData.inter_keystroke_latency = now - this.lastKeystrokeTime;
        }
        
        this.events.push(eventData);
        this.lastKeystrokeTime = now;
        
        console.log('Keystroke logged:', eventData);
    }

    logPaste(event) {
        const now = Date.now();
        
        const pastedText = event.clipboardData ? event.clipboardData.getData('text') : '';

        const eventData = {
            timestamp: new Date(now).toISOString(),
            event_type: 'paste',
            data: {
                pasted_text: event.clipboardData.getData('text')
            }
        };

        this.events.push(eventData);
        console.log('Paste logged:', eventData);
    }

    logQuerySubmit(sqlContent) {
        this.attemptNumber++;

        const now = Date.now();

        const eventData = {
            timestamp: new Date(now).toISOString(),
            event_type: 'query_submit',
            data: {
                sql_content: sqlContent,
                attempt_number: this.attemptNumber
            }
        };

        this.events.push(eventData);
        console.log('Query submit logged:', eventData);
    }

    logError(errorMessage, errorType) {
        const now = Date.now();

        const eventData = {
            timestamp: new Date(now).toISOString(),
            event_type: 'error_displayed',
            data: {
                error_message: errorMessage,
                error_type: errorType
            }
        };

        this.events.push(eventData);
        this.lastErrorTime = now;
        
        console.log('Error logged:', eventData);
    }

    getEvents() {
        return this.events;
    }

    reset() {
        console.log('Resetting logger. Total events collected:', this.events.length);
        
        this.events = [];
        this.lastKeystrokeTime = null;
        this.lastErrorTime = null;
        this.attemptNumber = 0;
    }
}

window.keystrokeLogger = new KeystrokeLogger();
console.log('KeystrokeLogger initialized');