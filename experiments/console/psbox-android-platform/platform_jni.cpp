// SPDX-License-Identifier: GPL-3.0-or-later
#include "platform_lifecycle.h"
#include <jni.h>
#include <cerrno>
#include <new>

extern "C" JNIEXPORT jint JNICALL
Java_org_nimboxcloud_psbox_PsboxPlatform_nativeInitialize(JNIEnv* env, jclass, jstring path) {
    if (!path) return EINVAL;
    const char* value = env->GetStringUTFChars(path, nullptr);
    if (!value) return ENOMEM; // Preserve a pending VM exception.
    int result;
    try { result = nimbo::psbox::initializePlatform(value); }
    catch (const std::bad_alloc&) { result = ENOMEM; }
    catch (...) { result = EIO; }
    env->ReleaseStringUTFChars(path, value);
    return result;
}
extern "C" JNIEXPORT jboolean JNICALL
Java_org_nimboxcloud_psbox_PsboxPlatform_nativeShutdown(JNIEnv*, jclass) {
    try { nimbo::psbox::shutdownPlatform(); return JNI_TRUE; }
    catch (...) { return JNI_FALSE; }
}
extern "C" JNIEXPORT jboolean JNICALL
Java_org_nimboxcloud_psbox_PsboxPlatform_nativeIsReady(JNIEnv*, jclass) {
    try { return nimbo::psbox::platformReady() ? JNI_TRUE : JNI_FALSE; }
    catch (...) { return JNI_FALSE; }
}
