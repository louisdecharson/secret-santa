# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.0.7
FROM oven/bun:${BUN_VERSION} as base

LABEL fly_launch_runtime="Bun"

# NodeJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential openssl 

# Install node modules
COPY --link bun.lockb package.json ./

# Install nodejs using n
ARG NODE_VERSION=20
RUN apt update \
    && apt install -y curl
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n

RUN bun install -ci
# Generate Prisma Client
COPY --link prisma prisma
RUN bunx prisma generate

# Copy application code
COPY --link . .

# Final stage for app image
FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
RUN mkdir /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
RUN rm -rf node_modules
COPY --from=build /app /app

ARG NODE_VERSION=20
RUN apt update \
    && apt install -y curl
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n #\
    # && bash n $NODE_VERSION \
    # && rm n \
    # && npm install -g n

# Entrypoint prepares the database.
ENTRYPOINT ["/app/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "run", "src/index.ts" ]
