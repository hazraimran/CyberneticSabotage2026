class FeatureCalculator {
    constructor(events, questionStartTime) {
        this.events = events;
        this.questionStartTime = questionStartTime;
    }

    calculateFeatures() {
        // Schema hover frequency
        const schemaHovers = this.events.filter(e => e.event_type === 'schema_hover');
        const schemaHoverCount = schemaHovers.length;
        const avgHoverDuration = schemaHovers.length > 0
        ? schemaHovers.reduce((sum, e) => sum + e.data.duration_ms, 0) / schemaHovers.length
        : 0;
        return {
            avg_ikl: this.calculateAvgIKL(),
            ikl_std_dev: this.calculateIKLStdDev(),
            avg_pel: this.calculateAvgPEL(),
            pause_count: this.calculatePauseCount(),
            backspace_frequency: this.calculateBackspaceFrequency(),
            error_repetition_count: this.calculateErrorRepetitionCount(),
            paste_frequency: this.calculatePasteFrequency(),
            rapid_resubmission: this.calculateRapidResubmission(),
            time_to_first_keystroke: this.calculateTimeToFirstKeystroke(),

            total_events: this.events.length,

            schema_hover_count: schemaHoverCount,
            avg_hover_duration: avgHoverDuration,
        };
    }

    calculateAvgIKL() {
        const iklEvents = this.events.filter(e => e.inter_keystroke_latency);

        if (iklEvents.length === 0) return 0;

        const iklValues = iklEvents.map(e => e.inter_keystroke_latency);

        const sum = iklValues.reduce((a, b) => a + b, 0);
        const avg = sum / iklValues.length;

        return avg;
    }

    calculateIKLStdDev() {
        const iklEvents = this.events.filter(e => e.inter_keystroke_latency);
        if (iklEvents.length === 0) return 0;
        const iklValues = iklEvents.map(e => e.inter_keystroke_latency);

        const sum = iklValues.reduce((a, b) => a + b, 0);
        const avg = sum / iklValues.length;

        const variance = iklValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / iklValues.length;

        const stdDev = Math.sqrt(variance);
        return stdDev;
    }

    calculateAvgPEL() {
        const pelEvents = this.events.filter(e => e.post_error_latency);

        if (pelEvents.length === 0) return 0;

        const pelValues = pelEvents.map(e => e.post_error_latency);
        
        const sum = pelValues.reduce((a, b) => a + b, 0);
        const avg = sum / pelValues.length;

        return avg;
    }

    calculatePauseCount() {
        const pauseEvents = this.events.filter(e => e.inter_keystroke_latency > 2000);

        return pauseEvents.length;
    }

    calculateBackspaceFrequency() {
        const keydownEvents = this.events.filter(e => e.event_type === 'keydown');

        if (keydownEvents.length === 0) return 0;

        const backspaceEvents = keydownEvents.filter(e => e.data.is_backspace);

        const frequency = backspaceEvents.length / keydownEvents.length;

        return frequency;
    }

    calculateErrorRepetitionCount() {
        const errorEvents = this.events.filter(e => e.event_type === 'error_displayed');

        if (errorEvents.length === 0) return 0;

        const errorTypes = errorEvents.map(e => e.data.error_type);

        let repetitionCount = 0;
        for (let i = 1; i < errorTypes.length; i++) {
            if (errorTypes[i] === errorTypes[i - 1]) {
                repetitionCount++;
            }
        }
        return repetitionCount;
    }

    calculatePasteFrequency() {
        const pasteEvents = this.events.filter(e => e.event_type === 'paste');

        return pasteEvents.length;
    }

    calculateRapidResubmission() {
        const submitEvents = this.events.filter(e => e.event_type === 'query_submit');

        if (submitEvents.length < 2) return 0;

        let rapidCount = 0;
        for (let i = 1; i < submitEvents.length; i++) {
            const prevTime = new Date(submitEvents[i - 1].timestamp).getTime();
            const currTime = new Date(submitEvents[i].timestamp).getTime();

            const timeDiff = currTime - prevTime;

            if (timeDiff < 5000) {
                rapidCount++;
            }
        }
        return rapidCount;
    }

    calculateTimeToFirstKeystroke() {
        const firstKeystroke = this.events.find(e => e.event_type === 'keydown');

        if(!firstKeystroke) return 0;

        const firstKeystrokeTime = new Date(firstKeystroke.timestamp).getTime();
        const delay = firstKeystrokeTime - this.questionStartTime;

        return delay;
    }


}