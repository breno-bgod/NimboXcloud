// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 RafaelNGP
// Nimbo adaptation: explicit host directory and verified storage readiness.
// The Android platform layer (psbox): app data directory in internal storage,
// assets from package, POSIX threads and networking.
#include <cstdint>
#include "platform/platform.h"
#include "util/log.h"

#include <algorithm>
#include <arpa/inet.h>
#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <netdb.h>
#include <netinet/in.h>
#include <pthread.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

#if defined(__ANDROID__)
#include <android/log.h>
#endif

namespace xc::platform {

namespace {
std::string g_dataDir;
std::string g_dataDirNote;

bool g_writable = false;
int g_storageErrno = 0;

bool storageFailure(int error) {
    g_writable = false;
    g_storageErrno = error ? error : EIO;
    g_dataDirNote = "App-private storage unavailable";
    return false;
}

bool makeDirs(const std::string& path) {
    for (size_t i = 1; i <= path.size(); ++i) {
        if (i == path.size() || path[i] == '/') {
            const auto segment = path.substr(0, i);
            if (::mkdir(segment.c_str(), 0700) != 0 && errno != EEXIST)
                return storageFailure(errno);
            struct stat st {};
            if (::stat(segment.c_str(), &st) != 0) return storageFailure(errno);
            if (!S_ISDIR(st.st_mode)) return storageFailure(ENOTDIR);
        }
    }
    return true;
}
}  // namespace

bool init() {
    g_dataDir.clear(); g_dataDirNote.clear();
    g_writable = false; g_storageErrno = 0;
    // Trusted APK host must set filesDir/psbox before starting native workers.
    // No fallback into another application's package or external storage.
    const char* env = std::getenv("XCLOUD_DATA_DIR");
    if (!env || env[0] != '/') return storageFailure(EINVAL);
    g_dataDir = env;
    if (!makeDirs(g_dataDir)) return false;
    std::string probe = g_dataDir + "/.nx-write-probe-XXXXXX";
    int fd = ::mkstemp(probe.data());
    if (fd < 0) return storageFailure(errno);
    int error = 0;
    const char byte = 0;
    if (::write(fd, &byte, 1) != 1) error = errno ? errno : EIO;
    if (::close(fd) != 0 && !error) error = errno;
    if (::unlink(probe.c_str()) != 0 && !error) error = errno;
    if (error) return storageFailure(error);
    g_writable = true;
    return true;
}

void shutdown() { g_writable = false; }

std::string dataDir() { return g_dataDir; }
std::string dataDirNote() { return g_dataDirNote; }
bool dataDirWritable() { return g_writable; }
int dataDirErrno() { return g_storageErrno; }
std::string appDir() { return g_dataDir; }
std::string assetDir() { return g_dataDir + "/assets"; }
std::string caBundlePath() { return assetDir() + "/cacert.pem"; }

bool randomBytes(void* out, size_t len) {
    int fd = ::open("/dev/urandom", O_RDONLY);
    if (fd < 0) return false;
    auto* p = static_cast<unsigned char*>(out);
    while (len > 0) {
        ssize_t n = ::read(fd, p, len);
        if (n <= 0) {
            ::close(fd);
            return false;
        }
        p += n;
        len -= static_cast<size_t>(n);
    }
    ::close(fd);
    return true;
}

bool resolveIPv4(const std::string& host, std::vector<uint32_t>& addrs, std::string& err) {
    in_addr literal{};
    if (::inet_pton(AF_INET, host.c_str(), &literal) == 1) {
        addrs.push_back(literal.s_addr);
        return true;
    }
    addrinfo hints{};
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    addrinfo* res = nullptr;
    int rc = ::getaddrinfo(host.c_str(), nullptr, &hints, &res);
    if (rc != 0 || !res) {
        err = "DNS lookup failed for " + host + ": " + gai_strerror(rc);
        return false;
    }
    for (addrinfo* p = res; p != nullptr; p = p->ai_next) {
        if (p->ai_family == AF_INET && p->ai_addr) {
            uint32_t a = reinterpret_cast<sockaddr_in*>(p->ai_addr)->sin_addr.s_addr;
            if (std::find(addrs.begin(), addrs.end(), a) == addrs.end()) {
                addrs.push_back(a);
            }
        }
    }
    ::freeaddrinfo(res);
    if (addrs.empty()) {
        err = "DNS lookup failed for " + host + ": no IPv4 address found";
        return false;
    }
    return true;
}

bool resolveIPv4(const std::string& host, uint32_t& addr, std::string& err) {
    std::vector<uint32_t> addrs;
    if (!resolveIPv4(host, addrs, err)) return false;
    addr = addrs[0];
    return true;
}

void probeNetworking() {}

void notify(const std::string& text) { notify(text, text); }

void notify(const std::string& text, const std::string& forLog) {
#if defined(__ANDROID__)
    (void)forLog; // Display text only; never log private fallback details.
    __android_log_print(ANDROID_LOG_INFO, "PSBox", "%s", text.c_str());
#else
    std::printf("[Android Notify] %s (%s)\n", text.c_str(), forLog.c_str());
#endif
}

void makePrivate(const std::string& path) { ::chmod(path.c_str(), 0600); }

bool systemKeyboardAvailable() { return false; }
bool openSystemKeyboard(const std::string&, const std::string&, size_t, KeyboardKind) { return false; }
KeyboardStatus pollSystemKeyboard(std::string&) { return KeyboardStatus::Closed; }

bool restartApp() { return false; }

std::string firmwareVersion() { return {}; }
std::string diagnostics() { return {}; }
std::string platformName() { return "Android"; }
bool isPS4() { return false; }
bool isPS5() { return false; }
size_t imageCacheBudget() { return 96u << 20; }

void setNoThreadPinning(bool) {}
bool isHandheld() { return false; }
void forceHandheld(bool) {}

void setThreadAffinity(ThreadRole, const char*) {}
void setThreadRealtimePriority() {}

}  // namespace xc::platform

