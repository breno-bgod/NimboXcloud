// SPDX-License-Identifier: GPL-3.0-or-later
package org.nimboxcloud.psbox;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public final class PlatformOwnerTest {
    private static final class Backend implements PlatformOwner.Backend {
        int starts, stops, code; boolean stopOk = true, throwsStart, throwsStop;
        public int initialize() { starts++; if (throwsStart) throw new IllegalStateException("private details"); return code; }
        public boolean shutdown() { stops++; if (throwsStop) throw new IllegalStateException("private details"); return stopOk; }
    }
    private static void check(boolean result, String message) {
        if (!result) throw new AssertionError(message);
    }
    public static void main(String[] args) throws InterruptedException {
        PlatformOwner p = new PlatformOwner(); Object a = new Object(), b = new Object();
        Backend first = new Backend(), next = new Backend();
        check(!p.isReady(a), "initially closed");
        check(p.acquire(a, first) == 0 && p.isReady(a), "acquire first");
        check(p.acquire(a, first) == 0 && first.starts == 1, "idempotent init");
        check(p.acquire(b, next) == PlatformOwner.BUSY && next.starts == 0, "one owner");
        check(p.release(b) == 0 && first.stops == 0, "foreign stop ignored");
        check(p.release(a) == 0 && first.stops == 1, "release first");
        check(p.acquire(b, next) == 0, "acquire next");
        check(p.release(a) == 0 && p.isReady(b) && next.stops == 0, "stale Activity cannot stop next");
        next.stopOk = false;
        check(p.release(b) == PlatformOwner.SHUTDOWN_FAILED && !p.isReady(b), "failed stop not ready");
        check(p.acquire(a, first) == PlatformOwner.BUSY, "failed stop retains owner");
        next.stopOk = true; check(p.release(b) == 0, "retry stop");
        first.code = 13;
        check(p.acquire(a, first) == 13 && !p.isReady(a), "start failure and cleanup");
        check(p.acquire(b, next) == 0, "cleanup releases ownership"); p.release(b);
        first.throwsStart = true;
        check(p.acquire(a, first) == PlatformOwner.INITIALIZE_FAILED, "exception sanitized");
        first.throwsStop = true;
        check(p.acquire(a, first) == PlatformOwner.SHUTDOWN_FAILED, "cleanup failure retained");
        check(p.acquire(b, next) == PlatformOwner.BUSY, "cannot bypass failed cleanup");
        first.throwsStop = false; p.release(a);
        first.throwsStart = false; first.code = 0;
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger ar = new AtomicInteger(), br = new AtomicInteger();
        Thread ta = new Thread(() -> {await(go); ar.set(p.acquire(a, first));});
        Thread tb = new Thread(() -> {await(go); br.set(p.acquire(b, next));});
        ta.start(); tb.start(); go.countDown(); ta.join(); tb.join();
        check((ar.get() == 0 && br.get() == PlatformOwner.BUSY) ||
              (br.get() == 0 && ar.get() == PlatformOwner.BUSY), "concurrent single owner");
        p.release(a); p.release(b);
        System.out.println("PASS: Java ownership, stale callbacks, cleanup failures and concurrency; simulated backend only");
    }
    private static void await(CountDownLatch latch) {
        try { latch.await(); } catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
    }
}
