# =============================================================================
# Flutter + Android SDK Build Environment
# =============================================================================
# Production-quality Docker image for building Flutter Android applications.
# Includes Flutter SDK, Android SDK, Gradle, Kotlin, NDK, and CMake.
# =============================================================================

FROM ubuntu:22.04

# ---------------------------------------------------------------------------
# Image metadata
# ---------------------------------------------------------------------------
LABEL maintainer="raj998302-art"
LABEL version="1.0.0"
LABEL description="Flutter + Android SDK build environment for universal-ai-builder"
LABEL org.opencontainers.image.source="https://github.com/raj998302-art/universal-ai-builder"
LABEL org.opencontainers.image.title="flutter-android"
LABEL org.opencontainers.image.licenses="MIT"

# ---------------------------------------------------------------------------
# Pinned versions
# ---------------------------------------------------------------------------
ARG JAVA_VERSION=17
ARG ANDROID_CMDLINE_TOOLS_VERSION=11076708
ARG ANDROID_BUILD_TOOLS_VERSION=34.0.0
ARG ANDROID_PLATFORM_VERSION=android-34
ARG ANDROID_NDK_VERSION=26.1.10909125
ARG CMAKE_VERSION=3.22.1
ARG FLUTTER_VERSION=3.24.5
ARG GRADLE_VERSION=8.7

# ---------------------------------------------------------------------------
# Environment variables
# ---------------------------------------------------------------------------
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    FLUTTER_HOME=/opt/flutter \
    GRADLE_HOME=/opt/gradle \
    JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64

ENV PATH="${FLUTTER_HOME}/bin:${FLUTTER_HOME}/bin/cache/dart-sdk/bin:${GRADLE_HOME}/bin:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${PATH}"

# ---------------------------------------------------------------------------
# Install system dependencies and Temurin JDK 17
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        git \
        gnupg \
        locales \
        unzip \
        wget \
        xz-utils \
        zip \
        # Build essentials for native code
        build-essential \
        clang \
        lib32stdc++6 \
        lib32z1 \
        libglu1-mesa \
        # For Flutter linux desktop (optional but useful)
        pkg-config \
        libgtk-3-dev \
    && locale-gen en_US.UTF-8 \
    # ----- Install Adoptium Temurin JDK 17 -----
    && mkdir -p /etc/apt/keyrings \
    && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
        | gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo $VERSION_CODENAME) main" \
        > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends temurin-${JAVA_VERSION}-jdk \
    # ----- Cleanup -----
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/*

# ---------------------------------------------------------------------------
# Install Android command-line tools & SDK components
# ---------------------------------------------------------------------------
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools \
    && cd /tmp \
    && wget -q "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS_VERSION}_latest.zip" \
        -O cmdline-tools.zip \
    && unzip -q cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools \
    && mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest \
    && rm cmdline-tools.zip \
    # Accept all licenses non-interactively
    && yes | sdkmanager --licenses > /dev/null 2>&1 || true \
    # Install SDK components
    && sdkmanager --install \
        "platforms;${ANDROID_PLATFORM_VERSION}" \
        "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
        "platform-tools" \
        "ndk;${ANDROID_NDK_VERSION}" \
        "cmake;${CMAKE_VERSION}" \
    && sdkmanager --update \
    # Cleanup
    && rm -rf /tmp/*

# ---------------------------------------------------------------------------
# Install Gradle
# ---------------------------------------------------------------------------
RUN wget -q "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" \
        -O /tmp/gradle.zip \
    && unzip -q /tmp/gradle.zip -d /opt \
    && mv /opt/gradle-${GRADLE_VERSION} ${GRADLE_HOME} \
    && rm /tmp/gradle.zip

# ---------------------------------------------------------------------------
# Install Flutter SDK
# ---------------------------------------------------------------------------
RUN git clone --depth 1 --branch ${FLUTTER_VERSION} \
        https://github.com/flutter/flutter.git ${FLUTTER_HOME} \
    && chown -R root:root ${FLUTTER_HOME} \
    # Pre-cache Flutter artifacts
    && flutter precache --android \
    && flutter config --no-analytics \
    && dart --disable-analytics

# ---------------------------------------------------------------------------
# Create non-root builder user
# ---------------------------------------------------------------------------
RUN groupadd --gid 1000 builder \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash builder \
    && mkdir -p /workspace \
    && chown -R builder:builder /workspace \
    # Grant builder access to SDK directories
    && chown -R builder:builder ${ANDROID_HOME} \
    && chown -R builder:builder ${FLUTTER_HOME} \
    && chown -R builder:builder ${GRADLE_HOME}

USER builder

# ---------------------------------------------------------------------------
# Run flutter doctor (validates installation)
# ---------------------------------------------------------------------------
RUN flutter doctor --verbose \
    && java -version \
    && gradle --version

WORKDIR /workspace

CMD ["bash"]
