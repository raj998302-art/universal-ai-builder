# =============================================================================
# Web Development (Node.js) Build Environment
# =============================================================================
# Production-quality Docker image for building web applications.
# Includes Node.js, npm, pnpm, Bun, Git, and Python 3.
# =============================================================================

FROM ubuntu:22.04

# ---------------------------------------------------------------------------
# Image metadata
# ---------------------------------------------------------------------------
LABEL maintainer="raj998302-art"
LABEL version="1.0.0"
LABEL description="Web development (Node.js) build environment for universal-ai-builder"
LABEL org.opencontainers.image.source="https://github.com/raj998302-art/universal-ai-builder"
LABEL org.opencontainers.image.title="web-builder"
LABEL org.opencontainers.image.licenses="MIT"

# ---------------------------------------------------------------------------
# Pinned versions
# ---------------------------------------------------------------------------
ARG NODE_MAJOR=20
ARG PNPM_VERSION=9.12.3
ARG BUN_VERSION=1.1.34

# ---------------------------------------------------------------------------
# Environment variables
# ---------------------------------------------------------------------------
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    BUN_INSTALL=/opt/bun \
    PNPM_HOME=/opt/pnpm

ENV PATH="${BUN_INSTALL}/bin:${PNPM_HOME}:${PATH}"

# ---------------------------------------------------------------------------
# Install system dependencies, Node.js 20 LTS, Python 3, and build tools
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
        # Build essentials for native addons
        build-essential \
        g++ \
        make \
        # Python 3
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        # Additional useful tools
        jq \
        rsync \
        openssh-client \
    && locale-gen en_US.UTF-8 \
    # ----- Install Node.js 20 LTS via NodeSource -----
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    # ----- Cleanup -----
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/*

# ---------------------------------------------------------------------------
# Install pnpm
# ---------------------------------------------------------------------------
RUN npm install -g pnpm@${PNPM_VERSION} \
    && mkdir -p ${PNPM_HOME}

# ---------------------------------------------------------------------------
# Install Bun
# ---------------------------------------------------------------------------
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=${BUN_INSTALL} bash -s "bun-v${BUN_VERSION}" \
    && chmod -R 755 ${BUN_INSTALL}

# ---------------------------------------------------------------------------
# Create non-root builder user
# ---------------------------------------------------------------------------
RUN groupadd --gid 1000 builder \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash builder \
    && mkdir -p /workspace \
    && chown -R builder:builder /workspace \
    && chown -R builder:builder ${PNPM_HOME} \
    && chown -R builder:builder ${BUN_INSTALL}

USER builder

# ---------------------------------------------------------------------------
# Validate installation
# ---------------------------------------------------------------------------
RUN node --version \
    && npm --version \
    && pnpm --version \
    && bun --version \
    && python3 --version \
    && git --version

WORKDIR /workspace

CMD ["bash"]
