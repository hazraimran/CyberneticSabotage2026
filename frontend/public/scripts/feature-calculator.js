class FeatureCalculator {
    constructor(events, questionStartTime, queryIndex = 0) {
        this.events = events;
        this.questionStartTime = questionStartTime;
        this.queryIndex = queryIndex;
        this.tabHiddenTime = tabHiddenTime;
    }

    calculateFeatures() {
        // Schema hover frequency
        const schemaHovers = this.events.filter(e => e.event_type === 'schema_hover');
        const schemaHoverCount = schemaHovers.length;
        const avgHoverDuration = schemaHovers.length > 0
        ? schemaHovers.reduce((sum, e) => sum + e.data.duration_ms, 0) / schemaHovers.length
        : 0;

        // Marker 7: TFK (Time to First Keystroke)
        const keydownEvents = this.events.filter(e => e.event_type === 'keydown');
        const tfk = Math.max(0, keydownEvents.length > 0 && this.questionStartTime
            ? new Date(keydownEvents[0].timestamp).getTime() - this.questionStartTime - this.tabHiddenTime
            : 0);
        
        // Marker 4: RAR (Reading-to-Action Ratio)
        // Expected reading time per query (ms)
        const EXPECTED_READ_TIME =  {
            0: 9000, // Q1: 9s
            1: 54000, // Q2: 54s
            2: 45000, // Q3: 45s
            3: 28000, // Q4: 28s
            4: 82000, // Q5: 82
            11: 162000 // Q12: 162s
        };
        const expectedTime = EXPECTED_READ_TIME[this.queryIndex] ?? 30000;
        const rar = expectedTime > 0 ? tfk / expectedTime : 0;

        // Marker 3: Total Rewrites (Ctrl+A + Backspace = intent to quit)
        const selectAllEvents = this.events.filter(e => e.event_type === 'select_all');
        const rewriteCount = selectAllEvents.length;

        // IKL Coefficient of Variation (CV = SD/Mean) per Final Checklist
        const ikl_cv = this.calculateAvgIKL() > 0 
        ? this.calculateIKLStdDev() / this.calculateAvgIKL() 
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

            total_events: this.events.length,

            schema_hover_count: schemaHoverCount,
            avg_hover_duration: avgHoverDuration,

            time_to_first_keystroke: tfk,
            rar: rar,

            total_rewrites: rewriteCount,

            ikl_cv: ikl_cv,
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