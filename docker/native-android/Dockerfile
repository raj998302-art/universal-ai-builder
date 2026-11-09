# =============================================================================
# Native Android (Java/Kotlin) Build Environment
# =============================================================================
# Production-quality Docker image for building native Android applications
# using Java, Kotlin, Gradle, and the Android SDK.
# =============================================================================

FROM ubuntu:22.04

# ---------------------------------------------------------------------------
# Image metadata
# ---------------------------------------------------------------------------
LABEL maintainer="raj998302-art"
LABEL version="1.0.0"
LABEL description="Native Android (Java/Kotlin) build environment for universal-ai-builder"
LABEL org.opencontainers.image.source="https://github.com/raj998302-art/universal-ai-builder"
LABEL org.opencontainers.image.title="native-android"
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
ARG GRADLE_VERSION=8.7
ARG KOTLIN_VERSION=2.0.21

# ---------------------------------------------------------------------------
# Environment variables
# ---------------------------------------------------------------------------
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    GRADLE_HOME=/opt/gradle \
    KOTLIN_HOME=/opt/kotlin \
    JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64

ENV PATH="${KOTLIN_HOME}/bin:${GRADLE_HOME}/bin:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${PATH}"

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
        build-essential \
        lib32stdc++6 \
        lib32z1 \
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
# Install Kotlin compiler
# ---------------------------------------------------------------------------
RUN cd /tmp \
    && wget -q "https://github.com/JetBrains/kotlin/releases/download/v${KOTLIN_VERSION}/kotlin-compiler-${KOTLIN_VERSION}.zip" \
        -O kotlin-compiler.zip \
    && unzip -q kotlin-compiler.zip -d /opt \
    && mv /opt/kotlinc ${KOTLIN_HOME} \
    && rm kotlin-compiler.zip

# ---------------------------------------------------------------------------
# Create non-root builder user
# ---------------------------------------------------------------------------
RUN groupadd --gid 1000 builder \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash builder \
    && mkdir -p /workspace \
    && chown -R builder:builder /workspace \
    # Grant builder access to SDK directories
    && chown -R builder:builder ${ANDROID_HOME} \
    && chown -R builder:builder ${GRADLE_HOME} \
    && chown -R builder:builder ${KOTLIN_HOME}

USER builder

# ---------------------------------------------------------------------------
# Validate installation
# ---------------------------------------------------------------------------
RUN java -version \
    && gradle --version \
    && kotlinc -version \
    && sdkmanager --list 2>/dev/null | head -20

WORKDIR /workspace

CMD ["bash"]
