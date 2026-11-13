// SPDX-License-Identifier: GPL-3.0-or-later
#include "platform_lifecycle.h"
#include "android_storage_config.h"
#include "platform/platform.h"
#include <cerrno>
#include <mutex>
namespace nimbo::psbox {
namespace {
std::mutex lifecycleMutex;
bool active = false;
std::string activeDirectory;
}
int initializePlatform(const std::string& directory) {
    std::lock_guard<std::mutex> lock(lifecycleMutex);
    if (active) return directory == activeDirectory ? 0 : EBUSY;
    if (directory.empty() || directory.front() != '/') return EINVAL;
    if (!xc::platform::configureAndroidDataDir(directory)) return EBUSY;
    if (!xc::platform::init()) return xc::platform::dataDirErrno();
    activeDirectory = directory;
    active = true;
    return 0;
}
void shutdownPlatform() {
    std::lock_guard<std::mutex> lock(lifecycleMutex);
    xc::platform::shutdown();
    active = false;
    activeDirectory.clear();
}
bool platformReady() {
    std::lock_guard<std::mutex> lock(lifecycleMutex);
    return active && xc::platform::dataDirWritable();
}
}
