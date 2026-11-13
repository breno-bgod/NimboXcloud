// SPDX-License-Identifier: GPL-3.0-or-later
#pragma once
#include <string>
namespace nimbo::psbox {
// Platform only: success does NOT mean app core, authentication or stream started.
int initializePlatform(const std::string& directory);
void shutdownPlatform();
bool platformReady();
}
