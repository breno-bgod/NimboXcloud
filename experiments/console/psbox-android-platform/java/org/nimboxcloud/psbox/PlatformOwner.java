// SPDX-License-Identifier: GPL-3.0-or-later
package org.nimboxcloud.psbox;

/** Process-local ownership for platform lifecycle, not cloud sessions. */
final class PlatformOwner {
    interface Backend { int initialize(); boolean shutdown(); }
    static final int BUSY = -2, INITIALIZE_FAILED = -3, SHUTDOWN_FAILED = -4;
    private Object owner;
    private Backend backend;
    private boolean ready;
    private int error;

    synchronized int acquire(Object claimant, Backend candidate) {
        if (claimant == null || candidate == null) throw new IllegalArgumentException("Owner and backend required");
        if (owner != null) return owner == claimant ? error : BUSY;
        owner = claimant; backend = candidate; ready = false;
        int result;
        try { result = backend.initialize(); }
        catch (RuntimeException failure) { result = INITIALIZE_FAILED; }
        if (result == 0) { ready = true; error = 0; return 0; }
        int cleanup = release(claimant);
        return cleanup != 0 ? cleanup : result;
    }
    synchronized int release(Object claimant) {
        if (owner == null || owner != claimant) return 0;
        ready = false;
        boolean stopped;
        try { stopped = backend.shutdown(); }
        catch (RuntimeException failure) { stopped = false; }
        if (!stopped) { error = SHUTDOWN_FAILED; return error; }
        owner = null; backend = null; error = 0;
        return 0;
    }
    synchronized boolean isReady(Object claimant) { return owner == claimant && ready; }
}
