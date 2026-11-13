// SPDX-License-Identifier: GPL-3.0-or-later
package org.nimboxcloud.psbox;

import android.content.Context;
import java.io.File;

/** Platform lifecycle only. Not a session, player or WebView JavaScript bridge. */
public final class PsboxPlatform {
    public static final int NATIVE_UNAVAILABLE = -1;
    private static final boolean AVAILABLE;
    static {
        boolean loaded;
        try { System.loadLibrary("nimbo_psbox_platform"); loaded = true; }
        catch (UnsatisfiedLinkError error) { loaded = false; }
        AVAILABLE = loaded;
    }
    private PsboxPlatform() {}
    public static boolean isAvailable() { return AVAILABLE; }
    /** Returns 0 on platform readiness, otherwise errno or NATIVE_UNAVAILABLE. */
    public static synchronized int initialize(Context context) {
        if (!AVAILABLE) return NATIVE_UNAVAILABLE;
        if (context == null) throw new IllegalArgumentException("Context required");
        Context app = context.getApplicationContext();
        File files = (app != null ? app : context).getFilesDir();
        if (files == null) return NATIVE_UNAVAILABLE;
        // No arbitrary URL/path from a web page; PSBox state stays in its subdir.
        try { return nativeInitialize(new File(files, "psbox").getAbsolutePath()); }
        catch (UnsatisfiedLinkError error) { return NATIVE_UNAVAILABLE; }
    }
    /** Idempotent; false means the host must not claim shutdown completed. */
    public static synchronized boolean shutdown() {
        if (!AVAILABLE) return false;
        try { return nativeShutdown(); }
        catch (UnsatisfiedLinkError error) { return false; }
    }
    public static synchronized boolean isReady() {
        if (!AVAILABLE) return false;
        try { return nativeIsReady(); }
        catch (UnsatisfiedLinkError error) { return false; }
    }
    private static native int nativeInitialize(String privateDirectory);
    private static native boolean nativeShutdown();
    private static native boolean nativeIsReady();
}
