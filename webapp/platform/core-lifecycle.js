/*
 * Core Lifecycle
 * Version: 1.0
 *
 * Zentrale Verwaltung der grundlegenden Lebenszyklusphasen
 * der Anwendung.
 */

(() => {
    'use strict';

    const phases = Object.freeze({
        CREATED: 'created',
        INITIALIZING: 'initializing',
        READY: 'ready',
        RUNNING: 'running',
        STOPPED: 'stopped'
    });

    const validTransitions = Object.freeze({
        [phases.CREATED]: [phases.INITIALIZING],
        [phases.INITIALIZING]: [phases.READY],
        [phases.READY]: [phases.RUNNING],
        [phases.RUNNING]: [phases.STOPPED],
        [phases.STOPPED]: [phases.INITIALIZING]
    });

    let currentPhase = phases.CREATED;

    const CoreLifecycle = {
        phases,

        getPhase() {
            return currentPhase;
        },

        setPhase(phase) {
            if (!Object.values(phases).includes(phase)) {
                throw new Error(`Invalid lifecycle phase: ${phase}`);
            }

            const previousPhase = currentPhase;

            if (previousPhase === phase) {
                return;
            }

            const allowedTransitions = validTransitions[previousPhase] || [];

            if (!allowedTransitions.includes(phase)) {
                throw new Error(
                    `Invalid lifecycle transition: ${previousPhase} -> ${phase}`
                );
            }

            currentPhase = phase;

            if (window.Core && typeof window.Core.emit === 'function') {
                window.Core.emit('lifecycle:changed', {
                    previousPhase,
                    currentPhase: phase
                });
            }
        },

        is(phase) {
            return currentPhase === phase;
        }
    };

    window.CoreLifecycle =
        Object.freeze(CoreLifecycle);
})();
