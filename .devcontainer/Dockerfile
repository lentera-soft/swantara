FROM golang:1.26-alpine

RUN apk add --no-cache \
    just \
    curl \
    git \
    openssh-client \
    postgresql-client \
    bash \
    tzdata \
    make

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

RUN go install github.com/air-verse/air@latest \
    && go install github.com/pressly/goose/v3/cmd/goose@latest \
    && go install github.com/hibiken/asynq/tools/asynq@latest \
    && go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest

ARG UID=1000
ARG GID=1000
RUN addgroup -g $GID appgroup && adduser -u $UID -G appgroup -D appuser

ENV PATH="/home/appuser/go/bin:${PATH}"
ENV GOBIN=/home/appuser/go/bin
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

USER appuser
WORKDIR /workspace

CMD ["sleep", "infinity"]
