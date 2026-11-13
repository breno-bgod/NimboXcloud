// SPDX-License-Identifier: GPL-3.0-or-later
#include "platform_lifecycle.h"
#include "platform/platform.h"
#include <atomic>
#include <cerrno>
#include <cstdlib>
#include <cstdio>
#include <filesystem>
#include <thread>
static void check(bool value, const char* message) {
    if (!value) { std::fprintf(stderr, "FAIL: %s\n", message); std::exit(1); }
}
int main() {
    using namespace nimbo::psbox;
    check(!platformReady(), "initially closed");
    check(initializePlatform("relative") == EINVAL && !platformReady(), "invalid path stays closed");
    char path[] = "/tmp/nx-lifecycle-test-XXXXXX";
    check(::mkdtemp(path), "temporary root");
    const std::string root(path), first = root + "/first", second = root + "/second";
    ::setenv("XCLOUD_DATA_DIR", "/not-the-host-directory", 1);
    check(initializePlatform(first) == 0 && platformReady(), "start platform");
    check(xc::platform::dataDir() == first, "explicit host directory");
    check(std::string(std::getenv("XCLOUD_DATA_DIR")) == "/not-the-host-directory", "no process environment mutation");
    check(initializePlatform(first) == 0, "repeat same init idempotent");
    check(initializePlatform(second) == EBUSY && !std::filesystem::exists(second), "cannot switch live directory");
    shutdownPlatform(); shutdownPlatform();
    check(!platformReady(), "repeated shutdown closed");
    check(initializePlatform("/proc/nx-lifecycle-denied") != 0 && !platformReady(), "storage failure stays closed");
    check(initializePlatform(second) == 0 && platformReady(), "recover after failure");
    shutdownPlatform();
    std::atomic<bool> go{false}; int a = -1, b = -1;
    std::thread ta([&]{while(!go.load())std::this_thread::yield();a=initializePlatform(first);});
    std::thread tb([&]{while(!go.load())std::this_thread::yield();b=initializePlatform(second);});
    go = true; ta.join(); tb.join();
    check((a == 0 && b == EBUSY) || (b == 0 && a == EBUSY), "concurrent init has one owner");
    shutdownPlatform(); check(!platformReady(), "final shutdown");
    std::filesystem::remove_all(root);
    std::puts("PASS: platform lifecycle, idempotency, error recovery, concurrent ownership; host only");
}
