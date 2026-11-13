// SPDX-License-Identifier: GPL-3.0-or-later
package org.nimboxcloud.psbox;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.os.Looper;
import java.lang.ref.WeakReference;

/** Attach in host onCreate. No Activity, UI, login or WebView bridge is created. */
public final class PsboxActivityBinding implements Application.ActivityLifecycleCallbacks {
    public static final int BUSY = PlatformOwner.BUSY;
    public static final int INITIALIZE_FAILED = PlatformOwner.INITIALIZE_FAILED;
    public static final int SHUTDOWN_FAILED = PlatformOwner.SHUTDOWN_FAILED;
    public interface Listener { void onPlatformState(boolean ready, int error); }
    private static final PlatformOwner OWNER = new PlatformOwner();
    private final Object token = new Object();
    private final WeakReference<Activity> activity;
    private final Application application;
    private final PlatformOwner.Backend backend;
    private Listener listener;
    private boolean started, selected, detached;
    private int lastError;

    public PsboxActivityBinding(Activity host, Listener listener) {
        requireMainThread();
        if (host == null || host.getApplication() == null)
            throw new IllegalArgumentException("Attach from host onCreate");
        this.activity = new WeakReference<>(host);
        this.application = host.getApplication();
        this.listener = listener;
        backend = new PlatformOwner.Backend() {
            public int initialize() { return PsboxPlatform.initialize(application); }
            public boolean shutdown() {
                return !PsboxPlatform.isAvailable() || PsboxPlatform.shutdown();
            }
        };
        application.registerActivityLifecycleCallbacks(this);
    }
    /** Called only by trusted native host when selecting/deselecting this engine. */
    public int setSelected(boolean value) {
        requireMainThread();
        if (detached) throw new IllegalStateException("Binding detached");
        selected = value;
        return reconcile();
    }
    public boolean isReady() { return OWNER.isReady(token); }
    public int getLastError() { requireMainThread(); return lastError; }
    /** On failure retain ownership and registration, so detach can be retried. */
    public int detach() {
        requireMainThread();
        if (detached) return 0;
        selected = false; started = false;
        int result = reconcile();
        if (result == 0) {
            application.unregisterActivityLifecycleCallbacks(this);
            detached = true; listener = null; activity.clear();
        }
        return result;
    }
    private int reconcile() {
        lastError = started && selected ? OWNER.acquire(token, backend) : OWNER.release(token);
        if (listener != null) listener.onPlatformState(OWNER.isReady(token), lastError);
        return lastError;
    }
    private boolean matches(Activity candidate) { return activity.get() == candidate; }
    private static void requireMainThread() {
        if (Looper.myLooper() != Looper.getMainLooper()) throw new IllegalStateException("Main thread required");
    }
    @Override public void onActivityStarted(Activity host) {
        if (matches(host)) { started = true; reconcile(); }
    }
    @Override public void onActivityStopped(Activity host) {
        if (matches(host)) { started = false; reconcile(); }
        else if (started && selected && lastError == PlatformOwner.BUSY) {
            // A former host may have released ownership earlier in this callback
            // dispatch. One retry per lifecycle event; never spin or force stop.
            reconcile();
        }
    }
    @Override public void onActivityDestroyed(Activity host) {
        if (matches(host)) {
            listener = null; // A failed shutdown must not retain a destroyed UI.
            activity.clear(); detach();
        }
    }
    @Override public void onActivityCreated(Activity host, Bundle state) {}
    @Override public void onActivityResumed(Activity host) {
        if (matches(host) && started && selected && lastError == PlatformOwner.BUSY) reconcile();
    }
    @Override public void onActivityPaused(Activity host) {}
    @Override public void onActivitySaveInstanceState(Activity host, Bundle state) {}
}
